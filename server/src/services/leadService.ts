import { AdminRole, Prisma, PrismaClient } from "@prisma/client";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

export const LEAD_DELETE_CONFIRMATIONS = {
  all: "SOFT_DELETE_ALL_LEADS",
  course: "SOFT_DELETE_COURSE_LEADS",
  selected: "SOFT_DELETE_SELECTED_LEADS",
  restore: "RESTORE_LEADS",
  purge: "PERMANENTLY_DELETE_LEADS",
} as const;

export type LeadDeletionScope = "all" | "course" | "selected";
export type LeadVisibility = "active" | "deleted" | "all";
export type AdminActor = { id: string; role: AdminRole };

export interface CreateLeadInput {
  name: string;
  email: string;
  normalizedEmail?: string;
  phone?: string;
  normalizedPhone?: string;
  source?: string;
  message?: string;
  course?: string;
  courseId?: string;
  idempotencyKey?: string;
}

export interface CreateLeadRequestInput {
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  message?: string;
  course?: string;
  courseId: string;
  idempotencyKey?: string;
}

export interface CourseLeadFieldsConfig {
  name: boolean;
  email: boolean;
  phone: boolean;
  source: boolean;
}

export interface CourseLeadConfig {
  id: string;
  name: string;
  fields: CourseLeadFieldsConfig;
}

interface LeadRowInput {
  name: string;
  email: string;
  phone?: string | null;
  source?: string | null;
  message?: string | null;
  course?: string | null;
}

export interface LeadRecord {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  source?: string | null;
  message?: string | null;
  course?: string | null;
  courseId?: string | null;
  submittedAt: Date;
  createdAt: Date;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  deletionReason?: string | null;
}

export interface LeadListInput {
  page?: number;
  pageSize?: number;
  courseId?: string;
  courseName?: string;
  visibility?: LeadVisibility;
}

export interface LeadListResult {
  items: LeadRecord[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface LeadFilter {
  ids?: string[];
  courseId?: string;
  courseName?: string;
}

interface DuplicateLeadInput {
  normalizedEmail: string;
  normalizedPhone?: string | null;
  course?: string | null;
  courseId?: string | null;
  since: Date;
}

export interface LeadDeletionAuditInput {
  action: "soft_delete" | "restore" | "purge";
  scope: LeadDeletionScope | "restore" | "purge";
  leadIds: string[];
  courseId?: string | null;
  courseName?: string | null;
  reason: string;
  confirmation: string;
  actor: AdminActor;
  affectedCount: number;
}

export interface LeadRepository {
  create(data: CreateLeadInput): Promise<LeadRecord>;
  getCourseLeadConfig(courseId: string): Promise<CourseLeadConfig | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<LeadRecord | null>;
  findRecentDuplicate(input: DuplicateLeadInput): Promise<LeadRecord | null>;
  list(input: Required<Pick<LeadListInput, "page" | "pageSize" | "visibility">> & Omit<LeadListInput, "page" | "pageSize" | "visibility">): Promise<LeadListResult>;
  findIds(filter: LeadFilter, visibility: LeadVisibility): Promise<string[]>;
  softDeleteByIds(ids: string[], deletedAt: Date, actor: AdminActor, reason: string): Promise<number>;
  restoreByIds(ids: string[]): Promise<number>;
  purgeDeletedByIds(ids: string[]): Promise<number>;
  audit(input: LeadDeletionAuditInput): Promise<void>;
}

const buildWhere = (filter: LeadFilter, visibility: LeadVisibility): Prisma.LeadWhereInput => {
  const where: Prisma.LeadWhereInput = {};

  if (filter.ids?.length) {
    where.id = { in: filter.ids };
  }

  if (filter.courseId || filter.courseName) {
    where.OR = [
      ...(filter.courseId ? [{ courseId: filter.courseId }] : []),
      ...(filter.courseName ? [{ course: filter.courseName }] : []),
    ];
  }

  if (visibility === "active") {
    where.deletedAt = null;
  } else if (visibility === "deleted") {
    where.deletedAt = { not: null };
  }

  return where;
};

const leadSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  source: true,
  message: true,
  course: true,
  courseId: true,
  submittedAt: true,
  createdAt: true,
  deletedAt: true,
  deletedBy: true,
  deletionReason: true,
} satisfies Prisma.LeadSelect;

export const defaultCourseLeadFields: CourseLeadFieldsConfig = {
  name: true,
  email: true,
  phone: true,
  source: true,
};

const normalizeCourseLeadFields = (fields: unknown): CourseLeadFieldsConfig => {
  const parsed = typeof fields === "string" ? (() => {
    try {
      return JSON.parse(fields) as unknown;
    } catch {
      return null;
    }
  })() : fields;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return defaultCourseLeadFields;
  }

