// modules/images/images.service.ts

import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { PrismaService } from 'src/database/prisma.service';
import { AIService } from 'src/ai/ai.service';
import { ImageResponseDto } from './dto/image-response.dto';
import { ImagesPaginationDto } from './dto/images-pagination.dto';
import { mapImageToResponse } from './utils';

@Injectable()
export class ImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

  /**
   * Creates a new image asset.
   * 1. Calls AIService to generate the image from the provided prompt.
   * 2. Persists the generated image record in the database.
   * @param createImageDto - Data transfer object for image creation.
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

    // Call AIService to generate the image (using dummy endpoint for testing purposes)
    let generatedImage;
    try {
      generatedImage = await this.aiService.createImage({ prompt }, true);
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

    return mapImageToResponse(newImage);
  }

  /**
   * Retrieves a paginated list of image assets.
   * @param page - Page number (default 1).
   * @param limit - Number of images per page (default 10).
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<ImagesPaginationDto> {
    const skip = (page - 1) * limit;
    const [images, totalCount] = await this.prisma.$transaction([
      this.prisma.image.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.image.count({ where: { deletedAt: null } }),
    ]);
    const totalPages = Math.ceil(totalCount / limit);
    const imageResponses = images.map((image) => mapImageToResponse(image));
    return { totalCount, page, limit, totalPages, images: imageResponses };
  }

  /**
   * Retrieves a single image asset by its ID.
   * @param id - The ID of the image.
   */
  async findOne(id: string): Promise<ImageResponseDto> {
    const image = await this.prisma.image.findUnique({
      where: { id, deletedAt: null },
    });
    if (!image) {
      throw new NotFoundException(`Image with ID ${id} not found.`);
    }
    return mapImageToResponse(image);
  }

  /**
   * Updates an existing image asset.
   * @param id - The ID of the image to update.
   * @param updateImageDto - Data transfer object containing update fields.
   */
  async update(
    id: string,
    updateImageDto: UpdateImageDto,
  ): Promise<ImageResponseDto> {
    const image = await this.prisma.image.findUnique({
      where: { id, deletedAt: null },
    });
    if (!image) {
      throw new NotFoundException(`Image with ID ${id} not found.`);
    }
    const updatedImage = await this.prisma.image.update({
      where: { id },
      data: updateImageDto,
    });
    return mapImageToResponse(updatedImage);
  }

  /**
   * Soft deletes an image asset.
   * @param id - The ID of the image to delete.
   */
  async remove(id: string): Promise<ImageResponseDto> {
    const image = await this.prisma.image.findUnique({
      where: { id, deletedAt: null },
    });
    if (!image) {
      throw new NotFoundException(`Image with ID ${id} not found.`);
    }
    const deletedImage = await this.prisma.image.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return mapImageToResponse(deletedImage);
  }
}
