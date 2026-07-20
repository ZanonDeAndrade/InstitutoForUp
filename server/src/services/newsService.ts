import { PrismaClient } from "@prisma/client";
import type { News } from "@prisma/client";
import { deleteStoredObject } from "../config/storage";
import { env } from "../config/env";
import { hasStorageBackedImageReference, isSafePublicImageId } from "./publicImageService";
import { CreateNewsDto, NewsResponseDto, PaginatedResult, UpdateNewsDto } from "../dtos/newsDto";

const prisma = new PrismaClient();

export interface UploadedNewsImage {
  storageKey: string;
  url: string;
}

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || `news-${Date.now()}`;

export class NewsService {
  private proxyUrl(newsId?: string | null) {
    if (!newsId || !isSafePublicImageId(newsId)) return undefined;
    const base = env.PUBLIC_BASE_URL;
    return `${base.replace(/\/$/, "")}/api/images/news/${encodeURIComponent(newsId)}`;
  }

  private async mapToDto(news: News): Promise<NewsResponseDto> {
    const imageUrl = hasStorageBackedImageReference(news.imageStorageKey, news.imageUrl, "news")
      ? this.proxyUrl(news.id) ?? ""
      : news.imageUrl;

    return {
      id: news.id,
      title: news.title,
      subtitle: news.subtitle,
      content: news.content,
      imageUrl,
      slug: news.slug,
      status: (news.status as "published" | "draft") ?? "published",
      publishedAt: news.publishedAt ? news.publishedAt.toISOString() : null,
      createdAt: news.createdAt?.toISOString(),
      updatedAt: news.updatedAt?.toISOString(),
    };
  }

  async list(params?: { page?: number; pageSize?: number; includeDrafts?: boolean }) {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const pageSize = params?.pageSize && params.pageSize > 0 ? params.pageSize : 10;
    const where = params?.includeDrafts ? undefined : { status: "published" };
    const [items, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: [
          { publishedAt: "desc" },
          { createdAt: "desc" },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.news.count({ where }),
    ]);

    const mapped = await Promise.all(items.map((item) => this.mapToDto(item)));

    const result: PaginatedResult<NewsResponseDto> = {
      items: mapped,
      total,
      page,
      pageSize,
    };
    return result;
  }

  async getBySlug(slug: string, includeDrafts = false): Promise<NewsResponseDto | null> {
    const news = await prisma.news.findFirst({
      where: {
        slug,
        ...(includeDrafts ? {} : { status: "published" }),
      },
    });
    if (!news) return null;
    return this.mapToDto(news);
  }

  async create(payload: CreateNewsDto, uploadedImage?: UploadedNewsImage | null) {
    const slug = payload.slug?.trim() || slugify(payload.title);

    const created = await prisma.news.create({
      data: {
        title: payload.title,
        subtitle: payload.subtitle,
        content: payload.content,
        slug,
        status: "published",
        publishedAt: new Date(),
        imageUrl: uploadedImage?.url ?? payload.imageUrl ?? null,
        imageStorageKey: uploadedImage?.storageKey ?? payload.imageStorageKey ?? null,
      },
    });

    return this.mapToDto(created);
  }

  async update(id: string, payload: UpdateNewsDto, uploadedImage?: UploadedNewsImage | null) {
    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing) return null;

    const slug = payload.slug?.trim() || existing.slug || slugify(payload.title ?? existing.title);

    if (uploadedImage && existing.imageStorageKey && existing.imageStorageKey !== uploadedImage.storageKey) {
      await deleteStoredObject(existing.imageStorageKey);
    }

    const updated = await prisma.news.update({
      where: { id },
      data: {
        title: payload.title ?? existing.title,
        subtitle: payload.subtitle ?? existing.subtitle,
        content: payload.content ?? existing.content,
        slug,
        status: "published",
        publishedAt: existing.publishedAt ?? new Date(),
        imageUrl: uploadedImage?.url ?? payload.imageUrl ?? existing.imageUrl ?? null,
        imageStorageKey:
          uploadedImage?.storageKey ?? payload.imageStorageKey ?? existing.imageStorageKey ?? null,
      },
    });

    return this.mapToDto(updated);
  }

  async delete(id: string) {
    const news = await prisma.news.findUnique({ where: { id } });
    if (!news) return false;

    await prisma.news.delete({ where: { id } });

    if (news.imageStorageKey) {
      await deleteStoredObject(news.imageStorageKey);
    }

    return true;
  }
}

export const newsService = new NewsService();
