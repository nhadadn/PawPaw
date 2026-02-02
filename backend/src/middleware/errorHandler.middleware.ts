import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import logger from '../lib/logger';
import { AppError, ValidationError, ConflictError, NotFoundError } from '../utils/errors';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let error = err;

  // 1. Transformar errores de librerías de terceros a AppError

  // Zod Validation Errors
  if (error instanceof ZodError) {
    const details = error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    error = new ValidationError('Validation failed', details);
  }

  // Prisma Errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint violation
    if (error.code === 'P2002') {
      const target = (error.meta?.target as string[]) || 'Field';
      error = new ConflictError(`${target} already exists`);
    }
    // P2025: Record not found
    else if (error.code === 'P2025') {
      error = new NotFoundError('Record');
    }
    // Add more Prisma codes as needed
  }

  // JSON Syntax Error
  else if (
    error instanceof SyntaxError &&
    'status' in error &&
    (error as { status: number }).status === 400 &&
    'body' in error
  ) {
    error = new ValidationError('Invalid JSON format');
  }

  // 2. Asegurar que sea una instancia de AppError
  if (!(error instanceof AppError)) {
    // Si es un error desconocido, lo tratamos como 500 Internal Server Error
    // En producción ocultamos el mensaje original por seguridad
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : error.message || 'Unknown Error';

    error = new AppError(message, 500, 'INTERNAL_SERVER_ERROR', false);
    // Preservar el stack original para debugging
    error.stack = err.stack;
  }

  const appError = error as AppError;

  // 3. Logging
  // Loggear con nivel adecuado: error para 500s, warn para 4xx
  const logContext = {
    code: appError.code,
    path: req.path,
    method: req.method,
    ip: req.ip,
    requestId: req.headers['x-request-id'] as string,
    // En producción, incluir stack solo si es error 500
    stack: appError.statusCode >= 500 ? appError.stack : undefined,
    details: appError.details,
  };

  if (appError.statusCode >= 500) {
    logger.error(appError.message, logContext);
  } else {
    logger.warn(appError.message, logContext);
  }

  // 4. Enviar Respuesta
  const response: Record<string, unknown> = {
    error: appError.code,
    message: appError.message,
  };

  // Agregar detalles solo si existen y no es producción (o si es validación que es segura)
  if (
    appError.details &&
    (process.env.NODE_ENV !== 'production' || appError instanceof ValidationError)
  ) {
    response.details = appError.details;
  }

  // Agregar stack trace solo en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    response.stack = appError.stack;
  }

  // Agregar requestId si existe
  if (req.headers['x-request-id']) {
    response.requestId = req.headers['x-request-id'];
  }

  res.status(appError.statusCode).json(response);
};
