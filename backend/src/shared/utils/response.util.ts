import { HttpStatus } from '@nestjs/common';
import { ApiResponse, PaginatedResponse } from '../interfaces/api-response.interface';

export class ResponseUtil {
  static success<T>(
    data: T,
    message: string = 'Operação realizada com sucesso',
    statusCode: number = HttpStatus.OK,
    path: string = ''
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      path,
      statusCode,
    };
  }

  static created<T>(
    data: T,
    message: string = 'Recurso criado com sucesso',
    path: string = ''
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      path,
      statusCode: HttpStatus.CREATED,
    };
  }

  static noContent(
    message: string = 'Operação realizada com sucesso',
    path: string = ''
  ): ApiResponse<null> {
    return {
      success: true,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      path,
      statusCode: HttpStatus.NO_CONTENT,
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Dados recuperados com sucesso',
    path: string = ''
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
      path,
      statusCode: HttpStatus.OK,
    };
  }

  static error(
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    errors: string[] = [],
    path: string = '',
    errorCode?: string
  ): ApiResponse<null> {
    return {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path,
      statusCode,
      data: null,
    };
  }

  static badRequest(
    message: string = 'Requisição inválida',
    errors: string[] = [],
    path: string = ''
  ): ApiResponse<null> {
    return this.error(message, HttpStatus.BAD_REQUEST, errors, path, 'BAD_REQUEST');
  }

  static unauthorized(
    message: string = 'Não autorizado',
    path: string = ''
  ): ApiResponse<null> {
    return this.error(message, HttpStatus.UNAUTHORIZED, [], path, 'UNAUTHORIZED');
  }

  static forbidden(
    message: string = 'Acesso negado',
    path: string = ''
  ): ApiResponse<null> {
    return this.error(message, HttpStatus.FORBIDDEN, [], path, 'FORBIDDEN');
  }

  static notFound(
    message: string = 'Recurso não encontrado',
    path: string = ''
  ): ApiResponse<null> {
    return this.error(message, HttpStatus.NOT_FOUND, [], path, 'NOT_FOUND');
  }

  static conflict(
    message: string = 'Conflito de dados',
    path: string = ''
  ): ApiResponse<null> {
    return this.error(message, HttpStatus.CONFLICT, [], path, 'CONFLICT');
  }

  static validationError(
    message: string = 'Erro de validação',
    errors: string[] = [],
    path: string = ''
  ): ApiResponse<null> {
    return this.error(message, HttpStatus.UNPROCESSABLE_ENTITY, errors, path, 'VALIDATION_ERROR');
  }
}
