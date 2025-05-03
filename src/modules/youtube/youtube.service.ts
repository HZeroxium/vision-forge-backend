// modules/youtube/youtube.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { YouTubeAuthService } from './services/youtube-auth.service';
import { YouTubeVideoService } from './services/youtube-video.service';
import { YouTubeAnalyticsService } from './services/youtube-analytics.service';

/**
 * YouTubeService acts as a facade for various YouTube related services
 */
@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);

  constructor(
    private readonly authService: YouTubeAuthService,
    private readonly videoService: YouTubeVideoService,
    private readonly analyticsService: YouTubeAnalyticsService,
  ) {
    this.logger.log('YouTubeService initialized with modular architecture');
  }

  // Auth related methods
  getAuthUrl(userId?: string): string {
    return this.authService.getAuthUrl(userId);
  }

  async handleCallback(code: string, userId: string): Promise<any> {
    return this.authService.handleCallback(code, userId);
  }

  // Video related methods
  async uploadVideo(
    userId: string,
    videoId: string,
    title: string,
    description: string,
    tags: string[],
    privacyStatus: 'private' | 'public' | 'unlisted' = 'private',
  ): Promise<any> {
    return this.videoService.uploadVideo(
      userId,
      videoId,
      title,
      description,
      tags,
      privacyStatus,
    );
  }

  async getVideoStatistics(publishingHistoryId: string): Promise<any> {
    return this.videoService.getVideoStatistics(publishingHistoryId);
  }

  // Analytics related methods
  async getVideoAnalytics(
    userId: string,
    videoId: string,
    metrics?: string,
    startDate?: string,
    endDate?: string,
    dimensions?: string,
  ): Promise<any> {
    return this.analyticsService.getVideoAnalytics(
      userId,
      videoId,
      metrics,
      startDate,
      endDate,
      dimensions,
    );
  }

  async getChannelAnalytics(
    userId: string,
    metrics?: string,
    startDate?: string,
    endDate?: string,
    dimensions?: string,
  ): Promise<any> {
    return this.analyticsService.getChannelAnalytics(
      userId,
      metrics,
      startDate,
      endDate,
      dimensions,
    );
  }

  async getTopVideosAnalytics(
    userId: string,
    limit?: number,
    metrics?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    return this.analyticsService.getTopVideosAnalytics(
      userId,
      limit,
      metrics,
      startDate,
      endDate,
    );
  }

  async getDemographicsAnalytics(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    return this.analyticsService.getDemographicsAnalytics(
      userId,
      startDate,
      endDate,
    );
  }
}
