import express from "express";
import courseRoutes from "./routes/courseRoutes";
import newsRoutes from "./routes/newsRoutes";
import leadRoutes from "./routes/leadRoutes";
import authRoutes from "./routes/authRoutes";
import imageRoutes from "./routes/imageRoutes";
import { reqLogger } from "./middleware/reqLogger";
import { env } from "./config/env";
import { corsMiddleware } from "./config/cors";
import { permissionsPolicyHeader, securityHeadersMiddleware } from "./config/securityHeaders";
import { requestIdMiddleware } from "./middleware/requestId";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

const app = express();
const port = env.PORT;

app.set("trust proxy", env.TRUST_PROXY_HOPS);
app.use(requestIdMiddleware);
app.use(securityHeadersMiddleware);
app.use((_req, res, next) => {
  res.setHeader("Permissions-Policy", permissionsPolicyHeader);
  next();
});
app.use(reqLogger);
app.use(express.json({ limit: "5mb" }));

app.use("/api/images", imageRoutes);
app.use("/api", corsMiddleware);
app.use("/api/courses", courseRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/auth", authRoutes);

app.use(errorHandler);

app.listen(port, () => {
  logger.info("server.started", { port });
});
