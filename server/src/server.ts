import "dotenv/config";
import path from "node:path";
import express from "express";
import cors from "cors";
import courseRoutes from "./routes/courseRoutes";
import newsRoutes from "./routes/newsRoutes";
import { reqLogger } from "./middleware/reqLogger";
import { downloadFromStorage } from "./config/storage";

const app = express();
const port = process.env.PORT || 4010;

const isProd = process.env.NODE_ENV === "production";

// Recupera a lista de origens permitidas a partir das variáveis de ambiente
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Configurações CORS
app.use(
  cors(
    isProd && allowedOrigins.length
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
        },
  ),
);

app.use(reqLogger);
app.use(express.json({ limit: "5mb" }));

const uploadsDir = process.env.UPLOADS_DIR ?? "uploads";
app.use("/uploads", express.static(path.join(process.cwd(), uploadsDir)));

// Proxy de imagens do storage para evitar bloqueios externos
app.get("/api/images/:storageKey(*)", async (req, res) => {
  try {
    const { storageKey } = req.params;
    const { buffer, contentType } = await downloadFromStorage(storageKey);
    res.setHeader("Content-Type", contentType);
    res.send(buffer);
  } catch (error) {
    console.error("[image-proxy] error", error);
    return res.status(404).send();
  }
});

app.use("/api/courses", courseRoutes);
app.use("/api/news", newsRoutes);

// Tratamento de erro geral
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Internal error:", error);
  return res.status(500).json({ message: "Erro interno", details: error.message });
});

// Inicialização do servidor
app.listen(port, () => {
  console.log(`ForUp API running on port ${port}`);
});
