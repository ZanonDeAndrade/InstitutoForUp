import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const baseEnv = {
  NODE_ENV: "development",
  PUBLIC_BASE_URL: "http://localhost:4000",
  DATABASE_URL: "postgresql://user:password@localhost:5432/forup",
  DIRECT_URL: "postgresql://user:password@localhost:5432/forup",
  CORS_ALLOWED_ORIGINS: "http://localhost:5173",
  STORAGE_DRIVER: "local",
  GOOGLE_SHEETS_CLIENT_EMAIL: "service-account@test.local",
  GOOGLE_SHEETS_PRIVATE_KEY: [
    "-----BEGIN " + "PRIVATE KEY-----",
    "test-private-key-body",
    "-----END " + "PRIVATE KEY-----",
  ].join("\n"),
  GOOGLE_SHEETS_SPREADSHEET_ID: "spreadsheet-id",
  ADMIN_TOKEN_SECRET: "test-token-secret-12345678901234567890",
};

Object.assign(process.env, baseEnv);

test("Prisma schema and migration lock are pinned to PostgreSQL", () => {
  const schema = readFileSync(resolve("prisma/schema.prisma"), "utf8");
  const migrationLock = readFileSync(resolve("prisma/migrations/migration_lock.toml"), "utf8");

  assert.match(schema, /datasource\s+db\s+{[\s\S]*provider\s*=\s*"postgresql"/);
  assert.doesNotMatch(schema, /provider\s*=\s*"sqlite"/);
  assert.match(migrationLock, /provider\s*=\s*"postgresql"/);
});

test("backend environment rejects SQLite database URLs", async () => {
  const { parseBackendEnv } = await import("../config/env");

  const parsedDatabaseUrl = parseBackendEnv({
    ...baseEnv,
    DATABASE_URL: "file:./dev.db",
  });
  assert.equal(parsedDatabaseUrl.success, false);

  const parsedDirectUrl = parseBackendEnv({
    ...baseEnv,
    DIRECT_URL: "file:./dev.db",
  });
  assert.equal(parsedDirectUrl.success, false);
});

test("backend environment accepts PostgreSQL URLs for development", async () => {
  const { parseBackendEnv } = await import("../config/env");
  const parsed = parseBackendEnv(baseEnv);

  assert.equal(parsed.success, true);
});
