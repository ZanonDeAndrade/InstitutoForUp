import { Router } from "express";
import { courseController } from "../controllers/courseController";
import { uploadMiddleware } from "../config/storage";

const router = Router();

router.get("/", courseController.list);
router.get("/:courseId", courseController.getById);
router.post("/", courseController.upsert);
router.put("/:courseId", courseController.upsert);
router.delete("/:courseId", courseController.delete);
router.post("/:courseId/images", uploadMiddleware.array("images"), courseController.uploadImages);
router.delete("/:courseId/images/:imageId", courseController.deleteImage);

export default router;
