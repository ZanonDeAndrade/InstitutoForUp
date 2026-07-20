import { strict as assert } from "node:assert";
import test from "node:test";
import express from "express";
import request from "supertest";
import type {
  CourseLeadConfig,
  CreateLeadInput,
  LeadDeletionAuditInput,
  LeadListInput,
  LeadRecord,
  LeadRepository,
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
  process.env.RATE_LIMIT_LEADS_WINDOW_MS = "1000";
  process.env.RATE_LIMIT_LEADS_MAX = "20";
  process.env.LEAD_DEDUP_WINDOW_MS = "86400000";
};

configureEnv();

const requireHeader = (value: string | string[] | undefined, name: string) => {
  if (typeof value !== "string") {
    throw new Error(`missing ${name} header`);
  }
  return value;
};

class MemoryLeadRepository implements LeadRepository {
  records: LeadRecord[] = [];
  createdInputs: CreateLeadInput[] = [];
  audits: LeadDeletionAuditInput[] = [];
  courses = new Map<string, CourseLeadConfig>([
    ["course-a", { id: "course-a", name: "Curso A", fields: { name: true, email: true, phone: true, source: true } }],
  ]);

  async create(data: CreateLeadInput) {
    this.createdInputs.push(data);
    const now = new Date("2026-07-13T12:00:00.000Z");
    const record: LeadRecord = {
      id: `lead-${this.records.length + 1}`,
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      source: data.source ?? null,
      message: data.message ?? null,
      course: data.course ?? null,
      courseId: data.courseId ?? null,
      submittedAt: now,
      createdAt: now,
      deletedAt: null,
      deletedBy: null,
      deletionReason: null,
    };
    const persisted = {
      ...record,
      id: data.idempotencyKey ? `${record.id}:${data.idempotencyKey}` : record.id,
    };
    this.records.push(persisted);
    return persisted;
  }

  async getCourseLeadConfig(courseId: string) {
    return this.courses.get(courseId) ?? null;
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    return this.records.find((lead) => lead.id.endsWith(`:${idempotencyKey}`)) ?? null;
  }

  async findRecentDuplicate(input: {
    normalizedEmail: string;
    normalizedPhone?: string | null;
    course?: string | null;
    courseId?: string | null;
    since: Date;
  }) {
    return (
      this.records.find((lead) => {
        if (lead.submittedAt < input.since) return false;
        const emailMatches = lead.email.toLowerCase() === input.normalizedEmail;
        const phoneMatches = input.normalizedPhone ? (lead.phone ?? "").replace(/[^\d+]/g, "") === input.normalizedPhone : true;
        const courseMatches = input.courseId ? lead.courseId === input.courseId : lead.course === input.course;
        return emailMatches && phoneMatches && courseMatches;
      }) ?? null
    );
  }

  async list(input: Required<Pick<LeadListInput, "page" | "pageSize" | "visibility">> & Omit<LeadListInput, "page" | "pageSize" | "visibility">) {
    return {
      items: this.records,
      page: input.page,
      pageSize: input.pageSize,
      total: this.records.length,
      totalPages: 1,
    };
  }

  async findIds() {
    return [];
  }

  async softDeleteByIds() {
    return 0;
  }

  async restoreByIds() {
    return 0;
  }

  async purgeDeletedByIds() {
    return 0;
  }

  async audit(input: LeadDeletionAuditInput) {
    this.audits.push(input);
  }
}

const validLeadPayload = (overrides: Record<string, unknown> = {}) => ({
  name: "Maria Silva",
  email: "MARIA@example.com",
  phone: "(11) 99999-0000",
  source: "instagram",
  message: "Quero receber mais informacoes.",
  course: "Curso A",
  courseId: "course-a",
  captchaToken: "valid-captcha-token",
  idempotencyKey: `idem-${Math.random().toString(16).slice(2)}-123456`,
  website: "",
  formStartedAt: Date.now() - 3_000,
  ...overrides,
});

const createApp = async (options: { captchaValid?: boolean; limit?: number; repository?: MemoryLeadRepository } = {}) => {
  const [{ createLeadController }, { LeadService }, { createRateLimiter }, { requestIdMiddleware }, { errorHandler }, { asyncHandler }] =
    await Promise.all([
      import("../controllers/leadController"),
      import("../services/leadService"),
      import("../config/rateLimit"),
      import("../middleware/requestId"),
      import("../middleware/errorHandler"),
      import("../utils/asyncHandler"),
    ]);

  const repository = options.repository ?? new MemoryLeadRepository();
  const service = new LeadService(repository, () => new Date("2026-07-13T12:00:00.000Z"), async () => undefined);
  const controller = createLeadController(service, {
    async verify() {
      return options.captchaValid ?? true;
    },
  });

  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(requestIdMiddleware);
  app.post(
    "/api/leads",
    createRateLimiter({ name: "lead-create", windowMs: 1_000, max: options.limit ?? 20 }),
    asyncHandler(controller.create),
  );
  app.use(errorHandler);
  return { app, repository };
};

test("public lead endpoint accepts a legitimate lead and normalizes contact data", async () => {
  const { app, repository } = await createApp();

  await request(app).post("/api/leads").set("X-Forwarded-For", "203.0.113.50").send(validLeadPayload()).expect(201);

  assert.equal(repository.records.length, 1);
  const record = repository.records[0];
  const createdInput = repository.createdInputs[0];
  assert.ok(record);
  assert.ok(createdInput);
  assert.equal(record.email, "maria@example.com");
  assert.equal(record.phone, "(11) 99999-0000");
  assert.equal(createdInput.normalizedEmail, "maria@example.com");
  assert.equal(createdInput.normalizedPhone, "11999990000");
});

