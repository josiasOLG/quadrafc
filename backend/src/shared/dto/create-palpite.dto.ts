import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreatePalpiteDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'ID do jogo' })
  @IsNotEmpty({ message: 'ID do jogo é obrigatório' })
  jogoId: string;

  @ApiProperty({ example: 2, description: 'Palpite para o time A' })
  @IsNotEmpty({ message: 'Palpite para o time A é obrigatório' })
  @IsNumber({}, { message: 'Palpite deve ser um número' })
  @Min(0, { message: 'Palpite deve ser maior ou igual a 0' })
  timeA: number;

  @ApiProperty({ example: 1, description: 'Palpite para o time B' })
  @IsNotEmpty({ message: 'Palpite para o time B é obrigatório' })
  @IsNumber({}, { message: 'Palpite deve ser um número' })
  @Min(0, { message: 'Palpite deve ser maior ou igual a 0' })
  timeB: number;
}
