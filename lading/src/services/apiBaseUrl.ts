const fallbackApiBaseUrl = import.meta.env.DEV ? "http://localhost:4010/api" : "https://iforup.com/api";

const hasControlCharacter = (value: string) =>
  Array.from(value).some((char) => {
    const code = char.charCodeAt(0);
    return code <= 31 || code === 127;
  });

export const resolveApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (!configured) return fallbackApiBaseUrl;
  if (hasControlCharacter(configured)) return fallbackApiBaseUrl;

  try {
    const base = typeof window === "undefined" ? fallbackApiBaseUrl : window.location.origin;
    const url = new URL(configured, base);
    if (!["http:", "https:"].includes(url.protocol)) return fallbackApiBaseUrl;
    return configured;
  } catch {
    return fallbackApiBaseUrl;
  }
};
