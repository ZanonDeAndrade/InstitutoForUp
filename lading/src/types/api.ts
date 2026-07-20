export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
}

export interface ApiErrorResponse {
  requestId?: string;
  message: string;
  error?: {
    code?: string;
    message?: string;
  };
}
