export type NewsStatus = "published" | "draft";

export interface News {
  id: string;
  title: string;
  subtitle?: string | null;
  content: string;
  imageUrl?: string | null;
  imageStorageKey?: string | null;
  publishedAt?: string | null;
  slug: string;
  status: NewsStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedNewsResponse {
  items: News[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UpsertNewsDto {
  title: string;
  subtitle?: string;
  content: string;
  slug?: string;
  imageFile?: File | null;
  imageUrl?: string | null;
}
