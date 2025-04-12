// modules/users/dto/user-reponse.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

/**
 * Data Transfer Object for user responses
 * Ensures we never expose sensitive data like passwords
 */
export class UserResponseDto {
  @ApiProperty({ description: 'Unique identifier of the user' })
  id: string;

  @ApiProperty({ description: 'Email address of the user' })
  email: string;

  @ApiProperty({ description: 'Full name of the user', required: false })
  name?: string;

  @ApiProperty({
    description: 'Role of the user',
    enum: Role,
    example: Role.USER,
  })
  role: Role;

  @ApiProperty({ description: 'Date when the user was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when the user was last updated' })
  updatedAt?: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
