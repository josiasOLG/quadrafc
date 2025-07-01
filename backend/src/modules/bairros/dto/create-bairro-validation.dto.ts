import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateBairroValidationDto {
  @ApiProperty({ description: 'Nome do bairro', example: 'Centro' })
  @IsString({ message: 'Nome deve ser um texto' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @Length(2, 100, { message: 'Nome deve ter entre 2 e 100 caracteres' })
  nome: string;

  @ApiProperty({ description: 'Cidade do bairro', example: 'São Paulo' })
  @IsString({ message: 'Cidade deve ser um texto' })
  @IsNotEmpty({ message: 'Cidade é obrigatória' })
  @Length(2, 100, { message: 'Cidade deve ter entre 2 e 100 caracteres' })
  cidade: string;

  @ApiProperty({ description: 'Estado do bairro', example: 'SP' })
  @IsString({ message: 'Estado deve ser um texto' })
  @IsNotEmpty({ message: 'Estado é obrigatório' })
  @Length(2, 2, { message: 'Estado deve ter exatamente 2 caracteres' })
  estado: string;

  @ApiProperty({ description: 'CEP do bairro', example: '01001-000', required: false })
  @IsOptional()
  @IsString({ message: 'CEP deve ser um texto' })
  cep?: string;
}
