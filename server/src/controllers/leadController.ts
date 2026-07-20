import { Request, Response } from "express";
import { createHash } from "node:crypto";
import { z } from "zod";
import { AdminRequest } from "../middleware/adminAuth";
import { appErrors } from "../errors/AppError";
import { captchaService, type CaptchaVerifier } from "../services/captchaService";
import {
  AdminActor,
  LeadDeletionScope,
  LeadVisibility,
  leadService,
} from "../services/leadService";
import { logger } from "../utils/logger";

const createLeadSchema = z
  .object({
    name: z.string().trim().max(120).optional(),
    email: z.string().trim().max(254).optional(),
    phone: z.string().trim().max(32).optional(),
    source: z.string().trim().max(80).optional(),
    message: z.string().trim().max(500).optional(),
    course: z.string().trim().max(160).optional(),
    courseId: z.string().trim().min(1).max(100),
    captchaToken: z.string().trim().min(1).max(4096),
    idempotencyKey: z.string().trim().min(8).max(128).optional(),
    website: z.string().trim().max(2048).optional(),
    formStartedAt: z.coerce.number().int().positive(),
  })
  .strict();

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  courseId: z.string().trim().min(1).optional(),
  courseName: z.string().trim().min(1).optional(),
  visibility: z.enum(["active", "deleted", "all"]).optional(),
});

const leadIdArraySchema = z.array(z.string().trim().min(1)).min(1).max(500);

const softDeleteSchema = z.object({
  scope: z.enum(["all", "course", "selected"]),
  leadIds: leadIdArraySchema.optional(),
  courseId: z.string().trim().min(1).optional(),
  courseName: z.string().trim().min(1).optional(),
  reason: z.string().trim().min(8),
  confirmation: z.string().trim().min(1),
});

const restoreSchema = z.object({
  leadIds: leadIdArraySchema,
  reason: z.string().trim().min(8),
  confirmation: z.string().trim().min(1),
});

const purgeSchema = restoreSchema;

const actorFromRequest = (req: Request): AdminActor => {
  const admin = (req as AdminRequest).admin;
  if (!admin) throw appErrors.authentication();
  return { id: admin.id, role: admin.role };
};

const hashValue = (value?: string) =>
  value ? createHash("sha256").update(value).digest("hex").slice(0, 16) : undefined;

const suspiciousTextPattern = /<\s*script|<\/?[a-z][\s\S]*>|javascript:|data:text\/html|https?:\/\/|www\./i;
const repeatedCharacterPattern = /(.)\1{12,}/;
const minimumCompletionMs = 2_000;
const maximumCompletionMs = 24 * 60 * 60 * 1000;

const logLeadAbuse = (req: Request, reason: string) => {
  logger.warn("lead.abuse_rejected", {
    requestId: req.requestId,
    reason,
    ipHash: hashValue(req.ip),
    userAgentHash: hashValue(req.get("user-agent")),
  });
};

const assertHumanSubmission = (req: Request, data: z.infer<typeof createLeadSchema>) => {
  if (data.website) {
    logLeadAbuse(req, "honeypot");
    throw appErrors.validation("LEAD_REJECTED", "Nao foi possivel processar a solicitacao.");
  }

  const elapsedMs = Date.now() - data.formStartedAt;
  if (elapsedMs < minimumCompletionMs || elapsedMs > maximumCompletionMs) {
    logLeadAbuse(req, "submission_timing");
    throw appErrors.validation("LEAD_REJECTED", "Nao foi possivel processar a solicitacao.");
  }

  const textFields = [data.name, data.source, data.message, data.course].filter(Boolean).join(" ");
  if (suspiciousTextPattern.test(textFields) || repeatedCharacterPattern.test(textFields)) {
    logLeadAbuse(req, "suspicious_content");
    throw appErrors.validation("LEAD_REJECTED", "Nao foi possivel processar a solicitacao.");
  }
};

const leadValidationErrorCodes = new Set([
  "LEAD_NAME_REQUIRED",
  "LEAD_EMAIL_REQUIRED",
  "LEAD_PHONE_REQUIRED",
  "LEAD_SOURCE_REQUIRED",
  "LEAD_NAME_NOT_ALLOWED",
  "LEAD_EMAIL_NOT_ALLOWED",
  "LEAD_PHONE_NOT_ALLOWED",
  "LEAD_SOURCE_NOT_ALLOWED",
  "LEAD_NAME_INVALID",
  "LEAD_EMAIL_INVALID",
  "LEAD_PHONE_INVALID",
  "LEAD_SOURCE_INVALID",
]);

