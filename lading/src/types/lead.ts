import type { PaginatedResponse } from "./api";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  source?: string | null;
  message?: string | null;
  course?: string | null;
  courseId?: string | null;
  submittedAt: string;
  createdAt?: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletionReason?: string | null;
}

export interface CreateLeadDto {
  name: string;
  email: string;
  phone?: string;
  source?: string;
  message?: string;
  course?: string;
  courseId?: string;
  captchaToken: string;
  formStartedAt: number;
  idempotencyKey: string;
  website?: string;
}

export interface LeadInterestFormValues {
  name: string;
  email: string;
  phone: string;
  source: string;
  message: string;
  website: string;
}

export type LeadListResponse = PaginatedResponse<Lead> & { totalPages: number };
