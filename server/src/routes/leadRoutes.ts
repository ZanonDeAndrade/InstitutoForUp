import { Router } from "express";
import { leadController } from "../controllers/leadController";

const router = Router();

router.post("/", leadController.create);

export default router;
