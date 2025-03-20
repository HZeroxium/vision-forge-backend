// src/videos/videos.service.ts
import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { PrismaService } from 'src/database/prisma.service';
import { AIService } from 'src/ai/ai.service';
import { VideoResponseDto } from './dto/video-response.dto';
import { VideosPaginationDto } from './dto/videos-pagination.dto';

@Injectable()
export class VideosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}
  mapVideoToResponse(video: any): VideoResponseDto {
    return {
      id: video.id,
      userId: video.userId,
      scriptId: video.scriptId,
      status: video.status,
      url: video.url,
      thumbnailUrl: video.thumbnailUrl,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    };
  }
  /**
   * Create a new video asset.
   * 1. Call AIService to generate the video based on the provided image and audio URLs.
   * 2. Save the generated video record into the database.
   * @param createVideoDto - DTO for creating video.
   * @param userId - ID of the authenticated user.
   */
  async createVideo(
    createVideoDto: CreateVideoDto,
    userId: string,
  ): Promise<VideoResponseDto> {
    const { imageUrls, audioUrl, transitionDuration } = createVideoDto;
    if (!imageUrls || imageUrls.length === 0 || !audioUrl) {
      throw new BadRequestException('Image URLs and audio URL are required.');
    }

    // Call AIService to generate the video (using dummy endpoint for testing)
    let generatedVideo;
    try {
      // Choose the video generation mode: 'simple' or 'full'
      generatedVideo = await this.aiService.createVideo(
        {
          image_urls: imageUrls,
          audio_url: audioUrl,
          transition_duration: transitionDuration,
        },
        'simple', // For this example, we use 'simple' mode (slideshow)
        true,
      );
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

    // Save the generated video record into the database.
    let newVideo;
    try {
      newVideo = await this.prisma.video.create({
        data: {
          userId,
          status: 'COMPLETED', // Assuming video generation is complete
          url: generatedVideo.video_url,
          // thumbnailUrl can be set later if available.
        },
      });
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
   * Retrieve a paginated list of video assets.
   * @param page - Page number (default 1).
   * @param limit - Number of records per page (default 10).
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<VideosPaginationDto> {
    const skip = (page - 1) * limit;
    const [videos, totalCount] = await this.prisma.$transaction([
      this.prisma.video.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.video.count({ where: { deletedAt: null } }),
    ]);
    const totalPages = Math.ceil(totalCount / limit);
    const videoResponses = videos.map((video) =>
      this.mapVideoToResponse(video),
    );
    return { totalCount, page, limit, totalPages, videos: videoResponses };
  }

  /**
   * Retrieve a single video asset by ID.
   * @param id - The ID of the video.
   */
  async findOne(id: string): Promise<VideoResponseDto> {
    const video = await this.prisma.video.findUnique({
      where: { id, deletedAt: null },
    });
    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found.`);
    }
    return this.mapVideoToResponse(video);
  }

  /**
   * Update an existing video asset.
   * @param id - The ID of the video to update.
   * @param updateVideoDto - DTO containing update fields.
   */
  async update(
    id: string,
    updateVideoDto: UpdateVideoDto,
  ): Promise<VideoResponseDto> {
    const video = await this.prisma.video.findUnique({
      where: { id, deletedAt: null },
    });
    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found.`);
    }
    const updatedVideo = await this.prisma.video.update({
      where: { id },
      data: updateVideoDto,
    });
    return this.mapVideoToResponse(updatedVideo);
  }

  /**
   * Soft delete a video asset.
   * @param id - The ID of the video to delete.
   */
  async remove(id: string): Promise<VideoResponseDto> {
    const video = await this.prisma.video.findUnique({
      where: { id, deletedAt: null },
    });
    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found.`);
    }
    const deletedVideo = await this.prisma.video.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return this.mapVideoToResponse(deletedVideo);
  }
}
