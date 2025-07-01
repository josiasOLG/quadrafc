import { Body, Controller, Get, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CepService } from './cep.service';

@ApiTags('CEP')
@Controller('cep')
export class CepController {
  constructor(private readonly cepService: CepService) {}

  @Get(':cep')
  @ApiOperation({ summary: 'Buscar informações de um CEP' })
  @ApiResponse({ status: 200, description: 'Informações do CEP encontradas.' })
  @ApiResponse({ status: 404, description: 'CEP não encontrado.' })
  async buscarCep(@Param('cep') cep: string, @Res() res: Response) {
    const result = await this.cepService.buscarCep(cep);
    if (!result) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'CEP não encontrado ou inválido.' });
    }
    return res.status(HttpStatus.OK).json(result);
  }

  @Get('bairros/:cidade/:estado')
  @ApiOperation({ summary: 'Buscar bairros de uma cidade' })
  @ApiResponse({ status: 200, description: 'Lista de bairros da cidade.' })
  async buscarBairrosPorCidade(
    @Param('cidade') cidade: string,
    @Param('estado') estado: string,
    @Res() res: Response,
    @Query('limite') limite?: number
  ) {
    const bairros = await this.cepService.buscarBairrosPorCidade(
      cidade,
      estado,
      limite ? parseInt(limite.toString()) : 20
    );
    return res.status(HttpStatus.OK).json(bairros);
  }

  @Post('validar-bairro')
  @ApiOperation({ summary: 'Validar se um novo bairro pode ser criado' })
  @ApiResponse({ status: 200, description: 'Resultado da validação.' })
  async validarNovoBairro(
    @Body() body: { nome: string; cidade: string; estado: string },
    @Res() res: Response
  ) {
    const resultado = await this.cepService.validarNovoBairro(body.nome, body.cidade, body.estado);
    return res.status(HttpStatus.OK).json(resultado);
  }
}
