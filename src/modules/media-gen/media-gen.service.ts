// modules/media-gen/media-gen.service.ts

import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediaResponseDto } from './dto/media-response.dto';
import { MediaPaginationDto } from './dto/media-pagination.dto';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from 'src/common/logger/logger.service';
import { AIService } from 'src/ai/ai.service';
import { MediaType } from '@prisma/client';

@Injectable()
export class MediaGenService {
  private readonly logger = new AppLoggerService();
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly aiService: AIService,
  ) {}

  // Reusable helper to map a MediaAsset record to MediaResponseDto
  private mapToResponse(media: any): MediaResponseDto {
    return {
      id: media.id,
      prompt: media.prompt,
      style: media.style,
      mediaType: media.type,
      s3Url: media.s3Url,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    };
  }

  async generateImage(
    createMediaDto: CreateMediaDto,
  ): Promise<MediaResponseDto> {
    const { prompt, style } = createMediaDto;

    if (!prompt || !style) {
      throw new BadRequestException(
        'Prompt, style, and mediaType are required.',
      );
    }

    // Save media asset to database
    const generatedMedia = await this.aiService.createImage(
      {
        prompt,
      },
      true,
    );
    let newMedia;
    try {
      newMedia = await this.prisma.mediaAsset.create({
        data: {
          prompt,
          style,
          type: MediaType.IMAGE,
          s3Url: generatedMedia.image_url,
        },
      });
    } catch (dbError) {
      this.logger.error('Database error:', dbError);
      throw new HttpException(
        {
          errorCode: 'DB_ERROR',
          message: 'Failed to save media asset.',
          details: dbError.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return this.mapToResponse(newMedia);
  }

  /**
   * Retrieves a paginated list of media assets.
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<MediaPaginationDto> {
    page = parseInt(page.toString(), 10);
    limit = parseInt(limit.toString(), 10);
    const skip = (page - 1) * limit;
    const [mediaAssets, totalCount] = await this.prisma.$transaction([
      this.prisma.mediaAsset.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.mediaAsset.count({ where: { deletedAt: null } }),
    ]);
    const totalPages = Math.ceil(totalCount / limit);
    const responses = mediaAssets.map((asset) => this.mapToResponse(asset));
    return { totalCount, page, limit, totalPages, mediaAssets: responses };
  }

  /**
   * Retrieves a single media asset by ID.
   */
  async findOne(id: string): Promise<MediaResponseDto> {
    const media = await this.prisma.mediaAsset.findUnique({
      where: { id, deletedAt: null },
    });
    if (!media) {
      throw new NotFoundException(`Media asset with ID ${id} not found`);
    }
    return this.mapToResponse(media);
  }

  /**
   * Updates an existing media asset.
   */
  async update(
    id: string,
    updateMediaDto: UpdateMediaDto,
  ): Promise<MediaResponseDto> {
    const media = await this.prisma.mediaAsset.findUnique({
      where: { id, deletedAt: null },
    });
    if (!media) {
      throw new NotFoundException(`Media asset with ID ${id} not found`);
    }
    const updatedMedia = await this.prisma.mediaAsset.update({
      where: { id },
      data: updateMediaDto,
    });
    return this.mapToResponse(updatedMedia);
  }

  /**
   * Soft deletes a media asset.
   */
  async remove(id: string): Promise<MediaResponseDto> {
    const media = await this.prisma.mediaAsset.findUnique({
      where: { id, deletedAt: null },
    });
    if (!media) {
      throw new NotFoundException(`Media asset with ID ${id} not found`);
    }
    const deletedMedia = await this.prisma.mediaAsset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return this.mapToResponse(deletedMedia);
  }
}
