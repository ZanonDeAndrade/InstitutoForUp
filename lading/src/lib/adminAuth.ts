const TOKEN_KEY = "forup_admin_token";

const isBrowser = typeof window !== "undefined";

type JwtPayload = { exp?: number; sub?: string } | null;

const decodePayload = (token: string): JwtPayload => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const getAdminToken = () => {
  if (!isBrowser) return null;
  return window.localStorage.getItem(TOKEN_KEY);
};

export const setAdminToken = (token: string) => {
  if (!isBrowser) return;
  window.localStorage.setItem(TOKEN_KEY, token);
};

export const clearAdminToken = () => {
  if (!isBrowser) return;
  window.localStorage.removeItem(TOKEN_KEY);
};

export const isAdminAuthenticated = () => {
  const token = getAdminToken();
  if (!token) return false;
  const payload = decodePayload(token);
  const expMs = payload?.exp ? payload.exp * 1000 : 0;
  const valid = !!payload?.sub && expMs > Date.now();
  if (!valid) {
    clearAdminToken();
  }
  return valid;
};
