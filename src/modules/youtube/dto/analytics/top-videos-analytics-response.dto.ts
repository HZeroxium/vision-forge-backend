// /src/modules/youtube/dto/analytics/top-videos-analytics-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { ColumnHeader } from './common-types.dto';

export class TopVideoDetailsDto {
  @ApiProperty({
    description: 'YouTube video ID',
    example: 'dQw4w9WgXcQ',
  })
  videoId: string;

  @ApiProperty({
    description: 'Video title',
    example: 'Never Gonna Give You Up',
  })
  title: string;

  @ApiProperty({
    description: 'Video thumbnail URL',
    example: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg',
  })
  thumbnail: string;

  @ApiProperty({
    description: 'Video publish date',
    example: '2009-10-25T06:57:33Z',
  })
  publishedAt: string;

  @ApiProperty({
    description: 'Video duration (ISO 8601 duration format)',
    example: 'PT3M33S',
  })
  duration: string;

  @ApiProperty({
    description: 'Video metrics (e.g., views, likes)',
    type: [Number],
    example: [1000000, 50000, 2000],
  })
  metrics: number[];
}

export class TopVideosAnalyticsResponseDto {
  @ApiProperty({
    description: 'Column headers from the analytics data',
    type: [ColumnHeader],
  })
  columnHeaders: ColumnHeader[];

  @ApiProperty({
    description: 'Top videos data with enhanced details',
    type: [TopVideoDetailsDto],
  })
  rows: TopVideoDetailsDto[];
}
