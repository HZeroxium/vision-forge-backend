// /src/modules/youtube/dto/analytics/channel-analytics-request.dto.ts

import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  BaseAnalyticsRequestDto,
  AnalyticsDimension,
} from './common-types.dto';

export class ChannelAnalyticsRequestDto extends BaseAnalyticsRequestDto {
  @IsOptional()
  @IsString()
  metrics?: string;

  @IsOptional()
  @IsEnum(AnalyticsDimension)
  dimensions?: AnalyticsDimension;
}
