import axios from "axios";

const defaultBaseUrl = import.meta.env.DEV ? "http://localhost:4010/api" : "http://143.198.4.218/api";
const baseURL = import.meta.env.VITE_API_URL?.trim() || defaultBaseUrl;

const api = axios.create({
  baseURL,
  timeout: 8000,
});

export default api;
