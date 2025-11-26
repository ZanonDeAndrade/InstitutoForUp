"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleSheetsClient = void 0;
const googleapis_1 = require("googleapis");
const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");
const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const defaultSheetName = (process.env.GOOGLE_SHEETS_LEADS_SHEET_NAME || "Leads").trim() || "Leads";
const createdSheets = new Set();
const hasRequiredEnv = () => !!(clientEmail && privateKey && spreadsheetId);
const auth = hasRequiredEnv()
    ? new googleapis_1.google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })
    : null;
exports.googleSheetsClient = {
    async appendLeadRow(input) {
        if (!auth || !hasRequiredEnv()) {
            console.warn("[sheets] skipped append (missing credentials)");
            return;
        }
        const sheets = googleapis_1.google.sheets({ version: "v4", auth });
        const targetSheet = sanitizeSheetName(input.course);
        await ensureSheetExists(sheets, targetSheet);
        const values = [
            [
                formatToBrazilDateTime(new Date()),
                input.name,
                input.email,
                input.phone ?? "",
                input.source ?? "",
                input.message ?? "",
                input.course ?? "",
            ],
        ];
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${targetSheet}!A1:G`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values },
        });
    },
};
function sanitizeSheetName(raw) {
    const base = (raw || defaultSheetName).trim();
    const cleaned = base.replace(/[\\/?*[\]:]/g, "-").replace(/'+/g, "").slice(0, 90).trim();
    return cleaned || defaultSheetName;
}
async function ensureSheetExists(sheets, title) {
    if (createdSheets.has(title))
        return;
    const meta = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: "sheets.properties.title",
    });
    const exists = meta.data.sheets?.some((s) => s.properties?.title === title);
    if (!exists) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        addSheet: {
                            properties: { title },
                        },
                    },
                ],
            },
        });
    }
    await ensureHeaderRow(sheets, title);
    createdSheets.add(title);
}
async function ensureHeaderRow(sheets, title) {
    try {
        const current = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${title}!A1:G1`,
        });
        const hasData = !!current.data.values && current.data.values.length > 0 && current.data.values[0].length > 0;
        if (hasData)
            return;
    }
    catch (error) {
        // Ignora e tenta escrever cabeçalho
        console.warn("[sheets] header check failed, attempting to write header", error);
    }
    const header = [["Data cadastro", "Nome", "Email", "Telefone", "Origem", "Mensagem", "Curso"]];
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${title}!A1:G1`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: header },
    });
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [
                {
                    repeatCell: {
                        range: {
                            sheetId: await getSheetId(sheets, title),
                            startRowIndex: 0,
                            endRowIndex: 1,
                            startColumnIndex: 0,
                            endColumnIndex: 7,
                        },
                        cell: {
                            userEnteredFormat: {
                                textFormat: {
                                    bold: true,
                                    fontSize: 12,
                                },
                            },
                        },
                        fields: "userEnteredFormat(textFormat)",
                    },
                },
            ],
        },
    });
}
async function getSheetId(sheets, title) {
    const meta = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: "sheets.properties(title,sheetId)",
    });
    const found = meta.data.sheets?.find((s) => s.properties?.title === title)?.properties?.sheetId;
    if (found === undefined || found === null) {
        throw new Error(`Sheet not found: ${title}`);
    }
    return found;
}
function formatToBrazilDateTime(date) {
    const formatter = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        dateStyle: "short",
        timeStyle: "medium",
    });
    return formatter.format(date);
}
