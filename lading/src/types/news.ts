import type { PaginatedResponse } from "./api";

export type NewsStatus = "published" | "draft";

export interface News {
  id: string;
  title: string;
  subtitle?: string | null;
  content: string;
  imageUrl?: string | null;
  publishedAt?: string | null;
  slug: string;
  status: NewsStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type PaginatedNewsResponse = PaginatedResponse<News>;

export interface UpsertNewsDto {
  title: string;
  subtitle?: string;
  content: string;
  slug?: string;
  imageFile?: File | null;
  imageUrl?: string | null;
}

export type NewsFormValues = UpsertNewsDto;
