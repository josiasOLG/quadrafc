import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateProfileVisibilityDto {
  @ApiProperty({ description: 'Se o perfil deve ser público ou privado' })
  @IsBoolean()
  isPublicProfile: boolean;
}
