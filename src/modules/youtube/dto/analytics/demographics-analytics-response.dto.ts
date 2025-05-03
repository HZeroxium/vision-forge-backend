// /src/modules/youtube/dto/analytics/demographics-analytics-response.dto.ts

export class GenderDistributionDto {
  male: number;
  female: number;
  other: number;
}

export class AgeGroupDataDto {
  male: number;
  female: number;
  other?: number;
}

export class DemographicsAnalyticsResponseDto {
  ageGroups: Record<string, AgeGroupDataDto>;
  genderDistribution: GenderDistributionDto;
}
