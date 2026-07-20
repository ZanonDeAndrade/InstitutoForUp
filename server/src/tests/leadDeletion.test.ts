import { strict as assert } from "node:assert";
import test from "node:test";
import express from "express";
import request from "supertest";
import { AdminRole } from "@prisma/client";
import type {
  AdminActor,
  CourseLeadConfig,
  CreateLeadInput,
  LeadDeletionAuditInput,
  LeadListInput,
  LeadRecord,
  LeadRepository,
  LeadVisibility,
} from "../services/leadService";

const configureEnv = () => {
  process.env.NODE_ENV = "test";
  process.env.PUBLIC_BASE_URL = "http://localhost:4000";
  process.env.DATABASE_URL = "postgresql://" + "user:password@localhost:5432/forup";
  process.env.DIRECT_URL = "postgresql://" + "user:password@localhost:5432/forup";
  process.env.CORS_ALLOWED_ORIGINS = "http://localhost:5173";
  process.env.STORAGE_DRIVER = "local";
  process.env.GOOGLE_SHEETS_CLIENT_EMAIL = "service-account@test.local";
  process.env.GOOGLE_SHEETS_PRIVATE_KEY = [
    "-----BEGIN " + "PRIVATE KEY-----",
    "test-private-key-body",
    "-----END " + "PRIVATE KEY-----",
  ].join("\n");
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID = "spreadsheet-id";
  process.env.ADMIN_TOKEN_SECRET = "test-token-secret-12345678901234567890";
  process.env.RATE_LIMIT_ADMIN_MAX = "100";
};

configureEnv();

class MemoryLeadRepository implements LeadRepository {
  records: LeadRecord[];
  audits: LeadDeletionAuditInput[] = [];

  constructor(records: LeadRecord[]) {
    this.records = records;
  }

  async create(data: CreateLeadInput) {
    const now = new Date("2026-07-13T00:00:00.000Z");
    const record = { ...data, id: `lead-${this.records.length + 1}`, submittedAt: now, createdAt: now };
    this.records.push(record);
    return record;
  }

  async getCourseLeadConfig(): Promise<CourseLeadConfig | null> {
    return {
      id: "course-a",
      name: "Curso A",
      fields: { name: true, email: true, phone: true, source: true },
    };
  }

  async findByIdempotencyKey() {
    return null;
  }

  async findRecentDuplicate() {
    return null;
  }

  async list(input: Required<Pick<LeadListInput, "page" | "pageSize" | "visibility">> & Omit<LeadListInput, "page" | "pageSize" | "visibility">) {
    const filtered = this.filter({ courseId: input.courseId, courseName: input.courseName }, input.visibility);
    const start = (input.page - 1) * input.pageSize;
    const items = filtered.slice(start, start + input.pageSize);
    return {
      items,
      page: input.page,
      pageSize: input.pageSize,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / input.pageSize)),
    };
  }

  async findIds(filter: { ids?: string[]; courseId?: string; courseName?: string }, visibility: LeadVisibility) {
    return this.filter(filter, visibility).map((lead) => lead.id);
  }

  async softDeleteByIds(ids: string[], deletedAt: Date, actor: AdminActor, reason: string) {
    let count = 0;
    for (const lead of this.records) {
      if (ids.includes(lead.id) && !lead.deletedAt) {
        lead.deletedAt = deletedAt;
        lead.deletedBy = actor.id;
        lead.deletionReason = reason;
        count += 1;
      }
    }
    return count;
  }

  async restoreByIds(ids: string[]) {
    let count = 0;
    for (const lead of this.records) {
      if (ids.includes(lead.id) && lead.deletedAt) {
        lead.deletedAt = null;
        lead.deletedBy = null;
        lead.deletionReason = null;
        count += 1;
      }
    }
    return count;
  }

  async purgeDeletedByIds(ids: string[]) {
    const before = this.records.length;
    this.records = this.records.filter((lead) => !(ids.includes(lead.id) && lead.deletedAt));
    return before - this.records.length;
  }

  async audit(input: LeadDeletionAuditInput) {
    this.audits.push(input);
  }

  private filter(filter: { ids?: string[]; courseId?: string; courseName?: string }, visibility: LeadVisibility) {
    return this.records
      .filter((lead) => {
        if (visibility === "active" && lead.deletedAt) return false;
        if (visibility === "deleted" && !lead.deletedAt) return false;
        if (filter.ids?.length && !filter.ids.includes(lead.id)) return false;
        if (filter.courseId || filter.courseName) {
          return lead.courseId === filter.courseId || lead.course === filter.courseName;
        }
        return true;
      })
      .sort((left, right) => right.submittedAt.getTime() - left.submittedAt.getTime());
  }
}

