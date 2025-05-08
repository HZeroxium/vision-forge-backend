// /src/modules/youtube/dto/analytics/top-videos-analytics-response.dto.ts

import { ColumnHeader } from './common-types.dto';

export class TopVideoDetailsDto {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
  metrics: number[];
}

export class TopVideosAnalyticsResponseDto {
  columnHeaders: ColumnHeader[];
  rows: TopVideoDetailsDto[];
}
