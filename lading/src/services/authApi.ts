import adminApi from "./adminApi";
import type { AdminSessionUser } from "@/lib/adminPermissions";

export interface AdminSessionResponse {
  exp: number;
  user: AdminSessionUser;
}

export const authApi = {
  async login(identifier: string, password: string) {
    const { data } = await adminApi.post<AdminSessionResponse>("/auth/login", { identifier, password });
    return data;
  },

  async session() {
    const { data } = await adminApi.get<AdminSessionResponse>("/auth/session");
    return data;
  },

  async refresh() {
    const { data } = await adminApi.post<AdminSessionResponse>("/auth/refresh");
    return data;
  },

  async logout() {
    await adminApi.post("/auth/logout");
  },
};
