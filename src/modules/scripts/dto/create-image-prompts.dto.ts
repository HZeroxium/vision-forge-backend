// src/scripts/dto/create-image-prompts.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for creating image prompts based on script content.
 */
export class CreateImagePromptsDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  style: string;
}
