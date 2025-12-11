import { Request, Response } from "express";
import { z } from "zod";
import { courseService } from "../services/courseService";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, persistUploadedFiles } from "../config/storage";
import { PILLAR_IDS, PillarId } from "../constants/pillars";

const upsertSchema = z.object({
  id: z.string().min(1, "id é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().max(800).optional(),
  fields: z.any().optional(),
  pillar: z
    .string()
    .optional()
    .refine(
      (value) => value === undefined || PILLAR_IDS.includes(value as PillarId),
      "Pilar inválido",
    ),
});

export const courseController = {
  list: async (_req: Request, res: Response) => {
    const courses = await courseService.list();
    return res.json(courses);
  },

  getById: async (req: Request, res: Response) => {
    const course = await courseService.getById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }
    return res.json(course);
  }, //adwasd

  upsert: async (req: Request, res: Response) => {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Dados inválidos", issues: parsed.error.flatten() });
    }

    const course = await courseService.upsert({
      ...parsed.data,
      pillar: parsed.data.pillar as PillarId | undefined,
    });
    return res.status(201).json(course);
  },

  uploadImages: async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    console.log("[ctrl] uploadImages", {
      courseId: req.params.courseId,
      files: files.map((f) => ({ name: f.originalname, size: f.size, type: f.mimetype })),
    });
    if (!files.length) {
      return res.status(400).json({ message: "Envie pelo menos uma imagem." });
    }

    const invalid = files.find(
      (file) => file.size > MAX_FILE_SIZE_BYTES || !ALLOWED_MIME_TYPES.includes(file.mimetype),
    );
    if (invalid) {
      return res
        .status(400)
        .json({ message: "Apenas PNG/JPG/WebP até 2MB são permitidos.", file: invalid.originalname });
    }

    try {
      const stored = await persistUploadedFiles(files);
      const created = await courseService.addImages(req.params.courseId, stored);
      console.log("[ctrl] uploadImages stored", created);
      return res.status(201).json(created);
    } catch (err) {
      console.error("[ctrl] uploadImages error", err);
      return res.status(500).json({ message: "Erro ao salvar imagens", error: (err as Error).message });
    }
  },

  deleteImage: async (req: Request, res: Response) => {
    try {
      await courseService.deleteImage(req.params.courseId, req.params.imageId);
      return res.status(204).send();
    } catch (error) {
      if ((error as Error).message === "IMAGE_NOT_FOUND") {
        return res.status(404).json({ message: "Imagem não encontrada" });
      }
      throw error;
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await courseService.deleteCourse(req.params.courseId);
      return res.status(204).send();
    } catch (error) {
      if ((error as Error).message === "COURSE_NOT_FOUND") {
        return res.status(404).json({ message: "Curso não encontrado" });
      }
      console.error("[ctrl] delete course error", error);
      return res.status(500).json({ message: "Erro ao excluir curso" });
    }
  },
};
