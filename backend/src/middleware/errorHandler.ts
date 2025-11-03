import { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  void next;
  const status = err instanceof HttpError ? err.status : 500;
  const message =
    err instanceof HttpError
      ? err.message
      : status === 500
      ? "Internal server error"
      : "Unexpected error";

  if (status >= 500) {
    console.error("Unhandled error:", err);
  }

  res.status(status).json({
    error: message,
    details: err instanceof HttpError ? err.details : undefined
  });
}
