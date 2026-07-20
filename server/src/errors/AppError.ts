export type AppErrorKind = "validation" | "authentication" | "authorization" | "not_found" | "conflict" | "internal";

export class AppError extends Error {
  constructor(
    public readonly kind: AppErrorKind,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly publicMessage: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
  }
}

export const appErrors = {
  validation: (code = "VALIDATION_ERROR", publicMessage = "Dados invalidos.", context?: Record<string, unknown>) =>
    new AppError("validation", 400, code, publicMessage, context),
  authentication: (code = "AUTHENTICATION_REQUIRED", publicMessage = "Autenticacao necessaria.") =>
    new AppError("authentication", 401, code, publicMessage),
  authorization: (code = "FORBIDDEN", publicMessage = "Acesso negado.") =>
    new AppError("authorization", 403, code, publicMessage),
  notFound: (code = "NOT_FOUND", publicMessage = "Recurso nao encontrado.") =>
    new AppError("not_found", 404, code, publicMessage),
  conflict: (code = "CONFLICT", publicMessage = "Conflito ao processar a solicitacao.") =>
    new AppError("conflict", 409, code, publicMessage),
  internal: (code = "INTERNAL_ERROR", publicMessage = "Erro interno ao processar a solicitacao.") =>
    new AppError("internal", 500, code, publicMessage),
};
