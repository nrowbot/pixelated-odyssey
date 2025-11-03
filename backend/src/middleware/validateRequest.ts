import { AnyZodObject } from "zod";
import { NextFunction, Request, Response } from "express";
import { HttpError } from "./errorHandler";

export function validateRequest(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      const formatted = result.error.flatten();
      throw new HttpError(400, "Validation failed", formatted);
    }

    const parsed = result.data as { body?: unknown; params?: unknown; query?: unknown };

    if (parsed.body !== undefined) {
      req.body = parsed.body as typeof req.body;
    }

    if (parsed.params !== undefined) {
      req.params = parsed.params as typeof req.params;
    }

    if (parsed.query !== undefined) {
      req.query = parsed.query as typeof req.query;
    }

    next();
  };
}
