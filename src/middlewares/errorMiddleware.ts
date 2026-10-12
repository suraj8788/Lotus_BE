import { NextFunction, Request, Response } from "express";

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
}

export const errorMiddleware = (
  error: HttpError,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void => {
  const statusCode = error.statusCode ?? error.status ?? 500;
  const message = statusCode >= 500
    ? "Internal server error"
    : statusCode === 413
      ? "Request is too large. Profile pictures must not exceed 3 MB"
      : error.message;

  if (statusCode >= 500) {
    console.error(error);
  }

  response.status(statusCode).json({
    success: false,
    message,
  });
};
