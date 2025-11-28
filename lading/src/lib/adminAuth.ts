const TOKEN_KEY = "forup_admin_token";

const isBrowser = typeof window !== "undefined";
let tokenCache: string | null = null;

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

const clearPersistedTokens = () => {
  if (!isBrowser) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
};

export const getAdminToken = () => tokenCache;

export const setAdminToken = (token: string) => {
  tokenCache = token;
  clearPersistedTokens();
};

export const clearAdminToken = () => {
  tokenCache = null;
  clearPersistedTokens();
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

// Garante que tokens antigos não fiquem guardados após reload
clearPersistedTokens();
