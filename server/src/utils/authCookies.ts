import type { Request, Response } from "express";
import { env } from "../config/env";
import { DEFAULT_EXP_SECONDS } from "./token";

export const ADMIN_SESSION_COOKIE = "forup_admin_session";
export const ADMIN_CSRF_COOKIE = "forup_admin_csrf";

const isProduction = env.NODE_ENV === "production";
const maxAge = DEFAULT_EXP_SECONDS * 1000;

const commonCookieOptions = {
  secure: isProduction,
  sameSite: "lax" as const,
  maxAge,
};

export const setAdminSessionCookies = (
  res: Response,
  session: {
    token: string;
    csrfToken: string;
  },
) => {
  res.cookie(ADMIN_SESSION_COOKIE, session.token, {
    ...commonCookieOptions,
    httpOnly: true,
    path: "/api",
  });
  res.cookie(ADMIN_CSRF_COOKIE, session.csrfToken, {
    ...commonCookieOptions,
    httpOnly: false,
    path: "/",
  });
};

export const clearAdminSessionCookies = (res: Response) => {
  res.clearCookie(ADMIN_SESSION_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/api",
  });
  res.clearCookie(ADMIN_CSRF_COOKIE, {
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
};

export const readCookie = (req: Request, name: string) => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader.split(";").map((part) => part.trim());
  for (const cookie of cookies) {
    const separatorIndex = cookie.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = cookie.slice(0, separatorIndex);
    if (key !== name) continue;
    const value = cookie.slice(separatorIndex + 1);
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return undefined;
};
