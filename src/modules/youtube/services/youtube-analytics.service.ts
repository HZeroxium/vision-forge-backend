// /src/modules/youtube/services/youtube-analytics.service.ts

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { CacheService, CacheType } from '@common/cache/cache.service';
import { YouTubeAuthService } from './youtube-auth.service';
import { YouTubeVideoService } from './youtube-video.service';
import { YouTubeFormatterService } from './youtube-formatter.service';

@Injectable()
export class YouTubeAnalyticsService {
  private readonly logger = new Logger(YouTubeAnalyticsService.name);
  private readonly ANALYTICS_CACHE_PREFIX = 'youtube:analytics:';

  constructor(
    private readonly authService: YouTubeAuthService,
    private readonly videoService: YouTubeVideoService,
    private readonly formatterService: YouTubeFormatterService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Convert relative date strings like '30daysAgo' to ISO format (YYYY-MM-DD)
   * @param relativeDate Relative date string or ISO date
   * @returns ISO formatted date string
   */
  private convertToISODate(relativeDate: string): string {
    // If it's already in YYYY-MM-DD format, return it
    if (/^\d{4}-\d{2}-\d{2}$/.test(relativeDate)) {
      return relativeDate;
    }

    const date = new Date();

    if (relativeDate === 'today') {
      // Return today's date in ISO format
      return date.toISOString().split('T')[0];
    }

    // Parse relative formats like '30daysAgo'
    const match = relativeDate.match(/^(\d+)days?Ago$/i);
    if (match) {
      const daysToSubtract = parseInt(match[1], 10);
      date.setDate(date.getDate() - daysToSubtract);
      return date.toISOString().split('T')[0];
    }

    // Default to 30 days ago if format isn't recognized
    this.logger.warn(
      `Unrecognized date format: ${relativeDate}, using 30 days ago as default`,
    );
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get analytics data for a specific video
   */
  async getVideoAnalytics(
    userId: string,
    videoId: string,
    metrics: string = 'views,likes,comments,shares',
    startDate: string = '7daysAgo',
    endDate: string = 'today',
    dimensions: string = 'day',
  ): Promise<any> {
    try {
      // Generate a cache key
      const cacheKey = `${this.ANALYTICS_CACHE_PREFIX}video:${videoId}:${metrics}:${startDate}:${endDate}:${dimensions}`;

      // Try to get from cache first with AUTH type
      const cachedAnalytics = await this.cacheService.getCache(
        cacheKey,
        CacheType.AUTH,
      );
      if (cachedAnalytics) {
        return JSON.parse(cachedAnalytics);
      }

      // Get YouTube analytics client
      const { youtubeAnalytics } =
        await this.authService.getAuthClientForUser(userId);

      // Format the metrics string for the API
      const metricsArray = metrics.split(',');
      const formattedMetrics = metricsArray.join(',');

      // Convert relative dates to ISO format
      const isoStartDate = this.convertToISODate(startDate);
      const isoEndDate = this.convertToISODate(endDate);

      // Make the API request
      const response = await youtubeAnalytics.reports.query({
        ids: 'channel==MINE',
        startDate: isoStartDate,
        endDate: isoEndDate,
        metrics: formattedMetrics,
        dimensions,
        filters: `video==${videoId}`,
        sort: dimensions,
      });

      // Format the data for visualization
      const result = this.formatterService.formatAnalyticsData(
        response.data,
        dimensions,
      );

      // Cache the result for 30 minutes with AUTH type
      await this.cacheService.setCache(
        cacheKey,
        JSON.stringify(result),
        1800, // 30 minutes
        CacheType.AUTH,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error getting video analytics: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to get YouTube video analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get analytics data for a channel
   */
  async getChannelAnalytics(
    userId: string,
    metrics: string = 'views,comments,likes,subscribersGained,subscribersLost',
    startDate: string = '30daysAgo',
    endDate: string = 'today',
    dimensions: string = 'day',
  ): Promise<any> {
    try {
      // Generate a cache key
      const cacheKey = `${this.ANALYTICS_CACHE_PREFIX}channel:${userId}:${metrics}:${startDate}:${endDate}:${dimensions}`;

      // Try to get from cache first with AUTH type
      const cachedAnalytics = await this.cacheService.getCache(
        cacheKey,
        CacheType.AUTH,
      );
      if (cachedAnalytics) {
        return JSON.parse(cachedAnalytics);
      }

      // Get YouTube analytics client
      const { youtubeAnalytics } =
        await this.authService.getAuthClientForUser(userId);

      // Format the metrics string for the API
      const metricsArray = metrics.split(',');
      const formattedMetrics = metricsArray.join(',');

      // Convert relative dates to ISO format
      const isoStartDate = this.convertToISODate(startDate);
      const isoEndDate = this.convertToISODate(endDate);

      // Make the API request
      const response = await youtubeAnalytics.reports.query({
        ids: 'channel==MINE',
        startDate: isoStartDate,
        endDate: isoEndDate,
        metrics: formattedMetrics,
        dimensions,
        sort: dimensions,
      });

      // Format the data for visualization
      const result = this.formatterService.formatAnalyticsData(
        response.data,
        dimensions,
      );

      // Cache the result for 30 minutes with AUTH type
      await this.cacheService.setCache(
        cacheKey,
        JSON.stringify(result),
        1800, // 30 minutes
        CacheType.AUTH,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error getting channel analytics: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to get YouTube channel analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get top videos analytics
   */
  async getTopVideosAnalytics(
    userId: string,
    limit: number = 10,
    metrics: string = 'views,likes,comments',
    startDate: string = '90daysAgo',
    endDate: string = 'today',
  ): Promise<any> {
    try {
      // Generate a cache key
      const cacheKey = `${this.ANALYTICS_CACHE_PREFIX}top-videos:${userId}:${limit}:${metrics}:${startDate}:${endDate}`;

      // Try to get from cache first with AUTH type
      const cachedAnalytics = await this.cacheService.getCache(
        cacheKey,
        CacheType.AUTH,
      );
      if (cachedAnalytics) {
        return JSON.parse(cachedAnalytics);
      }

      // Get YouTube analytics client
      const { youtubeAnalytics } =
        await this.authService.getAuthClientForUser(userId);

      // Format the metrics string for the API
      const metricsArray = metrics.split(',');
      const formattedMetrics = metricsArray.join(',');

      // Convert relative dates to ISO format
      const isoStartDate = this.convertToISODate(startDate);
      const isoEndDate = this.convertToISODate(endDate);

      // Make the API request for top videos
      const response = await youtubeAnalytics.reports.query({
        ids: 'channel==MINE',
        startDate: isoStartDate,
        endDate: isoEndDate,
        metrics: formattedMetrics,
        dimensions: 'video',
        sort: '-views',
        maxResults: limit,
      });

      // If we have video IDs, fetch additional metadata
      let result = response.data;

      if (response.data.rows && response.data.rows.length > 0) {
        // Get video details for the top videos
        const videoIds = response.data.rows.map((row) => row[0]);
        const videoDetails = await this.videoService.getVideosDetails(
          userId,
          videoIds,
        );

        // Merge analytics data with video details
        result = this.formatterService.mergeAnalyticsWithVideoDetails(
          response.data,
          videoDetails,
        );
      }

      // Cache the result for 1 hour with AUTH type
      await this.cacheService.setCache(
        cacheKey,
        JSON.stringify(result),
        3600, // 1 hour
        CacheType.AUTH,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error getting top videos analytics: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to get YouTube top videos analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get demographics analytics for a channel
   */
  async getDemographicsAnalytics(
    userId: string,
    startDate: string = '30daysAgo',
    endDate: string = 'today',
  ): Promise<any> {
    try {
      // Generate a cache key
      const cacheKey = `${this.ANALYTICS_CACHE_PREFIX}demographics:${userId}:${startDate}:${endDate}`;

      // Try to get from cache first with AUTH type
      const cachedAnalytics = await this.cacheService.getCache(
        cacheKey,
        CacheType.AUTH,
      );
      if (cachedAnalytics) {
        return JSON.parse(cachedAnalytics);
      }

      // Get YouTube analytics client
      const { youtubeAnalytics } =
        await this.authService.getAuthClientForUser(userId);

      // Convert relative dates to ISO format
      const isoStartDate = this.convertToISODate(startDate);
      const isoEndDate = this.convertToISODate(endDate);

      // Make the API request for viewer demographics
      const response = await youtubeAnalytics.reports.query({
        ids: 'channel==MINE',
        startDate: isoStartDate,
        endDate: isoEndDate,
        metrics: 'viewerPercentage',
        dimensions: 'ageGroup,gender',
      });

      // Format the data for visualization
      const result = this.formatterService.formatDemographicsData(
        response.data,
      );

      // Cache the result for 24 hours with AUTH type
      await this.cacheService.setCache(
        cacheKey,
        JSON.stringify(result),
        86400, // 24 hours
        CacheType.AUTH,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error getting demographics analytics: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to get YouTube demographics analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
