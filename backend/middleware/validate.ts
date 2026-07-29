import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validate(mobileSchema: ZodSchema, webSchema?: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Validating request body:", req.body);

      const schema =
        req.query.platform === "WEB" && webSchema ? webSchema : mobileSchema;

      req.body = schema.parse(req.body);

      console.log("Validation successful:", req.body);
      next();
    } catch (err) {
      console.log("Validation failed:", err);

      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          issues: err.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      return res.status(400).json({
        success: false,
        error: "Invalid request",
      });
    }
  };
}

export function validateBody(schema: ZodSchema) {
  return validate(schema);
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          issues: err.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      return res.status(400).json({
        success: false,
        error: "Invalid query parameters",
      });
    }
  };
}
