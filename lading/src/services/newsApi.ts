import api from "./api";
import { News, PaginatedNewsResponse, UpsertNewsDto } from "@/types/news";

const basePath = "/news";

const buildFormData = (payload: UpsertNewsDto) => {
  const formData = new FormData();
  formData.append("title", payload.title);
  if (payload.subtitle) formData.append("subtitle", payload.subtitle);
  formData.append("content", payload.content);
  if (payload.slug) formData.append("slug", payload.slug);
  if (payload.imageFile) formData.append("image", payload.imageFile);
  if (payload.imageUrl) formData.append("imageUrl", payload.imageUrl);

  return formData;
};

export const newsApi = {
  async list(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedNewsResponse> {
    const { data } = await api.get<PaginatedNewsResponse>(basePath, {
      params: {
        page: params?.page,
        pageSize: params?.pageSize,
      },
    });
    return data;
  },

  async latest(limit = 3): Promise<News[]> {
    const { data } = await api.get<PaginatedNewsResponse>(basePath, {
      params: { page: 1, pageSize: limit },
    });
    return data.items;
  },

  async getBySlug(slug: string): Promise<News> {
    const { data } = await api.get<News>(`${basePath}/${slug}`);
    return data;
  },

  async create(payload: UpsertNewsDto): Promise<News> {
    const formData = buildFormData(payload);
    const { data } = await api.post<News>(basePath, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async update(id: string, payload: UpsertNewsDto): Promise<News> {
    const formData = buildFormData(payload);
    const { data } = await api.put<News>(`${basePath}/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${basePath}/${id}`);
  },
};
