import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UserSearchDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  bairro?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  search?: string; // Campo de busca global

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  ativo?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  assinaturaPremium?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  banned?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isAdmin?: boolean;
}
