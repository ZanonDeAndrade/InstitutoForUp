"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseController = void 0;
const zod_1 = require("zod");
const courseService_1 = require("../services/courseService");
const storage_1 = require("../config/storage");
const pillars_1 = require("../constants/pillars");
const upsertSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, "id é obrigatório"),
    name: zod_1.z.string().min(1, "Nome é obrigatório"),
    description: zod_1.z.string().max(800).optional(),
    fields: zod_1.z.any().optional(),
    pillar: zod_1.z
        .string()
        .optional()
        .refine((value) => value === undefined || pillars_1.PILLAR_IDS.includes(value), "Pilar inválido"),
});
exports.courseController = {
    list: async (_req, res) => {
        const courses = await courseService_1.courseService.list();
        return res.json(courses);
    },
    getById: async (req, res) => {
        const course = await courseService_1.courseService.getById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ message: "Curso não encontrado" });
        }
        return res.json(course);
    }, //adwasd
    upsert: async (req, res) => {
        const parsed = upsertSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Dados inválidos", issues: parsed.error.flatten() });
        }
        const course = await courseService_1.courseService.upsert({
            ...parsed.data,
            pillar: parsed.data.pillar,
        });
        return res.status(201).json(course);
    },
    uploadImages: async (req, res) => {
        const files = req.files || [];
        console.log("[ctrl] uploadImages", {
            courseId: req.params.courseId,
            files: files.map((f) => ({ name: f.originalname, size: f.size, type: f.mimetype })),
        });
        if (!files.length) {
            return res.status(400).json({ message: "Envie pelo menos uma imagem." });
        }
        const invalid = files.find((file) => file.size > storage_1.MAX_FILE_SIZE_BYTES || !storage_1.ALLOWED_MIME_TYPES.includes(file.mimetype));
        if (invalid) {
            return res
                .status(400)
                .json({ message: "Apenas PNG/JPG/WebP até 2MB são permitidos.", file: invalid.originalname });
        }
        try {
            const stored = await (0, storage_1.persistUploadedFiles)(files);
            const created = await courseService_1.courseService.addImages(req.params.courseId, stored);
            console.log("[ctrl] uploadImages stored", created);
            return res.status(201).json(created);
        }
        catch (err) {
            console.error("[ctrl] uploadImages error", err);
            return res.status(500).json({ message: "Erro ao salvar imagens", error: err.message });
        }
    },
    deleteImage: async (req, res) => {
        try {
            await courseService_1.courseService.deleteImage(req.params.courseId, req.params.imageId);
            return res.status(204).send();
        }
        catch (error) {
            if (error.message === "IMAGE_NOT_FOUND") {
                return res.status(404).json({ message: "Imagem não encontrada" });
            }
            throw error;
        }
    },
    delete: async (req, res) => {
        try {
            await courseService_1.courseService.deleteCourse(req.params.courseId);
            return res.status(204).send();
        }
        catch (error) {
            if (error.message === "COURSE_NOT_FOUND") {
                return res.status(404).json({ message: "Curso não encontrado" });
            }
            console.error("[ctrl] delete course error", error);
            return res.status(500).json({ message: "Erro ao excluir curso" });
        }
    },
};
