import helmet from "helmet";
import { env } from "./env";

const isProduction = env.NODE_ENV === "production";

export const securityHeadersMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      "default-src": ["'self'"],
      "base-uri": ["'self'"],
      "connect-src": ["'self'", ...env.CORS_ALLOWED_ORIGINS_LIST],
      "font-src": ["'self'", "data:"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
      "img-src": ["'self'", "data:", "blob:", "https:"],
      "media-src": ["'self'"],
      "object-src": ["'none'"],
      "script-src": ["'self'"],
      "style-src": ["'self'"],
      ...(isProduction ? { "upgrade-insecure-requests": [] } : {}),
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: isProduction
    ? {
        maxAge: 15552000,
        includeSubDomains: true,
        preload: false,
      }
    : false,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: false,
});

export const permissionsPolicyHeader =
  "camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self)";
