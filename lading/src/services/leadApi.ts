import publicApi from "./publicApi";
import type { CreateLeadDto, Lead } from "@/types/lead";

export const leadApi = {
  async create(payload: CreateLeadDto): Promise<Lead> {
    const { data } = await publicApi.post<Lead>("/leads", payload, {
      headers: { "Idempotency-Key": payload.idempotencyKey },
    });
    return data;
  },
};
