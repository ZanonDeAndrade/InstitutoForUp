import { NextFunction, Request, Response, Router } from "express";
import { AdminRequest, requireAdmin } from "../middleware/adminAuth";
import { adminAuthService, AuthFailure, type AdminRoleValue } from "../services/adminAuthService";
import { clearAdminSessionCookies, setAdminSessionCookies } from "../utils/authCookies";
import { revokeAdminToken, signAdminToken } from "../utils/token";
import { adminSensitiveRateLimiter, loginRateLimiter } from "../config/rateLimit";
import { appErrors } from "../errors/AppError";
import { permissionsForRole } from "../auth/rbac";

interface AuthenticatedAdmin {
  id: string;
  email?: string;
  username: string;
  role: AdminRoleValue;
}

interface AdminAuthenticator {
  authenticate(
    identifier: string,
    password: string,
    context?: {
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<AuthenticatedAdmin>;
}

const publicAdmin = (admin: AuthenticatedAdmin) => ({
  id: admin.id,
  email: admin.email,
  username: admin.username,
  role: admin.role,
  permissions: permissionsForRole(admin.role),
});

const publicAdminFromRequest = (req: AdminRequest) => ({
  id: req.admin?.id,
  username: req.admin?.username,
  role: req.admin?.role,
  permissions: req.admin?.permissions ?? [],
});

export const createAuthRouter = (authenticator: AdminAuthenticator = adminAuthService) => {
  const router = Router();

  router.post("/login", loginRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
    const identifier = String(req.body?.identifier ?? req.body?.email ?? req.body?.username ?? "");
    const password = String(req.body?.password ?? "");

    try {
      const admin = await authenticator.authenticate(identifier, password, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      const session = signAdminToken({
        id: admin.id,
        role: admin.role,
        username: admin.username,
      });
      setAdminSessionCookies(res, session);

      return res.json({
        exp: session.exp,
        user: publicAdmin(admin),
      });
    } catch (error) {
      if (error instanceof AuthFailure) {
        return next(error);
      }
      return next(error);
    }
  });

  router.get("/session", requireAdmin, (req, res) =>
    res.json({
      user: publicAdminFromRequest(req as AdminRequest),
      exp: (req as AdminRequest).admin?.exp,
    }),
  );

  router.post("/refresh", requireAdmin, adminSensitiveRateLimiter, (req, res) => {
    const admin = (req as AdminRequest).admin;
    if (!admin) {
      throw appErrors.authentication();
    }

    const session = signAdminToken({
      id: admin.id,
      role: admin.role,
      username: admin.username,
    });
    revokeAdminToken(admin);
    setAdminSessionCookies(res, session);

    return res.json({
      exp: session.exp,
      user: publicAdminFromRequest(req as AdminRequest),
    });
  });

  router.post("/logout", requireAdmin, adminSensitiveRateLimiter, (req, res) => {
    const admin = (req as AdminRequest).admin;
    if (admin) {
      revokeAdminToken(admin);
    }
    clearAdminSessionCookies(res);
    return res.status(204).send();
  });

  return router;
};

export default createAuthRouter();
