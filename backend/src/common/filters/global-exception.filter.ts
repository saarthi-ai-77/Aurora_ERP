import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '@shared/contracts/api.contracts';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (typeof errorResponse === 'object' && errorResponse !== null) {
      message = (errorResponse as any).message || (errorResponse as any).error || message;
      code = (errorResponse as any).error || code;
    } else if (typeof errorResponse === 'string') {
      message = errorResponse;
    }

    const payload: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
      },
    };

    if (response.headersSent) {
      return;
    }

    response.status(status).json(payload);
  }
}
