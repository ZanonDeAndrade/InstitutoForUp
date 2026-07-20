import { Router, type Request } from "express";
import { courseController } from "../controllers/courseController";
import { uploadMiddleware } from "../config/storage";
import { requireAdmin, requirePermission } from "../middleware/adminAuth";
import { adminSensitiveRateLimiter, uploadRateLimiter } from "../config/rateLimit";
import { asyncHandler } from "../utils/asyncHandler";
import { ADMIN_PERMISSIONS } from "../auth/rbac";
import { auditAdminAction } from "../middleware/adminActionAudit";

const router = Router();
const courseResourceId = (req: Request) =>
  req.params.courseId ?? (typeof req.body?.id === "string" ? req.body.id : undefined);

router.get("/", asyncHandler(courseController.list));
router.get("/:courseId", asyncHandler(courseController.getById));
router.post(
  "/",
  requireAdmin,
  adminSensitiveRateLimiter,
  requirePermission(ADMIN_PERMISSIONS.MANAGE_COURSES),
  auditAdminAction(ADMIN_PERMISSIONS.MANAGE_COURSES, "course", courseResourceId),
  asyncHandler(courseController.upsert),
);
router.put(
  "/:courseId",
  requireAdmin,
  adminSensitiveRateLimiter,
  requirePermission(ADMIN_PERMISSIONS.MANAGE_COURSES),
  auditAdminAction(ADMIN_PERMISSIONS.MANAGE_COURSES, "course", courseResourceId),
  asyncHandler(courseController.upsert),
);
router.delete(
  "/:courseId",
  requireAdmin,
  adminSensitiveRateLimiter,
  requirePermission(ADMIN_PERMISSIONS.MANAGE_COURSES),
  auditAdminAction(ADMIN_PERMISSIONS.MANAGE_COURSES, "course", (req) => req.params.courseId),
  asyncHandler(courseController.delete),
);
router.post(
  "/:courseId/images",
  requireAdmin,
  requirePermission(ADMIN_PERMISSIONS.MANAGE_IMAGES),
  uploadRateLimiter,
  auditAdminAction(ADMIN_PERMISSIONS.MANAGE_IMAGES, "course_image", (req) => req.params.courseId),
  uploadMiddleware.array("images"),
  asyncHandler(courseController.uploadImages),
);
router.delete(
  "/:courseId/images/:imageId",
  requireAdmin,
  adminSensitiveRateLimiter,
  requirePermission(ADMIN_PERMISSIONS.MANAGE_IMAGES),
  auditAdminAction(ADMIN_PERMISSIONS.MANAGE_IMAGES, "course_image", (req) => req.params.imageId),
  asyncHandler(courseController.deleteImage),
);

export default router;
