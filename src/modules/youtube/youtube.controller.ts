import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { YouTubeService } from './youtube.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

// Import DTOs
import { AuthUrlResponseDto } from './dto/auth/auth-url-response.dto';
import { CallbackRequestDto } from './dto/auth/callback-request.dto';
import { CallbackResponseDto } from './dto/auth/callback-response.dto';
import { UploadVideoRequestDto } from './dto/upload/upload-video-request.dto';
import { UploadVideoResponseDto } from './dto/upload/upload-video-response.dto';
import { VideoStatisticsResponseDto } from './dto/statistics/video-statistics-response.dto';
import { VideoAnalyticsRequestDto } from './dto/analytics/video-analytics-request.dto';
import { ChannelAnalyticsRequestDto } from './dto/analytics/channel-analytics-request.dto';
import { TopVideosAnalyticsRequestDto } from './dto/analytics/top-videos-analytics-request.dto';
import { BaseAnalyticsRequestDto } from './dto/analytics/common-types.dto';
import { BaseAnalyticsResponseDto } from './dto/analytics/common-types.dto';
import { TopVideosAnalyticsResponseDto } from './dto/analytics/top-videos-analytics-response.dto';
import { DemographicsAnalyticsResponseDto } from './dto/analytics/demographics-analytics-response.dto';

@Controller('youtube')
export class YouTubeController {
  private readonly logger = new Logger(YouTubeController.name);

  constructor(private readonly youtubeService: YouTubeService) {}

  @UseGuards(JwtAuthGuard)
  @Get('auth-url')
  getAuthUrl(@Req() req: { user: { userId: string } }): AuthUrlResponseDto {
    return {
      url: this.youtubeService.getAuthUrl(req.user.userId),
    };
  }

  // Public callback endpoint that doesn't require authentication
  @Get('public-callback')
  async handlePublicCallback(
    @Query() query: CallbackRequestDto,
  ): Promise<CallbackResponseDto> {
    try {
      // If there's an error parameter in the callback, handle it
      if (query.error) {
        this.logger.error(`OAuth error: ${query.error}`);
        if (query.error === 'access_denied') {
          throw new HttpException(
            'Access denied. You need to be added as a test user in the Google Cloud Console.',
            HttpStatus.FORBIDDEN,
          );
        }
        throw new HttpException(
          `Authentication failed: ${query.error}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!query.code) {
        throw new HttpException(
          'No authorization code provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!query.state) {
        throw new HttpException(
          'No state parameter provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Decode the state to get the user ID
      let userId: string;
      try {
        userId = Buffer.from(query.state, 'base64').toString('utf-8');
        this.logger.log(`Decoded state parameter to user ID: ${userId}`);
      } catch (e) {
        this.logger.error(`Error decoding state parameter: ${e.message}`);
        throw new HttpException(
          'Invalid state parameter',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.youtubeService.handleCallback(query.code, userId);
    } catch (error) {
      this.logger.error(
        `Error in OAuth callback: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to authenticate with YouTube',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Keep the existing protected endpoint for backward compatibility
  @UseGuards(JwtAuthGuard)
  @Get('callback')
  async handleCallback(
    @Query() query: CallbackRequestDto,
    @Req() req: { user: { userId: string } },
  ): Promise<CallbackResponseDto> {
    try {
      // If there's an error parameter in the callback, handle it
      if (query.error) {
        this.logger.error(`OAuth error: ${query.error}`);
        if (query.error === 'access_denied') {
          throw new HttpException(
            'Access denied. You need to be added as a test user in the Google Cloud Console.',
            HttpStatus.FORBIDDEN,
          );
        }
        throw new HttpException(
          `Authentication failed: ${query.error}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!query.code) {
        throw new HttpException(
          'No authorization code provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.youtubeService.handleCallback(
        query.code,
        req.user.userId,
      );
    } catch (error) {
      this.logger.error(`Error in OAuth callback: ${error.message}`);
      throw new HttpException(
        error.message || 'Failed to authenticate with YouTube',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  async uploadVideo(
    @Body() uploadVideoDto: UploadVideoRequestDto,
    @Req() req: { user: { userId: string } },
  ): Promise<UploadVideoResponseDto> {
    const { videoId, title, description, tags, privacyStatus } = uploadVideoDto;
    return this.youtubeService.uploadVideo(
      req.user.userId,
      videoId,
      title,
      description,
      tags,
      privacyStatus,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('statistics/:publishingHistoryId')
  async getStatistics(
    @Param('publishingHistoryId') publishingHistoryId: string,
  ): Promise<VideoStatisticsResponseDto> {
    return this.youtubeService.getVideoStatistics(publishingHistoryId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('analytics/video/:videoId')
  async getVideoAnalytics(
    @Param('videoId') videoId: string,
    @Query() query: VideoAnalyticsRequestDto,
    @Req() req: { user: { userId: string } },
  ): Promise<BaseAnalyticsResponseDto> {
    try {
      return await this.youtubeService.getVideoAnalytics(
        req.user.userId,
        videoId,
        query.metrics,
        query.startDate,
        query.endDate,
        query.dimensions,
      );
    } catch (error) {
      this.logger.error(
        `Error getting video analytics: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to get video analytics',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('analytics/channel')
  async getChannelAnalytics(
    @Query() query: ChannelAnalyticsRequestDto,
    @Req() req: { user: { userId: string } },
  ): Promise<BaseAnalyticsResponseDto> {
    try {
      return await this.youtubeService.getChannelAnalytics(
        req.user.userId,
        query.metrics,
        query.startDate,
        query.endDate,
        query.dimensions,
      );
    } catch (error) {
      this.logger.error(
        `Error getting channel analytics: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to get channel analytics',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('analytics/top-videos')
  async getTopVideosAnalytics(
    @Query() query: TopVideosAnalyticsRequestDto,
    @Req() req: { user: { userId: string } },
  ): Promise<TopVideosAnalyticsResponseDto> {
    try {
      return await this.youtubeService.getTopVideosAnalytics(
        req.user.userId,
        query.limit,
        query.metrics,
        query.startDate,
        query.endDate,
      );
    } catch (error) {
      this.logger.error(
        `Error getting top videos analytics: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to get top videos analytics',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('analytics/demographics')
  async getDemographicsAnalytics(
    @Query() query: BaseAnalyticsRequestDto,
    @Req() req: { user: { userId: string } },
  ): Promise<DemographicsAnalyticsResponseDto> {
    try {
      return await this.youtubeService.getDemographicsAnalytics(
        req.user.userId,
        query.startDate,
        query.endDate,
      );
    } catch (error) {
      this.logger.error(
        `Error getting demographics analytics: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to get demographics analytics',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
