import { Request, Response } from "express";
import { z } from "zod";
import { NEWS_ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, uploadNewsImage } from "../config/storage";
import { newsService } from "../services/newsService";

const optionalText = z
  .string()
  .optional()
  .transform((val) => (val && val.trim().length ? val.trim() : undefined));

const baseSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  subtitle: z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length ? val : undefined)),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  slug: z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length ? val.trim() : undefined)),
  imageUrl: optionalText,
});

export const newsController = {
  list: async (req: Request, res: Response) => {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;

    const result = await newsService.list({ page, pageSize });
    return res.json(result);
  },

  getBySlug: async (req: Request, res: Response) => {
    const news = await newsService.getBySlug(req.params.slug);
    if (!news) {
      return res.status(404).json({ message: "Notícia não encontrada" });
    }
    return res.json(news);
  },

  create: async (req: Request, res: Response) => {
    const parsed = baseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Dados inválidos", issues: parsed.error.flatten() });
    }

    const file = req.file as Express.Multer.File | undefined;

    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES || !NEWS_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return res
          .status(400)
          .json({ message: "Envie uma imagem PNG/JPG de até 2MB", file: file.originalname });
      }
    }

    try {
      const stored = file ? await uploadNewsImage(file) : null;
      const created = await newsService.create(parsed.data, stored);
      return res.status(201).json(created);
    } catch (error) {
      console.error("[news] create error", error);
      return res.status(500).json({ message: "Erro ao criar notícia" });
    }
  },

  update: async (req: Request, res: Response) => {
    const parsed = baseSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Dados inválidos", issues: parsed.error.flatten() });
    }

    const file = req.file as Express.Multer.File | undefined;

    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES || !NEWS_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return res
          .status(400)
          .json({ message: "Envie uma imagem PNG/JPG de até 2MB", file: file.originalname });
      }
    }

    try {
      const stored = file ? await uploadNewsImage(file) : null;
      const updated = await newsService.update(req.params.id, parsed.data, stored);
      if (!updated) {
        return res.status(404).json({ message: "Notícia não encontrada" });
      }
      return res.json(updated);
    } catch (error) {
      console.error("[news] update error", error);
      return res.status(500).json({ message: "Erro ao atualizar notícia" });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const deleted = await newsService.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Notícia não encontrada" });
      }
      return res.status(204).send();
    } catch (error) {
      console.error("[news] delete error", error);
      return res.status(500).json({ message: "Erro ao excluir notícia" });
    }
  },
};
