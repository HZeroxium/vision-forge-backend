// /src/modules/youtube/dto/analytics/channel-analytics-request.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  BaseAnalyticsRequestDto,
  AnalyticsDimension,
} from './common-types.dto';

export class ChannelAnalyticsRequestDto extends BaseAnalyticsRequestDto {
  @ApiPropertyOptional({
    description: 'Metrics to retrieve (comma-separated)',
    example: 'views,comments,likes,subscribersGained,subscribersLost',
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
