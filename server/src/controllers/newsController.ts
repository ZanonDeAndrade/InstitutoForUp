import { Request, Response } from "express";
import { z } from "zod";
import { uploadNewsImage } from "../config/storage";
import { ImageUploadError } from "../services/imageUploadService";
import { newsService } from "../services/newsService";
import { appErrors } from "../errors/AppError";

const optionalText = z
  .string()
  .optional()
  .transform((val) => (val && val.trim().length ? val.trim() : undefined));

const baseSchema = z.object({
  title: z.string().min(1, "Titulo e obrigatorio"),
  subtitle: z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length ? val : undefined)),
  content: z.string().min(1, "Conteudo e obrigatorio"),
  slug: z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length ? val.trim() : undefined)),
  imageUrl: optionalText,
});

const handleUploadError = (error: unknown) => {
  if (error instanceof ImageUploadError) {
    throw appErrors.validation(error.code, "Arquivo de imagem invalido.");
  }
};

const requiredParam = (value: string | undefined, code: string) => {
  if (!value) {
    throw appErrors.validation(code, "Parametro de rota invalido.");
  }
  return value;
};

export const newsController = {
  list: async (req: Request, res: Response) => {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;

    const result = await newsService.list({ page, pageSize, includeDrafts: false });
    return res.json(result);
  },

  adminList: async (req: Request, res: Response) => {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;

    const result = await newsService.list({ page, pageSize, includeDrafts: true });
    return res.json(result);
  },

  getBySlug: async (req: Request, res: Response) => {
    const slug = requiredParam(req.params.slug, "NEWS_SLUG_REQUIRED");
    const news = await newsService.getBySlug(slug, false);
    if (!news) {
      throw appErrors.notFound("NEWS_NOT_FOUND", "Noticia nao encontrada.");
    }
    return res.json(news);
  },

  adminGetBySlug: async (req: Request, res: Response) => {
    const slug = requiredParam(req.params.slug, "NEWS_SLUG_REQUIRED");
    const news = await newsService.getBySlug(slug, true);
    if (!news) {
      throw appErrors.notFound("NEWS_NOT_FOUND", "Noticia nao encontrada.");
    }
    return res.json(news);
  },

  create: async (req: Request, res: Response) => {
    const parsed = baseSchema.safeParse(req.body);
    if (!parsed.success) {
      throw appErrors.validation("VALIDATION_ERROR", "Dados invalidos.");
    }

    const file = req.file as Express.Multer.File | undefined;

    try {
      const stored = file ? await uploadNewsImage(file) : null;
      const created = await newsService.create(parsed.data, stored);
      return res.status(201).json(created);
    } catch (error) {
      handleUploadError(error);
      throw error;
    }
  },

  update: async (req: Request, res: Response) => {
    const parsed = baseSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      throw appErrors.validation("VALIDATION_ERROR", "Dados invalidos.");
    }

    const file = req.file as Express.Multer.File | undefined;

    try {
      const stored = file ? await uploadNewsImage(file) : null;
      const id = requiredParam(req.params.id, "NEWS_ID_REQUIRED");
      const updated = await newsService.update(id, parsed.data, stored);
      if (!updated) {
        throw appErrors.notFound("NEWS_NOT_FOUND", "Noticia nao encontrada.");
      }
      return res.json(updated);
    } catch (error) {
      handleUploadError(error);
      throw error;
    }
  },

  delete: async (req: Request, res: Response) => {
    const id = requiredParam(req.params.id, "NEWS_ID_REQUIRED");
    const deleted = await newsService.delete(id);
    if (!deleted) {
      throw appErrors.notFound("NEWS_NOT_FOUND", "Noticia nao encontrada.");
    }
    return res.status(204).send();
  },
};
