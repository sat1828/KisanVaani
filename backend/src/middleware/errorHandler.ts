import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  // Always log 5xx (unexpected/unoperational) errors, in every
  // environment — previously this only logged in development, which
  // means production errors were invisible unless someone happened to be
  // tailing stdout at the exact moment. 4xx client errors are logged at
  // debug level since they're expected/noisy (bad input, etc).
  if (statusCode >= 500) {
    logger.error('Unhandled request error', { message: err.message, stack: err.stack, statusCode, path: req.path, method: req.method });
  } else {
    logger.debug('Request error', { message, statusCode, code, path: req.path });
  }

  res.status(statusCode).json({
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
