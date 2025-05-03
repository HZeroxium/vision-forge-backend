// modules/images/images.service.ts

import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { PrismaService } from '@database/prisma.service';
import { AIService } from '@ai/ai.service';
import { ImageResponseDto } from './dto/image-response.dto';
import { ImagesPaginationDto } from './dto/images-pagination.dto';
import { CacheService, CacheType } from '@/common/cache/cache.service';
import { generateCacheKey } from '@/common/cache/utils';
import { AppLoggerService } from '@/common/logger/logger.service';

@Injectable()
export class ImagesService {
  private readonly logger = this.appLogger;
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly cacheService: CacheService,
    private readonly appLogger: AppLoggerService,
  ) {}

  /**
   * Maps a Prisma Image record to ImageResponseDto.
   */
  mapImageToResponse(image: any): ImageResponseDto {
    return {
      id: image.id,
      prompt: image.prompt,
      style: image.style,
      url: image.url,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    };
  }

  /**
   * Creates a new image asset.
   * 1. Calls AIService to generate the image from the provided prompt.
   * 2. Persists the generated image record in the database.
   * 3. Invalidates related cache keys.
   * @param createImageDto - DTO for image creation.
   * @param userId - ID of the authenticated user.
   */
  async createImage(
    createImageDto: CreateImageDto,
    userId: string,
  ): Promise<ImageResponseDto> {
    const { prompt, style } = createImageDto;
    if (!prompt || !style) {
      throw new BadRequestException('Prompt and style are required.');
    }

    // Call AIService to generate the image (using dummy endpoint for testing)
    let generatedImage;
    try {
      generatedImage = await this.aiService.createImage({ prompt });
    } catch (error) {
      throw new HttpException(
        {
          errorCode: 'AI_ERROR',
          message: 'Failed to generate image from AI provider.',
          details: error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Save the generated image record to the database.
    let newImage;
    try {
      newImage = await this.prisma.image.create({
        data: {
          userId,
          prompt,
          style,
          url: generatedImage.image_url, // General URL for the image
        },
      });
      // Invalidate cache for individual image and general pagination.
      await this.cacheService.deleteCache(
        generateCacheKey(['images', 'findOne', newImage.id]),
      );
      await this.cacheService.deleteCache(
        generateCacheKey(['images', 'findAll', '1', '10']),
      );
      return this.mapImageToResponse(newImage);
    } catch (dbError) {
      throw new HttpException(
        {
          errorCode: 'DB_ERROR',
          message: 'Failed to save generated image.',
          details: dbError.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Retrieves a paginated list of image assets.
   * Uses caching to reduce database load.
   * @param page - Page number (default 1).
   * @param limit - Number of images per page (default 10).
   * @param userId - Optional filter by user ID.
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    userId?: string,
  ): Promise<ImagesPaginationDto> {
    const cacheKey = generateCacheKey([
      'images',
      'findAll',
      page.toString(),
      limit.toString(),
      userId || 'all',
    ]);

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

    const [images, totalCount] = await this.prisma.$transaction([
      this.prisma.image.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.image.count({ where: whereClause }),
    ]);
    const totalPages = Math.ceil(totalCount / limit);
    const imageResponses = images.map((image) =>
      this.mapImageToResponse(image),
    );
    const result: ImagesPaginationDto = {
      totalCount,
      page,
      limit,
      totalPages,
      images: imageResponses,
    };

    await this.cacheService.setCache(
      cacheKey,
      JSON.stringify(result),
      undefined,
      CacheType.DATA,
    );
    return result;
  }

  /**
   * Retrieves a single image asset by its ID.
   * Uses caching to reduce database load.
   * @param id - The ID of the image.
   */
  async findOne(id: string): Promise<ImageResponseDto> {
    const cacheKey = generateCacheKey(['images', 'findOne', id]);
    const cached = await this.cacheService.getCache(cacheKey, CacheType.DATA);
    if (cached) {
      this.logger.log(`Cache hit for key: ${cacheKey}`);
      return JSON.parse(cached);
    }
    const image = await this.prisma.image.findUnique({
      where: { id, deletedAt: null },
    });
    if (!image) {
      throw new NotFoundException(`Image with ID ${id} not found.`);
    }
    const response = this.mapImageToResponse(image);
    await this.cacheService.setCache(
      cacheKey,
      JSON.stringify(response),
      undefined,
      CacheType.DATA,
    );
    return response;
  }

  /**
   * Updates an existing image asset.
   * Invalidate related cache keys after update.
   * @param id - The ID of the image to update.
   * @param updateImageDto - DTO containing update fields.
   * @param userId - The ID of the user making the request.
   */
  async update(
    id: string,
    updateImageDto: UpdateImageDto,
    userId: string,
  ): Promise<ImageResponseDto> {
    const image = await this.prisma.image.findUnique({
      where: { id, deletedAt: null },
    });

    if (!image) {
      throw new NotFoundException(`Image with ID ${id} not found.`);
    }

    // Check if the user owns the image
    if (image.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this image',
      );
    }

    const updatedImage = await this.prisma.image.update({
      where: { id },
      data: updateImageDto,
    });

    // Invalidate cache
    await this.cacheService.deleteCache(
      generateCacheKey(['images', 'findOne', id]),
    );
    await this.cacheService.deleteCache(
      generateCacheKey(['images', 'findAll', '1', '10']),
    );
    await this.cacheService.deleteCache(
      generateCacheKey(['images', 'findAll', '1', '10', userId]),
    );

    return this.mapImageToResponse(updatedImage);
  }

  /**
   * Soft deletes an image asset.
   * Invalidate related cache keys after deletion.
   * @param id - The ID of the image to delete.
   * @param userId - The ID of the user making the request.
   */
  async remove(id: string, userId: string): Promise<ImageResponseDto> {
    const image = await this.prisma.image.findUnique({
      where: { id, deletedAt: null },
    });

    if (!image) {
      throw new NotFoundException(`Image with ID ${id} not found.`);
    }

    // Check if the user owns the image
    if (image.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this image',
      );
    }

    const deletedImage = await this.prisma.image.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Invalidate cache
    await this.cacheService.deleteCache(
      generateCacheKey(['images', 'findOne', id]),
    );
    await this.cacheService.deleteCache(
      generateCacheKey(['images', 'findAll', '1', '10']),
    );
    await this.cacheService.deleteCache(
      generateCacheKey(['images', 'findAll', '1', '10', userId]),
    );

    return this.mapImageToResponse(deletedImage);
  }
}
