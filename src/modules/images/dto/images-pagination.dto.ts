// modules/images/dto/images-pagination.dto.ts

import { ImageResponseDto } from './image-response.dto';

/**
 * DTO for paginated image responses.
 */
export class ImagesPaginationDto {
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  images: ImageResponseDto[];
}
