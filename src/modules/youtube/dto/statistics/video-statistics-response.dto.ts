// /src/modules/youtube/dto/statistics/video-statistics-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VideoStatisticsDto {
  @ApiProperty({
    description: 'Number of views',
    example: 12345,
  })
  viewCount: number;

  @ApiProperty({
    description: 'Number of likes',
    example: 500,
  })
  likeCount: number;

  @ApiProperty({
    description: 'Number of dislikes',
    example: 10,
  })
  dislikeCount: number;

  @ApiProperty({
    description: 'Number of comments',
    example: 100,
  })
  commentCount: number;

  @ApiProperty({
    description: 'Number of times the video was marked as favorite',
    example: 50,
  })
  favoriteCount: number;

  @ApiProperty({
    description: 'Last time the statistics were updated',
    example: '2023-05-01T12:00:00.000Z',
  })
  lastUpdated: string;
}

export class VideoStatisticsResponseDto {
  @ApiProperty({
    description: 'Video statistics',
    type: VideoStatisticsDto,
  })
  statistics: VideoStatisticsDto;

  @ApiProperty({
    description: 'YouTube video ID',
    example: 'dQw4w9WgXcQ',
  })
  youtubeVideoId: string;

  @ApiProperty({
    description: 'YouTube video URL',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  youtubeUrl: string;

  @ApiPropertyOptional({
    description: 'All raw statistics from YouTube API',
  })
  allStats?: Record<string, any>;
}
