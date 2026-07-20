import type { Request } from "express";
import cors, { type CorsOptions } from "cors";
import { env } from "./env";

const browserUserAgentPattern = /\b(Mozilla|Chrome|Chromium|Safari|Firefox|Edg|OPR)\b/i;
type HeaderRequest = Pick<Request, "headers">;

const hasBrowserFetchMetadata = (req: HeaderRequest) =>
  Boolean(req.headers["sec-fetch-site"] || req.headers["sec-fetch-mode"] || req.headers["sec-fetch-dest"]);

const looksLikeBrowser = (req: HeaderRequest) => browserUserAgentPattern.test(String(req.headers["user-agent"] ?? ""));

export const isCorsOriginAllowed = (
  origin: string | undefined,
  allowedOrigins = env.CORS_ALLOWED_ORIGINS_LIST,
) => Boolean(origin && allowedOrigins.includes(origin));

export const isNonBrowserRequestWithoutOriginAllowed = (req: HeaderRequest) =>
  env.CORS_ALLOW_NON_BROWSER_REQUESTS && !req.headers.origin && !hasBrowserFetchMetadata(req) && !looksLikeBrowser(req);

export const isCorsRequestAllowed = (req: HeaderRequest, origin: string | undefined) => {
  if (origin) return isCorsOriginAllowed(origin);
  return isNonBrowserRequestWithoutOriginAllowed(req);
};

export const buildCorsOptions = (req: HeaderRequest): CorsOptions => ({
  origin: (origin, callback) => {
    if (isCorsRequestAllowed(req, origin)) {
      return callback(null, origin || false);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: env.CORS_ALLOWED_METHODS_LIST,
  allowedHeaders: env.CORS_ALLOWED_HEADERS_LIST,
  maxAge: env.CORS_PREFLIGHT_MAX_AGE_SECONDS,
  optionsSuccessStatus: 204,
});

export const corsMiddleware = cors((req, callback) => {
  callback(null, buildCorsOptions(req));
});
