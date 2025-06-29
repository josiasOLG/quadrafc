import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Max, Min } from 'class-validator';

export class PaginationDto {
  @ApiProperty({ 
    description: 'Número da página', 
    minimum: 1, 
    default: 1,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive({ message: 'Página deve ser um número positivo' })
  @Min(1, { message: 'Página deve ser no mínimo 1' })
  page?: number = 1;

  @ApiProperty({ 
    description: 'Número de itens por página', 
    minimum: 1, 
    maximum: 100, 
    default: 10,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive({ message: 'Limite deve ser um número positivo' })
  @Min(1, { message: 'Limite deve ser no mínimo 1' })
  @Max(100, { message: 'Limite deve ser no máximo 100' })
  limit?: number = 10;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
