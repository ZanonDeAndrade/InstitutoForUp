import { Request, Response, NextFunction } from "express";

export const reqLogger = (req: Request, _res: Response, next: NextFunction) => {
  console.log(`[req] ${req.method} ${req.originalUrl}`);
  next();
};
