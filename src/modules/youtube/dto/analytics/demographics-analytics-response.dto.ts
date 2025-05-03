// /src/modules/youtube/dto/analytics/demographics-analytics-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class GenderDistributionDto {
  @ApiProperty({
    description: 'Percentage of male viewers',
    example: 65.5,
  })
  male: number;

  @ApiProperty({
    description: 'Percentage of female viewers',
    example: 32.3,
  })
  female: number;

  @ApiProperty({
    description: 'Percentage of other gender viewers',
    example: 2.2,
  })
  other: number;
}

export class AgeGroupDataDto {
  @ApiProperty({
    description: 'Percentage of male viewers in this age group',
    example: 15.2,
  })
  male: number;

  @ApiProperty({
    description: 'Percentage of female viewers in this age group',
    example: 8.7,
  })
  female: number;

  @ApiProperty({
    description: 'Percentage of other gender viewers in this age group',
    example: 0.5,
  })
  other?: number;
}

export class DemographicsAnalyticsResponseDto {
  @ApiProperty({
    description: 'Viewer age group distribution',
    example: {
      '18-24': { male: 20.5, female: 15.2 },
      '25-34': { male: 25.3, female: 12.1 },
      '35-44': { male: 10.2, female: 5.3 },
      '45-54': { male: 5.1, female: 2.4 },
      '55-64': { male: 2.3, female: 1.1 },
      '65+': { male: 0.5, female: 0.0 },
    },
    type: 'object',
    additionalProperties: {
      type: 'object',
      properties: {
        male: { type: 'number' },
        female: { type: 'number' },
        other: { type: 'number' },
      },
    },
  })
  ageGroups: Record<string, AgeGroupDataDto>;

  @ApiProperty({
    description: 'Overall gender distribution',
    type: GenderDistributionDto,
  })
  genderDistribution: GenderDistributionDto;
}
