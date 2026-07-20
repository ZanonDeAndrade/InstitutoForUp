import { strict as assert } from "node:assert";
import test from "node:test";
import jwt from "jsonwebtoken";

const TEST_SECRET = "test-token-secret-12345678901234567890";
const ISSUER = "forup-admin-api";
const AUDIENCE = "forup-admin-panel";

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
  process.env.ADMIN_TOKEN_SECRET = TEST_SECRET;
};

configureEnv();

const loadTokenModule = () => import("../utils/token");

const signTestToken = (input?: { expiresIn?: number; algorithm?: "HS256" | "HS384" }) =>
  jwt.sign(
    {
      role: "editor",
      username: "admin",
      token_use: "admin_access",
    },
    TEST_SECRET,
    {
      algorithm: input?.algorithm ?? "HS256",
      audience: AUDIENCE,
      expiresIn: input?.expiresIn ?? 60,
      issuer: ISSUER,
      jwtid: "test-token-id",
      subject: "admin-1",
      header: {
        alg: input?.algorithm ?? "HS256",
        typ: "JWT",
      },
    },
  );

const replaceLastChar = (value: string) => `${value.slice(0, -1)}${value.endsWith("a") ? "b" : "a"}`;

test("accepts a valid admin token", async () => {
  const { signAdminToken, verifyAdminToken } = await loadTokenModule();

  const { token, exp } = signAdminToken({ id: "admin-1", role: "editor", username: "admin" });
  const payload = verifyAdminToken(token);

  assert.equal(payload.sub, "admin-1");
  assert.equal(payload.role, "editor");
  assert.equal(payload.username, "admin");
  assert.equal(payload.token_use, "admin_access");
  assert.equal(payload.iss, ISSUER);
  assert.equal(payload.aud, AUDIENCE);
  assert.equal(payload.exp, exp);
  assert.ok(payload.jti);
});

test("rejects an expired admin token", async () => {
  const { AdminTokenError, verifyAdminToken } = await loadTokenModule();
  const token = signTestToken({ expiresIn: -1 });

  assert.throws(
    () => verifyAdminToken(token),
    (error) => error instanceof AdminTokenError && error.code === "expired" && error.statusCode === 401,
  );
});

test("rejects an admin token with invalid signature", async () => {
  const { AdminTokenError, verifyAdminToken } = await loadTokenModule();
  const token = replaceLastChar(signTestToken());

  assert.throws(
    () => verifyAdminToken(token),
    (error) => error instanceof AdminTokenError && error.code === "invalid" && error.statusCode === 401,
  );
});

test("rejects an admin token with a modified payload", async () => {
  const { AdminTokenError, verifyAdminToken } = await loadTokenModule();
  const [header, payload, signature] = signTestToken().split(".");
  assert.ok(header);
  assert.ok(payload);
  assert.ok(signature);
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  decoded.username = "attacker";
  const tamperedPayload = Buffer.from(JSON.stringify(decoded)).toString("base64url");
  const token = `${header}.${tamperedPayload}.${signature}`;

  assert.throws(
    () => verifyAdminToken(token),
    (error) => error instanceof AdminTokenError && error.code === "invalid" && error.statusCode === 401,
  );
});

test("rejects an admin token with an unapproved algorithm", async () => {
  const { AdminTokenError, verifyAdminToken } = await loadTokenModule();
  const token = signTestToken({ algorithm: "HS384" });

  assert.throws(
    () => verifyAdminToken(token),
    (error) => error instanceof AdminTokenError && error.code === "invalid" && error.statusCode === 401,
  );
});

test("rejects a broken admin token format", async () => {
  const { AdminTokenError, verifyAdminToken } = await loadTokenModule();

  assert.throws(
    () => verifyAdminToken("not-a-valid-jwt"),
    (error) => error instanceof AdminTokenError && error.code === "invalid" && error.statusCode === 401,
  );
});
