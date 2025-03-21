// modules/audios/dto/audios-pagination.dto.ts
import { AudioResponseDto } from './audio-response.dto';

/**
 * DTO for paginated audio responses.
 */
export class AudiosPaginationDto {
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  audios: AudioResponseDto[];
}
