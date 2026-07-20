type LogLevel = "info" | "warn" | "error";

const sensitiveKeyPattern =
  /authorization|cookie|token|csrf|password|secret|private[_-]?key|credential|signed[_-]?url|storage[_-]?key|email|phone|name|message|payload|headers/i;
const signedUrlPattern = /(X-Amz-Signature|X-Amz-Credential|token=|signature=|signed)/i;
const signedUrlValuePattern = /https?:\/\/[^\s"'<>]+(?:token=|signature=|X-Amz-Signature=|X-Amz-Credential=)[^\s"'<>]*/gi;
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const storageKeyPattern = /\b(?:courses|news)\/[A-Za-z0-9._-]+\b/g;
const storageReferencePattern = /\b(?:storageKey|storage_key)\s*[:=]\s*[^\s,;}]+/gi;
const signedReferencePattern = /\b(?:signedUrl|signed_url)\s*[:=]\s*[^\s,;}]+/gi;
const privateKeyLabelPattern = /\bprivate[_-]?key\b/gi;
const bearerPattern = /Bearer\s+[A-Za-z0-9._~+/=-]+/gi;
const cookieValuePattern = /\b(forup_admin_session|forup_admin_csrf)=([^;\s]+)/gi;

const redactString = (value: string) =>
  value
    .replace(signedReferencePattern, "signed_url_reference=[REDACTED]")
    .replace(storageReferencePattern, "storage_reference=[REDACTED]")
    .replace(signedUrlValuePattern, "[REDACTED_SIGNED_URL]")
    .replace(emailPattern, "[REDACTED_EMAIL]")
    .replace(storageKeyPattern, "[REDACTED_STORAGE_KEY]")
    .replace(privateKeyLabelPattern, "[REDACTED_KEY_LABEL]")
    .replace(bearerPattern, "Bearer [REDACTED]")
    .replace(cookieValuePattern, "$1=[REDACTED]")
    .replace(/([?&](?:token|signature|X-Amz-Signature|X-Amz-Credential)=)[^&\s]+/gi, "$1[REDACTED]");

const redactValue = (value: unknown, key?: string): unknown => {
  if (key && sensitiveKeyPattern.test(key)) return "[REDACTED]";
  if (typeof value === "string" && signedUrlPattern.test(value)) return "[REDACTED]";
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map((item) => redactValue(item));
  if (value && typeof value === "object") {
    if (value instanceof Error) {
      return {
        name: value.name,
        message: redactString(value.message),
        stack: value.stack ? redactString(value.stack) : undefined,
      };
    }
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        redactValue(entryValue, entryKey),
      ]),
    );
  }
  return value;
};

export const redactSensitive = (input: unknown) => redactValue(input);

const write = (level: LogLevel, event: string, data: Record<string, unknown> = {}) => {
  const entry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...(redactSensitive(data) as Record<string, unknown>),
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
};

export const logger = {
  info: (event: string, data?: Record<string, unknown>) => write("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) => write("warn", event, data),
  error: (event: string, data?: Record<string, unknown>) => write("error", event, data),
};
