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
  process.env.CORS_ALLOWED_ORIGINS = "http://localhost:5173";
};

configureEnv();

const createApp = async () => {
  const [{ appErrors }, { errorHandler }, { requestIdMiddleware }, { requireAdmin }, { ImageUploadError }] =
    await Promise.all([
      import("../errors/AppError"),
      import("../middleware/errorHandler"),
      import("../middleware/requestId"),
      import("../middleware/adminAuth"),
      import("../services/imageUploadService"),
    ]);
  const app = express();
  app.use(express.json());
  app.use(requestIdMiddleware);
  app.get("/internal-db", (_req, _res, next) =>
    next(
      new Error(
        "Prisma failed: SELECT * FROM Lead WHERE email='person@example.com' storageKey=courses/private.webp signedUrl=https://example.com/file?token=secret",
      ),
    ),
  );
  app.get("/external", (_req, _res, next) =>
    next(new Error("Google Sheets private_key failed with credential service-account@example.com")),
  );
  app.get("/validation", (_req, _res, next) =>
    next(appErrors.validation("VALIDATION_ERROR", "Dados invalidos.", { email: "person@example.com" })),
  );
  app.get("/upload", (_req, _res, next) => next(new ImageUploadError("UPLOAD_IMAGE_CORRUPTED")));
  app.get("/admin", requireAdmin, (_req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  return app;
};

test("internal database errors return generic response with requestId and no sensitive details", async () => {
  const response = await request(await createApp()).get("/internal-db").set("X-Request-Id", "req-test-123").expect(500);

  assert.equal(response.headers["x-request-id"], "req-test-123");
  assert.equal(response.body.requestId, "req-test-123");
  assert.equal(response.body.error.code, "INTERNAL_ERROR");
  const body = JSON.stringify(response.body);
  assert.equal(body.includes("SELECT"), false);
  assert.equal(body.includes("storageKey"), false);
  assert.equal(body.includes("signedUrl"), false);
  assert.equal(body.includes("person@example.com"), false);
});

test("authentication errors are standardized", async () => {
  const response = await request(await createApp()).get("/admin").expect(401);

  assert.equal(response.body.error.type, "authentication");
  assert.equal(response.body.error.code, "AUTHENTICATION_REQUIRED");
  assert.ok(response.body.requestId);
});

test("validation errors are standardized without echoing personal payload", async () => {
  const response = await request(await createApp()).get("/validation").expect(400);

  assert.equal(response.body.error.type, "validation");
  assert.equal(response.body.error.code, "VALIDATION_ERROR");
  assert.equal(JSON.stringify(response.body).includes("person@example.com"), false);
});

test("upload errors are public and do not expose internals", async () => {
  const response = await request(await createApp()).get("/upload").expect(400);

  assert.equal(response.body.error.type, "validation");
  assert.equal(response.body.error.code, "UPLOAD_IMAGE_CORRUPTED");
});

test("external integration errors return generic internal response", async () => {
  const response = await request(await createApp()).get("/external").expect(500);

  assert.equal(response.body.error.code, "INTERNAL_ERROR");
  assert.equal(JSON.stringify(response.body).includes("private_key"), false);
  assert.equal(JSON.stringify(response.body).includes("service-account"), false);
});

test("logger redacts sensitive fields recursively", async () => {
  const { redactSensitive } = await import("../utils/logger");
  const redacted = redactSensitive({
    headers: {
      authorization: "Bearer secret-token",
      cookie: "forup_admin_session=secret",
    },
    payload: {
      email: "person@example.com",
      nested: {
        signedUrl: "https://example.com/file?token=secret",
        storageKey: "courses/private.webp",
      },
    },
  });

  const serialized = JSON.stringify(redacted);
  assert.equal(serialized.includes("secret-token"), false);
  assert.equal(serialized.includes("forup_admin_session"), false);
  assert.equal(serialized.includes("person@example.com"), false);
  assert.equal(serialized.includes("courses/private.webp"), false);
});

test("logger redacts sensitive data inside Error message and stack", async () => {
  const { redactSensitive } = await import("../utils/logger");
  const error = new Error(
    "SELECT * FROM Lead WHERE email='person@example.com' storageKey=courses/private.webp url=https://example.com/a?token=secret",
  );
  const serialized = JSON.stringify(redactSensitive({ error }));

  assert.equal(serialized.includes("person@example.com"), false);
  assert.equal(serialized.includes("courses/private.webp"), false);
  assert.equal(serialized.includes("token=secret"), false);
  assert.equal(serialized.includes("storageKey="), false);
  assert.equal(serialized.includes("signedUrl="), false);
  assert.equal(serialized.includes("private_key"), false);
});
