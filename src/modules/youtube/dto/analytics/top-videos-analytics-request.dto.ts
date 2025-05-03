// /src/modules/youtube/dto/analytics/top-videos-analytics-request.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BaseAnalyticsRequestDto } from './common-types.dto';

export class TopVideosAnalyticsRequestDto extends BaseAnalyticsRequestDto {
  @ApiPropertyOptional({
    description: 'Maximum number of videos to return',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Metrics to retrieve (comma-separated)',
    example: 'views,likes,comments',
  })
  @IsOptional()
  @IsString()
  metrics?: string;
}
