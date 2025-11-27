"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_path_1 = __importDefault(require("node:path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const courseRoutes_1 = __importDefault(require("./routes/courseRoutes"));
const newsRoutes_1 = __importDefault(require("./routes/newsRoutes"));
const leadRoutes_1 = __importDefault(require("./routes/leadRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const reqLogger_1 = require("./middleware/reqLogger");
const storage_1 = require("./config/storage");
const app = (0, express_1.default)();
const port = process.env.PORT || 4010;
const isProd = process.env.NODE_ENV === "production";
// Recupera a lista de origens permitidas a partir das variáveis de ambiente
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
// Configurações CORS
app.use((0, cors_1.default)(isProd && allowedOrigins.length
    ? {
        origin: (origin, callback) => {
            // Permite apenas as origens configuradas em produção
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
    }
    : {
        // Em desenvolvimento, libera tudo para facilitar testes locais
        origin: true,
        credentials: true,
    }));
app.use(reqLogger_1.reqLogger);
app.use(express_1.default.json({ limit: "5mb" }));
const uploadsDir = process.env.UPLOADS_DIR ?? "uploads";
app.use("/uploads", express_1.default.static(node_path_1.default.join(process.cwd(), uploadsDir)));
// Proxy de imagens do storage para evitar bloqueios externos
app.get("/api/images/:storageKey(*)", async (req, res) => {
    try {
        const { storageKey } = req.params;
        const { buffer, contentType } = await (0, storage_1.downloadFromStorage)(storageKey);
        res.setHeader("Content-Type", contentType);
        res.send(buffer);
    }
    catch (error) {
        console.error("[image-proxy] error", error);
        return res.status(404).send();
    }
});
app.use("/api/courses", courseRoutes_1.default);
app.use("/api/news", newsRoutes_1.default);
app.use("/api/leads", leadRoutes_1.default);
app.use("/api/auth", authRoutes_1.default);
// Tratamento de erro geral
app.use((error, _req, res, _next) => {
    console.error("Internal error:", error);
    return res.status(500).json({ message: "Erro interno", details: error.message });
});
// Inicialização do servidor
app.listen(port, () => {
    console.log(`FORUP API running on port ${port}`);
});