test("public lead endpoint requires fields according to the trusted course config", async () => {
  const { app, repository } = await createApp();

  const response = await request(app)
    .post("/api/leads")
    .set("X-Forwarded-For", "203.0.113.56")
    .send(validLeadPayload({ phone: undefined }))
    .expect(400);

  assert.equal(response.body.error.code, "LEAD_PHONE_REQUIRED");
  assert.equal(repository.records.length, 0);
});

test("public lead endpoint accepts a course with phone and source disabled", async () => {
  const repository = new MemoryLeadRepository();
  repository.courses.set("course-b", {
    id: "course-b",
    name: "Curso B Canonico",
    fields: { name: true, email: true, phone: false, source: false },
  });
  const { app } = await createApp({ repository });

  await request(app)
    .post("/api/leads")
    .set("X-Forwarded-For", "203.0.113.57")
    .send(validLeadPayload({ courseId: "course-b", course: "Nome adulterado", phone: undefined, source: undefined }))
    .expect(201);

  assert.equal(repository.records.length, 1);
  const record = repository.records[0];
  assert.ok(record);
  assert.equal(record.course, "Curso B Canonico");
  assert.equal(record.phone, null);
  assert.equal(record.source, null);
});

test("public lead endpoint rejects disabled configured fields when clients submit them", async () => {
  const repository = new MemoryLeadRepository();
  repository.courses.set("course-c", {
    id: "course-c",
    name: "Curso C",
    fields: { name: true, email: true, phone: false, source: false },
  });
  const { app } = await createApp({ repository });

  const response = await request(app)
    .post("/api/leads")
    .set("X-Forwarded-For", "203.0.113.58")
    .send(validLeadPayload({ courseId: "course-c", phone: "(11) 99999-0000", source: undefined }))
    .expect(400);

  assert.equal(response.body.error.code, "LEAD_PHONE_NOT_ALLOWED");
  assert.equal(repository.records.length, 0);
});

test("public lead endpoint rejects invalid source values and unknown fields", async () => {
  const { app, repository } = await createApp();

  const invalidSource = await request(app)
    .post("/api/leads")
    .set("X-Forwarded-For", "203.0.113.59")
    .send(validLeadPayload({ source: "crawler" }))
    .expect(400);

  assert.equal(invalidSource.body.error.code, "LEAD_SOURCE_INVALID");

  const unknownField = await request(app)
    .post("/api/leads")
    .set("X-Forwarded-For", "203.0.113.59")
    .send(validLeadPayload({ requiredFields: { phone: false } }))
    .expect(400);

  assert.equal(unknownField.body.error.code, "INVALID_LEAD_DATA");
  assert.equal(repository.records.length, 0);
});

test("public lead endpoint rejects leads for unknown courses", async () => {
  const { app, repository } = await createApp();

  const response = await request(app)
    .post("/api/leads")
    .set("X-Forwarded-For", "203.0.113.60")
    .send(validLeadPayload({ courseId: "missing-course" }))
    .expect(404);

  assert.equal(response.body.error.code, "COURSE_NOT_FOUND");
  assert.equal(repository.records.length, 0);
});

test("public lead endpoint rejects honeypot bot submissions", async () => {
  const { app, repository } = await createApp();

  const response = await request(app)
    .post("/api/leads")
    .set("X-Forwarded-For", "203.0.113.51")
    .send(validLeadPayload({ website: "https://bot.example" }))
    .expect(400);

  assert.equal(response.body.error.code, "LEAD_REJECTED");
  assert.equal(repository.records.length, 0);
});

test("public lead endpoint rejects invalid CAPTCHA tokens before storing data", async () => {
  const { app, repository } = await createApp({ captchaValid: false });

  const response = await request(app)
    .post("/api/leads")
    .set("X-Forwarded-For", "203.0.113.52")
    .send(validLeadPayload())
    .expect(400);

  assert.equal(response.body.error.code, "CAPTCHA_INVALID");
  assert.equal(repository.records.length, 0);
});

test("public lead endpoint deduplicates repeated contact/course submissions", async () => {
  const { app, repository } = await createApp();

  await request(app).post("/api/leads").set("X-Forwarded-For", "203.0.113.53").send(validLeadPayload()).expect(201);
  await request(app)
    .post("/api/leads")
    .set("X-Forwarded-For", "203.0.113.53")
    .send(validLeadPayload({ idempotencyKey: "different-idempotency-key-123" }))
    .expect(200);

  assert.equal(repository.records.length, 1);
});

test("public lead endpoint treats repeated idempotency keys as a replay", async () => {
  const { app, repository } = await createApp();
  const idempotencyKey = "same-idempotency-key-123";

  await request(app).post("/api/leads").set("X-Forwarded-For", "203.0.113.54").send(validLeadPayload({ idempotencyKey })).expect(201);
  await request(app)
    .post("/api/leads")
    .set("X-Forwarded-For", "203.0.113.54")
    .send(validLeadPayload({ email: "other@example.com", idempotencyKey }))
    .expect(200);

  assert.equal(repository.records.length, 1);
});

test("public lead endpoint returns 429 when the lead-specific rate limit is exceeded", async () => {
  const { app } = await createApp({ limit: 1 });

  await request(app).post("/api/leads").set("X-Forwarded-For", "203.0.113.55").send(validLeadPayload()).expect(201);
  const response = await request(app)
    .post("/api/leads")
    .set("X-Forwarded-For", "203.0.113.55")
    .send(validLeadPayload({ email: "rate@example.com", idempotencyKey: "rate-idempotency-key-123" }))
    .expect(429);

  assert.equal(response.body.policy, "lead-create");
  const retryAfter = requireHeader(response.headers["retry-after"], "retry-after");
  assert.match(retryAfter, /^\d+$/);
});
