import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class EntrarEmBairroDto {
  @ApiProperty({ description: 'Código único do usuário para copiar dados de localização' })
  @IsNotEmpty({ message: 'Código é obrigatório' })
  @IsString({ message: 'Código deve ser uma string' })
  codigo: string;
}
