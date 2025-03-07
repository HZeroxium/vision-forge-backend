// modules/media-gen/dto/create-media.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { MediaType } from '@prisma/client';

export class CreateMediaDto {
  @IsString()
  @IsNotEmpty()
  prompt: string; // Prompt for generating media content

  @IsString()
  @IsNotEmpty()
  style: string; // e.g., "cartoon", "realistic", etc.

  @IsEnum(MediaType, { message: 'Invalid media type' })
  mediaType: MediaType; // IMAGE or VIDEO

  // Additional optional parameters
  @IsOptional()
  @IsNumber()
  guidanceScale?: number;

  @IsOptional()
  @IsString()
  negativePrompt?: string;

  @IsOptional()
  @IsNumber()
  numInferenceSteps?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;
}
