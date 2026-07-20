const LEGACY_TOKEN_KEY = "forup_admin_token";
const CSRF_COOKIE = "forup_admin_csrf";

const isBrowser = typeof window !== "undefined";

export const clearLegacyAdminStorage = () => {
  if (!isBrowser) return;
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  window.sessionStorage.removeItem(LEGACY_TOKEN_KEY);
};

export const getAdminCsrfToken = () => {
  if (!isBrowser) return null;
  const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
  const csrfCookie = cookies.find((cookie) => cookie.startsWith(`${CSRF_COOKIE}=`));
  if (!csrfCookie) return null;
  return decodeURIComponent(csrfCookie.slice(CSRF_COOKIE.length + 1));
};
