import { Request, Response } from "express";
import { leadService } from "../services/leadService";

export const leadController = {
  async create(req: Request, res: Response) {
    const { name, email, phone, source, message, course } = req.body ?? {};

    if (!name || !email) {
      return res.status(400).json({ message: "NAME_AND_EMAIL_REQUIRED" });
    }

    try {
      const lead = await leadService.createLead({
        name: String(name).trim(),
        email: String(email).trim(),
        phone: phone ? String(phone).trim() : undefined,
        source: source ? String(source).trim() : undefined,
        message: message ? String(message).trim() : undefined,
        course: course ? String(course).trim() : undefined,
      });

      return res.status(201).json(lead);
    } catch (error) {
      console.error("[lead] failed to create", error);
      return res.status(500).json({ message: "LEAD_CREATION_FAILED" });
    }
  },
};
