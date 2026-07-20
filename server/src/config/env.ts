import "dotenv/config";
import { z } from "zod";

const requiredString = (name: string) =>
  z
    .string({ required_error: `${name} is required` })
    .trim()
    .min(1, `${name} is required`);

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const nonNegativeInteger = z.coerce.number().int().min(0);
const positiveInteger = z.coerce.number().int().positive();
const booleanString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const privateKey = requiredString("GOOGLE_SHEETS_PRIVATE_KEY").transform((value) => value.replace(/\\n/g, "\n"));

const placeholderPattern = /replace-with|PROJECT_REF|example-project|example\.com|<[^>]+>/i;

const rejectPlaceholder = (ctx: z.RefinementCtx, path: string, value?: string) => {
  if (!value || !placeholderPattern.test(value)) return;
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path: [path],
    message: `${path} must not be a placeholder`,
  });
};

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4010),
    TRUST_PROXY_HOPS: nonNegativeInteger.default(0),
    PUBLIC_BASE_URL: requiredString("PUBLIC_BASE_URL").url("PUBLIC_BASE_URL must be a valid URL"),
    DATABASE_URL: requiredString("DATABASE_URL").refine(
      (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
      "DATABASE_URL must be a PostgreSQL connection URL",
    ),
    DIRECT_URL: requiredString("DIRECT_URL").refine(
      (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
      "DIRECT_URL must be a PostgreSQL connection URL",
    ),
    CORS_ALLOWED_ORIGINS: z.string().trim().default(""),
    CORS_ALLOWED_METHODS: z.string().trim().default("GET,POST,PUT,DELETE,OPTIONS"),
    CORS_ALLOWED_HEADERS: z.string().trim().default("Content-Type,X-CSRF-Token"),
    CORS_PREFLIGHT_MAX_AGE_SECONDS: nonNegativeInteger.default(600),
    CORS_ALLOW_NON_BROWSER_REQUESTS: booleanString,
    STORAGE_DRIVER: z.enum(["local", "supabase", "s3"]).default("local"),
    UPLOADS_DIR: z.string().trim().min(1).default("uploads"),
    SUPABASE_URL: optionalString,
    SUPABASE_SERVICE_ROLE_KEY: optionalString,
    SUPABASE_BUCKET: z.string().trim().min(1).default("courses"),
    AWS_REGION: z.string().trim().min(1).default("auto"),
    AWS_S3_ENDPOINT: optionalString,
    AWS_S3_BUCKET: optionalString,
    AWS_S3_BASE_URL: optionalString,
    AWS_ACCESS_KEY_ID: optionalString,
    AWS_SECRET_ACCESS_KEY: optionalString,
    GOOGLE_SHEETS_CLIENT_EMAIL: requiredString("GOOGLE_SHEETS_CLIENT_EMAIL").email(
      "GOOGLE_SHEETS_CLIENT_EMAIL must be a valid email",
    ),
    GOOGLE_SHEETS_PRIVATE_KEY: privateKey,
    GOOGLE_SHEETS_SPREADSHEET_ID: requiredString("GOOGLE_SHEETS_SPREADSHEET_ID"),
    GOOGLE_SHEETS_LEADS_SHEET_NAME: z.string().trim().min(1).default("Leads"),
    ADMIN_TOKEN_SECRET: requiredString("ADMIN_TOKEN_SECRET").min(
      32,
      "ADMIN_TOKEN_SECRET must have at least 32 characters",
    ),
    RATE_LIMIT_REDIS_URL: optionalString,
    RATE_LIMIT_LOGIN_WINDOW_MS: positiveInteger.default(15 * 60 * 1000),
    RATE_LIMIT_LOGIN_MAX: positiveInteger.default(5),
    RATE_LIMIT_LEADS_WINDOW_MS: positiveInteger.default(10 * 60 * 1000),
    RATE_LIMIT_LEADS_MAX: positiveInteger.default(10),
    RATE_LIMIT_UPLOAD_WINDOW_MS: positiveInteger.default(15 * 60 * 1000),
    RATE_LIMIT_UPLOAD_MAX: positiveInteger.default(20),
    RATE_LIMIT_IMAGE_PROXY_WINDOW_MS: positiveInteger.default(60 * 1000),
    RATE_LIMIT_IMAGE_PROXY_MAX: positiveInteger.default(120),
    RATE_LIMIT_ADMIN_WINDOW_MS: positiveInteger.default(15 * 60 * 1000),
    RATE_LIMIT_ADMIN_MAX: positiveInteger.default(120),
    CAPTCHA_PROVIDER: z.enum(["disabled", "turnstile", "hcaptcha"]).default("disabled"),
    CAPTCHA_SECRET_KEY: optionalString,
    CAPTCHA_VERIFY_URL: optionalString,
    LEAD_DEDUP_WINDOW_MS: positiveInteger.default(24 * 60 * 60 * 1000),
  })
  .superRefine((env, ctx) => {
    for (const key of [
      "PUBLIC_BASE_URL",
      "DATABASE_URL",
      "DIRECT_URL",
      "GOOGLE_SHEETS_CLIENT_EMAIL",
      "GOOGLE_SHEETS_PRIVATE_KEY",
      "GOOGLE_SHEETS_SPREADSHEET_ID",
      "ADMIN_TOKEN_SECRET",
    ] as const) {
      rejectPlaceholder(ctx, key, env[key]);
    }

    if (env.NODE_ENV === "production" && !env.CORS_ALLOWED_ORIGINS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CORS_ALLOWED_ORIGINS"],
        message: "CORS_ALLOWED_ORIGINS is required in production",
      });
    }

    if (env.NODE_ENV === "production" && env.CORS_ALLOWED_ORIGINS.split(",").some((origin) => origin.trim() === "*")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CORS_ALLOWED_ORIGINS"],
        message: "CORS_ALLOWED_ORIGINS must not contain wildcard origins in production",
      });
    }

    if (!env.CORS_ALLOWED_METHODS.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CORS_ALLOWED_METHODS"],
        message: "CORS_ALLOWED_METHODS must not be empty",
      });
    }

    if (!env.CORS_ALLOWED_HEADERS.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CORS_ALLOWED_HEADERS"],
        message: "CORS_ALLOWED_HEADERS must not be empty",
      });
    }

    if (env.NODE_ENV === "production" && !env.RATE_LIMIT_REDIS_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["RATE_LIMIT_REDIS_URL"],
        message: "RATE_LIMIT_REDIS_URL is required in production for shared rate limiting",
      });
    }

    if (env.NODE_ENV === "production" && env.CAPTCHA_PROVIDER === "disabled") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CAPTCHA_PROVIDER"],
        message: "CAPTCHA_PROVIDER must be turnstile or hcaptcha in production",
      });
    }

    if (env.CAPTCHA_PROVIDER !== "disabled") {
      if (!env.CAPTCHA_SECRET_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CAPTCHA_SECRET_KEY"],
          message: "CAPTCHA_SECRET_KEY is required when CAPTCHA_PROVIDER is enabled",
        });
      }
      rejectPlaceholder(ctx, "CAPTCHA_SECRET_KEY", env.CAPTCHA_SECRET_KEY);
    }

    if (env.STORAGE_DRIVER === "supabase") {
      if (!env.SUPABASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["SUPABASE_URL"],
          message: "SUPABASE_URL is required when STORAGE_DRIVER=supabase",
        });
      }
      rejectPlaceholder(ctx, "SUPABASE_URL", env.SUPABASE_URL);
      if (!env.SUPABASE_SERVICE_ROLE_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["SUPABASE_SERVICE_ROLE_KEY"],
          message: "SUPABASE_SERVICE_ROLE_KEY is required when STORAGE_DRIVER=supabase",
        });
      }
      rejectPlaceholder(ctx, "SUPABASE_SERVICE_ROLE_KEY", env.SUPABASE_SERVICE_ROLE_KEY);
    }

    if (env.STORAGE_DRIVER === "s3") {
      for (const key of ["AWS_S3_BUCKET", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"] as const) {
        if (!env[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is required when STORAGE_DRIVER=s3`,
          });
        }
        rejectPlaceholder(ctx, key, env[key]);
      }
    }

    if (!env.GOOGLE_SHEETS_PRIVATE_KEY.includes("-----BEGIN PRIVATE KEY-----")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GOOGLE_SHEETS_PRIVATE_KEY"],
        message: "GOOGLE_SHEETS_PRIVATE_KEY must be a PEM private key",
      });
    }
  });

export const parseBackendEnv = (input: NodeJS.ProcessEnv) => envSchema.safeParse(input);

const parsedEnv = parseBackendEnv(process.env);

if (!parsedEnv.success) {
  const fields = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".") || "ENV"}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid backend environment configuration: ${fields}`);
}

export const env = {
  ...parsedEnv.data,
  CORS_ALLOWED_ORIGINS_LIST: parsedEnv.data.CORS_ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  CORS_ALLOWED_METHODS_LIST: parsedEnv.data.CORS_ALLOWED_METHODS.split(",")
    .map((method) => method.trim().toUpperCase())
    .filter(Boolean),
  CORS_ALLOWED_HEADERS_LIST: parsedEnv.data.CORS_ALLOWED_HEADERS.split(",")
    .map((header) => header.trim())
    .filter(Boolean),
};

export type BackendEnv = typeof env;
