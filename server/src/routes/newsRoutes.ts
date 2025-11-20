import { Router } from "express";
import { createUploadMiddleware } from "../config/storage";
import { newsController } from "../controllers/newsController";

const router = Router();
const uploadNewsImage = createUploadMiddleware("news");

router.get("/", newsController.list);
router.get("/:slug", newsController.getBySlug);
router.post("/", uploadNewsImage.single("image"), newsController.create);
router.put("/:id", uploadNewsImage.single("image"), newsController.update);
router.delete("/:id", newsController.delete);

export default router;
