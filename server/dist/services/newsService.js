"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsService = exports.NewsService = void 0;
const client_1 = require("@prisma/client");
const storage_1 = require("../config/storage");
const prisma = new client_1.PrismaClient();
const slugify = (value) => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || `news-${Date.now()}`;
class NewsService {
    proxyUrl(storageKey) {
        if (!storageKey)
            return undefined;
        const base = process.env.PUBLIC_BASE_URL ?? "http://localhost:4000";
        return `${base.replace(/\/$/, "")}/api/images/${encodeURIComponent(storageKey)}`;
    }
    async mapToDto(news) {
        const imageUrl = news.imageStorageKey
            ? this.proxyUrl(news.imageStorageKey) ?? (await (0, storage_1.getSignedUrl)(news.imageStorageKey))
            : news.imageUrl;
        return {
            ...news,
            status: news.status ?? "published",
            imageUrl,
            publishedAt: news.publishedAt ? news.publishedAt.toISOString() : null,
            createdAt: news.createdAt?.toISOString(),
            updatedAt: news.updatedAt?.toISOString(),
        };
    }
    async list(params) {
        const page = params?.page && params.page > 0 ? params.page : 1;
        const pageSize = params?.pageSize && params.pageSize > 0 ? params.pageSize : 10;
        const [items, total] = await Promise.all([
            prisma.news.findMany({
                orderBy: [
                    { publishedAt: "desc" },
                    { createdAt: "desc" },
                ],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.news.count(),
        ]);
        const mapped = await Promise.all(items.map((item) => this.mapToDto(item)));
        const result = {
            items: mapped,
            total,
            page,
            pageSize,
        };
        return result;
    }
    async getBySlug(slug) {
        const news = await prisma.news.findUnique({
            where: { slug },
        });
        if (!news)
            return null;
        return this.mapToDto(news);
    }
    async create(payload, uploadedImage) {
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
    async update(id, payload, uploadedImage) {
        const existing = await prisma.news.findUnique({ where: { id } });
        if (!existing)
            return null;
        const slug = payload.slug?.trim() || existing.slug || slugify(payload.title ?? existing.title);
        if (uploadedImage && existing.imageStorageKey && existing.imageStorageKey !== uploadedImage.storageKey) {
            await (0, storage_1.deleteStoredObject)(existing.imageStorageKey);
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
                imageStorageKey: uploadedImage?.storageKey ?? payload.imageStorageKey ?? existing.imageStorageKey ?? null,
            },
        });
        return this.mapToDto(updated);
    }
    async delete(id) {
        const news = await prisma.news.findUnique({ where: { id } });
        if (!news)
            return false;
        await prisma.news.delete({ where: { id } });
        if (news.imageStorageKey) {
            await (0, storage_1.deleteStoredObject)(news.imageStorageKey);
        }
        return true;
    }
}
exports.NewsService = NewsService;
exports.newsService = new NewsService();
