import publicApi from "./publicApi";
import { News, PaginatedNewsResponse } from "@/types/news";

const basePath = "/news";

export const newsApi = {
  async list(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedNewsResponse> {
    const { data } = await publicApi.get<PaginatedNewsResponse>(basePath, {
      params: {
        page: params?.page,
        pageSize: params?.pageSize,
      },
    });
    return data;
  },

  async latest(limit = 3): Promise<News[]> {
    const { data } = await publicApi.get<PaginatedNewsResponse>(basePath, {
      params: { page: 1, pageSize: limit },
    });
    return data.items;
  },

  async getBySlug(slug: string): Promise<News> {
    const { data } = await publicApi.get<News>(`${basePath}/${slug}`);
    return data;
  },
};
