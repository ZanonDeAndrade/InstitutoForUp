import crypto from "node:crypto";
import jwt, { JsonWebTokenError, JwtPayload as JsonWebTokenPayload, NotBeforeError, TokenExpiredError } from "jsonwebtoken";
import { env } from "../config/env";
import { ADMIN_ROLES, type AdminRoleValue } from "../services/adminAuthService";

export const ADMIN_TOKEN_ALGORITHM = "HS256";
export const ADMIN_TOKEN_ISSUER = "forup-admin-api";
export const ADMIN_TOKEN_AUDIENCE = "forup-admin-panel";
export const ADMIN_TOKEN_TYPE = "JWT";
export const ADMIN_TOKEN_USE = "admin_access";
export const ADMIN_CSRF_HEADER = "x-csrf-token";
export const DEFAULT_EXP_SECONDS = 60 * 60 * 12; // 12h

export interface TokenPayload extends JsonWebTokenPayload {
  sub: string;
  role: AdminRoleValue;
  username: string;
  token_use: typeof ADMIN_TOKEN_USE;
  exp: number;
  iat: number;
  iss: typeof ADMIN_TOKEN_ISSUER;
  aud: typeof ADMIN_TOKEN_AUDIENCE;
  jti: string;
}

export class AdminTokenError extends Error {
  constructor(
    public readonly code: "missing" | "expired" | "invalid" | "revoked",
    public readonly statusCode = 401,
  ) {
    super(code);
  }
}

const getSecret = () => env.ADMIN_TOKEN_SECRET;
const revokedTokenIds = new Map<string, number>();

const cleanupRevokedTokens = (now = Date.now()) => {
  for (const [jti, expiresAt] of revokedTokenIds.entries()) {
    if (expiresAt <= now) {
      revokedTokenIds.delete(jti);
    }
  }
};

export const createAdminCsrfToken = (jti: string) =>
  crypto.createHmac("sha256", getSecret()).update(`${ADMIN_TOKEN_USE}:${jti}`).digest("base64url");

const secureCompare = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const verifyAdminCsrfToken = (payload: TokenPayload, headerToken?: string, cookieToken?: string) => {
  if (!headerToken || !cookieToken) return false;
  const expected = createAdminCsrfToken(payload.jti);
  return secureCompare(headerToken, cookieToken) && secureCompare(cookieToken, expected);
};

export const revokeAdminToken = (payload: Pick<TokenPayload, "jti" | "exp">) => {
  revokedTokenIds.set(payload.jti, payload.exp * 1000);
  cleanupRevokedTokens();
};

export const clearRevokedAdminTokensForTests = () => {
  revokedTokenIds.clear();
};

const isAdminRole = (role: unknown): role is AdminRoleValue =>
  typeof role === "string" && ADMIN_ROLES.includes(role as AdminRoleValue);

const isTokenPayload = (payload: unknown): payload is TokenPayload => {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<TokenPayload>;
  return (
    typeof candidate.sub === "string" &&
    candidate.sub.length > 0 &&
    isAdminRole(candidate.role) &&
    typeof candidate.username === "string" &&
    candidate.username.length > 0 &&
    candidate.token_use === ADMIN_TOKEN_USE &&
    typeof candidate.exp === "number" &&
    typeof candidate.iat === "number" &&
    candidate.iss === ADMIN_TOKEN_ISSUER &&
    candidate.aud === ADMIN_TOKEN_AUDIENCE &&
    typeof candidate.jti === "string" &&
    candidate.jti.length > 0
  );
};

export const signAdminToken = (input: { id: string; role: AdminRoleValue; username: string }) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    {
      role: input.role,
      username: input.username,
      token_use: ADMIN_TOKEN_USE,
    },
    getSecret(),
    {
      algorithm: ADMIN_TOKEN_ALGORITHM,
      audience: ADMIN_TOKEN_AUDIENCE,
      expiresIn: DEFAULT_EXP_SECONDS,
      issuer: ADMIN_TOKEN_ISSUER,
      jwtid: jti,
      subject: input.id,
      header: {
        alg: ADMIN_TOKEN_ALGORITHM,
        typ: ADMIN_TOKEN_TYPE,
      },
    },
  );
  const decoded = jwt.decode(token) as JsonWebTokenPayload | null;
  if (!decoded || typeof decoded.exp !== "number") {
    throw new AdminTokenError("invalid");
  }
  return { token, exp: decoded.exp, csrfToken: createAdminCsrfToken(jti) };
};

export const verifyAdminToken = (token: string): TokenPayload => {
  if (!token.trim()) {
    throw new AdminTokenError("missing");
  }

  try {
    const verified = jwt.verify(token, getSecret(), {
      algorithms: [ADMIN_TOKEN_ALGORITHM],
      audience: ADMIN_TOKEN_AUDIENCE,
      issuer: ADMIN_TOKEN_ISSUER,
      complete: true,
    });

    if (typeof verified === "string") {
      throw new AdminTokenError("invalid");
    }

    const { header, payload } = verified;
    if (header.alg !== ADMIN_TOKEN_ALGORITHM || header.typ !== ADMIN_TOKEN_TYPE || !isTokenPayload(payload)) {
      throw new AdminTokenError("invalid");
    }
    cleanupRevokedTokens();
    if (revokedTokenIds.has(payload.jti)) {
      throw new AdminTokenError("revoked");
    }

    return payload;
  } catch (error) {
    if (error instanceof AdminTokenError) throw error;
    if (error instanceof TokenExpiredError) throw new AdminTokenError("expired");
    if (error instanceof JsonWebTokenError || error instanceof NotBeforeError) {
      throw new AdminTokenError("invalid");
    }
    throw new AdminTokenError("invalid");
  }
};
