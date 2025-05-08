// modules/users/dto/create-user.dto.ts

import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000) // Limit description to 1000 characters
  description?: string; // Added field for user self-description

  @IsOptional()
  @IsEnum(Role, { message: 'Invalid role' })
  role?: Role;
}
