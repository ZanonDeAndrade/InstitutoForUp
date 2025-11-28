import { Router } from "express";
import { signAdminToken } from "../utils/token";

const router = Router();

router.post("/login", (req, res) => {
  const password = String(req.body?.password ?? "");
  const adminPassword = process.env.ADMIN_PASSWORD || "adminForUp!";

  if (!adminPassword) {
    return res.status(500).json({ message: "ADMIN_PASSWORD not configured on server" });
  }

  if (password !== adminPassword) {
    return res.status(401).json({ message: "Senha inválida" });
  }

  const { token, exp } = signAdminToken("admin");
  return res.json({ token, exp });
});

export default router;
