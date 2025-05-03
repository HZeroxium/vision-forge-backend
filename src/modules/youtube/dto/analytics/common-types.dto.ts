// /src/modules/youtube/dto/analytics/common-types.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

// Shared types for analytics
export enum AnalyticsDimension {
  DAY = 'day',
  MONTH = 'month',
}

export class ChartDataset {
  @ApiProperty({
    description: 'Label for the dataset',
    example: 'Views',
  })
  label: string;

  @ApiProperty({
    description: 'Data points for the dataset',
    type: [Number],
    example: [120, 150, 180, 90, 200],
  })
  data: number[];

  @ApiProperty({
    description: 'Whether to fill the area under the line',
    example: false,
  })
  fill: boolean;

  @ApiProperty({
    description: 'Border color for the chart line',
    example: '#FF6384',
  })
  borderColor: string;

  @ApiProperty({
    description: 'Line tension for the curve',
    example: 0.1,
  })
  tension: number;
}

export class ColumnHeader {
  @ApiProperty({
    description: 'Name of the column',
    example: 'views',
  })
  name: string;

  @ApiProperty({
    description: 'Type of the column (DIMENSION or METRIC)',
    example: 'METRIC',
  })
  type: string;

  @ApiProperty({
    description: 'Data type of the column',
    example: 'INTEGER',
  })
  dataType: string;
}

// Base request for analytics endpoints with time range
export class BaseAnalyticsRequestDto {
  @ApiPropertyOptional({
    description:
      'Start date for analytics data (YYYY-MM-DD or relative like "7daysAgo")',
    example: '2023-05-01',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description:
      'End date for analytics data (YYYY-MM-DD or relative like "today")',
    example: '2023-05-31',
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}

// Base analytics response with chart data
export class BaseAnalyticsResponseDto {
  @ApiProperty({
    description: 'Labels for the chart (e.g., dates)',
    type: [String],
    example: [
      '2023-05-01',
      '2023-05-02',
      '2023-05-03',
      '2023-05-04',
      '2023-05-05',
    ],
  })
  labels: string[];

  @ApiProperty({
    description: 'Datasets for the chart',
    type: [ChartDataset],
  })
  datasets: ChartDataset[];

  @ApiProperty({
    description: 'Column headers from the analytics data',
    type: [ColumnHeader],
  })
  columnHeaders: ColumnHeader[];

  @ApiProperty({
    description: 'Time unit used for the data',
    example: 'day',
    enum: AnalyticsDimension,
  })
  timeUnit: AnalyticsDimension;
}
