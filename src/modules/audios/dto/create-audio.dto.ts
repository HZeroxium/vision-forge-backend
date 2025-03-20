// modules/audios/dto/create-audio.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { TTSProvider } from '@prisma/client';

/**
 * DTO for creating a new audio asset.
 */
export class CreateAudioDto {
  @IsString()
  @IsNotEmpty()
  script: string;

  // Optional provider, defaults to 'openai'
  @IsOptional()
  @IsEnum(TTSProvider, {
    message: 'Provider must be one of: GOOGLE_TTS, OPENAI',
  })
  provider?: TTSProvider = TTSProvider.OPENAI;
}
