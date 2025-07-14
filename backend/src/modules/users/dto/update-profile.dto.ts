import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ description: 'Nome do usuário', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(50, { message: 'Nome deve ter no máximo 50 caracteres' })
  nome?: string;

  @ApiProperty({ description: 'URL ou base64 do avatar', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000000, { message: 'Avatar muito grande. Máximo 5MB permitido.' })
  @Matches(
    /^(https?:\/\/.*\.(jpg|jpeg|png|gif|webp).*|data:image\/(jpeg|jpg|png|gif|webp);base64,.*|)$/i,
    {
      message: 'Avatar deve ser uma URL válida ou uma imagem base64 (JPG, PNG, GIF, WEBP)',
    }
  )
  avatarUrl?: string;
}