const lead = (id: string, overrides: Partial<LeadRecord> = {}): LeadRecord => ({
  id,
  name: `Lead ${id}`,
  email: `${id}@example.com`,
  phone: null,
  source: "site",
  message: null,
  course: "Curso A",
  courseId: "course-a",
  submittedAt: new Date(`2026-07-13T00:00:0${id.replace(/\D/g, "") || "1"}.000Z`),
  createdAt: new Date("2026-07-13T00:00:00.000Z"),
  deletedAt: null,
  deletedBy: null,
  deletionReason: null,
  ...overrides,
});

const editor: AdminActor = { id: "editor-1", role: AdminRole.editor };
const superAdmin: AdminActor = { id: "super-1", role: AdminRole.super_admin };

const loadLeadService = async () => import("../services/leadService");

test("common lead listing excludes soft-deleted records and supports pagination", async () => {
  const { LeadService } = await loadLeadService();
  const repository = new MemoryLeadRepository([
    lead("1"),
    lead("2", { courseId: "course-b", course: "Curso B" }),
    lead("3", { deletedAt: new Date("2026-07-13T01:00:00.000Z") }),
  ]);
  const service = new LeadService(repository);

  const active = await service.listLeads({ page: 1, pageSize: 1 });
  assert.equal(active.total, 2);
  assert.equal(active.items.length, 1);
  const activeLead = active.items[0];
  assert.ok(activeLead);
  assert.equal(activeLead.deletedAt, null);

  const deleted = await service.listLeads({ visibility: "deleted" });
  assert.equal(deleted.total, 1);
  const deletedLead = deleted.items[0];
  assert.ok(deletedLead);
  assert.equal(deletedLead.id, "3");
});

test("selected lead deletion is soft, audited and requires explicit confirmation", async () => {
  const { LeadService, LEAD_DELETE_CONFIRMATIONS } = await loadLeadService();
  const repository = new MemoryLeadRepository([lead("1"), lead("2")]);
  const service = new LeadService(repository, () => new Date("2026-07-13T12:00:00.000Z"));

  await assert.rejects(
    () =>
      service.softDeleteLeads({
        actor: editor,
        scope: "selected",
        leadIds: ["1"],
        reason: "pedido do titular",
        confirmation: "DELETE",
      }),
    /LEAD_DELETION_CONFIRMATION_REQUIRED/,
  );

  const result = await service.softDeleteLeads({
    actor: editor,
    scope: "selected",
    leadIds: ["1"],
    reason: "pedido do titular",
    confirmation: LEAD_DELETE_CONFIRMATIONS.selected,
  });

  assert.equal(result.deleted, 1);
  const deletedLead = repository.records[0];
  const audit = repository.audits[0];
  assert.ok(deletedLead);
  assert.ok(audit);
  assert.equal(deletedLead.deletedBy, editor.id);
  assert.equal(deletedLead.deletionReason, "pedido do titular");
  assert.ok(deletedLead.deletedAt);
  assert.equal(repository.audits.length, 1);
  assert.equal(audit.action, "soft_delete");
  assert.deepEqual(audit.leadIds, ["1"]);
});

test("batch deletion of all leads is blocked for non super_admin", async () => {
  const { LeadService, LEAD_DELETE_CONFIRMATIONS } = await loadLeadService();
  const service = new LeadService(new MemoryLeadRepository([lead("1")]));

  await assert.rejects(
    () =>
      service.softDeleteLeads({
        actor: editor,
        scope: "all",
        reason: "limpeza operacional aprovada",
        confirmation: LEAD_DELETE_CONFIRMATIONS.all,
      }),
    /LEAD_DELETE_ALL_FORBIDDEN/,
  );
});

