"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsController = void 0;
const zod_1 = require("zod");
const storage_1 = require("../config/storage");
const newsService_1 = require("../services/newsService");
const optionalText = zod_1.z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length ? val.trim() : undefined));
const baseSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Título é obrigatório"),
    subtitle: zod_1.z
        .string()
        .optional()
        .transform((val) => (val && val.trim().length ? val : undefined)),
    content: zod_1.z.string().min(1, "Conteúdo é obrigatório"),
    slug: zod_1.z
        .string()
        .optional()
        .transform((val) => (val && val.trim().length ? val.trim() : undefined)),
    imageUrl: optionalText,
});
exports.newsController = {
    list: async (req, res) => {
        const page = req.query.page ? Number(req.query.page) : undefined;
        const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;
        const result = await newsService_1.newsService.list({ page, pageSize });
        return res.json(result);
    },
    getBySlug: async (req, res) => {
        const news = await newsService_1.newsService.getBySlug(req.params.slug);
        if (!news) {
            return res.status(404).json({ message: "Notícia não encontrada" });
        }
        return res.json(news);
    },
    create: async (req, res) => {
        const parsed = baseSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Dados inválidos", issues: parsed.error.flatten() });
        }
        const file = req.file;
        if (file) {
            if (file.size > storage_1.MAX_FILE_SIZE_BYTES || !storage_1.NEWS_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                return res
                    .status(400)
                    .json({ message: "Envie uma imagem PNG/JPG de até 2MB", file: file.originalname });
            }
        }
        try {
            const stored = file ? await (0, storage_1.uploadNewsImage)(file) : null;
            const created = await newsService_1.newsService.create(parsed.data, stored);
            return res.status(201).json(created);
        }
        catch (error) {
            console.error("[news] create error", error);
            return res.status(500).json({ message: "Erro ao criar notícia" });
        }
    },
    update: async (req, res) => {
        const parsed = baseSchema.partial().safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Dados inválidos", issues: parsed.error.flatten() });
        }
        const file = req.file;
        if (file) {
            if (file.size > storage_1.MAX_FILE_SIZE_BYTES || !storage_1.NEWS_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                return res
                    .status(400)
                    .json({ message: "Envie uma imagem PNG/JPG de até 2MB", file: file.originalname });
            }
        }
        try {
            const stored = file ? await (0, storage_1.uploadNewsImage)(file) : null;
            const updated = await newsService_1.newsService.update(req.params.id, parsed.data, stored);
            if (!updated) {
                return res.status(404).json({ message: "Notícia não encontrada" });
            }
            return res.json(updated);
        }
        catch (error) {
            console.error("[news] update error", error);
            return res.status(500).json({ message: "Erro ao atualizar notícia" });
        }
    },
    delete: async (req, res) => {
        try {
            const deleted = await newsService_1.newsService.delete(req.params.id);
            if (!deleted) {
                return res.status(404).json({ message: "Notícia não encontrada" });
            }
            return res.status(204).send();
        }
        catch (error) {
            console.error("[news] delete error", error);
            return res.status(500).json({ message: "Erro ao excluir notícia" });
        }
    },
};
