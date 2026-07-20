const protocolPattern = /^[a-z][a-z0-9+.-]*:/i;

const hasControlCharacter = (value: string) =>
  Array.from(value).some((char) => {
    const code = char.charCodeAt(0);
    return code <= 31 || code === 127;
  });

export const safeAdminRedirectPath = (value: unknown, fallback = "/") => {
  if (typeof value !== "string") return fallback;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (protocolPattern.test(path) || hasControlCharacter(path)) return fallback;
  return path;
};
