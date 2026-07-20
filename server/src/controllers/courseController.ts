import { Request, Response } from "express";
import { z } from "zod";
import { courseService } from "../services/courseService";
import { persistUploadedFiles } from "../config/storage";
import { ImageUploadError } from "../services/imageUploadService";
import { PILLAR_IDS, PillarId } from "../constants/pillars";
import { appErrors } from "../errors/AppError";
import { courseContentSchema } from "../dtos/courseContentDto";

const upsertSchema = z.object({
  id: z.string().min(1, "id e obrigatorio"),
  name: z.string().min(1, "Nome e obrigatorio"),
  description: z.string().max(10000).optional(),
  fields: z
    .object({
      name: z.boolean().optional(),
      email: z.boolean().optional(),
      phone: z.boolean().optional(),
      source: z.boolean().optional(),
      quote: z.string().max(500).optional(),
    })
    .passthrough()
    .optional(),
  content: courseContentSchema.optional(),
  pillar: z.string().refine((value) => PILLAR_IDS.includes(value as PillarId), "Pilar invalido"),
});

const requiredParam = (value: string | undefined, code: string) => {
  if (!value) {
    throw appErrors.validation(code, "Parametro de rota invalido.");
  }
  return value;
};

export const courseController = {
  list: async (_req: Request, res: Response) => {
    const courses = await courseService.list();
    return res.json(courses);
  },

  getById: async (req: Request, res: Response) => {
    const courseId = requiredParam(req.params.courseId, "COURSE_ID_REQUIRED");
    const course = await courseService.getById(courseId);
    if (!course) {
      throw appErrors.notFound("COURSE_NOT_FOUND", "Curso nao encontrado.");
    }
    return res.json(course);
  },

  upsert: async (req: Request, res: Response) => {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) {
      throw appErrors.validation("VALIDATION_ERROR", "Dados invalidos.");
    }

    const course = await courseService.upsert({
      ...parsed.data,
      pillar: parsed.data.pillar as PillarId | undefined,
    });
    return res.status(201).json(course);
  },

  uploadImages: async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) {
      throw appErrors.validation("IMAGE_REQUIRED", "Envie pelo menos uma imagem.");
    }

    try {
      const stored = await persistUploadedFiles(files);
      const courseId = requiredParam(req.params.courseId, "COURSE_ID_REQUIRED");
      const created = await courseService.addImages(courseId, stored);
      return res.status(201).json(created);
    } catch (err) {
      if (err instanceof ImageUploadError) {
        throw appErrors.validation(err.code, "Arquivo de imagem invalido.");
      }
      if ((err as Error).message === "COURSE_NOT_FOUND") {
        throw appErrors.notFound("COURSE_NOT_FOUND", "Curso nao encontrado.");
      }
      throw err;
    }
  },

  deleteImage: async (req: Request, res: Response) => {
    try {
      const courseId = requiredParam(req.params.courseId, "COURSE_ID_REQUIRED");
      const imageId = requiredParam(req.params.imageId, "IMAGE_ID_REQUIRED");
      await courseService.deleteImage(courseId, imageId);
      return res.status(204).send();
    } catch (error) {
      if ((error as Error).message === "IMAGE_NOT_FOUND") {
        throw appErrors.notFound("IMAGE_NOT_FOUND", "Imagem nao encontrada.");
      }
      throw error;
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const courseId = requiredParam(req.params.courseId, "COURSE_ID_REQUIRED");
      await courseService.deleteCourse(courseId);
      return res.status(204).send();
    } catch (error) {
      if ((error as Error).message === "COURSE_NOT_FOUND") {
        throw appErrors.notFound("COURSE_NOT_FOUND", "Curso nao encontrado.");
      }
      throw error;
    }
  },
};
