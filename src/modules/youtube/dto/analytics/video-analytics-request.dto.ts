// /src/modules/youtube/dto/analytics/video-analytics-request.dto.ts

import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  BaseAnalyticsRequestDto,
  AnalyticsDimension,
} from './common-types.dto';

export class VideoAnalyticsRequestDto extends BaseAnalyticsRequestDto {
  @IsString()
  videoId: string;

  @IsOptional()
  @IsString()
  metrics?: string;

  @IsOptional()
  @IsEnum(AnalyticsDimension)
  dimensions?: AnalyticsDimension;
}