test("soft-deleted leads can be restored with audit", async () => {
  const { LeadService, LEAD_DELETE_CONFIRMATIONS } = await loadLeadService();
  const repository = new MemoryLeadRepository([
    lead("1", {
      deletedAt: new Date("2026-07-13T12:00:00.000Z"),
      deletedBy: "editor-1",
      deletionReason: "pedido do titular",
    }),
  ]);
  const service = new LeadService(repository);

  const result = await service.restoreLeads({
    actor: editor,
    leadIds: ["1"],
    reason: "restauracao solicitada",
    confirmation: LEAD_DELETE_CONFIRMATIONS.restore,
  });

  assert.equal(result.restored, 1);
  const restoredLead = repository.records[0];
  const audit = repository.audits[0];
  assert.ok(restoredLead);
  assert.ok(audit);
  assert.equal(restoredLead.deletedAt, null);
  assert.equal(restoredLead.deletedBy, null);
  assert.equal(restoredLead.deletionReason, null);
  assert.equal(audit.action, "restore");
});

test("permanent deletion only purges already deleted leads and requires super_admin", async () => {
  const { LeadService, LEAD_DELETE_CONFIRMATIONS } = await loadLeadService();
  const repository = new MemoryLeadRepository([
    lead("1", { deletedAt: new Date("2026-07-13T12:00:00.000Z") }),
    lead("2"),
  ]);
  const service = new LeadService(repository);

  await assert.rejects(
    () =>
      service.purgeDeletedLeads({
        actor: editor,
        leadIds: ["1", "2"],
        reason: "retencao expirada",
        confirmation: LEAD_DELETE_CONFIRMATIONS.purge,
      }),
    /LEAD_PURGE_FORBIDDEN/,
  );

  const result = await service.purgeDeletedLeads({
    actor: superAdmin,
    leadIds: ["1", "2"],
    reason: "retencao expirada",
    confirmation: LEAD_DELETE_CONFIRMATIONS.purge,
  });

  assert.equal(result.purged, 1);
  assert.deepEqual(repository.records.map((item) => item.id), ["2"]);
  const audit = repository.audits[0];
  assert.ok(audit);
  assert.equal(audit.action, "purge");
});

test("generic lead delete route is unavailable and permanent delete is restricted by role", async () => {
  const [
    { default: leadRoutes },
    { requestIdMiddleware },
    { errorHandler },
    { signAdminToken },
    { ADMIN_SESSION_COOKIE, ADMIN_CSRF_COOKIE },
    { LEAD_DELETE_CONFIRMATIONS },
  ] =
    await Promise.all([
      import("../routes/leadRoutes"),
      import("../middleware/requestId"),
      import("../middleware/errorHandler"),
      import("../utils/token"),
      import("../utils/authCookies"),
      loadLeadService(),
    ]);
  const session = signAdminToken({ id: "editor-1", role: "editor", username: "editor" });
  const app = express();
  app.use(express.json());
  app.use(requestIdMiddleware);
  app.use("/api/leads", leadRoutes);
  app.use(errorHandler);

  await request(app)
    .delete("/api/leads")
    .set("Cookie", [`${ADMIN_SESSION_COOKIE}=${session.token}`, `${ADMIN_CSRF_COOKIE}=${session.csrfToken}`])
    .set("X-CSRF-Token", session.csrfToken)
    .send({ confirmation: LEAD_DELETE_CONFIRMATIONS.all, reason: "limpeza operacional aprovada" })
    .expect(404);

  const response = await request(app)
    .delete("/api/leads/permanent")
    .set("Cookie", [`${ADMIN_SESSION_COOKIE}=${session.token}`, `${ADMIN_CSRF_COOKIE}=${session.csrfToken}`])
    .set("X-CSRF-Token", session.csrfToken)
    .send({ leadIds: ["1"], confirmation: LEAD_DELETE_CONFIRMATIONS.purge, reason: "retencao expirada" })
    .expect(403);

  assert.equal(response.body.error.code, "FORBIDDEN");
});
