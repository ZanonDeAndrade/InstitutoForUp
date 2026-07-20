import { PrismaClient } from "@prisma/client";
import { downloadFromStorage } from "../config/storage";
import { env } from "../config/env";
import { assertAllowedStorageKey, type StoragePrefix } from "./supabaseStorageService";

export type PublicImageKind = "course" | "news";

export interface PublicImagePayload {
  buffer: Buffer;
  contentType: string;
}

export interface PublicImageRepository {
  findPublicCourseImageStorageKey(imageId: string): Promise<string | null>;
  findPublicNewsImageStorageKey(newsId: string): Promise<string | null>;
}

export type StorageDownloader = (storageKey: string) => Promise<PublicImagePayload>;

const prisma = new PrismaClient();
const publicImageIdPattern = /^[A-Za-z0-9_-]{8,80}$/;

export const isSafePublicImageId = (value: string) => publicImageIdPattern.test(value);

const safeStorageKeyOrNull = (storageKey: string | null | undefined, prefix: StoragePrefix) => {
  if (!storageKey) return null;
  try {
    return assertAllowedStorageKey(storageKey, prefix);
  } catch {
    return null;
  }
};

export const storageKeyFromLegacyImageUrl = (imageUrl: string | null | undefined, prefix: StoragePrefix) => {
  if (!imageUrl) return null;
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;

  const candidates: string[] = [];

  if (trimmed.startsWith("/uploads/")) {
    candidates.push(trimmed.slice("/uploads/".length));
  }

  if (trimmed.startsWith("/api/images/")) {
    candidates.push(decodeURIComponent(trimmed.slice("/api/images/".length)));
  }

  try {
    const parsed = new URL(trimmed, env.PUBLIC_BASE_URL);
    const publicBase = new URL(env.PUBLIC_BASE_URL);
    if (parsed.origin === publicBase.origin && parsed.pathname.startsWith("/uploads/")) {
      candidates.push(decodeURIComponent(parsed.pathname.slice("/uploads/".length)));
    }
    if (parsed.origin === publicBase.origin && parsed.pathname.startsWith("/api/images/")) {
      candidates.push(decodeURIComponent(parsed.pathname.slice("/api/images/".length)));
    }
    if (env.AWS_S3_BASE_URL) {
      const s3Base = new URL(env.AWS_S3_BASE_URL);
      if (parsed.origin === s3Base.origin && parsed.pathname.startsWith(`${s3Base.pathname.replace(/\/$/, "")}/`)) {
        candidates.push(decodeURIComponent(parsed.pathname.slice(s3Base.pathname.replace(/\/$/, "").length + 1)));
      }
    }
  } catch {
    return null;
  }

  for (const candidate of candidates) {
    const safeKey = safeStorageKeyOrNull(candidate, prefix);
    if (safeKey) return safeKey;
  }

  return null;
};

export const hasStorageBackedImageReference = (
  storageKey: string | null | undefined,
  imageUrl: string | null | undefined,
  prefix: StoragePrefix,
) => Boolean(safeStorageKeyOrNull(storageKey, prefix) ?? storageKeyFromLegacyImageUrl(imageUrl, prefix));

export class PrismaPublicImageRepository implements PublicImageRepository {
  async findPublicCourseImageStorageKey(imageId: string) {
    const image = await prisma.courseImage.findUnique({
      where: { id: imageId },
      select: {
        storageKey: true,
        url: true,
        course: { select: { id: true } },
      },
    });

    if (!image?.course) return null;
    return safeStorageKeyOrNull(image.storageKey, "courses") ?? storageKeyFromLegacyImageUrl(image.url, "courses");
  }

  async findPublicNewsImageStorageKey(newsId: string) {
    const news = await prisma.news.findFirst({
      where: {
        id: newsId,
        status: "published",
      },
      select: {
        imageStorageKey: true,
        imageUrl: true,
      },
    });

    return safeStorageKeyOrNull(news?.imageStorageKey, "news") ?? storageKeyFromLegacyImageUrl(news?.imageUrl, "news");
  }
}

export class PublicImageService {
  constructor(
    private readonly repository: PublicImageRepository = new PrismaPublicImageRepository(),
    private readonly storageDownloader: StorageDownloader = downloadFromStorage,
  ) {}

  async getPublicImage(kind: PublicImageKind, imageId: string): Promise<PublicImagePayload | null> {
    if (!isSafePublicImageId(imageId)) return null;

    const storedStorageKey =
      kind === "course"
        ? await this.repository.findPublicCourseImageStorageKey(imageId)
        : await this.repository.findPublicNewsImageStorageKey(imageId);
    const storageKey = safeStorageKeyOrNull(storedStorageKey, kind === "course" ? "courses" : "news");

    if (!storageKey) return null;

    try {
      return await this.storageDownloader(storageKey);
    } catch {
      return null;
    }
  }
}

export const publicImageService = new PublicImageService();
