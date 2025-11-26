import api from "./api";

export interface CreateLeadDto {
  name: string;
  email: string;
  phone?: string;
  source?: string;
  message?: string;
  course?: string;
}

export const leadApi = {
  async create(payload: CreateLeadDto) {
    const { data } = await api.post("/leads", payload);
    return data;
  },
};
