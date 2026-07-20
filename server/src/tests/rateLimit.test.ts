import { strict as assert } from "node:assert";
import test from "node:test";
import express from "express";
import request from "supertest";

const configureEnv = () => {
  process.env.NODE_ENV = "test";
  process.env.PUBLIC_BASE_URL = "http://localhost:4000";
  process.env.DATABASE_URL = "postgresql://" + "user:password@localhost:5432/forup";
  process.env.DIRECT_URL = "postgresql://" + "user:password@localhost:5432/forup";
  process.env.STORAGE_DRIVER = "local";
  process.env.GOOGLE_SHEETS_CLIENT_EMAIL = "service-account@test.local";
  process.env.GOOGLE_SHEETS_PRIVATE_KEY = [
    "-----BEGIN " + "PRIVATE KEY-----",
    "test-private-key-body",
    "-----END " + "PRIVATE KEY-----",
  ].join("\n");
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID = "spreadsheet-id";
  process.env.ADMIN_TOKEN_SECRET = "test-token-secret-12345678901234567890";
  process.env.RATE_LIMIT_LOGIN_WINDOW_MS = "1000";
  process.env.RATE_LIMIT_LOGIN_MAX = "1";
};

configureEnv();

const requireHeader = (value: string | string[] | undefined, name: string) => {
  if (typeof value !== "string") {
    throw new Error(`missing ${name} header`);
  }
  return value;
};

const createLimitedApp = async (windowMs = 100) => {
  const { createRateLimiter } = await import("../config/rateLimit");
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.get("/uploads/file.png", (_req, res) => res.status(204).send());
  app.post(
    "/limited",
    createRateLimiter({
      name: "lead-create",
      windowMs,
      max: 1,
    }),
    (_req, res) => res.json({ ok: true }),
  );
  return app;
};

const createLoginApp = async () => {
  const { createAuthRouter } = await import("../routes/authRoutes");
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(
    "/api/auth",
    createAuthRouter({
      async authenticate() {
        return {
          id: "admin-1",
          email: "admin@example.com",
          username: "admin",
          role: "editor",
        };
      },
    }),
  );
  return app;
};

test("login route uses a stricter independent limiter", async () => {
  const app = await createLoginApp();

  await request(app)
    .post("/api/auth/login")
    .set("X-Forwarded-For", "203.0.113.20")
    .send({ identifier: "admin@example.com", password: "correct-password-123" })
    .expect(200);

  const limited = await request(app)
    .post("/api/auth/login")
    .set("X-Forwarded-For", "203.0.113.20")
    .send({ identifier: "admin@example.com", password: "correct-password-123" })
    .expect(429);

  assert.equal(limited.body.policy, "login");

  await request(app)
    .post("/api/auth/login")
    .set("X-Forwarded-For", "203.0.113.21")
    .send({ identifier: "admin@example.com", password: "correct-password-123" })
    .expect(200);
});

test("returns standardized 429 and Retry-After when route limit is exceeded", async () => {
  const app = await createLimitedApp(1_000);

  await request(app).post("/limited").set("X-Forwarded-For", "203.0.113.10").expect(200);
  const limited = await request(app).post("/limited").set("X-Forwarded-For", "203.0.113.10").expect(429);

  assert.equal(limited.body.code, "RATE_LIMITED");
  assert.equal(limited.body.policy, "lead-create");
  const retryAfter = requireHeader(limited.headers["retry-after"], "retry-after");
  assert.match(retryAfter, /^\d+$/);
});

test("rate limit window resets after expiration", async () => {
  const app = await createLimitedApp(300);

  await request(app).post("/limited").set("X-Forwarded-For", "203.0.113.11").expect(200);
  await request(app).post("/limited").set("X-Forwarded-For", "203.0.113.11").expect(429);
  await new Promise((resolve) => setTimeout(resolve, 380));
  await request(app).post("/limited").set("X-Forwarded-For", "203.0.113.11").expect(200);
});

test("different normalized IPs have independent rate limit buckets", async () => {
  const app = await createLimitedApp(1_000);

  await request(app).post("/limited").set("X-Forwarded-For", "203.0.113.12").expect(200);
  await request(app).post("/limited").set("X-Forwarded-For", "203.0.113.13").expect(200);
});

test("healthcheck and public assets are not affected by route-specific limiter", async () => {
  const app = await createLimitedApp(1_000);

  await request(app).post("/limited").set("X-Forwarded-For", "203.0.113.14").expect(200);
  await request(app).post("/limited").set("X-Forwarded-For", "203.0.113.14").expect(429);
  await request(app).get("/health").set("X-Forwarded-For", "203.0.113.14").expect(200);
  await request(app).get("/uploads/file.png").set("X-Forwarded-For", "203.0.113.14").expect(204);
});
