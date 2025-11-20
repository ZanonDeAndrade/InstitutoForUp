import { PrismaClient } from "@prisma/client";
import { deleteStoredObject, getSignedUrl } from "../config/storage";
import { StoredFile } from "../config/storage";

const prisma = new PrismaClient();

type UploadedFile = Express.Multer.File & { key?: string };

export interface UpsertCoursePayload {
  id: string;
  name: string;
  description?: string;
  fields?: unknown;
}

const parseFields = (fields: unknown) => {
  if (typeof fields === "string") {
    try {
      return JSON.parse(fields);
    } catch (_err) {
      return null;
    }
  }
  return fields;
};

export class CourseService {
  private proxyUrl(storageKey?: string | null) {
    if (!storageKey) return undefined;
    const base = process.env.PUBLIC_BASE_URL ?? "http://localhost:4000";
    return `${base.replace(/\/$/, "")}/api/images/${encodeURIComponent(storageKey)}`;
  }

  async list() {
    const courses = await prisma.course.findMany({
      include: { images: true },
      orderBy: { name: "asc" },
    });
    console.log("[svc] list courses", courses.length);
    const coursesWithSigned = await Promise.all(
      courses.map(async (course) => ({
        ...course,
        fields: parseFields(course.fields),
        images: await Promise.all(
          course.images.map(async (img) => ({
            ...img,
            url: this.proxyUrl(img.storageKey ?? img.url ?? "") ?? (await getSignedUrl(img.storageKey ?? img.url ?? "")),
          })),
        ),
      })),
    );
    return coursesWithSigned;
  }

  async getById(id: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: { images: true },
    });
    console.log("[svc] getById", { id, found: !!course });
    if (!course) return null;
    const images = await Promise.all(
      course.images.map(async (img) => ({
        ...img,
        url: this.proxyUrl(img.storageKey ?? img.url ?? "") ?? (await getSignedUrl(img.storageKey ?? img.url ?? "")),
      })),
    );
    return {
      ...course,
      fields: parseFields(course.fields),
      images,
    };
  }

  async upsert(payload: UpsertCoursePayload) {
    console.log("[svc] upsert", payload.id);
    return prisma.course.upsert({
      where: { id: payload.id },
      create: {
        id: payload.id,
        name: payload.name,
        description: payload.description,
        fields: payload.fields ? JSON.stringify(payload.fields) : null,
      },
      update: {
        name: payload.name,
        description: payload.description,
        fields: payload.fields ? JSON.stringify(payload.fields) : null,
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

    return created;
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
    console.log("[svc] course deleted", courseId);
  }
}

export const courseService = new CourseService();
