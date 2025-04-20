// modules/youtube/youtube.service.ts
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CacheService } from '@common/cache/cache.service';
import { PrismaService } from '@database/prisma.service';
import { lastValueFrom } from 'rxjs';
import { google } from 'googleapis';
import { createReadStream } from 'fs';

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);
  private youtube;
  private oauth2Client;

  // Cache keys prefixes
  private readonly OAUTH_CACHE_PREFIX = 'youtube:oauth:';
  private readonly STATS_CACHE_PREFIX = 'youtube:stats:';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly cacheService: CacheService,
    private readonly prisma: PrismaService,
  ) {
    // Try to use YouTube credentials first, fall back to Google credentials if not available
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUrl = this.configService.get<string>('YOUTUBE_REDIRECT_URL');

    // Log which credentials are being used
    this.logger.log(
      `Using ${
        this.configService.get('YOUTUBE_CLIENT_ID') ? 'YouTube' : 'Google'
      } credentials for YouTube API`,
    );

    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUrl,
    );

    // Initialize YouTube API client
    this.youtube = google.youtube({
      version: 'v3',
      auth: this.oauth2Client,
    });
  }

  /**
   * Get the authorization URL for YouTube OAuth
   */
  getAuthUrl(userId?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
    ];

    // If userId is provided, encode it as a state parameter for security
    const state = userId ? Buffer.from(userId).toString('base64') : undefined;

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
      prompt: 'consent', // Add this to force consent screen every time
      state, // Include the encoded user ID as state
      redirect_uri:
        this.configService.get<string>('YOUTUBE_PUBLIC_REDIRECT_URL') ||
        this.configService.get<string>('YOUTUBE_REDIRECT_URL'),
    });
  }

  /**
   * Handle the OAuth2 callback and store tokens in Redis instead of database
   */
  async handleCallback(code: string, userId: string): Promise<any> {
    try {
      // Log the start of the authentication process with user ID
      this.logger.log(
        `Starting YouTube OAuth callback process for user ${userId}`,
      );

      // Validate cache service is available
      try {
        await this.cacheService.getCache('test-key');
      } catch (cacheError) {
        this.logger.error(
          `Cache service error: ${cacheError.message}`,
          cacheError.stack,
        );
        throw new Error('Cache service unavailable');
      }

      // Exchange code for tokens
      this.logger.log('Exchanging authorization code for tokens');
      let tokens;
      try {
        // IMPORTANT: Explicitly set the redirect_uri to match what was used in auth URL
        const redirectUri = this.configService.get<string>(
          'YOUTUBE_PUBLIC_REDIRECT_URL',
        );
        this.logger.log(
          `Using redirect URI for token exchange: ${redirectUri}`,
        );

        const response = await this.oauth2Client.getToken({
          code,
          redirect_uri: redirectUri,
        });

        tokens = response.tokens;
        this.logger.log('Successfully obtained tokens');
      } catch (tokenError) {
        this.logger.error(
          `Token exchange error: ${tokenError.message}`,
          tokenError.stack,
        );
        throw new Error(
          `Failed to exchange authorization code: ${tokenError.message}`,
        );
      }

      // Set credentials
      this.oauth2Client.setCredentials(tokens);

      // Get channel info
      this.logger.log('Fetching YouTube channel information');
      let channelData, channelId, channelName;
      try {
        const response = await this.youtube.channels.list({
          part: 'snippet',
          mine: true,
        });

        channelData = response.data.items?.[0];
        if (!channelData) {
          this.logger.error('No channel data returned from YouTube API');
          throw new Error('No channel data available');
        }

        channelId = channelData?.id;
        channelName = channelData?.snippet?.title;
        this.logger.log(`Found channel: ${channelName} (${channelId})`);
      } catch (channelError) {
        this.logger.error(
          `Channel info error: ${channelError.message}`,
          channelError.stack,
        );
        throw new Error(`Failed to get channel info: ${channelError.message}`);
      }

      // Store auth data in Redis with expiration based on token expiry
      const tokenData = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
        tokenExpiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : new Date(Date.now() + 3600 * 1000).toISOString(),
        channelId,
        channelName,
      };

      // Calculate TTL in seconds - default to 1 hour if no expiry provided
      const ttl = tokens.expiry_date
        ? Math.floor(
            (new Date(tokens.expiry_date).getTime() - Date.now()) / 1000,
          )
        : 3600;

      // Store in Redis
      try {
        this.logger.log(`Storing token data in cache with TTL: ${ttl}s`);
        await this.cacheService.setCache(
          `${this.OAUTH_CACHE_PREFIX}${userId}`,
          JSON.stringify(tokenData),
          ttl,
        );
        this.logger.log('Successfully stored tokens in cache');
      } catch (cacheError) {
        this.logger.error(
          `Failed to store tokens in cache: ${cacheError.message}`,
          cacheError.stack,
        );
        throw new Error(`Cache storage error: ${cacheError.message}`);
      }

      return {
        success: true,
        channelName,
        channelId,
      };
    } catch (error) {
      this.logger.error(
        `Error in OAuth callback: ${error.message}`,
        error.stack,
      );

      // Provide more specific error messages based on type of error
      if (error.message.includes('invalid_grant')) {
        throw new HttpException(
          'Invalid or expired authorization code',
          HttpStatus.BAD_REQUEST,
        );
      } else if (error.message.includes('Cache service')) {
        throw new HttpException(
          'Cache service issue: ' + error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } else if (error.message.includes('Token exchange')) {
        throw new HttpException(
          'Authorization error: ' + error.message,
          HttpStatus.BAD_REQUEST,
        );
      } else if (error.message.includes('channel info')) {
        throw new HttpException(
          'YouTube API error: ' + error.message,
          HttpStatus.BAD_GATEWAY,
        );
      }

      throw new HttpException(
        'Failed to authenticate with YouTube: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Refresh token if needed
   */
  private async refreshTokenIfNeeded(userId: string): Promise<void> {
    const tokenDataStr = await this.cacheService.getCache(
      `${this.OAUTH_CACHE_PREFIX}${userId}`,
    );

    if (!tokenDataStr) {
      throw new HttpException(
        'YouTube authentication required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tokenData = JSON.parse(tokenDataStr);
    const tokenExpiry = new Date(tokenData.tokenExpiry);

    // If token expires in less than 5 minutes, refresh it
    if (tokenExpiry.getTime() - Date.now() < 5 * 60 * 1000) {
      this.logger.log('Refreshing YouTube token');

      try {
        this.oauth2Client.setCredentials({
          refresh_token: tokenData.refreshToken,
        });

        const { credentials } = await this.oauth2Client.getAccessToken();

        const newTokenData = {
          ...tokenData,
          accessToken: credentials.access_token,
          tokenExpiry: credentials.expiry_date
            ? new Date(credentials.expiry_date).toISOString()
            : new Date(Date.now() + 3600 * 1000).toISOString(),
        };

        // Calculate new TTL
        const newTtl = credentials.expiry_date
          ? Math.floor(
              (new Date(credentials.expiry_date).getTime() - Date.now()) / 1000,
            )
          : 3600;

        // Update in Redis
        await this.cacheService.setCache(
          `${this.OAUTH_CACHE_PREFIX}${userId}`,
          JSON.stringify(newTokenData),
          newTtl,
        );
      } catch (error) {
        this.logger.error(`Error refreshing token: ${error.message}`);
        throw new HttpException(
          'Failed to refresh YouTube token',
          HttpStatus.UNAUTHORIZED,
        );
      }
    }
  }

  /**
   * Get user's YouTube OAuth credentials from Redis
   */
  private async getUserCredentials(userId: string) {
    await this.refreshTokenIfNeeded(userId);

    const tokenDataStr = await this.cacheService.getCache(
      `${this.OAUTH_CACHE_PREFIX}${userId}`,
    );
    if (!tokenDataStr) {
      throw new HttpException(
        'YouTube authentication required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return JSON.parse(tokenDataStr);
  }

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
      // Get OAuth credentials from Redis
      const tokenData = await this.getUserCredentials(userId);

      // Set credentials
      this.oauth2Client.setCredentials({
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
      });

      // Get video info from database
      const video = await this.prisma.video.findUnique({
        where: { id: videoId },
      });

      if (!video || !video.url) {
        throw new HttpException('Video not found', HttpStatus.NOT_FOUND);
      }

      // Download video to temporary file
      const videoPath = await this.downloadVideo(video.url);

      // Upload to YouTube
      const res = await this.youtube.videos.insert({
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

      const youtubeVideoId = res.data.id;

      // Save publishing history in database (this is important to keep)
      const publishingHistory = await this.prisma.publishingHistory.create({
        data: {
          videoId,
          platform: 'YOUTUBE',
          platformVideoId: youtubeVideoId,
          publishStatus: 'success',
          publishLogs: res.data,
        },
      });

      return {
        success: true,
        youtubeVideoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
        publishingHistoryId: publishingHistory.id,
      };
    } catch (error) {
      this.logger.error(
        `Error uploading to YouTube: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to upload video to YouTube',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Fetch statistics for a YouTube video directly from the API instead of storing in database
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

      // Try to get from cache first
      const cachedStats = await this.cacheService.getCache(
        `${this.STATS_CACHE_PREFIX}${youtubeVideoId}`,
      );
      if (cachedStats) {
        return {
          statistics: JSON.parse(cachedStats),
          youtubeVideoId,
          youtubeUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
        };
      }

      // Get user's YouTube auth credentials
      const tokenData = await this.getUserCredentials(
        publishingHistory.video.userId,
      );

      // Set credentials
      this.oauth2Client.setCredentials({
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
      });

      // Get statistics from YouTube
      const response = await this.youtube.videos.list({
        part: 'statistics',
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

      // Cache for 5 minutes to avoid too many API calls
      await this.cacheService.setCache(
        `${this.STATS_CACHE_PREFIX}${youtubeVideoId}`,
        JSON.stringify(formattedStats),
        300, // 5 minutes
      );

      return {
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
