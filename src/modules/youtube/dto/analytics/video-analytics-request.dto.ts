// /src/modules/youtube/dto/analytics/video-analytics-request.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  BaseAnalyticsRequestDto,
  AnalyticsDimension,
} from './common-types.dto';

export class VideoAnalyticsRequestDto extends BaseAnalyticsRequestDto {
  @ApiProperty({
    description: 'YouTube video ID',
    example: 'dQw4w9WgXcQ',
  })
  @IsString()
  videoId: string;

  @ApiPropertyOptional({
    description: 'Metrics to retrieve (comma-separated)',
    example: 'views,likes,comments,shares',
  })
  @IsOptional()
  @IsString()
  metrics?: string;

  @ApiPropertyOptional({
    description: 'Dimension to group by',
    example: 'day',
    enum: AnalyticsDimension,
    default: AnalyticsDimension.DAY,
  })
  @IsOptional()
  @IsEnum(AnalyticsDimension)
  dimensions?: AnalyticsDimension;
}
