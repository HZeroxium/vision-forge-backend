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

  @IsString()
  @IsNotEmpty()
  audioUrl: string;

  @IsOptional()
  @IsNumber()
  transitionDuration?: number;
}
