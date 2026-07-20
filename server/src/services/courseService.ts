import { Prisma, PrismaClient } from "@prisma/client";
import { deleteStoredObject } from "../config/storage";
import { StoredFile } from "../config/storage";
import { env } from "../config/env";
import { hasStorageBackedImageReference, isSafePublicImageId } from "./publicImageService";
import { PILLAR_BY_COURSE, PILLAR_IDS, PillarId } from "../constants/pillars";

const prisma = new PrismaClient();

export interface UpsertCoursePayload {
  id: string;
  name: string;
  description?: string;
  fields?: unknown;
  content?: Prisma.InputJsonValue;
  pillar?: PillarId;
}

const parseFields = (fields: unknown) => {
  if (typeof fields === "string") {
    try {
      return JSON.parse(fields);
    } catch {
      return null;
    }
  }
  return fields;
};

const normalizeDescription = (description?: string | null) => {
  if (typeof description !== "string") return description;
  return description
    .replace(/\t+/g, " ") // remove tabs
    .replace(/ {2,}/g, " ") // colapsa múltiplos espaços, preservando quebras de linha
    .replace(/ \n/g, "\n"); // remove espaços antes da quebra
};

export class CourseService {
  private proxyUrl(imageId?: string | null) {
    if (!imageId || !isSafePublicImageId(imageId)) return undefined;
    const base = env.PUBLIC_BASE_URL;
    return `${base.replace(/\/$/, "")}/api/images/course/${encodeURIComponent(imageId)}`;
  }

  private imageUrlFor(imageId: string, storageKey?: string | null, legacyUrl?: string | null) {
    if (!hasStorageBackedImageReference(storageKey, legacyUrl, "courses")) return legacyUrl ?? "";
    return this.proxyUrl(imageId) ?? "";
  }

  private publicImageDto(img: { id: string; url: string; storageKey?: string | null; courseId: string; createdAt: Date }) {
    return {
      id: img.id,
      courseId: img.courseId,
      createdAt: img.createdAt,
      url: this.imageUrlFor(img.id, img.storageKey, img.url),
    };
  }

  async list() {
    const courses = await prisma.course.findMany({
      include: { images: true },
      orderBy: { name: "asc" },
    });
    const persistPromises: Promise<unknown>[] = [];
    const coursesWithSigned = await Promise.all(
      courses.map(async (course) => ({
        ...course,
        description: normalizeDescription(course.description),
        fields: parseFields(course.fields),
        pillar: await this.resolveAndPersistPillar(course.id, course.pillar, persistPromises),
        images: course.images.map((img) => this.publicImageDto(img)),
      })),
    );
    if (persistPromises.length) {
      await Promise.allSettled(persistPromises);
    }
    return coursesWithSigned;
  }

  async getById(id: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!course) return null;
    const pillar = await this.resolveAndPersistPillar(id, course.pillar);
    const images = course.images.map((img) => this.publicImageDto(img));
    return {
      ...course,
      description: normalizeDescription(course.description),
      fields: parseFields(course.fields),
      pillar,
      images,
    };
  }

  async upsert(payload: UpsertCoursePayload) {
    const existing = await prisma.course.findUnique({ where: { id: payload.id } });
    const pillar = this.resolvePillar(payload.id, payload.pillar ?? existing?.pillar);

    return prisma.course.upsert({
      where: { id: payload.id },
      create: {
        id: payload.id,
        name: payload.name,
        description: payload.description,
        pillar,
        fields: payload.fields ? JSON.stringify(payload.fields) : null,
        content: payload.content,
      },
      update: {
        name: payload.name,
        description: payload.description,
        pillar,
        fields: payload.fields ? JSON.stringify(payload.fields) : null,
        ...(payload.content !== undefined ? { content: payload.content } : {}),
      },
      include: { images: true },
    });
  }

  async addImages(courseId: string, storedFiles: StoredFile[]) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new Error("COURSE_NOT_FOUND");
    }

    const created = await prisma.$transaction(
      storedFiles.map((file) =>
        prisma.courseImage.create({
          data: {
            courseId,
            storageKey: file.storageKey,
            url: file.url,
          },
        }),
      ),
    );

    return created.map((img) => this.publicImageDto(img));
  }

  async deleteImage(courseId: string, imageId: string) {
    const image = await prisma.courseImage.findUnique({ where: { id: imageId } });
    if (!image || image.courseId !== courseId) {
      throw new Error("IMAGE_NOT_FOUND");
    }

    await prisma.courseImage.delete({ where: { id: imageId } });
    if (image.storageKey) {
      await deleteStoredObject(image.storageKey);
    }
  }

  async deleteCourse(courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId }, include: { images: true } });
    if (!course) {
      throw new Error("COURSE_NOT_FOUND");
    }
    await prisma.$transaction([
      prisma.courseImage.deleteMany({ where: { courseId } }),
      prisma.course.delete({ where: { id: courseId } }),
    ]);
    await Promise.all(course.images.map((img) => img.storageKey && deleteStoredObject(img.storageKey)));
  }

  private async resolveAndPersistPillar(
    courseId: string,
    pillar?: string | null,
    persistPromises?: Promise<unknown>[],
  ): Promise<PillarId> {
    const normalized = this.normalizePillar(pillar);
    const resolved = normalized ?? PILLAR_BY_COURSE[courseId] ?? "valores-humanos";
    if (resolved !== pillar) {
      const promise = prisma.course.update({ where: { id: courseId }, data: { pillar: resolved } });
      if (persistPromises) {
        persistPromises.push(promise);
      } else {
        await promise;
      }
    }
    return resolved;
  }

  private normalizePillar(pillar?: string | null): PillarId | null {
    if (!pillar) return null;
    const cleaned = pillar.toLowerCase().trim().replace(/[_\s]+/g, "-");
    return (PILLAR_IDS.includes(cleaned as PillarId) ? cleaned : null) as PillarId | null;
  }

  private resolvePillar(courseId: string, pillar?: string | null): PillarId {
    const normalized = this.normalizePillar(pillar);
    if (normalized) return normalized;
    const mapped = PILLAR_BY_COURSE[courseId];
    if (mapped) return mapped;
    return "valores-humanos";
  }
}

export const courseService = new CourseService();
