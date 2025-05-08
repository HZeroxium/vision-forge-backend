// modules/publisher/dto/publisher-pagination.dto.ts

import { PublisherResponseDto } from './publisher-response.dto';

export class PublisherPaginationDto {
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  publishingHistories: PublisherResponseDto[];
}
