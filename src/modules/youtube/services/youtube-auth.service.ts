// /src/modules/youtube/services/youtube-auth.service.ts

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService, CacheType } from '@common/cache/cache.service';
import { google } from 'googleapis';

@Injectable()
export class YouTubeAuthService {
  private readonly logger = new Logger(YouTubeAuthService.name);
  private oauth2Client;

  // Cache keys prefixes
  private readonly OAUTH_CACHE_PREFIX = 'youtube:oauth:';

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    // Initialize OAuth2 client
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUrl = this.configService.get<string>('YOUTUBE_REDIRECT_URL');

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUrl,
    );
  }

  /**
   * Get the authorization URL for YouTube OAuth
   */
  getAuthUrl(userId?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
      'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
    ];

    // If userId is provided, encode it as a state parameter for security
    const state = userId ? Buffer.from(userId).toString('base64') : undefined;

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
      prompt: 'consent',
      state,
      redirect_uri:
        this.configService.get<string>('YOUTUBE_PUBLIC_REDIRECT_URL') ||
        this.configService.get<string>('YOUTUBE_REDIRECT_URL'),
    });
  }

  /**
   * Handle the OAuth2 callback and store tokens in Redis
   */
  async handleCallback(code: string, userId: string): Promise<any> {
    try {
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
      let tokens;
      try {
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
        const youtube = google.youtube({
          version: 'v3',
          auth: this.oauth2Client,
        });

        const response = await youtube.channels.list({
          part: ['snippet'],
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

      // Store auth data in Redis
      const tokenData = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
        tokenExpiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : new Date(Date.now() + 3600 * 1000).toISOString(),
        channelId,
        channelName,
      };

      // Calculate TTL in seconds
      const ttl = tokens.expiry_date
        ? Math.floor(
            (new Date(tokens.expiry_date).getTime() - Date.now()) / 1000,
          )
        : 3600;

      // Use AUTH Cache instead of regular cache
      try {
        this.logger.log(`Storing token data in cache with TTL: ${ttl}s`);
        await this.cacheService.setCache(
          `${this.OAUTH_CACHE_PREFIX}${userId}`,
          JSON.stringify(tokenData),
          ttl,
          CacheType.AUTH, // Specify this is AUTH cache
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

      // Provide specific error messages
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
   * Get OAuth clients with refreshed credentials
   */
  async getAuthClientForUser(userId: string): Promise<any> {
    // First refresh token if needed
    await this.refreshTokenIfNeeded(userId);

    // Get credentials
    const tokenData = await this.getUserCredentials(userId);

    // Set credentials to OAuth client
    this.oauth2Client.setCredentials({
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken,
    });

    return {
      oauth2Client: this.oauth2Client,
      youtube: google.youtube({
        version: 'v3',
        auth: this.oauth2Client,
      }),
      youtubeAnalytics: google.youtubeAnalytics({
        version: 'v2',
        auth: this.oauth2Client,
      }),
      userId,
      channelId: tokenData.channelId,
      channelName: tokenData.channelName,
    };
  }

  /**
   * Get user's YouTube OAuth credentials from Redis
   */
  async getUserCredentials(userId: string) {
    const tokenDataStr = await this.cacheService.getCache(
      `${this.OAUTH_CACHE_PREFIX}${userId}`,
      CacheType.AUTH, // Specify this is AUTH cache
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
   * Refresh token if needed
   */
  private async refreshTokenIfNeeded(userId: string): Promise<void> {
    const tokenDataStr = await this.cacheService.getCache(
      `${this.OAUTH_CACHE_PREFIX}${userId}`,
      CacheType.AUTH, // Specify this is AUTH cache
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

        // Update in Redis with AUTH cache
        await this.cacheService.setCache(
          `${this.OAUTH_CACHE_PREFIX}${userId}`,
          JSON.stringify(newTokenData),
          newTtl,
          CacheType.AUTH,
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
}
