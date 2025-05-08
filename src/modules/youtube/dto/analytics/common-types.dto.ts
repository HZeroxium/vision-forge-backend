// /src/modules/youtube/dto/analytics/common-types.dto.ts

import { IsEnum, IsOptional, IsString } from 'class-validator';

// Shared types for analytics
export enum AnalyticsDimension {
  DAY = 'day',
  MONTH = 'month',
}

export class ChartDataset {
  label: string;
  data: number[];
  fill: boolean;
  borderColor: string;
  tension: number;
}

export class ColumnHeader {
  name: string;
  type: string;
  dataType: string;
}

// Base request for analytics endpoints with time range
export class BaseAnalyticsRequestDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

// Base analytics response with chart data
export class BaseAnalyticsResponseDto {
  labels: string[];
  datasets: ChartDataset[];
  columnHeaders: ColumnHeader[];
  timeUnit: AnalyticsDimension;
}
