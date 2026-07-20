import { env } from "../config/env";
import { logger } from "../utils/logger";

export interface CaptchaVerificationInput {
  token: string;
  remoteIp?: string;
  idempotencyKey?: string;
}

export interface CaptchaVerifier {
  verify(input: CaptchaVerificationInput): Promise<boolean>;
}

interface CaptchaVerifyResponse {
  success?: boolean;
  "error-codes"?: string[];
}

const defaultVerifyUrl = () => {
  if (env.CAPTCHA_PROVIDER === "hcaptcha") return "https://hcaptcha.com/siteverify";
  return "https://challenges.cloudflare.com/turnstile/v0/siteverify";
};

class HttpCaptchaVerifier implements CaptchaVerifier {
  async verify(input: CaptchaVerificationInput) {
    if (env.CAPTCHA_PROVIDER === "disabled") {
      return true;
    }

    const body = new URLSearchParams({
      secret: env.CAPTCHA_SECRET_KEY ?? "",
      response: input.token,
    });

    if (input.remoteIp) body.set("remoteip", input.remoteIp);
    if (input.idempotencyKey && env.CAPTCHA_PROVIDER === "turnstile") {
      body.set("idempotency_key", input.idempotencyKey);
    }

    try {
      const response = await fetch(env.CAPTCHA_VERIFY_URL ?? defaultVerifyUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (!response.ok) {
        logger.warn("captcha.verify_http_failed", { statusCode: response.status });
        return false;
      }

      const result = (await response.json()) as CaptchaVerifyResponse;
      if (!result.success) {
        logger.warn("captcha.verify_rejected", { errorCodes: result["error-codes"] ?? [] });
      }
      return result.success === true;
    } catch (error) {
      logger.warn("captcha.verify_error", { error });
      return false;
    }
  }
}

export const captchaService = new HttpCaptchaVerifier();
