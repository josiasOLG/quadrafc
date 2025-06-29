import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(protected reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }
    
    return super.canActivate(context);
  }

  getRequest(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // Extrair JWT do cookie httpOnly em vez do header Authorization
    if (request.cookies && request.cookies.token) {
      request.headers.authorization = `Bearer ${request.cookies.token}`;
    }
    
    return request;
  }
}
