import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4005/api",
  timeout: 8000,
});

export default api;
