// modules/audios/dto/update-audio.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateAudioDto } from './create-audio.dto';
import { TTSProvider } from '@prisma/client';

/**
 * DTO for updating an audio asset.
 */
export class UpdateAudioDto extends PartialType(CreateAudioDto) {
  provider?: TTSProvider;

  url?: string;

  durationSeconds?: number;
}
