import { strict as assert } from "node:assert";
import test from "node:test";
import express from "express";
import request from "supertest";

const ALLOWED_ORIGIN = "http://localhost:5173";

const configureEnv = () => {
  process.env.NODE_ENV = "test";
  process.env.PUBLIC_BASE_URL = "http://localhost:4000";
  process.env.DATABASE_URL = "postgresql://" + "user:password@localhost:5432/forup";
  process.env.DIRECT_URL = "postgresql://" + "user:password@localhost:5432/forup";
  process.env.CORS_ALLOWED_ORIGINS = ALLOWED_ORIGIN;
  process.env.CORS_ALLOWED_METHODS = "GET,POST,PUT,DELETE,OPTIONS";
  process.env.CORS_ALLOWED_HEADERS = "Content-Type,X-CSRF-Token";
  process.env.CORS_ALLOW_NON_BROWSER_REQUESTS = "false";
  process.env.STORAGE_DRIVER = "local";
  process.env.GOOGLE_SHEETS_CLIENT_EMAIL = "service-account@test.local";
  process.env.GOOGLE_SHEETS_PRIVATE_KEY = [
    "-----BEGIN " + "PRIVATE KEY-----",
    "test-private-key-body",
    "-----END " + "PRIVATE KEY-----",
  ].join("\n");
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID = "spreadsheet-id";
  process.env.ADMIN_TOKEN_SECRET = "test-token-secret-12345678901234567890";
};

configureEnv();

const requireHeader = (value: string | string[] | undefined, name: string) => {
  if (typeof value !== "string") {
    throw new Error(`missing ${name} header`);
  }
  return value;
};

const createSecurityApp = async () => {
  const [{ corsMiddleware }, { permissionsPolicyHeader, securityHeadersMiddleware }] = await Promise.all([
    import("../config/cors"),
    import("../config/securityHeaders"),
  ]);

  const app = express();
  app.use(securityHeadersMiddleware);
  app.use((_req, res, next) => {
    res.setHeader("Permissions-Policy", permissionsPolicyHeader);
    next();
  });
  app.get("/uploads/logo.png", (_req, res) => res.status(204).send());
  app.use("/api", corsMiddleware);
  app.get("/api/ping", (_req, res) => res.json({ ok: true }));
  app.post("/api/ping", (_req, res) => res.json({ ok: true }));
  app.use((error: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    void next;
    if (error.message === "Not allowed by CORS") {
      return res.status(403).json({ message: "Origin not allowed" });
    }
    return res.status(500).json({ message: "Internal error" });
  });
  return app;
};

test("sets explicit security headers without unsafe CSP directives", async () => {
  const app = await createSecurityApp();
  const response = await request(app).get("/api/ping").set("Origin", ALLOWED_ORIGIN).expect(200);

  const csp = requireHeader(response.headers["content-security-policy"], "content-security-policy");
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.doesNotMatch(csp, /unsafe-inline/);
  assert.doesNotMatch(csp, /unsafe-eval/);
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.equal(response.headers["referrer-policy"], "strict-origin-when-cross-origin");
  const permissionsPolicy = requireHeader(response.headers["permissions-policy"], "permissions-policy");
  assert.match(permissionsPolicy, /camera=\(\)/);
  assert.equal(response.headers["x-frame-options"], "DENY");
});

test("allows configured CORS origin with credentials", async () => {
  const app = await createSecurityApp();
  const response = await request(app).get("/api/ping").set("Origin", ALLOWED_ORIGIN).expect(200);

  assert.equal(response.headers["access-control-allow-origin"], ALLOWED_ORIGIN);
  assert.equal(response.headers["access-control-allow-credentials"], "true");
  assert.equal(response.headers.vary, "Origin");
});

test("rejects invalid CORS origin", async () => {
  const app = await createSecurityApp();
  await request(app).get("/api/ping").set("Origin", "https://evil.example").expect(403);
});

test("rejects browser-like requests without Origin", async () => {
  const app = await createSecurityApp();
  await request(app)
    .post("/api/ping")
    .set("User-Agent", "Mozilla/5.0")
    .set("Sec-Fetch-Site", "same-origin")
    .send({ ok: true })
    .expect(403);
});

test("handles preflight with restricted methods, headers and credentials", async () => {
  const app = await createSecurityApp();
  const response = await request(app)
    .options("/api/ping")
    .set("Origin", ALLOWED_ORIGIN)
    .set("Access-Control-Request-Method", "POST")
    .set("Access-Control-Request-Headers", "Content-Type,X-CSRF-Token")
    .expect(204);

  assert.equal(response.headers["access-control-allow-origin"], ALLOWED_ORIGIN);
  assert.equal(response.headers["access-control-allow-credentials"], "true");
  assert.equal(response.headers["access-control-allow-methods"], "GET,POST,PUT,DELETE,OPTIONS");
  assert.equal(response.headers["access-control-allow-headers"], "Content-Type,X-CSRF-Token");
});

test("public assets are not blocked by API CORS middleware", async () => {
  const app = await createSecurityApp();
  await request(app).get("/uploads/logo.png").expect(204);
});
