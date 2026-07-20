import { Request, Response, NextFunction } from "express";
import type { AdminRoleValue } from "../services/adminAuthService";
import { ADMIN_CSRF_HEADER, AdminTokenError, verifyAdminCsrfToken, verifyAdminToken } from "../utils/token";
import { ADMIN_CSRF_COOKIE, ADMIN_SESSION_COOKIE, readCookie } from "../utils/authCookies";
import { appErrors } from "../errors/AppError";
import { AdminPermission, permissionsForRole, roleHasPermission } from "../auth/rbac";

export type AdminRequest = Request & {
  admin?: {
    id: string;
    role: AdminRoleValue;
    username: string;
    exp: number;
    jti: string;
    permissions: AdminPermission[];
  };
};

const requiresCsrf = (method: string) => !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  const token = readCookie(req, ADMIN_SESSION_COOKIE);
  if (!token) {
    return next(appErrors.authentication("AUTHENTICATION_REQUIRED", "Autenticacao necessaria."));
  }

  try {
    const payload = verifyAdminToken(token);
    if (requiresCsrf(req.method)) {
      const headerToken = req.get(ADMIN_CSRF_HEADER);
      const cookieToken = readCookie(req, ADMIN_CSRF_COOKIE);
      if (!verifyAdminCsrfToken(payload, headerToken, cookieToken)) {
        return next(appErrors.authorization("CSRF_INVALID", "Requisicao nao autorizada."));
      }
    }

    (req as AdminRequest).admin = {
      id: payload.sub,
      role: payload.role,
      username: payload.username,
      exp: payload.exp,
      jti: payload.jti,
      permissions: permissionsForRole(payload.role),
    };
    return next();
  } catch (error) {
    if (error instanceof AdminTokenError) {
      return next(error);
    }
    return next(appErrors.authentication("AUTHENTICATION_INVALID", "Autenticacao invalida."));
  }
};

export const requirePermission =
  (permission: AdminPermission) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const admin = (req as AdminRequest).admin;
    if (!admin || !roleHasPermission(admin.role, permission)) {
      return next(appErrors.authorization("FORBIDDEN", "Acesso negado."));
    }
    return next();
  };
