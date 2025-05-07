// modules/images/dto/create-image.dto.ts

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO for creating a new image asset.
 */
export class CreateImageDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsString()
  @IsNotEmpty()
  style: string;

  @IsString()
  @IsOptional()
  url?: string;
}
