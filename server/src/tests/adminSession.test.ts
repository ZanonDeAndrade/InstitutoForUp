import { strict as assert } from "node:assert";
import test from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";

const TEST_SECRET = "test-token-secret-12345678901234567890";
const ALLOWED_ORIGIN = "http://localhost:5173";

const configureEnv = () => {
  process.env.NODE_ENV = "test";
  process.env.PUBLIC_BASE_URL = "http://localhost:4000";
  process.env.DATABASE_URL = "postgresql://" + "user:password@localhost:5432/forup";
  process.env.DIRECT_URL = "postgresql://" + "user:password@localhost:5432/forup";
  process.env.CORS_ALLOWED_ORIGINS = ALLOWED_ORIGIN;
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

const extractCookieValue = (cookies: string[], name: string) => {
  const cookie = cookies.find((item) => item.startsWith(`${name}=`));
  assert.ok(cookie, `missing ${name} cookie`);
  const valuePart = cookie.split(";")[0];
  assert.ok(valuePart, `invalid ${name} cookie`);
  return decodeURIComponent(valuePart.slice(name.length + 1));
};

const createTestApp = async () => {
  const [{ createAuthRouter }, { requireAdmin }, tokenUtils] = await Promise.all([
    import("../routes/authRoutes"),
    import("../middleware/adminAuth"),
    import("../utils/token"),
  ]);
  tokenUtils.clearRevokedAdminTokensForTests();

  const app = express();
  app.use(express.json());
  app.use(
    "/api/auth",
    createAuthRouter({
      async authenticate(identifier: string, password: string) {
        if (identifier !== "admin@example.com" || password !== "correct-password-123") {
          const { AuthFailure } = await import("../services/adminAuthService");
          throw new AuthFailure("INVALID_CREDENTIALS");
        }
        return {
          id: "admin-1",
          email: "admin@example.com",
          username: "admin",
          role: "editor",
        };
      },
    }),
  );
  app.post("/api/protected", requireAdmin, (_req, res) => res.json({ ok: true }));
  return app;
};

test("login sets HttpOnly session cookie and CSRF cookie without returning the token", async () => {
  const app = await createTestApp();
  const response = await request(app)
    .post("/api/auth/login")
    .set("Origin", ALLOWED_ORIGIN)
    .send({ identifier: "admin@example.com", password: "correct-password-123" })
    .expect(200);

  assert.equal(response.body.token, undefined);
  assert.equal(response.body.user.username, "admin");
  assert.ok(response.body.user.permissions.includes("news.publish"));

  const cookies = response.headers["set-cookie"] as unknown as string[];
  const sessionCookie = cookies.find((cookie) => cookie.startsWith("forup_admin_session="));
  const csrfCookie = cookies.find((cookie) => cookie.startsWith("forup_admin_csrf="));

  assert.ok(sessionCookie?.includes("HttpOnly"));
  assert.ok(sessionCookie?.includes("Path=/api"));
  assert.ok(sessionCookie?.includes("SameSite=Lax"));
  assert.ok(csrfCookie);
  assert.equal(csrfCookie.includes("HttpOnly"), false);
  assert.ok(csrfCookie.includes("Path=/"));
});

test("session endpoint confirms authentication from backend cookie", async () => {
  const app = await createTestApp();
  const agent = request.agent(app);

  await agent
    .post("/api/auth/login")
    .send({ identifier: "admin@example.com", password: "correct-password-123" })
    .expect(200);

  const session = await agent.get("/api/auth/session").expect(200);
  assert.equal(session.body.user.id, "admin-1");
  assert.equal(session.body.user.role, "editor");
  assert.ok(session.body.user.permissions.includes("courses.manage"));
});

test("refresh rotates the session cookie when CSRF is valid", async () => {
  const app = await createTestApp();
  const agent = request.agent(app);

  const login = await agent
    .post("/api/auth/login")
    .send({ identifier: "admin@example.com", password: "correct-password-123" })
    .expect(200);
  const csrf = extractCookieValue(login.headers["set-cookie"] as unknown as string[], "forup_admin_csrf");

  const refresh = await agent.post("/api/auth/refresh").set("X-CSRF-Token", csrf).expect(200);

  assert.equal(refresh.body.user.username, "admin");
  assert.ok((refresh.headers["set-cookie"] as unknown as string[]).some((cookie) => cookie.startsWith("forup_admin_session=")));
});

test("unsafe admin request without CSRF is rejected", async () => {
  const app = await createTestApp();
  const agent = request.agent(app);

  await agent
    .post("/api/auth/login")
    .send({ identifier: "admin@example.com", password: "correct-password-123" })
    .expect(200);

  await agent.post("/api/protected").send({ ok: true }).expect(403);
});

test("logout revokes the current session", async () => {
  const app = await createTestApp();
  const agent = request.agent(app);

  const login = await agent
    .post("/api/auth/login")
    .send({ identifier: "admin@example.com", password: "correct-password-123" })
    .expect(200);
  const csrf = extractCookieValue(login.headers["set-cookie"] as unknown as string[], "forup_admin_csrf");

  await agent.post("/api/auth/logout").set("X-CSRF-Token", csrf).expect(204);
  await agent.get("/api/auth/session").expect(401);
});

test("expired session cookie is rejected", async () => {
  const app = await createTestApp();
  const { createAdminCsrfToken } = await import("../utils/token");
  const token = jwt.sign(
    {
      role: "editor",
      username: "admin",
      token_use: "admin_access",
    },
    TEST_SECRET,
    {
      algorithm: "HS256",
      audience: "forup-admin-panel",
      expiresIn: -1,
      issuer: "forup-admin-api",
      jwtid: "expired-session",
      subject: "admin-1",
      header: { alg: "HS256", typ: "JWT" },
    },
  );
  const csrf = createAdminCsrfToken("expired-session");

  await request(app)
    .get("/api/auth/session")
    .set("Cookie", [`forup_admin_session=${token}`, `forup_admin_csrf=${csrf}`])
    .expect(401);
});

test("CORS only allows configured origins for credentialed requests", async () => {
  const { isCorsOriginAllowed } = await import("../config/cors");

  assert.equal(isCorsOriginAllowed(ALLOWED_ORIGIN, [ALLOWED_ORIGIN]), true);
  assert.equal(isCorsOriginAllowed("https://evil.example", [ALLOWED_ORIGIN]), false);
});
