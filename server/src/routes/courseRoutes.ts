import { Router } from "express";
import { courseController } from "../controllers/courseController";
import { uploadMiddleware } from "../config/storage";
import { requireAdmin } from "../middleware/adminAuth";

const router = Router();

router.get("/", courseController.list);
router.get("/:courseId", courseController.getById);
router.post("/", requireAdmin, courseController.upsert);
router.put("/:courseId", requireAdmin, courseController.upsert);
router.delete("/:courseId", requireAdmin, courseController.delete);
router.post(
  "/:courseId/images",
  requireAdmin,
  uploadMiddleware.array("images"),
  courseController.uploadImages,
);
router.delete("/:courseId/images/:imageId", requireAdmin, courseController.deleteImage);

export default router;
