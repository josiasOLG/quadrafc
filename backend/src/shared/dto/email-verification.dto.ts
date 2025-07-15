import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class EnviarCodigoEmailDto {
  @ApiProperty({ example: 'joao@email.com', description: 'Email do usuário' })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;
}

export class VerificarCodigoEmailDto {
  @ApiProperty({ example: 'joao@email.com', description: 'Email do usuário' })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Código de verificação de 6 dígitos' })
  @IsString({ message: 'Código deve ser uma string' })
  @IsNotEmpty({ message: 'Código é obrigatório' })
  @Length(6, 6, { message: 'Código deve ter exatamente 6 dígitos' })
  codigo: string;
}
