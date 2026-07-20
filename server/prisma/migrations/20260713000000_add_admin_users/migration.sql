CREATE TYPE "AdminRole" AS ENUM ('super_admin', 'editor', 'viewer');

CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'viewer',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminLoginAudit" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT,
    "identifier" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLoginAudit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");
CREATE INDEX "AdminUser_role_idx" ON "AdminUser"("role");
CREATE INDEX "AdminUser_lockedUntil_idx" ON "AdminUser"("lockedUntil");
CREATE INDEX "AdminLoginAudit_adminUserId_createdAt_idx" ON "AdminLoginAudit"("adminUserId", "createdAt");
CREATE INDEX "AdminLoginAudit_identifier_createdAt_idx" ON "AdminLoginAudit"("identifier", "createdAt");
CREATE INDEX "AdminLoginAudit_success_createdAt_idx" ON "AdminLoginAudit"("success", "createdAt");

ALTER TABLE "AdminLoginAudit" ADD CONSTRAINT "AdminLoginAudit_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
