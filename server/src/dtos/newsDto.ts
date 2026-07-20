export type NewsStatus = "published" | "draft";

interface BaseNewsDto {
  title: string;
  subtitle?: string | null;
  content: string;
  imageUrl?: string | null;
  imageStorageKey?: string | null;
  slug?: string;
}

export type CreateNewsDto = BaseNewsDto;

export interface UpdateNewsDto extends Partial<BaseNewsDto> {
  id?: string;
}

export interface NewsResponseDto {
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

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
