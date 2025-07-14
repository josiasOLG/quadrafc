import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateLimitePalpitesDto {
  @ApiProperty({
    description: 'Novo limite diário de palpites para o usuário',
    minimum: 1,
    maximum: 50,
    example: 10,
  })
  @IsNumber({}, { message: 'O limite deve ser um número' })
  @Min(1, { message: 'O limite deve ser pelo menos 1' })
  @Max(50, { message: 'O limite não pode ser maior que 50' })
  novoLimite: number;
}
