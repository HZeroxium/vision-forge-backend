// modules/publisher/dto/publisher-pagination.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { PublisherResponseDto } from './publisher-response.dto';

export class PublisherPaginationDto {
  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty({ type: [PublisherResponseDto] })
  publishingHistories: PublisherResponseDto[];
}
