// modules/audios/dto/audio-response.dto.ts
/**
 * Response DTO for an audio asset.
 */
export class AudioResponseDto {
  id: string;
  script: string;
  provider: string;
  voiceParams?: any; // JSON object representing voice settings
  url: string;
  durationSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}
