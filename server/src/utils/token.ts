import crypto from "node:crypto";

const DEFAULT_EXP_SECONDS = 60 * 60 * 12; // 12h

const base64url = (input: Buffer | string) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

interface TokenPayload {
  sub: string;
  exp: number;
}

const getSecret = () => process.env.ADMIN_TOKEN_SECRET || "dev-admin-secret";

export const signAdminToken = (subject: string) => {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + DEFAULT_EXP_SECONDS;
  const payload: TokenPayload = { sub: subject, exp };
  const payloadEncoded = base64url(JSON.stringify(payload));
  const data = `${header}.${payloadEncoded}`;
  const signature = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
  const token = `${data}.${signature}`;
  return { token, exp };
};

export const verifyAdminToken = (token: string): TokenPayload | null => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const data = `${header}.${payload}`;
  const expected = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as TokenPayload;
  if (decoded.exp * 1000 < Date.now()) return null;
  return decoded;
};
