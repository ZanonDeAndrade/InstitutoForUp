import { strict as assert } from "node:assert";
import test from "node:test";
import {
  AdminAuthRepository,
  AdminAuthService,
  AdminAuthUser,
  AuthFailure,
  hashAdminPassword,
} from "../services/adminAuthService";

class MemoryAdminAuthRepository implements AdminAuthRepository {
  users = new Map<string, AdminAuthUser>();
  audits: Array<{
    adminUserId?: string | null;
    identifier: string;
    success: boolean;
    failureReason?: string | null;
    ipAddress?: string;
    userAgent?: string;
  }> = [];

  addUser(user: AdminAuthUser) {
    this.users.set(user.email, user);
    this.users.set(user.username, user);
  }

  async findByIdentifier(identifier: string) {
    return this.users.get(identifier) ?? null;
  }

  async markLoginSuccess(userId: string, at: Date) {
    const user = this.findUserById(userId);
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    void at;
  }

  async markLoginFailure(userId: string, failedLoginAttempts: number, lockedUntil: Date | null) {
    const user = this.findUserById(userId);
    user.failedLoginAttempts = failedLoginAttempts;
    user.lockedUntil = lockedUntil;
  }

  async recordAudit(input: {
    adminUserId?: string | null;
    identifier: string;
    success: boolean;
    failureReason?: string | null;
    ipAddress?: string;
    userAgent?: string;
  }) {
    this.audits.push(input);
  }

  private findUserById(userId: string) {
    const found = Array.from(new Set(this.users.values())).find((user) => user.id === userId);
    if (!found) throw new Error("USER_NOT_FOUND");
    return found;
  }
}

const createService = async () => {
  const repository = new MemoryAdminAuthRepository();
  const passwordHash = await hashAdminPassword("correct-password-123");
  repository.addUser({
    id: "admin-1",
    email: "admin@example.com",
    username: "admin",
    passwordHash,
    role: "editor",
    isActive: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
  });

  return {
    repository,
    service: new AdminAuthService(repository, async () => undefined, () => new Date("2026-07-13T00:00:00.000Z")),
  };
};

test("authenticates admin by email and returns role without password", async () => {
  const { repository, service } = await createService();

  const result = await service.authenticate("ADMIN@example.com", "correct-password-123", {
    ipAddress: "127.0.0.1",
    userAgent: "node-test",
  });

  assert.deepEqual(result, {
    id: "admin-1",
    email: "admin@example.com",
    username: "admin",
    role: "editor",
  });
  assert.equal(repository.audits.length, 1);
  const audit = repository.audits[0];
  assert.ok(audit);
  assert.equal(audit.success, true);
});

test("rejects invalid password with generic failure and audit", async () => {
  const { repository, service } = await createService();

  await assert.rejects(
    () => service.authenticate("admin@example.com", "wrong-password"),
    (error) => error instanceof AuthFailure && error.statusCode === 401,
  );

  const user = await repository.findByIdentifier("admin@example.com");
  const audit = repository.audits[0];
  assert.ok(audit);
  assert.equal(user?.failedLoginAttempts, 1);
  assert.equal(audit.success, false);
  assert.equal(audit.failureReason, "invalid_credentials");
});

test("rejects unknown user without revealing existence", async () => {
  const { repository, service } = await createService();

  await assert.rejects(
    () => service.authenticate("nobody@example.com", "wrong-password"),
    (error) => error instanceof AuthFailure && error.statusCode === 401,
  );

  assert.equal(repository.audits.length, 1);
  const audit = repository.audits[0];
  assert.ok(audit);
  assert.equal(audit.adminUserId, null);
  assert.equal(audit.success, false);
  assert.equal(audit.failureReason, "invalid_credentials");
});

test("locks existing admin temporarily after repeated invalid attempts", async () => {
  const { repository, service } = await createService();

  for (let index = 0; index < 5; index += 1) {
    await assert.rejects(() => service.authenticate("admin", "wrong-password"), AuthFailure);
  }

  const user = await repository.findByIdentifier("admin");
  assert.equal(user?.failedLoginAttempts, 5);
  assert.ok(user?.lockedUntil);

  await assert.rejects(
    () => service.authenticate("admin", "correct-password-123"),
    (error) => error instanceof AuthFailure && error.statusCode === 429,
  );
});

test("locks unknown identifiers with the same status as existing admins", async () => {
  const { service } = await createService();

  for (let index = 0; index < 4; index += 1) {
    await assert.rejects(
      () => service.authenticate("missing@example.com", "wrong-password"),
      (error) => error instanceof AuthFailure && error.statusCode === 401,
    );
  }

  await assert.rejects(
    () => service.authenticate("missing@example.com", "wrong-password"),
    (error) => error instanceof AuthFailure && error.statusCode === 429,
  );
});

test("authenticates admin by username", async () => {
  const { service } = await createService();

  const result = await service.authenticate("admin", "correct-password-123");

  assert.equal(result.id, "admin-1");
  assert.equal(result.role, "editor");
});
