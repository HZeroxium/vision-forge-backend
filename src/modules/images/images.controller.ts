// modules/images/images.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { ImageResponseDto } from './dto/image-response.dto';
import { ImagesPaginationDto } from './dto/images-pagination.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  /**
   * Create a new image asset.
   * Protected by JWT authentication.
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async createImage(
    @Body() createImageDto: CreateImageDto,
    @Req() req: any,
  ): Promise<ImageResponseDto> {
    return this.imagesService.createImage(createImageDto, req.user.userId);
  }

  /**
   * Get a paginated list of images.
   */
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<ImagesPaginationDto> {
    return this.imagesService.findAll(page, limit);
  }

  /**
   * Get a single image asset by ID.
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ImageResponseDto> {
    return this.imagesService.findOne(id);
  }

  /**
   * Update an existing image asset.
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateImageDto: UpdateImageDto,
  ): Promise<ImageResponseDto> {
    return this.imagesService.update(id, updateImageDto);
  }

  /**
   * Soft delete an image asset.
   */
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ImageResponseDto> {
    return this.imagesService.remove(id);
  }
}
