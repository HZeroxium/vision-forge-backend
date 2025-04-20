// modules/youtube/youtube.controller.ts
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
} from '@nestjs/common';
import { YouTubeService } from './youtube.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

@Controller('youtube')
export class YouTubeController {
  constructor(private readonly youtubeService: YouTubeService) {}

  @UseGuards(JwtAuthGuard)
  @Get('auth-url')
  getAuthUrl(@Req() req: any) {
    // Include user ID in the state parameter
    return {
      url: this.youtubeService.getAuthUrl(req.user.userId),
    };
  }

  // Public callback endpoint that doesn't require authentication
  @Get('public-callback')
  async handlePublicCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Query('state') state: string,
  ) {
    try {
      // If there's an error parameter in the callback, handle it
      if (error) {
        console.log(`OAuth error: ${error}`);
        if (error === 'access_denied') {
          throw new HttpException(
            'Access denied. You need to be added as a test user in the Google Cloud Console.',
            HttpStatus.FORBIDDEN,
          );
        }
        throw new HttpException(
          `Authentication failed: ${error}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!code) {
        throw new HttpException(
          'No authorization code provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!state) {
        throw new HttpException(
          'No state parameter provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Decode the state to get the user ID
      let userId: string;
      try {
        userId = Buffer.from(state, 'base64').toString('utf-8');
      } catch (e) {
        throw new HttpException(
          'Invalid state parameter',
          HttpStatus.BAD_REQUEST,
        );
      }

      return this.youtubeService.handleCallback(code, userId);
    } catch (error) {
      console.error(`Error in OAuth callback: ${error.message}`);
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
    @Query('code') code: string,
    @Query('error') error: string,
    @Req() req: any,
  ) {
    try {
      // If there's an error parameter in the callback, handle it
      if (error) {
        console.log(`OAuth error: ${error}`);
        if (error === 'access_denied') {
          throw new HttpException(
            'Access denied. You need to be added as a test user in the Google Cloud Console.',
            HttpStatus.FORBIDDEN,
          );
        }
        throw new HttpException(
          `Authentication failed: ${error}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!code) {
        throw new HttpException(
          'No authorization code provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      return this.youtubeService.handleCallback(code, req.user.userId);
    } catch (error) {
      console.error(`Error in OAuth callback: ${error.message}`);
      throw new HttpException(
        error.message || 'Failed to authenticate with YouTube',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  uploadVideo(
    @Body()
    uploadVideoDto: {
      videoId: string;
      title: string;
      description: string;
      tags: string[];
      privacyStatus?: 'private' | 'public' | 'unlisted';
    },
    @Req() req: any,
  ) {
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
  getStatistics(@Param('publishingHistoryId') publishingHistoryId: string) {
    return this.youtubeService.getVideoStatistics(publishingHistoryId);
  }
}
