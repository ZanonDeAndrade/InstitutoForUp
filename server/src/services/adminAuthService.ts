import bcrypt from "bcryptjs";
import { PrismaClient, AdminRole } from "@prisma/client";

export const ADMIN_ROLES = ["super_admin", "editor", "viewer"] as const;
export type AdminRoleValue = (typeof ADMIN_ROLES)[number];

const PASSWORD_HASH_COST = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_SECONDS = 15 * 60;
const BASE_FAILURE_DELAY_MS = 250;
const MAX_FAILURE_DELAY_MS = 2_000;

const DUMMY_PASSWORD_HASH = "$2a$12$P6fHPJp4ChZ2YgPJziO.BOvjyNI1tIZ4ZBapVvKtSmB/A8HYnBRyS";

export interface AdminAuthUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: AdminRoleValue;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}

export interface AdminLoginContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface AdminAuthRepository {
  findByIdentifier(identifier: string): Promise<AdminAuthUser | null>;
  markLoginSuccess(userId: string, at: Date): Promise<void>;
  markLoginFailure(userId: string, failedLoginAttempts: number, lockedUntil: Date | null): Promise<void>;
  recordAudit(input: {
    adminUserId?: string | null;
    identifier: string;
    success: boolean;
    failureReason?: string | null;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void>;
}

interface UnknownAttemptState {
  attempts: number;
  lockedUntil: Date | null;
}

export class AuthFailure extends Error {
  constructor(
    public readonly code: "INVALID_CREDENTIALS" | "LOCKED",
    public readonly statusCode = code === "LOCKED" ? 429 : 401,
  ) {
    super(code);
  }
}

const normalizeIdentifier = (identifier: string) => identifier.trim().toLowerCase();

const calculateDelayMs = (attempts: number) =>
  Math.min(MAX_FAILURE_DELAY_MS, attempts <= 1 ? 0 : BASE_FAILURE_DELAY_MS * 2 ** Math.min(attempts - 2, 3));

const calculateLockUntil = (attempts: number, now: Date) =>
  attempts >= MAX_FAILED_ATTEMPTS ? new Date(now.getTime() + LOCK_SECONDS * 1000) : null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const hashAdminPassword = (password: string) => bcrypt.hash(password, PASSWORD_HASH_COST);

export const verifyAdminPassword = (password: string, passwordHash: string) => bcrypt.compare(password, passwordHash);

export class PrismaAdminAuthRepository implements AdminAuthRepository {
  constructor(private readonly prisma = new PrismaClient()) {}

  async findByIdentifier(identifier: string): Promise<AdminAuthUser | null> {
    const normalized = normalizeIdentifier(identifier);
    const user = await this.prisma.adminUser.findFirst({
      where: {
        OR: [{ email: normalized }, { username: normalized }],
      },
    });

    return user
      ? {
          ...user,
          role: user.role as AdminRoleValue,
        }
      : null;
  }

  async markLoginSuccess(userId: string, at: Date) {
    await this.prisma.adminUser.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: at,
      },
    });
  }

  async markLoginFailure(userId: string, failedLoginAttempts: number, lockedUntil: Date | null) {
    await this.prisma.adminUser.update({
      where: { id: userId },
      data: {
        failedLoginAttempts,
        lockedUntil,
      },
    });
  }

  async recordAudit(input: {
    adminUserId?: string | null;
    identifier: string;
    success: boolean;
    failureReason?: string | null;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await this.prisma.adminLoginAudit.create({
      data: {
        adminUserId: input.adminUserId ?? null,
        identifier: input.identifier,
        success: input.success,
        failureReason: input.failureReason ?? null,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }
}

export class AdminAuthService {
  private readonly unknownAttempts = new Map<string, UnknownAttemptState>();

  constructor(
    private readonly repository: AdminAuthRepository,
    private readonly delay: (ms: number) => Promise<unknown> = sleep,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async authenticate(identifier: string, password: string, context: AdminLoginContext = {}) {
    const normalizedIdentifier = normalizeIdentifier(identifier);
    const user = await this.repository.findByIdentifier(normalizedIdentifier);
    const now = this.now();

    if (!normalizedIdentifier || !password) {
      await this.recordFailure(user, normalizedIdentifier, "invalid_credentials", context, now);
      throw new AuthFailure("INVALID_CREDENTIALS");
    }

    if (user?.lockedUntil && user.lockedUntil.getTime() > now.getTime()) {
      await this.repository.recordAudit({
        adminUserId: user.id,
        identifier: normalizedIdentifier,
        success: false,
        failureReason: "locked",
        ...context,
      });
      await this.delay(calculateDelayMs(user.failedLoginAttempts));
      throw new AuthFailure("LOCKED");
    }

    const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const passwordMatches = await verifyAdminPassword(password, passwordHash);

    if (!user || !user.isActive || !passwordMatches) {
      await this.recordFailure(user, normalizedIdentifier, "invalid_credentials", context, now);
      throw new AuthFailure("INVALID_CREDENTIALS");
    }

    await this.repository.markLoginSuccess(user.id, now);
    await this.repository.recordAudit({
      adminUserId: user.id,
      identifier: normalizedIdentifier,
      success: true,
      ...context,
    });
    this.unknownAttempts.delete(normalizedIdentifier);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
  }

  private async recordFailure(
    user: AdminAuthUser | null,
    identifier: string,
    reason: string,
    context: AdminLoginContext,
    now: Date,
  ) {
    if (user) {
      const attempts = user.failedLoginAttempts + 1;
      const lockedUntil = calculateLockUntil(attempts, now);
      await this.repository.markLoginFailure(user.id, attempts, lockedUntil);
      await this.repository.recordAudit({
        adminUserId: user.id,
        identifier,
        success: false,
        failureReason: lockedUntil ? "locked" : reason,
        ...context,
      });
      await this.delay(calculateDelayMs(attempts));
      if (lockedUntil && lockedUntil.getTime() > now.getTime()) {
        throw new AuthFailure("LOCKED");
      }
      return;
    }

    const state = this.unknownAttempts.get(identifier) ?? { attempts: 0, lockedUntil: null };
    const attempts = state.attempts + 1;
    const lockedUntil = calculateLockUntil(attempts, now);
    this.unknownAttempts.set(identifier, { attempts, lockedUntil });
    await this.repository.recordAudit({
      adminUserId: null,
      identifier,
      success: false,
      failureReason: lockedUntil ? "locked" : reason,
      ...context,
    });
    await this.delay(calculateDelayMs(attempts));

    if (lockedUntil && lockedUntil.getTime() > now.getTime()) {
      throw new AuthFailure("LOCKED");
    }
  }
}

export const adminAuthService = new AdminAuthService(new PrismaAdminAuthRepository());

export const toPrismaAdminRole = (role: AdminRoleValue): AdminRole => role as AdminRole;
