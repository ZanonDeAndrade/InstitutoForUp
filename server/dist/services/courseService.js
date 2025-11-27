"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseService = exports.CourseService = void 0;
const client_1 = require("@prisma/client");
const storage_1 = require("../config/storage");
const prisma = new client_1.PrismaClient();
const parseFields = (fields) => {
    if (typeof fields === "string") {
        try {
            return JSON.parse(fields);
        }
        catch (_err) {
            return null;
        }
    }
    return fields;
};
const normalizeDescription = (description) => {
    if (typeof description !== "string")
        return description;
    return description
        .replace(/\t+/g, " ") // remove tabs
        .replace(/ {2,}/g, " ") // colapsa múltiplos espaços, preservando quebras de linha
        .replace(/ \n/g, "\n"); // remove espaços antes da quebra
};
class CourseService {
    proxyUrl(storageKey) {
        if (!storageKey)
            return undefined;
        const base = process.env.PUBLIC_BASE_URL ?? "http://localhost:4000";
        return `${base.replace(/\/$/, "")}/api/images/${encodeURIComponent(storageKey)}`;
    }
    async list() {
        const courses = await prisma.course.findMany({
            include: { images: true },
            orderBy: { name: "asc" },
        });
        console.log("[svc] list courses", courses.length);
        const coursesWithSigned = await Promise.all(courses.map(async (course) => ({
            ...course,
            description: normalizeDescription(course.description),
            fields: parseFields(course.fields),
            images: await Promise.all(course.images.map(async (img) => ({
                ...img,
                url: this.proxyUrl(img.storageKey ?? img.url ?? "") ?? (await (0, storage_1.getSignedUrl)(img.storageKey ?? img.url ?? "")),
            }))),
        })));
        return coursesWithSigned;
    }
    async getById(id) {
        const course = await prisma.course.findUnique({
            where: { id },
            include: { images: true },
        });
        console.log("[svc] getById", { id, found: !!course });
        if (!course)
            return null;
        const images = await Promise.all(course.images.map(async (img) => ({
            ...img,
            url: this.proxyUrl(img.storageKey ?? img.url ?? "") ?? (await (0, storage_1.getSignedUrl)(img.storageKey ?? img.url ?? "")),
        })));
        return {
            ...course,
            description: normalizeDescription(course.description),
            fields: parseFields(course.fields),
            images,
        };
    }
    async upsert(payload) {
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
    async addImages(courseId, storedFiles) {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) {
            throw new Error("COURSE_NOT_FOUND");
        }
        const created = await prisma.$transaction(storedFiles.map((file) => prisma.courseImage.create({
            data: {
                courseId,
                storageKey: file.storageKey,
                url: file.url,
            },
        })));
        return created;
    }
    async deleteImage(courseId, imageId) {
        const image = await prisma.courseImage.findUnique({ where: { id: imageId } });
        if (!image || image.courseId !== courseId) {
            throw new Error("IMAGE_NOT_FOUND");
        }
        await prisma.courseImage.delete({ where: { id: imageId } });
        if (image.storageKey) {
            await (0, storage_1.deleteStoredObject)(image.storageKey);
        }
    }
    async deleteCourse(courseId) {
        const course = await prisma.course.findUnique({ where: { id: courseId }, include: { images: true } });
        if (!course) {
            throw new Error("COURSE_NOT_FOUND");
        }
        await prisma.$transaction([
            prisma.courseImage.deleteMany({ where: { courseId } }),
            prisma.course.delete({ where: { id: courseId } }),
        ]);
        await Promise.all(course.images.map((img) => img.storageKey && (0, storage_1.deleteStoredObject)(img.storageKey)));
        console.log("[svc] course deleted", courseId);
    }
}
exports.CourseService = CourseService;
exports.courseService = new CourseService();
