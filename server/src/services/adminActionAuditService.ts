import { PrismaClient } from "@prisma/client";
import type { AdminRoleValue } from "./adminAuthService";

interface AdminActionAuditRecord {
  actorId: string;
  actorRole: AdminRoleValue;
  action: string;
  resource: string;
  resourceId?: string;
  method?: string;
  path?: string;
  requestId?: string;
}

interface AdminActionAuditRepository {
  create(record: AdminActionAuditRecord): Promise<void>;
}

class PrismaAdminActionAuditRepository implements AdminActionAuditRepository {
  constructor(private readonly prisma = new PrismaClient()) {}

  async create(record: AdminActionAuditRecord) {
    await this.prisma.adminActionAudit.create({
      data: {
        actorId: record.actorId,
        actorRole: record.actorRole,
        action: record.action,
        resource: record.resource,
        resourceId: record.resourceId,
        method: record.method,
        path: record.path,
        requestId: record.requestId,
      },
    });
  }
}

export class AdminActionAuditService {
  constructor(private readonly repository: AdminActionAuditRepository) {}

  async record(record: AdminActionAuditRecord) {
    await this.repository.create(record);
  }
}

export const adminActionAuditService = new AdminActionAuditService(new PrismaAdminActionAuditRepository());

export type { AdminActionAuditRecord, AdminActionAuditRepository };
