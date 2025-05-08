// modules/publisher/publisher.service.ts

import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PublishVideoDto } from './dto/publish-video.dto';
import { UpdatePublisherDto } from './dto/update-publisher.dto';
import { PrismaService } from '@database/prisma.service';
import { PublisherResponseDto } from './dto/publisher-response.dto';
import { PublisherPaginationDto } from './dto/publisher-pagination.dto';
import { ConfigService } from '@nestjs/config';
import { YouTubeService } from '@/modules/youtube/youtube.service';
import { VideoStatus, PublishPlatform, Prisma } from '@prisma/client';

@Injectable()
export class PublisherService {
  private readonly logger = new Logger(PublisherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly youtubeService: YouTubeService,
  ) {}

  /**
   * Map database record to PublisherResponseDto
   */
  private mapToResponse(publishingHistory: any): PublisherResponseDto {
    let platformVideoUrl: string | undefined;

    // Generate platform-specific URLs
    if (publishingHistory.platform === PublishPlatform.YOUTUBE) {
      platformVideoUrl = `https://www.youtube.com/watch?v=${publishingHistory.platformVideoId}`;
    } else if (publishingHistory.platform === PublishPlatform.TIKTOK) {
      platformVideoUrl = `https://www.tiktok.com/@user/video/${publishingHistory.platformVideoId}`;
    } else if (publishingHistory.platform === PublishPlatform.FACEBOOK) {
      platformVideoUrl = `https://www.facebook.com/watch/?v=${publishingHistory.platformVideoId}`;
    }

    return {
      id: publishingHistory.id,
      videoId: publishingHistory.videoId,
      platform: publishingHistory.platform,
      platformVideoId: publishingHistory.platformVideoId,
      publishStatus: publishingHistory.publishStatus,
      publishLogs: publishingHistory.publishLogs,
      createdAt: publishingHistory.createdAt,
      updatedAt: publishingHistory.updatedAt,
      platformVideoUrl,
    };
  }

