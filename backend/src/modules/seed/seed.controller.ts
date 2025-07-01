import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeedService } from '../../database/seed.service';

@ApiTags('seed')
@Controller('api/seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('executar')
  @ApiOperation({ summary: 'Executar seed manualmente' })
  async executarSeed() {
    await this.seedService.executarSeedManual();
    return { message: 'Seed executado com sucesso!' };
  }

  @Post('limpar-e-executar')
  @ApiOperation({ summary: 'Limpar dados e executar seed' })
  async limparEExecutarSeed() {
    await this.seedService.limparEExecutarSeed();
    return { message: 'Dados limpos e seed executado com sucesso!' };
  }
}
