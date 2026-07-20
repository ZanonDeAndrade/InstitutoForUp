import axios from "axios";
import { resolveApiBaseUrl } from "./apiBaseUrl";

const baseURL = resolveApiBaseUrl();

const publicApi = axios.create({
  baseURL,
  timeout: 8000,
  allowAbsoluteUrls: false,
});

export default publicApi;
