// modules/videos/videos.service.ts

import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { PrismaService } from '@database/prisma.service';
import { AIService } from '@ai/ai.service';
import { VideoResponseDto } from './dto/video-response.dto';
import { VideosPaginationDto } from './dto/videos-pagination.dto';
import { VideoStatus } from '@prisma/client';
import { CreateVideoResponse } from 'src/ai/dto/fastapi.dto';
import { AppLoggerService } from '@common/logger/logger.service';
import { CacheService, CacheType } from '@/common/cache/cache.service';
import { generateCacheKey } from '@/common/cache/utils';

@Injectable()
export class VideosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly logger: AppLoggerService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Maps a Prisma Video record to VideoResponseDto.
   * Now supports including publishing history data when available.
   */
  mapVideoToResponse(video: any): VideoResponseDto {
    const response: VideoResponseDto = {
      id: video.id,
      userId: video.userId,
      scriptId: video.scriptId,
      status: video.status,
      url: video.url,
      thumbnailUrl: video.thumbnailUrl,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    };

    // Add publishing history ID if it exists in the video object
    if (video.publishingHistories && video.publishingHistories.length > 0) {
      response.publishingHistoryId = video.publishingHistories[0].id;
    }

    return response;
  }

  /**
   * Create a new video asset.
   * 1. Calls AIService to generate the video based on provided image and audio URLs.
   * 2. Saves the generated video record into the database.
   * 3. Invalidates related cache keys.
   * @param createVideoDto - DTO for creating video.
   * @param userId - ID of the authenticated user.
   */
  async createVideo(
    createVideoDto: CreateVideoDto,
    userId: string,
  ): Promise<VideoResponseDto> {
    const { imageUrls, audioUrl, transitionDuration, scriptId, scripts } =
      createVideoDto;
    if (!imageUrls || imageUrls.length === 0 || !audioUrl || !scriptId) {
      throw new BadRequestException('Image URLs and audio URL are required.');
    }

    this.logger.log(`Creating video for user ${userId}`);
    this.logger.log(`Script ID: ${scriptId}`);

    let generatedVideo: CreateVideoResponse;
    try {
      // For this example, we use 'simple' mode (slideshow).
      generatedVideo = await this.aiService.createVideo({
        image_urls: imageUrls,
        audio_url: audioUrl,
        transition_duration: transitionDuration,
        scripts,
      });
    } catch (error) {
      throw new HttpException(
        {
          errorCode: 'AI_ERROR',
          message: 'Failed to generate video from AI provider.',
          details: error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }

    let newVideo;
    try {
      newVideo = await this.prisma.video.create({
        data: {
          userId,
          scriptId,
          status: VideoStatus.COMPLETED, // Assuming generation is complete.
          url: generatedVideo.video_url,
          thumbnailUrl: imageUrls[0],
        },
      });
      // Invalidate cache for individual video and common pagination keys.
      await this.cacheService.deleteCache(
        generateCacheKey(['videos', 'findOne', newVideo.id]),
      );
      await this.cacheService.deleteCache(
        generateCacheKey(['videos', 'findAll', '1', '10']),
      );
    } catch (dbError) {
      throw new HttpException(
        {
          errorCode: 'DB_ERROR',
          message: 'Failed to save generated video.',
          details: dbError.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return this.mapVideoToResponse(newVideo);
  }

  /**
   * Retrieves a paginated list of video assets.
   * Uses caching to reduce database load.
   *
   * @param page - Page number (default 1).
   * @param limit - Number of records per page (default 10).
   * @param userId - Optional filter by user ID.
   * @returns Paginated video assets as VideosPaginationDto.
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    userId?: string,
  ): Promise<VideosPaginationDto> {
    const cacheKey = generateCacheKey([
      'videos',
      'findAll',
      page.toString(),
      limit.toString(),
      userId || 'all',
    ]);

    // Sử dụng DATA cache type
    const cached = await this.cacheService.getCache(cacheKey, CacheType.DATA);
    if (cached) {
      this.logger.log(`Cache hit for key: ${cacheKey}`);
      return JSON.parse(cached);
    }

    const skip = (page - 1) * limit;

    // Add userId filter if provided
    const whereClause: any = { deletedAt: null };
    if (userId) {
      whereClause.userId = userId;
    }

    const [videos, totalCount] = await this.prisma.$transaction([
      this.prisma.video.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          publishingHistories: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      }),
      this.prisma.video.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const videoResponses = videos.map((video) =>
      this.mapVideoToResponse(video),
    );

    const result: VideosPaginationDto = {
      totalCount,
      page,
      limit,
      totalPages,
      videos: videoResponses,
    };

    // Sử dụng DATA cache type khi lưu kết quả
    await this.cacheService.setCache(
      cacheKey,
      JSON.stringify(result),
      undefined,
      CacheType.DATA,
    );

    return result;
  }

  /**
   * Retrieves a single video asset by its ID.
   * Uses caching to reduce database load.
   *
   * @param id - The ID of the video.
   * @returns The video asset as VideoResponseDto.
   */
  async findOne(id: string): Promise<VideoResponseDto> {
    const cacheKey = generateCacheKey(['videos', 'findOne', id]);
    const cached = await this.cacheService.getCache(cacheKey, CacheType.DATA);
    if (cached) {
      this.logger.log(`Cache hit for key: ${cacheKey}`);
      return JSON.parse(cached);
    }

    const video = await this.prisma.video.findUnique({
      where: { id, deletedAt: null },
      include: {
        publishingHistories: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found.`);
    }

    const response = this.mapVideoToResponse(video);

    // Add the publishing history ID if available
    if (video.publishingHistories && video.publishingHistories.length > 0) {
      response.publishingHistoryId = video.publishingHistories[0].id;
    }

    await this.cacheService.setCache(
      cacheKey,
      JSON.stringify(response),
      undefined,
      CacheType.DATA,
    );

    return response;
  }

  /**
   * Updates an existing video asset.
   * Invalidates related cache keys after update.
   *
   * @param id - The ID of the video to update.
   * @param updateVideoDto - DTO containing update fields.
   * @param userId - The ID of the user making the request.
   * @returns The updated video asset as VideoResponseDto.
   */
  async update(
    id: string,
    updateVideoDto: UpdateVideoDto,
    userId: string,
  ): Promise<VideoResponseDto> {
    const video = await this.prisma.video.findUnique({
      where: { id, deletedAt: null },
    });

    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found.`);
    }

    // Check if the user owns the video
    if (video.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this video',
      );
    }

    const updatedVideo = await this.prisma.video.update({
      where: { id },
      data: updateVideoDto,
    });

    // Invalidate cache for this video and common pagination keys.
    await this.cacheService.deleteCache(
      generateCacheKey(['videos', 'findOne', id]),
    );
    await this.cacheService.deleteCache(
      generateCacheKey(['videos', 'findAll', '1', '10']),
    );
    await this.cacheService.deleteCache(
      generateCacheKey(['videos', 'findAll', '1', '10', userId]),
    );

    return this.mapVideoToResponse(updatedVideo);
  }

  /**
   * Soft deletes a video asset.
   * Invalidates related cache keys after deletion.
   *
   * @param id - The ID of the video to delete.
   * @param userId - The ID of the user making the request.
   * @returns The soft-deleted video asset as VideoResponseDto.
   */
  async remove(id: string, userId: string): Promise<VideoResponseDto> {
    const video = await this.prisma.video.findUnique({
      where: { id, deletedAt: null },
    });

    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found.`);
    }

    // Check if the user owns the video
    if (video.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this video',
      );
    }

    const deletedVideo = await this.prisma.video.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Invalidate cache for this video and common pagination keys.
    await this.cacheService.deleteCache(
      generateCacheKey(['videos', 'findOne', id]),
    );
    await this.cacheService.deleteCache(
      generateCacheKey(['videos', 'findAll', '1', '10']),
    );
    await this.cacheService.deleteCache(
      generateCacheKey(['videos', 'findAll', '1', '10', userId]),
    );

    return this.mapVideoToResponse(deletedVideo);
  }

  async findOneByScriptId(scriptId: string): Promise<VideoResponseDto> {
    const cacheKey = generateCacheKey([
      'videos',
      'findOneByScriptId',
      scriptId,
    ]);

    const cached = await this.cacheService.getCache(cacheKey, CacheType.DATA);
    if (cached) {
      this.logger.log(`Cache hit for key: ${cacheKey}`);
      return JSON.parse(cached);
    }

    const video = await this.prisma.video.findFirst({
      where: { scriptId, deletedAt: null },
      include: {
        publishingHistories: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!video) {
      throw new NotFoundException(
        `Video with Script ID ${scriptId} not found.`,
      );
    }

    const response = this.mapVideoToResponse(video);

    await this.cacheService.setCache(
      cacheKey,
      JSON.stringify(response),
      undefined,
      CacheType.DATA,
    );

    return response;
  }
}