  /**
   * Verify if a user has access to a video
   */
  private async verifyVideoOwnership(
    videoId: string,
    userId: string,
  ): Promise<void> {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: { userId: true },
    });

    if (!video) {
      throw new NotFoundException(`Video with ID ${videoId} not found`);
    }

    if (video.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this video',
      );
    }
  }

  /**
   * Publish a video to YouTube
   */
  async publishVideo(
    publishDto: PublishVideoDto,
    userId: string,
  ): Promise<PublisherResponseDto> {
    const { videoId, title, description, tags, privacyStatus } = publishDto;

    // Verify video ownership
    await this.verifyVideoOwnership(videoId, userId);

    // Retrieve video record from DB
    const videoRecord = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!videoRecord) {
      throw new HttpException('Video not found', HttpStatus.NOT_FOUND);
    }

    if (videoRecord.status !== VideoStatus.COMPLETED) {
      throw new HttpException(
        'Video is not ready for publishing. Status must be COMPLETED.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!videoRecord.url) {
      throw new HttpException('Video URL is missing', HttpStatus.BAD_REQUEST);
    }

    try {
      this.logger.log(`Starting YouTube upload process for video: ${videoId}`);

      // Upload to YouTube using YouTubeService
      const result = await this.youtubeService.uploadVideo(
        userId,
        videoId,
        title,
        description,
        tags,
        privacyStatus,
      );

      this.logger.log(
        `YouTube upload successful with ID: ${result.youtubeVideoId}`,
      );

      // Không cần cập nhật trạng thái video nữa vì đã được xử lý trong YouTubeVideoService
      const publishingHistory = await this.prisma.publishingHistory.findUnique({
        where: { id: result.publishingHistoryId },
      });

      if (!publishingHistory) {
        throw new HttpException(
          'Publishing history was not created properly',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Kiểm tra lại trạng thái video để đảm bảo tính nhất quán
      const updatedVideo = await this.prisma.video.findUnique({
        where: { id: videoId },
      });

      if (updatedVideo?.status !== VideoStatus.PUBLISHED) {
        this.logger.warn(
          `Video ${videoId} status wasn't updated properly, fixing now`,
        );
        await this.prisma.video.update({
          where: { id: videoId },
          data: { status: VideoStatus.PUBLISHED },
        });
      }

      return this.mapToResponse(publishingHistory);
    } catch (error) {
      this.logger.error(`YouTube upload failed: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to publish to YouTube: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Find all publishing histories for a specific user with pagination
   */
  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PublisherPaginationDto> {
    page = Math.max(1, page); // Ensure page is at least 1
    limit = Math.min(100, Math.max(1, limit)); // Limit between 1 and 100
    const skip = (page - 1) * limit;

    // Join with video to filter by userId
    const [histories, totalCount] = await this.prisma.$transaction([
      this.prisma.publishingHistory.findMany({
        where: {
          video: {
            userId: userId,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          video: {
            select: {
              userId: true,
            },
          },
        },
      }),
      this.prisma.publishingHistory.count({
        where: {
          video: {
            userId: userId,
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const responses = histories.map((history) => this.mapToResponse(history));

    return {
      totalCount,
      page,
      limit,
      totalPages,
      publishingHistories: responses,
    };
  }

  /**
   * Find one publishing history by ID, ensuring user ownership
   */
  async findOne(id: string, userId: string): Promise<PublisherResponseDto> {
    const history = await this.prisma.publishingHistory.findUnique({
      where: { id },
      include: {
        video: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!history) {
      throw new NotFoundException(`Publishing record with ID ${id} not found`);
    }

    // Check ownership
    if (history.video.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this publishing history',
      );
    }

    return this.mapToResponse(history);
  }

  /**
   * Update a publishing history record, ensuring user ownership
   */
  async update(
    id: string,
    updateDto: UpdatePublisherDto,
    userId: string,
  ): Promise<PublisherResponseDto> {
    // First check if record exists and user owns it
    const history = await this.prisma.publishingHistory.findUnique({
      where: { id },
      include: {
        video: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!history) {
      throw new NotFoundException(`Publishing record with ID ${id} not found`);
    }

    // Check ownership
    if (history.video.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this publishing history',
      );
    }

    // We can't change the videoId or platform after creation
    const { videoId, platform, ...updateFields } = updateDto;

    // Create a properly typed update object that Prisma accepts
    const updateData: Prisma.PublishingHistoryUpdateInput = {
      ...(updateFields.title && {
        publishLogs: {
          update: {
            title: updateFields.title,
          },
        },
      }),
      ...(updateFields.description && {
        publishLogs: {
          update: {
            description: updateFields.description,
          },
        },
      }),
      ...(updateFields.tags && {
        publishLogs: {
          update: {
            tags: updateFields.tags,
          },
        },
      }),
      ...(updateFields.privacyStatus && {
        publishLogs: {
          update: {
            privacyStatus: updateFields.privacyStatus,
          },
        },
      }),
    };

    // Currently only supporting title, description, and tags updates
    const updatedHistory = await this.prisma.publishingHistory.update({
      where: { id },
      data: updateData,
    });

    return this.mapToResponse(updatedHistory);
  }

  /**
   * Remove a publishing history record, ensuring user ownership
   */
  async remove(id: string, userId: string): Promise<PublisherResponseDto> {
    // First check if record exists and user owns it
    const history = await this.prisma.publishingHistory.findUnique({
      where: { id },
      include: {
        video: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!history) {
      throw new NotFoundException(`Publishing record with ID ${id} not found`);
    }

    // Check ownership
    if (history.video.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this publishing history',
      );
    }

    // Soft delete is preferred, but we'll use real delete as per your current implementation
    const deletedHistory = await this.prisma.publishingHistory.delete({
      where: { id },
    });

    return this.mapToResponse(deletedHistory);
  }
}
