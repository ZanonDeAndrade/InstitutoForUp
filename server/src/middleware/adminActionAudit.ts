import type { Request, RequestHandler } from "express";
import type { AdminPermission } from "../auth/rbac";
import type { AdminActionAuditService } from "../services/adminActionAuditService";
import { adminActionAuditService } from "../services/adminActionAuditService";
import type { AdminRequest } from "./adminAuth";
import { appErrors } from "../errors/AppError";
import { logger } from "../utils/logger";

type ResourceIdResolver = (req: Request) => string | undefined;

const getRequestId = (req: Request) => {
  const requestId = req.headers["x-request-id"];
  return Array.isArray(requestId) ? requestId[0] : requestId;
};

export const createAuditAdminAction =
  (service: AdminActionAuditService) =>
  (action: AdminPermission | string, resource: string, resourceId?: ResourceIdResolver): RequestHandler =>
  async (req, _res, next) => {
    const admin = (req as AdminRequest).admin;
    if (!admin) {
      return next();
    }

    try {
      await service.record({
        actorId: admin.id,
        actorRole: admin.role,
        action,
        resource,
        resourceId: resourceId?.(req),
        method: req.method,
        path: req.originalUrl,
        requestId: getRequestId(req),
      });
      return next();
    } catch (error) {
      logger.error("admin_action_audit_failed", {
        error,
        action,
        resource,
        requestId: getRequestId(req),
      });
      return next(appErrors.internal("ADMIN_AUDIT_FAILED", "Nao foi possivel processar a solicitacao."));
    }
  };

export const auditAdminAction = createAuditAdminAction(adminActionAuditService);
