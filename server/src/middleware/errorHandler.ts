import multer from "multer";
import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError, appErrors } from "../errors/AppError";
import { AuthFailure } from "../services/adminAuthService";
import { ImageUploadError } from "../services/imageUploadService";
import { AdminTokenError } from "../utils/token";
import { logger } from "../utils/logger";

const publicError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) return appErrors.validation("VALIDATION_ERROR", "Dados invalidos.");
  if (error instanceof AuthFailure) {
    if (error.statusCode === 429) {
      return new AppError("authentication", 429, error.code, "Muitas tentativas. Tente novamente mais tarde.");
    }
    return appErrors.authentication("INVALID_CREDENTIALS", "Credenciais invalidas.");
  }
  if (error instanceof AdminTokenError) {
    if (error.code === "expired") return appErrors.authentication("AUTHENTICATION_EXPIRED", "Sessao expirada.");
    return appErrors.authentication("AUTHENTICATION_INVALID", "Autenticacao invalida.");
  }
  if (error instanceof ImageUploadError) {
    return appErrors.validation(error.code, "Arquivo de imagem invalido.");
  }
  if (error instanceof multer.MulterError) {
    return appErrors.validation(error.code, error.code === "LIMIT_FILE_SIZE" ? "Arquivo muito grande." : "Upload rejeitado.");
  }
  if (error instanceof Error && error.message === "Not allowed by CORS") {
    return appErrors.authorization("ORIGIN_NOT_ALLOWED", "Origem nao permitida.");
  }
  if (error instanceof Error && error.message.endsWith("_NOT_FOUND")) {
    return appErrors.notFound();
  }
  return appErrors.internal();
};

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  void next;
  const mapped = publicError(error);
  const shouldLogError = mapped.kind === "internal" || mapped.statusCode >= 500;
  const logPayload = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    statusCode: mapped.statusCode,
    kind: mapped.kind,
    code: mapped.code,
    error,
  };

  if (shouldLogError) {
    logger.error("request.error", logPayload);
  } else {
    logger.warn("request.rejected", logPayload);
  }

  return res.status(mapped.statusCode).json({
    requestId: req.requestId,
    error: {
      code: mapped.code,
      type: mapped.kind,
      message: mapped.publicMessage,
    },
  });
};
