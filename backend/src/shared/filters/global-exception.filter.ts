import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseUtil } from '../utils/response.util';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';
    let errors: string[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || message;

        // Capturar erros de validação
        if (Array.isArray(responseObj.message)) {
          errors = responseObj.message;
          message = 'Erro de validação';
        }
      }
    } else if (exception instanceof Error) {
      // Tratamento específico para PayloadTooLargeError
      if (
        exception.message.includes('request entity too large') ||
        exception.name === 'PayloadTooLargeError'
      ) {
        status = HttpStatus.PAYLOAD_TOO_LARGE;
        message = 'Arquivo muito grande. O tamanho máximo permitido é 10MB.';
      } else {
        message = exception.message;
      }
      this.logger.error(`Erro não tratado: ${exception.message}`, exception.stack);
    }

    // Log do erro para debugging
    this.logger.error(`${request.method} ${request.url} - Status: ${status} - ${message}`);

    // Determinar o tipo de erro e retornar resposta padronizada
    let errorResponse;

    switch (status) {
      case HttpStatus.BAD_REQUEST:
        errorResponse = ResponseUtil.badRequest(message, errors, request.url);
        break;
      case HttpStatus.UNAUTHORIZED:
        errorResponse = ResponseUtil.unauthorized(message, request.url);
        break;
      case HttpStatus.FORBIDDEN:
        errorResponse = ResponseUtil.forbidden(message, request.url);
        break;
      case HttpStatus.NOT_FOUND:
        errorResponse = ResponseUtil.notFound(message, request.url);
        break;
      case HttpStatus.CONFLICT:
        errorResponse = ResponseUtil.conflict(message, request.url);
        break;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        errorResponse = ResponseUtil.validationError(message, errors, request.url);
        break;
      case HttpStatus.PAYLOAD_TOO_LARGE:
        errorResponse = ResponseUtil.error(message, status, ['Arquivo muito grande'], request.url);
        break;
      default:
        errorResponse = ResponseUtil.error(message, status, errors, request.url);
    }

    response.status(status).json(errorResponse);
  }
}
