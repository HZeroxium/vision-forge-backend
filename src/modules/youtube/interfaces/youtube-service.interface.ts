// /src/modules/youtube/interfaces/youtube-service.interface.ts

import { CallbackResponseDto } from '../dto/auth/callback-response.dto';
import { UploadVideoResponseDto } from '../dto/upload/upload-video-response.dto';
import { VideoStatisticsResponseDto } from '../dto/statistics/video-statistics-response.dto';
import { BaseAnalyticsResponseDto } from '../dto/analytics/common-types.dto';
import { TopVideosAnalyticsResponseDto } from '../dto/analytics/top-videos-analytics-response.dto';
import { DemographicsAnalyticsResponseDto } from '../dto/analytics/demographics-analytics-response.dto';
import { AnalyticsDimension } from '../dto/analytics/common-types.dto';

export interface IYouTubeService {
  // Auth methods
  getAuthUrl(userId?: string): string;
  handleCallback(code: string, userId: string): Promise<CallbackResponseDto>;

  // Video methods
  uploadVideo(
    userId: string,
    videoId: string,
    title: string,
    description: string,
    tags: string[],
    privacyStatus?: 'private' | 'public' | 'unlisted',
  ): Promise<UploadVideoResponseDto>;

  getVideoStatistics(
    publishingHistoryId: string,
  ): Promise<VideoStatisticsResponseDto>;

  // Analytics methods
  getVideoAnalytics(
    userId: string,
    videoId: string,
    metrics?: string,
    startDate?: string,
    endDate?: string,
    dimensions?: AnalyticsDimension,
  ): Promise<BaseAnalyticsResponseDto>;

  getChannelAnalytics(
    userId: string,
    metrics?: string,
    startDate?: string,
    endDate?: string,
    dimensions?: AnalyticsDimension,
  ): Promise<BaseAnalyticsResponseDto>;

  getTopVideosAnalytics(
    userId: string,
    limit?: number,
    metrics?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<TopVideosAnalyticsResponseDto>;

  getDemographicsAnalytics(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<DemographicsAnalyticsResponseDto>;
}
