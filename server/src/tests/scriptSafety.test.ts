import { strict as assert } from "node:assert";
import { createRequire } from "node:module";
import test from "node:test";

const requireScripts = createRequire(__filename);
const {
  createMaintenanceContext,
  getDatabaseInfo,
  parseArgs,
  redactDatabaseUrl,
} = requireScripts("../../scripts/lib/safeMaintenance");

const localEnv = {
  NODE_ENV: "development",
  DATABASE_URL: "postgresql://user:password@localhost:5432/forup_h14_temp",
};

test("maintenance scripts default to dry-run and redact database credentials", () => {
  const context = createMaintenanceContext({
    scriptName: "seed-test",
    destructive: true,
    argv: [],
    env: localEnv,
  });

  assert.equal(context.dryRun, true);
  assert.equal(context.execute, false);
  assert.match(context.db.redactedUrl, /\[user\]/);
  assert.match(context.db.redactedUrl, /\[password\]/);
  assert.doesNotThrow(() => context.assertCanExecute());
});

test("destructive maintenance execution requires explicit allow flag", () => {
  const context = createMaintenanceContext({
    scriptName: "seed-test",
    destructive: true,
    argv: ["--execute"],
    env: localEnv,
  });

  assert.throws(() => context.assertCanExecute(), /--allow-destructive/);
});

test("remote databases require strong confirmation before writes", () => {
  const env = {
    NODE_ENV: "staging",
    DATABASE_URL: "postgresql://user:password@db.example.com:5432/forup",
  };
  const context = createMaintenanceContext({
    scriptName: "fix-test",
    destructive: false,
    argv: ["--execute"],
    env,
  });

  assert.equal(context.requiresStrongConfirmation, true);
  assert.throws(() => context.assertCanExecute(), /Confirmacao obrigatoria/);

  const confirmed = createMaintenanceContext({
    scriptName: "fix-test",
    destructive: false,
    argv: ["--execute", "--confirm", "fix-test:db.example.com:forup"],
    env,
  });
  assert.doesNotThrow(() => confirmed.assertCanExecute());
});

test("production requires an additional production confirmation", () => {
  const env = {
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://user:password@db.example.com:5432/forup",
  };
  const context = createMaintenanceContext({
    scriptName: "seed-test",
    destructive: true,
    argv: ["--execute", "--allow-destructive", "--confirm", "seed-test:db.example.com:forup"],
    env,
  });

  assert.throws(() => context.assertCanExecute(), /confirm-production/);

  const confirmed = createMaintenanceContext({
    scriptName: "seed-test",
    destructive: true,
    argv: [
      "--execute",
      "--allow-destructive",
      "--confirm",
      "seed-test:db.example.com:forup",
      "--confirm-production",
      "production:seed-test:forup",
    ],
    env,
  });
  assert.doesNotThrow(() => confirmed.assertCanExecute());
});

test("database URL detection distinguishes local PostgreSQL from invalid URLs", () => {
  assert.deepEqual(parseArgs(["--execute", "--confirm", "abc"]).values, { confirm: "abc" });
  assert.equal(getDatabaseInfo(localEnv).isLocal, true);
  assert.equal(getDatabaseInfo(localEnv).isPostgres, true);
  assert.equal(getDatabaseInfo({ DATABASE_URL: "not-a-url" }).isPostgres, false);
  assert.equal(redactDatabaseUrl("postgresql://user:secret@localhost:5432/db").includes("secret"), false);
});
