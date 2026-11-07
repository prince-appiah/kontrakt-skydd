import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { DomainError, FileTooLargeError } from '@/domain/errors';

interface ErrorBody {
  readonly code: string;
  readonly message: string;
}

const STATUS_BY_CODE: Readonly<Record<string, number>> = {
  INVALID_REQUEST: 400,
  FILE_TOO_LARGE: 413,
  DOCUMENT_TOO_LONG: 413,
  UNSUPPORTED_FILE_TYPE: 415,
  DOCUMENT_PARSE_FAILED: 422,
  LLM_OUTPUT_INVALID: 502,
  LLM_REQUEST_FAILED: 502,
};

function describe(exception: unknown): { status: number; body: ErrorBody } {
  if (exception instanceof DomainError) {
    return {
      status: STATUS_BY_CODE[exception.code] ?? 500,
      body: { code: exception.code, message: exception.message },
    };
  }
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    if (status === 413) {
      const error = new FileTooLargeError();
      return { status, body: { code: error.code, message: error.message } };
    }
    if (status === 429) {
      return {
        status,
        body: {
          code: 'RATE_LIMITED',
          message: 'Too many requests, try again later',
        },
      };
    }
    if (status === 404) {
      return { status, body: { code: 'NOT_FOUND', message: 'Not found' } };
    }
    if (status < 500) {
      return {
        status,
        body: { code: 'INVALID_REQUEST', message: 'The request is not valid' },
      };
    }
  }
  return {
    status: 500,
    body: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body } = describe(exception);
    this.logger.warn(
      {
        code: body.code,
        status,
        ...(body.code === 'INTERNAL_ERROR' && {
          errorName:
            exception instanceof Error ? exception.name : typeof exception,
        }),
      },
      'request failed',
    );
    if (response.headersSent) {
      response.end();
      return;
    }
    response.status(status).json(body);
  }
}
