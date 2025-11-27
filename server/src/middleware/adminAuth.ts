import { Request, Response, NextFunction } from "express";
import { verifyAdminToken } from "../utils/token";

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const payload = verifyAdminToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  (req as Request & { admin?: string }).admin = payload.sub;
  return next();
};
