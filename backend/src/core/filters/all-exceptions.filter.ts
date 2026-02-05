/**
 * Global Exception Filter
 * Handles all exceptions and formats error responses
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: Record<string, unknown>;
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ErrorResponse;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // If already formatted error response
      if (
        typeof exceptionResponse === 'object' &&
        'error' in (exceptionResponse as object)
      ) {
        errorResponse = exceptionResponse as ErrorResponse;
      } else {
        // Format the error response
        const message =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as { message?: string | string[] }).message;

        errorResponse = {
          success: false,
          error: {
            code: this.getErrorCode(status),
            message: Array.isArray(message) ? message.join(', ') : (message || 'An error occurred'),
            statusCode: status,
          },
        };

        // Add validation details if present
        if (
          typeof exceptionResponse === 'object' &&
          'message' in (exceptionResponse as object) &&
          Array.isArray((exceptionResponse as { message: unknown }).message)
        ) {
          errorResponse.error.details = {
            validation: (exceptionResponse as { message: string[] }).message,
          };
        }
      }
    } else if (exception instanceof Error) {
      // Handle generic errors
      errorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message:
            process.env.NODE_ENV === 'production'
              ? 'Internal server error'
              : exception.message,
          statusCode: status,
        },
      };

      // Log the full error in non-production
      this.logger.error(
        `${request.method} ${request.url}`,
        exception.stack,
        'ExceptionFilter',
      );
    } else {
      // Unknown error type
      errorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          statusCode: status,
        },
      };
    }

    // Log error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${errorResponse.error.message}`,
      undefined,
      'ExceptionFilter',
    );

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    const statusCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };

    return statusCodes[status] || 'INTERNAL_ERROR';
  }
}
