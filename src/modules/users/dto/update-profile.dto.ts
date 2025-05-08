import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Data Transfer Object for updating user profile
 * This includes only the fields that users should be able to update in their profile
 */
export class UpdateProfileDto {
  @ApiProperty({ 
    description: 'Full name of the user',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ 
    description: 'User self-description', 
    required: false,
    example: 'Video content creator specializing in tech tutorials.' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000) // Limit description to 1000 characters
  description?: string;
}