  const data = parsed as Record<string, unknown>;
  return {
    name: typeof data.name === "boolean" ? data.name : defaultCourseLeadFields.name,
    email: typeof data.email === "boolean" ? data.email : defaultCourseLeadFields.email,
    phone: typeof data.phone === "boolean" ? data.phone : defaultCourseLeadFields.phone,
    source: typeof data.source === "boolean" ? data.source : defaultCourseLeadFields.source,
  };
};

class PrismaLeadRepository implements LeadRepository {
  async create(data: CreateLeadInput) {
    return prisma.lead.create({ data, select: leadSelect });
  }

  async getCourseLeadConfig(courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, name: true, fields: true },
    });
    if (!course) return null;
    return {
      id: course.id,
      name: course.name,
      fields: normalizeCourseLeadFields(course.fields),
    };
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    return prisma.lead.findUnique({
      where: { idempotencyKey },
      select: leadSelect,
    });
  }

  async findRecentDuplicate(input: DuplicateLeadInput) {
    const courseConditions: Prisma.LeadWhereInput[] = [];
    if (input.courseId) courseConditions.push({ courseId: input.courseId });
    if (input.course) courseConditions.push({ course: input.course });

    const and: Prisma.LeadWhereInput[] = [
      { deletedAt: null },
      { submittedAt: { gte: input.since } },
      { normalizedEmail: input.normalizedEmail },
    ];

    if (input.normalizedPhone) {
      and.push({ normalizedPhone: input.normalizedPhone });
    }
    if (courseConditions.length) {
      and.push({ OR: courseConditions });
    }

    return prisma.lead.findFirst({
      where: { AND: and },
      orderBy: { submittedAt: "desc" },
      select: leadSelect,
    });
  }

  async list(input: Required<Pick<LeadListInput, "page" | "pageSize" | "visibility">> & Omit<LeadListInput, "page" | "pageSize" | "visibility">) {
    const where = buildWhere({ courseId: input.courseId, courseName: input.courseName }, input.visibility);
    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { submittedAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        select: leadSelect,
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      items,
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
    };
  }

  async findIds(filter: LeadFilter, visibility: LeadVisibility) {
    const rows = await prisma.lead.findMany({
      where: buildWhere(filter, visibility),
      select: { id: true },
      orderBy: { submittedAt: "desc" },
    });
    return rows.map((row) => row.id);
  }

  async softDeleteByIds(ids: string[], deletedAt: Date, actor: AdminActor, reason: string) {
    if (!ids.length) return 0;
    const result = await prisma.lead.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: {
        deletedAt,
        deletedBy: actor.id,
        deletionReason: reason,
      },
    });
    return result.count;
  }

  async restoreByIds(ids: string[]) {
    if (!ids.length) return 0;
    const result = await prisma.lead.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: {
        deletedAt: null,
        deletedBy: null,
        deletionReason: null,
      },
    });
    return result.count;
  }

  async purgeDeletedByIds(ids: string[]) {
    if (!ids.length) return 0;
    const result = await prisma.lead.deleteMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
    });
    return result.count;
  }

  async audit(input: LeadDeletionAuditInput) {
    await prisma.leadDeletionAudit.create({
      data: {
        action: input.action,
        scope: input.scope,
        leadIds: input.leadIds,
        courseId: input.courseId ?? null,
        courseName: input.courseName ?? null,
        reason: input.reason,
        confirmation: input.confirmation,
        actorId: input.actor.id,
        actorRole: input.actor.role,
        affectedCount: input.affectedCount,
      },
    });
  }
}

const normalizePage = (page?: number) => Math.max(1, Number.isFinite(page ?? NaN) ? Math.floor(page!) : 1);
const normalizePageSize = (pageSize?: number) => Math.min(100, Math.max(1, Number.isFinite(pageSize ?? NaN) ? Math.floor(pageSize!) : 25));

const normalizeReason = (reason: string) => reason.trim();
export const normalizeLeadEmail = (email: string) => email.trim().toLowerCase();
export const normalizeLeadPhone = (phone?: string | null) => {
  const normalized = (phone ?? "").replace(/[^\d+]/g, "");
  return normalized || undefined;
};

