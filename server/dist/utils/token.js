"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdminToken = exports.signAdminToken = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const DEFAULT_EXP_SECONDS = 60 * 60 * 12; // 12h
const base64url = (input) => Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
const getSecret = () => process.env.ADMIN_TOKEN_SECRET || "dev-admin-secret";
const signAdminToken = (subject) => {
    const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const exp = Math.floor(Date.now() / 1000) + DEFAULT_EXP_SECONDS;
    const payload = { sub: subject, exp };
    const payloadEncoded = base64url(JSON.stringify(payload));
    const data = `${header}.${payloadEncoded}`;
    const signature = node_crypto_1.default.createHmac("sha256", getSecret()).update(data).digest("base64url");
    const token = `${data}.${signature}`;
    return { token, exp };
};
exports.signAdminToken = signAdminToken;
//a
const verifyAdminToken = (token) => {
    const parts = token.split(".");
    if (parts.length !== 3)
        return null;
    const [header, payload, signature] = parts;
    const data = `${header}.${payload}`;
    const expected = node_crypto_1.default.createHmac("sha256", getSecret()).update(data).digest("base64url");
    if (!node_crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)))
        return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (decoded.exp * 1000 < Date.now())
        return null;
    return decoded;
};
exports.verifyAdminToken = verifyAdminToken;
