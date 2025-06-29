import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'joao@email.com', description: 'Email do usuário' })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Senha do usuário' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  password: string;
}
