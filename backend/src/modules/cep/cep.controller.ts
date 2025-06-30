import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { CepService } from './cep.service';

@Controller('cep')
export class CepController {
  constructor(private readonly cepService: CepService) {}

  @Get(':cep')
  async buscarCep(@Param('cep') cep: string, @Res() res: Response) {
    const result = await this.cepService.buscarCep(cep);
    if (!result) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'CEP não encontrado ou inválido.' });
    }
    return res.status(HttpStatus.OK).json(result);
  }
}
