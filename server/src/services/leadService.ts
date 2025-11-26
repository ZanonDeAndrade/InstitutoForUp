import { PrismaClient } from "@prisma/client";
import { googleSheetsClient, LeadRowInput } from "./googleSheetsClient";

const prisma = new PrismaClient();

export interface CreateLeadInput {
  name: string;
  email: string;
  phone?: string;
  source?: string;
  message?: string;
  course?: string;
}

export class LeadService {
  async createLead(payload: CreateLeadInput) {
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

    const sheetPayload: LeadRowInput = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      message: lead.message,
      course: lead.course,
    };

    // Espelhamento assíncrono (não bloqueia a criação do lead)
    googleSheetsClient
      .appendLeadRow(sheetPayload)
      .catch((err) => console.error("[sheets] failed to append lead", err));

    return lead;
  }
}

export const leadService = new LeadService();
