import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, IsString, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'João Silva', description: 'Nome completo do usuário' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString({ message: 'Nome deve ser uma string' })
  nome: string; // Mudado de 'name' para 'nome'

  @ApiProperty({ example: 'joao@email.com', description: 'Email do usuário' })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Senha do usuário', minLength: 6 })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;

  // Campos opcionais - serão preenchidos no onboarding
  @ApiProperty({ example: 'São Paulo', description: 'Cidade do usuário', required: false })
  @IsOptional()
  @IsString({ message: 'Cidade deve ser uma string' })
  cidade?: string;

  @ApiProperty({ example: 'SP', description: 'Estado do usuário', required: false })
  @IsOptional()
  @IsString({ message: 'Estado deve ser uma string' })
  estado?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'ID do bairro', required: false })
  @IsOptional()
  @IsString({ message: 'ID do bairro deve ser uma string' })
  bairroId?: string;

  @ApiProperty({ example: '1990-01-01', description: 'Data de nascimento', required: false })
  @IsOptional()
  data_nascimento?: Date;

  @ApiProperty({ example: '(11) 99999-9999', description: 'Telefone do usuário', required: false })
  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  telefone?: string;
}
