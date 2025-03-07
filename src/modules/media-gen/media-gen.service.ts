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
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MediaGenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // Reusable mapper for MediaAsset to MediaResponseDto
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

  // Create/Generate media using an external API
  async generateMedia(
    createMediaDto: CreateMediaDto,
    videoId: string,
  ): Promise<MediaResponseDto> {
    const { prompt, style, mediaType } = createMediaDto;
    const requestBody = {
      prompt,
      style,
      mediaType: mediaType.toLowerCase(), // expected: 'image' or 'video'
      // TODO: Add additional parameters if required (e.g., resolution)
    };

    // Primary API configuration using Hugging Face Inference API
    const hfApiKey = this.configService.get<string>('HUGGINGFACE_API_KEY');
    const hfEndpoint =
      this.configService.get<string>('HUGGINGFACE_MEDIA_ENDPOINT') ||
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion';

    let mediaUrl: string;
    try {
      const response = await firstValueFrom(
        this.httpService.post(hfEndpoint, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hfApiKey}`,
          },
        }),
      );
      // Assume API returns media URL in response.data.url
      mediaUrl = response.data.url;
      if (!mediaUrl) {
        throw new Error('No media URL returned');
      }
    } catch (error) {
      // TODO: Implement fallback to alternative API such as DALL-E or Midjourney if available
      throw new HttpException(
        'Failed to generate media content',
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Save the media asset in the database
    const newMedia = await this.prisma.mediaAsset.create({
      data: {
        videoId,
        type: mediaType,
        prompt,
        style,
        s3Url: mediaUrl, // External URL or S3 URL
      },
    });
    return this.mapToResponse(newMedia);
  }

  // Retrieve paginated list of media assets
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

  // Retrieve a single media asset by ID
  async findOne(id: string): Promise<MediaResponseDto> {
    const media = await this.prisma.mediaAsset.findUnique({
      where: { id, deletedAt: null },
    });
    if (!media) {
      throw new NotFoundException(`Media asset with ID ${id} not found`);
    }
    return this.mapToResponse(media);
  }

  // Update a media asset
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

  // Soft delete a media asset
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
