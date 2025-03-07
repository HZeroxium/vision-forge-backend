// modules/media-gen/dto/media-pagination.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { MediaResponseDto } from './media-response.dto';

export class MediaPaginationDto {
  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty({ type: [MediaResponseDto] })
  mediaAssets: MediaResponseDto[];
}
