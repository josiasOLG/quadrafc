import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ResponseUtil } from '../utils/response.util';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        
        // Se a resposta já está no formato padronizado, retorna como está
        if (data && typeof data === 'object' && 'success' in data && 'timestamp' in data) {
          return data;
        }

        // Pegar mensagem customizada dos metadados
        const customMessage = this.reflector.get<string>('response-message', context.getHandler());
        
        const statusCode = response.statusCode;
        const path = request.url;

        // Determinar a mensagem baseada no status code
        let message = customMessage;
        if (!message) {
          switch (statusCode) {
            case 201:
              message = 'Recurso criado com sucesso';
              break;
            case 204:
              message = 'Operação realizada com sucesso';
              break;
            default:
              message = 'Operação realizada com sucesso';
          }
        }

        // Retornar resposta padronizada
        if (statusCode === 201) {
          return ResponseUtil.created(data, message, path);
        } else if (statusCode === 204) {
          return ResponseUtil.noContent(message, path);
        } else {
          return ResponseUtil.success(data, message, statusCode, path);
        }
      }),
    );
  }
}
