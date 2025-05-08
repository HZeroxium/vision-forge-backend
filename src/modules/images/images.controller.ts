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
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { ImageResponseDto } from './dto/image-response.dto';
import { ImagesPaginationDto } from './dto/images-pagination.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

interface RequestWithUser {
  user: {
    userId: string;
  };
}

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
    @Req() req: RequestWithUser,
  ): Promise<ImageResponseDto> {
    return this.imagesService.createImage(createImageDto, req.user.userId);
  }

  /**
   * Get a paginated list of images.
   */
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), new ParseIntPipe())
    page: number = 1,
    @Query('limit', new DefaultValuePipe(10), new ParseIntPipe())
    limit: number = 10,
    @Query('userId') userId?: string,
  ): Promise<ImagesPaginationDto> {
    return this.imagesService.findAll(page, limit, userId);
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
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateImageDto: UpdateImageDto,
    @Req() req: RequestWithUser,
  ): Promise<ImageResponseDto> {
    return this.imagesService.update(id, updateImageDto, req.user.userId);
  }

  /**
   * Soft delete an image asset.
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ImageResponseDto> {
    return this.imagesService.remove(id, req.user.userId);
  }

  /**
   * Get current user's images.
   */
  @UseGuards(JwtAuthGuard)
  @Get('user/me')
  async findMyImages(
    @Query('page', new DefaultValuePipe(1), new ParseIntPipe())
    page: number = 1,
    @Query('limit', new DefaultValuePipe(10), new ParseIntPipe())
    limit: number = 10,
    @Req() req: RequestWithUser,
  ): Promise<ImagesPaginationDto> {
    return this.imagesService.findAll(page, limit, req.user.userId);
  }
}
