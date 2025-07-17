import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class PaginacaoJogosDto {
  @ApiPropertyOptional({
    description: 'Página atual (inicia em 1)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Número de jogos por campeonato por página',
    example: 10,
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'ID do campeonato específico para paginação',
    example: 'brasileirao-serie-a-2024',
  })
  @IsOptional()
  campeonato?: string;

  @ApiPropertyOptional({
    description: 'Data inicial para busca (formato YYYY-MM-DD)',
    example: '2024-01-01',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Data inicial deve estar no formato YYYY-MM-DD',
  })
  dataInicial?: string;
}
