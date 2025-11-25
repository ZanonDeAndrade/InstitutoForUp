import axios from "axios";

// Prefer the env var; fall back to sensible defaults per environment.
const baseURL =
  import.meta.env.VITE_API_URL?.trim() ||
  (import.meta.env.DEV ? "http://localhost:4010/api" : "https://iforup.com/api");

const api = axios.create({
  baseURL,
  timeout: 8000,
});

export default api;
