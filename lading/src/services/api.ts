import axios from "axios";
import { getAdminToken, clearAdminToken } from "@/lib/adminAuth";

// Prefer the env var; fall back to sensible defaults per environment.
const baseURL =
  import.meta.env.VITE_API_URL?.trim() ||
  (import.meta.env.DEV ? "http://localhost:4010/api" : "https://iforup.com/api");

const api = axios.create({
  baseURL,
  timeout: 8000,
});

api.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAdminToken();
    }
    return Promise.reject(error);
  },
);

export default api;
