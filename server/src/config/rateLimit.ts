import type { Request, RequestHandler, Response } from "express";
import { ipKeyGenerator, rateLimit, type Options } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { createClient, type RedisClientType } from "redis";
import type { AdminRequest } from "../middleware/adminAuth";
import { env } from "./env";
import { logger } from "../utils/logger";

type RateLimitName = "login" | "lead-create" | "upload" | "image-proxy" | "admin-sensitive";

interface RateLimitPolicy {
  name: RateLimitName;
  windowMs: number;
  max: number;
  keyGenerator?: Options["keyGenerator"];
}

let redisClient: RedisClientType | null = null;

export const normalizeRateLimitIp = (req: Request) => ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? "0.0.0.0");

const createRateLimitStore = (name: RateLimitName) => {
  if (!env.RATE_LIMIT_REDIS_URL) {
    return undefined;
  }

  if (!redisClient) {
    redisClient = createClient({ url: env.RATE_LIMIT_REDIS_URL });
    redisClient.on("error", (error) => {
      logger.error("rate_limit.redis_error", { error });
    });
    void redisClient.connect();
  }

  return new RedisStore({
    prefix: `forup:rate-limit:${name}:`,
    sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
  });
};

const retryAfterSeconds = (req: Request) => {
  const resetTime = (req as Request & { rateLimit?: { resetTime?: Date } }).rateLimit?.resetTime;
  if (!resetTime) return undefined;
  return Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
};

const rateLimitHandler = (policy: RateLimitPolicy) => (req: Request, res: Response) => {
  const retryAfter = retryAfterSeconds(req) ?? Math.max(1, Math.ceil(policy.windowMs / 1000));
  res.setHeader("Retry-After", String(retryAfter));
  return res.status(429).json({
    requestId: req.requestId,
    message: "Rate limit exceeded",
    code: "RATE_LIMITED",
    policy: policy.name,
    retryAfter,
  });
};

export const createRateLimiter = (policy: RateLimitPolicy): RequestHandler =>
  rateLimit({
    windowMs: policy.windowMs,
    limit: policy.max,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: policy.keyGenerator ?? normalizeRateLimitIp,
    handler: rateLimitHandler(policy),
    store: createRateLimitStore(policy.name),
  });

export const loginRateLimiter = createRateLimiter({
  name: "login",
  windowMs: env.RATE_LIMIT_LOGIN_WINDOW_MS,
  max: env.RATE_LIMIT_LOGIN_MAX,
  keyGenerator: (req) => {
    const identifier = String(req.body?.identifier ?? req.body?.email ?? req.body?.username ?? "")
      .trim()
      .toLowerCase();
    return `ip:${normalizeRateLimitIp(req)}:identifier:${identifier || "missing"}`;
  },
});

export const leadCreateRateLimiter = createRateLimiter({
  name: "lead-create",
  windowMs: env.RATE_LIMIT_LEADS_WINDOW_MS,
  max: env.RATE_LIMIT_LEADS_MAX,
});

export const imageProxyRateLimiter = createRateLimiter({
  name: "image-proxy",
  windowMs: env.RATE_LIMIT_IMAGE_PROXY_WINDOW_MS,
  max: env.RATE_LIMIT_IMAGE_PROXY_MAX,
});

export const uploadRateLimiter = createRateLimiter({
  name: "upload",
  windowMs: env.RATE_LIMIT_UPLOAD_WINDOW_MS,
  max: env.RATE_LIMIT_UPLOAD_MAX,
  keyGenerator: (req) => {
    const admin = (req as AdminRequest).admin;
    return admin ? `admin:${admin.id}:ip:${normalizeRateLimitIp(req)}` : `ip:${normalizeRateLimitIp(req)}`;
  },
});

export const adminSensitiveRateLimiter = createRateLimiter({
  name: "admin-sensitive",
  windowMs: env.RATE_LIMIT_ADMIN_WINDOW_MS,
  max: env.RATE_LIMIT_ADMIN_MAX,
  keyGenerator: (req) => {
    const admin = (req as AdminRequest).admin;
    return admin ? `admin:${admin.id}:ip:${normalizeRateLimitIp(req)}` : `ip:${normalizeRateLimitIp(req)}`;
  },
});
