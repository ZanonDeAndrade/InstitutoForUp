import axios, { AxiosHeaders } from "axios";
import { clearLegacyAdminStorage, getAdminCsrfToken } from "@/lib/adminAuth";
import { resolveApiBaseUrl } from "./apiBaseUrl";

const baseURL = resolveApiBaseUrl();

const adminApi = axios.create({
  baseURL,
  timeout: 8000,
  withCredentials: true,
  allowAbsoluteUrls: false,
});

adminApi.interceptors.request.use((config) => {
  clearLegacyAdminStorage();
  const csrfToken = getAdminCsrfToken();
  if (csrfToken) {
    config.headers = AxiosHeaders.from(config.headers);
    config.headers.set("X-CSRF-Token", csrfToken);
  }
  config.withCredentials = true;
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearLegacyAdminStorage();
    }
    return Promise.reject(error);
  },
);

export default adminApi;
