import api from "./api";

export const authApi = {
  async login(password: string) {
    const { data } = await api.post<{ token: string; exp: number }>("/auth/login", { password });
    return data;
  },
};
