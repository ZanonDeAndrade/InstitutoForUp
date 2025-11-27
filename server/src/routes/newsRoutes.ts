import { Router } from "express";
import { createUploadMiddleware } from "../config/storage";
import { newsController } from "../controllers/newsController";
import { requireAdmin } from "../middleware/adminAuth";

const router = Router();
const uploadNewsImage = createUploadMiddleware("news");

router.get("/", newsController.list);
router.get("/:slug", newsController.getBySlug);
router.post("/", requireAdmin, uploadNewsImage.single("image"), newsController.create);
router.put("/:id", requireAdmin, uploadNewsImage.single("image"), newsController.update);
router.delete("/:id", requireAdmin, newsController.delete);

export default router;
