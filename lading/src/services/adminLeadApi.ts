import adminApi from "./adminApi";
import { LeadListResponse } from "@/types/lead";

export const leadDeleteConfirmations = {
  all: "SOFT_DELETE_ALL_LEADS",
  course: "SOFT_DELETE_COURSE_LEADS",
  selected: "SOFT_DELETE_SELECTED_LEADS",
  restore: "RESTORE_LEADS",
  purge: "PERMANENTLY_DELETE_LEADS",
} as const;

export type LeadVisibility = "active" | "deleted" | "all";

export const adminLeadApi = {
  async list(params: {
    page?: number;
    pageSize?: number;
    visibility?: LeadVisibility;
    courseId?: string;
    courseName?: string;
  } = {}): Promise<LeadListResponse> {
    const { data } = await adminApi.get<LeadListResponse>("/leads", { params });
    return data;
  },

  async softDelete(payload: {
    scope: "all" | "course" | "selected";
    leadIds?: string[];
    courseId?: string;
    courseName?: string;
    reason: string;
    confirmation: string;
  }): Promise<{ deleted: number }> {
    const { data } = await adminApi.post<{ deleted: number }>("/leads/bulk-delete", payload);
    return data;
  },

  async restore(payload: {
    leadIds: string[];
    reason: string;
    confirmation: string;
  }): Promise<{ restored: number }> {
    const { data } = await adminApi.post<{ restored: number }>("/leads/restore", payload);
    return data;
  },

  async purge(payload: {
    leadIds: string[];
    reason: string;
    confirmation: string;
  }): Promise<{ purged: number }> {
    const { data } = await adminApi.delete<{ purged: number }>("/leads/permanent", { data: payload });
    return data;
  },
};