const allowedLeadSources = new Set(["indicacao", "instagram", "facebook", "linkedin", "evento", "outro"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cleanOptional = (value?: string) => {
  const cleaned = value?.trim();
  return cleaned || undefined;
};

const assertRequiredField = (enabled: boolean, value: string | undefined, code: string) => {
  if (enabled && !value) throw new Error(code);
};

const assertNoDisabledFieldValue = (enabled: boolean, value: string | undefined, code: string) => {
  if (!enabled && value) throw new Error(code);
};

const validateLeadForCourse = (payload: CreateLeadRequestInput, course: CourseLeadConfig): CreateLeadInput => {
  const name = cleanOptional(payload.name);
  const email = cleanOptional(payload.email);
  const phone = cleanOptional(payload.phone);
  const source = cleanOptional(payload.source);
  const message = cleanOptional(payload.message);

  assertRequiredField(course.fields.name, name, "LEAD_NAME_REQUIRED");
  assertRequiredField(course.fields.email, email, "LEAD_EMAIL_REQUIRED");
  assertRequiredField(course.fields.phone, phone, "LEAD_PHONE_REQUIRED");
  assertRequiredField(course.fields.source, source, "LEAD_SOURCE_REQUIRED");

  assertNoDisabledFieldValue(course.fields.name, name, "LEAD_NAME_NOT_ALLOWED");
  assertNoDisabledFieldValue(course.fields.email, email, "LEAD_EMAIL_NOT_ALLOWED");
  assertNoDisabledFieldValue(course.fields.phone, phone, "LEAD_PHONE_NOT_ALLOWED");
  assertNoDisabledFieldValue(course.fields.source, source, "LEAD_SOURCE_NOT_ALLOWED");

  if (course.fields.name && name && name.length < 2) {
    throw new Error("LEAD_NAME_INVALID");
  }

  const normalizedEmail = email ? normalizeLeadEmail(email) : "";
  if (course.fields.email && !emailPattern.test(normalizedEmail)) {
    throw new Error("LEAD_EMAIL_INVALID");
  }

  const normalizedPhone = normalizeLeadPhone(phone);
  if (course.fields.phone && (!normalizedPhone || normalizedPhone.replace(/^\+/, "").length < 8 || normalizedPhone.length > 16)) {
    throw new Error("LEAD_PHONE_INVALID");
  }

  if (course.fields.source && source && !allowedLeadSources.has(source)) {
    throw new Error("LEAD_SOURCE_INVALID");
  }

  return {
    name: name ?? "",
    email: normalizedEmail,
    normalizedEmail,
    phone,
    normalizedPhone,
    source,
    message,
    course: course.name,
    courseId: course.id,
    idempotencyKey: payload.idempotencyKey,
  };
};

const normalizeIdempotencyKey = (value?: string) => {
  const key = value?.trim();
  if (!key) return undefined;
  return key.slice(0, 128);
};

const isUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const assertDeletionReason = (reason: string) => {
  if (normalizeReason(reason).length < 8) {
    throw new Error("LEAD_DELETION_REASON_REQUIRED");
  }
};

const assertConfirmation = (actual: string, expected: string) => {
  if (actual !== expected) {
    throw new Error("LEAD_DELETION_CONFIRMATION_REQUIRED");
  }
};

const assertCanSoftDelete = (actor: AdminActor, scope: LeadDeletionScope) => {
  if (actor.role === "viewer") {
    throw new Error("LEAD_DELETE_FORBIDDEN");
  }
  if (scope === "all" && actor.role !== "super_admin") {
    throw new Error("LEAD_DELETE_ALL_FORBIDDEN");
  }
};

const assertSuperAdmin = (actor: AdminActor) => {
  if (actor.role !== "super_admin") {
    throw new Error("LEAD_PURGE_FORBIDDEN");
  }
};

const filterForScope = (input: {
  scope: LeadDeletionScope;
  leadIds?: string[];
  courseId?: string;
  courseName?: string;
}): LeadFilter => {
  if (input.scope === "selected") {
    const ids = [...new Set((input.leadIds ?? []).map((id) => id.trim()).filter(Boolean))];
    if (!ids.length) throw new Error("LEAD_IDS_REQUIRED");
    return { ids };
  }

  if (input.scope === "course") {
    if (!input.courseId && !input.courseName) throw new Error("COURSE_ID_REQUIRED");
    return { courseId: input.courseId, courseName: input.courseName };
  }

  return {};
};

export class LeadService {
  constructor(
    private readonly repository: LeadRepository = new PrismaLeadRepository(),
    private readonly now: () => Date = () => new Date(),
    private readonly appendLeadRow: (input: LeadRowInput) => Promise<void> = async (input) => {
      const { googleSheetsClient } = await import("./googleSheetsClient");
      return googleSheetsClient.appendLeadRow(input);
    },
  ) {}

  async createLead(payload: CreateLeadRequestInput) {
    const courseId = payload.courseId.trim();
    const course = await this.repository.getCourseLeadConfig(courseId);
    if (!course) throw new Error("COURSE_NOT_FOUND");

    const normalizedPayload: CreateLeadInput = {
      ...validateLeadForCourse({ ...payload, courseId }, course),
      idempotencyKey: normalizeIdempotencyKey(payload.idempotencyKey),
    };

    if (normalizedPayload.idempotencyKey) {
      const existing = await this.repository.findByIdempotencyKey(normalizedPayload.idempotencyKey);
      if (existing) {
        logger.info("lead.create_idempotent_replay", { leadId: existing.id });
        return { lead: existing, status: "idempotent" as const };
      }
    }

    const duplicate = await this.repository.findRecentDuplicate({
      normalizedEmail: normalizedPayload.normalizedEmail!,
      normalizedPhone: normalizedPayload.normalizedPhone,
      course: normalizedPayload.course,
      courseId: normalizedPayload.courseId,
      since: new Date(this.now().getTime() - env.LEAD_DEDUP_WINDOW_MS),
    });

    if (duplicate) {
      logger.warn("lead.create_duplicate_suppressed", { leadId: duplicate.id });
      return { lead: duplicate, status: "duplicate" as const };
    }

    let lead: LeadRecord;
    try {
      lead = await this.repository.create(normalizedPayload);
    } catch (error) {
      if (normalizedPayload.idempotencyKey && isUniqueConstraintError(error)) {
        const existing = await this.repository.findByIdempotencyKey(normalizedPayload.idempotencyKey);
        if (existing) {
          logger.info("lead.create_idempotent_replay", { leadId: existing.id });
          return { lead: existing, status: "idempotent" as const };
        }
      }
      throw error;
    }

    const sheetPayload: LeadRowInput = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      message: lead.message,
      course: lead.course,
    };

    this.appendLeadRow(sheetPayload)
      .catch((err) => logger.error("sheets.append_lead_failed", { error: err }));

    return { lead, status: "created" as const };
  }

  async listLeads(input: LeadListInput = {}) {
    return this.repository.list({
      page: normalizePage(input.page),
      pageSize: normalizePageSize(input.pageSize),
      visibility: input.visibility ?? "active",
      courseId: input.courseId,
      courseName: input.courseName,
    });
  }

  async softDeleteLeads(input: {
    actor: AdminActor;
    scope: LeadDeletionScope;
    leadIds?: string[];
    courseId?: string;
    courseName?: string;
    reason: string;
    confirmation: string;
  }) {
    assertCanSoftDelete(input.actor, input.scope);
    assertDeletionReason(input.reason);
    assertConfirmation(input.confirmation, LEAD_DELETE_CONFIRMATIONS[input.scope]);

    const reason = normalizeReason(input.reason);
    const filter = filterForScope(input);
    const ids = await this.repository.findIds(filter, "active");
    const affectedCount = await this.repository.softDeleteByIds(ids, this.now(), input.actor, reason);

    await this.repository.audit({
      action: "soft_delete",
      scope: input.scope,
      leadIds: ids,
      courseId: input.courseId ?? null,
      courseName: input.courseName ?? null,
      reason,
      confirmation: input.confirmation,
      actor: input.actor,
      affectedCount,
    });

    return { deleted: affectedCount };
  }

  async restoreLeads(input: {
    actor: AdminActor;
    leadIds: string[];
    reason: string;
    confirmation: string;
  }) {
    if (input.actor.role === "viewer") throw new Error("LEAD_RESTORE_FORBIDDEN");
    assertDeletionReason(input.reason);
    assertConfirmation(input.confirmation, LEAD_DELETE_CONFIRMATIONS.restore);

    const ids = await this.repository.findIds({ ids: input.leadIds }, "deleted");
    const affectedCount = await this.repository.restoreByIds(ids);

    await this.repository.audit({
      action: "restore",
      scope: "restore",
      leadIds: ids,
      reason: normalizeReason(input.reason),
      confirmation: input.confirmation,
      actor: input.actor,
      affectedCount,
    });

    return { restored: affectedCount };
  }

  async purgeDeletedLeads(input: {
    actor: AdminActor;
    leadIds: string[];
    reason: string;
    confirmation: string;
  }) {
    assertSuperAdmin(input.actor);
    assertDeletionReason(input.reason);
    assertConfirmation(input.confirmation, LEAD_DELETE_CONFIRMATIONS.purge);

    const ids = await this.repository.findIds({ ids: input.leadIds }, "deleted");
    const affectedCount = await this.repository.purgeDeletedByIds(ids);

    await this.repository.audit({
      action: "purge",
      scope: "purge",
      leadIds: ids,
      reason: normalizeReason(input.reason),
      confirmation: input.confirmation,
      actor: input.actor,
      affectedCount,
    });

    return { purged: affectedCount };
  }
}

export const leadService = new LeadService();
