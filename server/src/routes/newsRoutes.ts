import { Router } from "express";
import { createUploadMiddleware } from "../config/storage";
import { newsController } from "../controllers/newsController";
import { requireAdmin, requirePermission } from "../middleware/adminAuth";
import { adminSensitiveRateLimiter, uploadRateLimiter } from "../config/rateLimit";
import { asyncHandler } from "../utils/asyncHandler";
import { ADMIN_PERMISSIONS } from "../auth/rbac";
import { auditAdminAction } from "../middleware/adminActionAudit";

const router = Router();
const uploadNewsImage = createUploadMiddleware("news");

router.get("/", asyncHandler(newsController.list));
router.get(
  "/admin/list",
  requireAdmin,
  adminSensitiveRateLimiter,
  requirePermission(ADMIN_PERMISSIONS.PUBLISH_NEWS),
  auditAdminAction(ADMIN_PERMISSIONS.PUBLISH_NEWS, "news"),
  asyncHandler(newsController.adminList),
);
router.get(
  "/admin/:slug",
  requireAdmin,
  adminSensitiveRateLimiter,
  requirePermission(ADMIN_PERMISSIONS.PUBLISH_NEWS),
  auditAdminAction(ADMIN_PERMISSIONS.PUBLISH_NEWS, "news", (req) => req.params.slug),
  asyncHandler(newsController.adminGetBySlug),
);
router.get("/:slug", asyncHandler(newsController.getBySlug));
router.post(
  "/",
  requireAdmin,
  requirePermission(ADMIN_PERMISSIONS.PUBLISH_NEWS),
  uploadRateLimiter,
  auditAdminAction(ADMIN_PERMISSIONS.PUBLISH_NEWS, "news"),
  uploadNewsImage.single("image"),
  asyncHandler(newsController.create),
);
router.put(
  "/:id",
  requireAdmin,
  requirePermission(ADMIN_PERMISSIONS.PUBLISH_NEWS),
  uploadRateLimiter,
  auditAdminAction(ADMIN_PERMISSIONS.PUBLISH_NEWS, "news", (req) => req.params.id),
  uploadNewsImage.single("image"),
  asyncHandler(newsController.update),
);
router.delete(
  "/:id",
  requireAdmin,
  adminSensitiveRateLimiter,
  requirePermission(ADMIN_PERMISSIONS.PUBLISH_NEWS),
  auditAdminAction(ADMIN_PERMISSIONS.PUBLISH_NEWS, "news", (req) => req.params.id),
  asyncHandler(newsController.delete),
);

export default router;
