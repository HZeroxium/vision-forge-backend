// modules/videos/dto/videos-pagination.dto.ts
import { VideoResponseDto } from './video-response.dto';

/**
 * DTO for paginated video responses.
 */
export class VideosPaginationDto {
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  videos: VideoResponseDto[];
}
