import crypto from "node:crypto";
import { NextFunction, Request, Response } from "express";

declare module "express-serve-static-core" {
  interface Request {
    requestId: string;
  }
}

const requestIdPattern = /^[a-zA-Z0-9._-]{8,128}$/;

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const incoming = req.get("x-request-id");
  req.requestId = incoming && requestIdPattern.test(incoming) ? incoming : crypto.randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
};
