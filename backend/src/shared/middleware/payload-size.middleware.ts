import { Injectable, NestMiddleware } from '@nestjs/common';
import * as express from 'express';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class PayloadSizeMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Aplicar limite maior apenas para rotas de upload de perfil
    if (req.url.includes('/users/profile')) {
      express.json({ limit: '10mb' })(req, res, next);
    } else {
      next();
    }
  }
}
