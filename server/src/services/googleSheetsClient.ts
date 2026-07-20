import { google } from "googleapis";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const clientEmail = env.GOOGLE_SHEETS_CLIENT_EMAIL;
const privateKey = env.GOOGLE_SHEETS_PRIVATE_KEY;
const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;
const defaultSheetName = env.GOOGLE_SHEETS_LEADS_SHEET_NAME;
const createdSheets = new Set<string>();

export interface LeadRowInput {
  name: string;
  email: string;
  phone?: string | null;
  source?: string | null;
  message?: string | null;
  course?: string | null;
}

const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const googleSheetsClient = {
  async appendLeadRow(input: LeadRowInput) {
    const sheets = google.sheets({ version: "v4", auth });
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

function sanitizeSheetName(raw?: string | null) {
  const base = (raw || defaultSheetName).trim();
  const cleaned = base.replace(/[\\/?*[\]:]/g, "-").replace(/'+/g, "").slice(0, 90).trim();
  return cleaned || defaultSheetName;
}

async function ensureSheetExists(sheets: ReturnType<typeof google.sheets>, title: string) {
  if (createdSheets.has(title)) return;

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

async function ensureHeaderRow(sheets: ReturnType<typeof google.sheets>, title: string) {
  try {
    const current = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${title}!A1:G1`,
    });

    const firstRow = current.data.values?.[0];
    const hasData = Array.isArray(firstRow) && firstRow.length > 0;
    if (hasData) return;
  } catch (error) {
    // Ignora e tenta escrever cabeçalho
    logger.warn("sheets.header_check_failed", { error });
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

async function getSheetId(sheets: ReturnType<typeof google.sheets>, title: string): Promise<number> {
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

function formatToBrazilDateTime(date: Date) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "medium",
  });
  return formatter.format(date);
}
