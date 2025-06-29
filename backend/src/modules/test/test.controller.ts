import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PremiumAccessService } from '../../shared/services/premium-access.service';

@ApiTags('test')
@Controller('test')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TestController {
  constructor(private premiumAccessService: PremiumAccessService) {}

  @Get('meu-acesso')
  @ApiOperation({ summary: 'Testar meu acesso premium atual' })
  async testarMeuAcesso(@Request() req: any) {
    const userId = req.user.userId;
    const acessos = await this.premiumAccessService.listarAcessosUsuario(userId);

    return {
      userId,
      acessos,
      resumo: {
        temAssinaturaPremium: acessos.assinaturaPremium,
        dataVencimento: acessos.dataVencimentoPremium,
        acessoNacional: acessos.temAcessoNacional,
        estadosLiberados: acessos.estadosAcessiveis,
        cidadesLiberadas: acessos.cidadesAcessiveis,
        custos: acessos.custos,
      },
    };
  }

  @Get('dar-premium')
  @ApiOperation({ summary: 'TESTE: Dar 1 ano de premium grátis' })
  async darPremiumTeste(@Request() req: any) {
    const userId = req.user.userId;

    // Dar 1 ano de premium
    const resultado = await this.premiumAccessService.comprarAssinaturaPremium(userId, 12);

    return {
      message: 'Premium de 1 ano adicionado!',
      resultado,
    };
  }
}
