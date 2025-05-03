// /src/modules/youtube/services/youtube-video.service.ts

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@database/prisma.service';
import { lastValueFrom } from 'rxjs';
import { createReadStream } from 'fs';
import { CacheService, CacheType } from '@common/cache/cache.service';
import { YouTubeAuthService } from './youtube-auth.service';
import { VideoStatus } from '@prisma/client';

@Injectable()
export class YouTubeVideoService {
  private readonly logger = new Logger(YouTubeVideoService.name);
  private readonly STATS_CACHE_PREFIX = 'youtube:stats:';

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly authService: YouTubeAuthService,
  ) {}

  /**
   * Upload a video to YouTube
   */
  async uploadVideo(
    userId: string,
    videoId: string,
    title: string,
    description: string,
    tags: string[],
    privacyStatus: 'private' | 'public' | 'unlisted' = 'private',
  ): Promise<any> {
    try {
      // Get authentication clients
      const { youtube } = await this.authService.getAuthClientForUser(userId);

      // Get video info from database
      const video = await this.prisma.video.findUnique({
        where: { id: videoId },
      });

      if (!video || !video.url) {
        throw new HttpException('Video not found', HttpStatus.NOT_FOUND);
      }

      // Download video to temporary file - thao tác này nên thực hiện trước khi bắt đầu transaction
      const videoPath = await this.downloadVideo(video.url);
      let youtubeVideoId;
      let publishingHistory;

      try {
        // Thực hiện upload video lên YouTube TRƯỚC KHI bắt đầu transaction
        this.logger.log('Starting YouTube upload...');
        const res = await youtube.videos.insert({
          part: 'snippet,status',
          requestBody: {
            snippet: {
              title,
              description,
              tags,
              categoryId: '22', // People & Blogs category
            },
            status: {
              privacyStatus,
            },
          },
          media: {
            body: createReadStream(videoPath),
          },
        });
        youtubeVideoId = res.data.id;
        this.logger.log(`YouTube upload completed with ID: ${youtubeVideoId}`);

        // Sau khi đã có kết quả từ YouTube, mới bắt đầu transaction với cơ sở dữ liệu
        await this.prisma.$transaction(
          async (prisma) => {
            // Lưu thông tin publishing history
            publishingHistory = await prisma.publishingHistory.create({
              data: {
                videoId,
                platform: 'YOUTUBE',
                platformVideoId: youtubeVideoId,
                publishStatus: 'success',
                publishLogs: res.data,
              },
            });

            // Cập nhật trạng thái video
            await prisma.video.update({
              where: { id: videoId },
              data: { status: VideoStatus.PUBLISHED },
            });

            this.logger.log(`Video ${videoId} status updated to PUBLISHED`);
          },
          {
            // Cấu hình thời gian timeout dài hơn nếu cần
            timeout: 10000, // 10 giây
          },
        );

        // Xóa file tạm sau khi đã upload xong
        try {
          const fs = require('fs');
          fs.unlinkSync(videoPath);
          this.logger.debug(`Temporary file ${videoPath} removed successfully`);
        } catch (unlinkError) {
          this.logger.warn(
            `Failed to remove temporary file: ${unlinkError.message}`,
          );
        }

        return {
          success: true,
          youtubeVideoId,
          youtubeUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
          publishingHistoryId: publishingHistory.id,
        };
      } catch (error) {
        // Xử lý lỗi trong quá trình upload hoặc transaction
        throw error;
      }
    } catch (error) {
      this.logger.error(
        `Error uploading to YouTube: ${error.message}`,
        error.stack,
      );

      // Nếu lỗi xảy ra, đảm bảo rằng chúng ta không để video trong trạng thái không nhất quán
      try {
        await this.prisma.video.update({
          where: { id: videoId },
          data: { status: VideoStatus.COMPLETED },
        });
        this.logger.log(
          `Reset video ${videoId} status to COMPLETED due to upload error`,
        );
      } catch (resetError) {
        this.logger.error(
          `Failed to reset video status: ${resetError.message}`,
        );
      }

      throw new HttpException(
        'Failed to upload video to YouTube',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Fetch statistics for a YouTube video directly from the API
   */
  async getVideoStatistics(publishingHistoryId: string): Promise<any> {
    try {
      // Get publishing history
      const publishingHistory = await this.prisma.publishingHistory.findUnique({
        where: { id: publishingHistoryId },
        include: { video: true },
      });

      if (!publishingHistory) {
        throw new HttpException(
          'Publishing history not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const youtubeVideoId = publishingHistory.platformVideoId;

      // Try to get from cache first - Sử dụng AUTH cache
      const cachedStats = await this.cacheService.getCache(
        `${this.STATS_CACHE_PREFIX}${youtubeVideoId}`,
        CacheType.AUTH,
      );
      if (cachedStats) {
        return {
          statistics: JSON.parse(cachedStats),
          youtubeVideoId,
          youtubeUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
        };
      }

      // Get authentication clients
      const { youtube } = await this.authService.getAuthClientForUser(
        publishingHistory.video.userId,
      );

      // Get statistics from YouTube
      const response = await youtube.videos.list({
        part: 'statistics,snippet,contentDetails,status,topicDetails',
        id: youtubeVideoId,
      });

      const statistics = response.data.items?.[0]?.statistics;

      if (!statistics) {
        throw new HttpException(
          'No statistics available',
          HttpStatus.NOT_FOUND,
        );
      }

      // Format statistics
      const formattedStats = {
        viewCount: parseInt(statistics.viewCount || '0', 10),
        likeCount: parseInt(statistics.likeCount || '0', 10),
        dislikeCount: parseInt(statistics.dislikeCount || '0', 10),
        commentCount: parseInt(statistics.commentCount || '0', 10),
        favoriteCount: parseInt(statistics.favoriteCount || '0', 10),
        lastUpdated: new Date().toISOString(),
      };

      // Cache for 5 minutes to avoid too many API calls - Sử dụng AUTH cache
      await this.cacheService.setCache(
        `${this.STATS_CACHE_PREFIX}${youtubeVideoId}`,
        JSON.stringify(formattedStats),
        300, // 5 minutes
        CacheType.AUTH,
      );

      return {
        allStats: response.data.items?.[0],
        statistics: formattedStats,
        youtubeVideoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
      };
    } catch (error) {
      this.logger.error(
        `Error getting YouTube statistics: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to get YouTube statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get video details from YouTube API
   */
  async getVideosDetails(userId: string, videoIds: string[]): Promise<any> {
    try {
      const { youtube } = await this.authService.getAuthClientForUser(userId);

      const response = await youtube.videos.list({
        part: 'snippet,contentDetails,statistics',
        id: videoIds.join(','),
      });

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error getting video details: ${error.message}`,
        error.stack,
      );
      return { items: [] };
    }
  }

  /**
   * Download video from URL to a temporary file
   */
  private async downloadVideo(url: string): Promise<string> {
    const os = require('os');
    const path = require('path');
    const fs = require('fs');
    const { pipeline } = require('stream/promises');
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, `video-${Date.now()}.mp4`);

    try {
      const response = await lastValueFrom(
        this.httpService.get(url, { responseType: 'stream' }),
      );

      await pipeline(response.data, fs.createWriteStream(tempPath));
      return tempPath;
    } catch (error) {
      this.logger.error(`Error downloading video: ${error.message}`);
      throw new Error('Failed to download video');
    }
  }
}
