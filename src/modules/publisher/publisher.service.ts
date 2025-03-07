// modules/publisher/publisher.service.ts

import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PublishVideoDto } from './dto/publish-video.dto';
import { PrismaService } from '../../database/prisma.service';
import { PublisherResponseDto } from './dto/publisher-response.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PublisherService {
  private readonly logger = new Logger(PublisherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async publishVideo(
    publishDto: PublishVideoDto,
  ): Promise<PublisherResponseDto> {
    const { videoId, platform, title, description, tags } = publishDto;

    // Retrieve video record from DB
    const videoRecord = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!videoRecord || !videoRecord.finalS3Url) {
      throw new HttpException(
        'Video not found or not completed',
        HttpStatus.BAD_REQUEST,
      );
    }

    let platformVideoId = '';
    let publishLogs = {};

    if (platform === 'YOUTUBE') {
      // YouTube API integration
      const youtubeApiKey = this.configService.get<string>('YOUTUBE_API_KEY');
      const youtubeUploadEndpoint =
        this.configService.get<string>('YOUTUBE_UPLOAD_ENDPOINT') ||
        'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status';
      try {
        const response = await firstValueFrom(
          this.httpService.post(
            youtubeUploadEndpoint,
            {
              snippet: {
                title,
                description,
                tags,
              },
              status: {
                privacyStatus: 'public', // or 'private' / 'unlisted'
              },
              media: {
                body: videoRecord.finalS3Url, // TODO: Replace with actual file stream if required
              },
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${youtubeApiKey}`,
              },
            },
          ),
        );
        platformVideoId = response.data.id;
        publishLogs = response.data;
      } catch (error) {
        this.logger.error('YouTube upload failed', error.message);
        throw new HttpException(
          'YouTube upload failed',
          HttpStatus.BAD_GATEWAY,
        );
      }
    } else if (platform === 'TIKTOK') {
      // TODO: Integrate TikTok API for video upload or use simulation for development
      platformVideoId = 'SIMULATED_TIKTOK_ID';
      publishLogs = { message: 'Simulated TikTok upload' };
    } else if (platform === 'FACEBOOK') {
      // TODO: Integrate Facebook Video API for upload
      platformVideoId = 'SIMULATED_FACEBOOK_ID';
      publishLogs = { message: 'Simulated Facebook upload' };
    } else {
      throw new HttpException('Unsupported platform', HttpStatus.BAD_REQUEST);
    }

    // Create PublishingHistory record in the database
    const publishingHistory = await this.prisma.publishingHistory.create({
      data: {
        videoId,
        platform,
        platformVideoId,
        publishStatus: 'success', // Adjust as needed based on API response
        publishLogs,
      },
    });

    const responseDto: PublisherResponseDto = {
      id: publishingHistory.id,
      videoId: publishingHistory.videoId,
      platform: publishingHistory.platform,
      platformVideoId: publishingHistory.platformVideoId,
      publishStatus: publishingHistory.publishStatus,
      publishLogs: publishingHistory.publishLogs,
      createdAt: publishingHistory.createdAt,
      updatedAt: publishingHistory.updatedAt,
    };

    return responseDto;
  }
}
