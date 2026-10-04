import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { env } from '../../config/env';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errorCode = 'SERVER_ERROR';
  let details = {};

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode;
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation Error';
    errorCode = 'VALIDATION_ERROR';
    details = err;
  } else if (err.name === 'ZodError') {
    // Zod validation error
    statusCode = 400;
    message = 'Invalid request data';
    errorCode = 'VALIDATION_ERROR';
    // @ts-ignore
    details = err.errors;
  } else {
    logger.error({ err }, 'Unhandled Error');
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    error: {
      code: errorCode,
      details: Object.keys(details).length > 0 ? details : undefined,
    },
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
