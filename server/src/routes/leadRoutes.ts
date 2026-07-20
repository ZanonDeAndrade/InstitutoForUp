import { Router } from "express";
import { leadController } from "../controllers/leadController";
import { requireAdmin, requirePermission } from "../middleware/adminAuth";
import { adminSensitiveRateLimiter, leadCreateRateLimiter } from "../config/rateLimit";
import { asyncHandler } from "../utils/asyncHandler";
import { ADMIN_PERMISSIONS } from "../auth/rbac";
import { auditAdminAction } from "../middleware/adminActionAudit";

export const createLeadRouter = (controller = leadController) => {
  const router = Router();

  router.post("/", leadCreateRateLimiter, asyncHandler(controller.create));
  router.get(
    "/",
    requireAdmin,
    adminSensitiveRateLimiter,
    requirePermission(ADMIN_PERMISSIONS.VIEW_LEADS),
    auditAdminAction(ADMIN_PERMISSIONS.VIEW_LEADS, "lead"),
    asyncHandler(controller.list),
  );
  router.post(
    "/bulk-delete",
    requireAdmin,
    adminSensitiveRateLimiter,
    requirePermission(ADMIN_PERMISSIONS.DELETE_LEADS),
    auditAdminAction(ADMIN_PERMISSIONS.DELETE_LEADS, "lead"),
    asyncHandler(controller.softDeleteBatch),
  );
  router.post(
    "/restore",
    requireAdmin,
    adminSensitiveRateLimiter,
    requirePermission(ADMIN_PERMISSIONS.DELETE_LEADS),
    auditAdminAction(ADMIN_PERMISSIONS.DELETE_LEADS, "lead"),
    asyncHandler(controller.restore),
  );
  router.delete(
    "/permanent",
    requireAdmin,
    adminSensitiveRateLimiter,
    requirePermission(ADMIN_PERMISSIONS.DELETE_LEADS),
    auditAdminAction(ADMIN_PERMISSIONS.DELETE_LEADS, "lead"),
    asyncHandler(controller.purge),
  );

  return router;
};

const router = createLeadRouter();

export default router;
