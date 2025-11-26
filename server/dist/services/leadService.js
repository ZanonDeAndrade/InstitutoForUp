"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadService = exports.LeadService = void 0;
const client_1 = require("@prisma/client");
const googleSheetsClient_1 = require("./googleSheetsClient");
const prisma = new client_1.PrismaClient();
class LeadService {
    async createLead(payload) {
        const lead = await prisma.lead.create({
            data: {
                name: payload.name,
                email: payload.email,
                phone: payload.phone,
                source: payload.source,
                message: payload.message,
                course: payload.course,
            },
        });
        const sheetPayload = {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            source: lead.source,
            message: lead.message,
            course: lead.course,
        };
        // Espelhamento assíncrono (não bloqueia a criação do lead)
        googleSheetsClient_1.googleSheetsClient
            .appendLeadRow(sheetPayload)
            .catch((err) => console.error("[sheets] failed to append lead", err));
        return lead;
    }
}
exports.LeadService = LeadService;
exports.leadService = new LeadService();
