import { strict as assert } from "node:assert";
import test from "node:test";
import express, { type RequestHandler } from "express";
import request from "supertest";

const TEST_SECRET = "test-token-secret-12345678901234567890";

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
  process.env.ADMIN_TOKEN_SECRET = TEST_SECRET;
  process.env.RATE_LIMIT_LOGIN_MAX = "100";
  process.env.RATE_LIMIT_ADMIN_MAX = "100";
  process.env.RATE_LIMIT_UPLOAD_MAX = "100";
};

configureEnv();

test("RBAC denies by default and authorizes each protected admin action by permission", async () => {
  const [
    { ADMIN_PERMISSIONS },
    { requireAdmin, requirePermission },
    { errorHandler },
    { requestIdMiddleware },
    { signAdminToken },
    { ADMIN_SESSION_COOKIE, ADMIN_CSRF_COOKIE },
  ] = await Promise.all([
    import("../auth/rbac"),
    import("../middleware/adminAuth"),
    import("../middleware/errorHandler"),
    import("../middleware/requestId"),
    import("../utils/token"),
    import("../utils/authCookies"),
  ]);

  const app = express();
  app.use(express.json());
  app.use(requestIdMiddleware);

  const ok: RequestHandler = (_req, res) => res.json({ ok: true });
  app.get("/api/leads", requireAdmin, requirePermission(ADMIN_PERMISSIONS.VIEW_LEADS), ok);
  app.post("/api/leads/bulk-delete", requireAdmin, requirePermission(ADMIN_PERMISSIONS.DELETE_LEADS), ok);
  app.post("/api/courses", requireAdmin, requirePermission(ADMIN_PERMISSIONS.MANAGE_COURSES), ok);
  app.post("/api/courses/:courseId/images", requireAdmin, requirePermission(ADMIN_PERMISSIONS.MANAGE_IMAGES), ok);
  app.post("/api/news", requireAdmin, requirePermission(ADMIN_PERMISSIONS.PUBLISH_NEWS), ok);
  app.post("/api/admin-users", requireAdmin, requirePermission(ADMIN_PERMISSIONS.MANAGE_USERS), ok);
  app.use(errorHandler);

  const cases = [
    { role: "super_admin", expected: [200, 200, 200, 200, 200, 200] },
    { role: "editor", expected: [200, 403, 200, 200, 200, 403] },
    { role: "viewer", expected: [200, 403, 403, 403, 403, 403] },
  ] as const;

  for (const entry of cases) {
    const session = signAdminToken({ id: `${entry.role}-1`, role: entry.role, username: entry.role });
    const cookie = [
      `${ADMIN_SESSION_COOKIE}=${session.token}`,
      `${ADMIN_CSRF_COOKIE}=${session.csrfToken}`,
    ];

    const responses = await Promise.all([
      request(app).get("/api/leads").set("Cookie", cookie),
      request(app).post("/api/leads/bulk-delete").set("Cookie", cookie).set("X-CSRF-Token", session.csrfToken),
      request(app).post("/api/courses").set("Cookie", cookie).set("X-CSRF-Token", session.csrfToken),
      request(app).post("/api/courses/course-a/images").set("Cookie", cookie).set("X-CSRF-Token", session.csrfToken),
      request(app).post("/api/news").set("Cookie", cookie).set("X-CSRF-Token", session.csrfToken),
      request(app).post("/api/admin-users").set("Cookie", cookie).set("X-CSRF-Token", session.csrfToken),
    ]);

    assert.deepEqual(
      responses.map((response) => response.status),
      entry.expected,
      entry.role,
    );
  }
});

test("admin action audit records actor, action, resource and timestamp", async () => {
  const [
    { ADMIN_PERMISSIONS },
    { requireAdmin, requirePermission },
    { createAuditAdminAction },
    { AdminActionAuditService },
    { signAdminToken },
    { ADMIN_SESSION_COOKIE, ADMIN_CSRF_COOKIE },
  ] = await Promise.all([
    import("../auth/rbac"),
    import("../middleware/adminAuth"),
    import("../middleware/adminActionAudit"),
    import("../services/adminActionAuditService"),
    import("../utils/token"),
    import("../utils/authCookies"),
  ]);

  const records: unknown[] = [];
  const service = new AdminActionAuditService({
    async create(record) {
      records.push(record);
    },
  });

  const app = express();
  app.use(express.json());
  app.post(
    "/api/courses",
    requireAdmin,
    requirePermission(ADMIN_PERMISSIONS.MANAGE_COURSES),
    createAuditAdminAction(service)(ADMIN_PERMISSIONS.MANAGE_COURSES, "course", (req) => String(req.body.id)),
    (_req, res) => res.json({ ok: true }),
  );

  const session = signAdminToken({ id: "super-1", role: "super_admin", username: "super" });
  await request(app)
    .post("/api/courses")
    .set("Cookie", [`${ADMIN_SESSION_COOKIE}=${session.token}`, `${ADMIN_CSRF_COOKIE}=${session.csrfToken}`])
    .set("X-CSRF-Token", session.csrfToken)
    .set("X-Request-Id", "req-123")
    .send({ id: "course-a" })
    .expect(200);

  assert.equal(records.length, 1);
  assert.deepEqual(records[0], {
    actorId: "super-1",
    actorRole: "super_admin",
    action: ADMIN_PERMISSIONS.MANAGE_COURSES,
    resource: "course",
    resourceId: "course-a",
    method: "POST",
    path: "/api/courses",
    requestId: "req-123",
  });
});