interface LeadCreator {
  createLead(input: Parameters<typeof leadService.createLead>[0]): ReturnType<typeof leadService.createLead>;
}

export const createLeadController = (
  creator: LeadCreator = leadService,
  captchaVerifier: CaptchaVerifier = captchaService,
) => ({
  async create(req: Request, res: Response) {
    const parsed = createLeadSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      logLeadAbuse(req, "invalid_payload");
      throw appErrors.validation("INVALID_LEAD_DATA", "Dados invalidos.");
    }

    assertHumanSubmission(req, parsed.data);

    const idempotencyKey = parsed.data.idempotencyKey || String(req.get("Idempotency-Key") ?? "").trim() || undefined;
    const captchaValid = await captchaVerifier.verify({
      token: parsed.data.captchaToken,
      remoteIp: req.ip,
      idempotencyKey,
    });

    if (!captchaValid) {
      logLeadAbuse(req, "captcha_invalid");
      throw appErrors.validation("CAPTCHA_INVALID", "Nao foi possivel validar a verificacao anti-abuso.");
    }

    try {
      const result = await creator.createLead({
        name: parsed.data.name || undefined,
        email: parsed.data.email || undefined,
        phone: parsed.data.phone || undefined,
        source: parsed.data.source || undefined,
        message: parsed.data.message || undefined,
        course: parsed.data.course || undefined,
        courseId: parsed.data.courseId,
        idempotencyKey,
      });

      return res.status(result.status === "created" ? 201 : 200).json(result.lead);
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "COURSE_NOT_FOUND") {
        throw appErrors.notFound("COURSE_NOT_FOUND", "Curso nao encontrado.");
      }
      if (leadValidationErrorCodes.has(code)) {
        throw appErrors.validation(code, "Dados invalidos para este curso.");
      }
      throw error;
    }
  },
});

const toPublicLeadError = (error: unknown) => {
  const message = error instanceof Error ? error.message : "";
  if (message.endsWith("_FORBIDDEN")) {
    return appErrors.authorization("FORBIDDEN", "Acesso negado.");
  }
  if (
    [
      "LEAD_DELETION_REASON_REQUIRED",
      "LEAD_DELETION_CONFIRMATION_REQUIRED",
      "LEAD_IDS_REQUIRED",
      "COURSE_ID_REQUIRED",
    ].includes(message)
  ) {
    return appErrors.validation(message, "Dados invalidos.");
  }
  return error;
};

export const leadController = {
  ...createLeadController(),
  async list(req: Request, res: Response) {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw appErrors.validation("INVALID_LEAD_QUERY", "Dados invalidos.");
    }

    const result = await leadService.listLeads({
      ...parsed.data,
      visibility: (parsed.data.visibility ?? "active") as LeadVisibility,
    });
    return res.json(result);
  },

  async softDeleteBatch(req: Request, res: Response) {
    const parsed = softDeleteSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      throw appErrors.validation("INVALID_LEAD_DELETE_REQUEST", "Dados invalidos.");
    }

    try {
      const result = await leadService.softDeleteLeads({
        actor: actorFromRequest(req),
        scope: parsed.data.scope as LeadDeletionScope,
        leadIds: parsed.data.leadIds,
        courseId: parsed.data.courseId,
        courseName: parsed.data.courseName,
        reason: parsed.data.reason,
        confirmation: parsed.data.confirmation,
      });
      return res.json(result);
    } catch (error) {
      throw toPublicLeadError(error);
    }
  },

  async restore(req: Request, res: Response) {
    const parsed = restoreSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      throw appErrors.validation("INVALID_LEAD_RESTORE_REQUEST", "Dados invalidos.");
    }

    try {
      const result = await leadService.restoreLeads({
        actor: actorFromRequest(req),
        leadIds: parsed.data.leadIds,
        reason: parsed.data.reason,
        confirmation: parsed.data.confirmation,
      });
      return res.json(result);
    } catch (error) {
      throw toPublicLeadError(error);
    }
  },

  async purge(req: Request, res: Response) {
    const parsed = purgeSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      throw appErrors.validation("INVALID_LEAD_PURGE_REQUEST", "Dados invalidos.");
    }

    try {
      const result = await leadService.purgeDeletedLeads({
        actor: actorFromRequest(req),
        leadIds: parsed.data.leadIds,
        reason: parsed.data.reason,
        confirmation: parsed.data.confirmation,
      });
      return res.json(result);
    } catch (error) {
      throw toPublicLeadError(error);
    }
  },
};
