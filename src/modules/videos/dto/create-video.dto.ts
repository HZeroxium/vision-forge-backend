// modules/videos/dto/create-video.dto.ts
import {
  IsArray,
  ArrayNotEmpty,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
} from 'class-validator';

/**
 * DTO for creating a new video asset.
 * The client provides image URLs, an audio URL, and optional transition duration.
 */
export class CreateVideoDto {
  @IsArray()
  @ArrayNotEmpty()
  imageUrls: string[];

  @IsArray()
  @ArrayNotEmpty()
  scripts: string[];

  @IsString()
  @IsNotEmpty()
  audioUrl: string;

  @IsString()
  @IsNotEmpty()
  scriptId: string;

  @IsOptional()
  @IsNumber()
  transitionDuration?: number;

  @IsOptional()
  @IsString()
  voice?: string;
}
