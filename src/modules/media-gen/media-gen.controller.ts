// modules/media-gen/media-gen.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { MediaGenService } from './media-gen.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediaResponseDto } from './dto/media-response.dto';
import { MediaPaginationDto } from './dto/media-pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('media-gen')
export class MediaGenController {
  constructor(private readonly mediaGenService: MediaGenService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async generateMedia(
    @Body() createMediaDto: CreateMediaDto,
    @Req() req: any,
  ): Promise<MediaResponseDto> {
    return this.mediaGenService.generateImage(createMediaDto);
  }

  /**
   * Retrieve a paginated list of media assets.
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<MediaPaginationDto> {
    return this.mediaGenService.findAll(page, limit);
  }

  /**
   * Retrieve a single media asset by ID.
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<MediaResponseDto> {
    return this.mediaGenService.findOne(id);
  }

  /**
   * Update a media asset.
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ): Promise<MediaResponseDto> {
    return this.mediaGenService.update(id, updateMediaDto);
  }

  /**
   * Soft delete a media asset.
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<MediaResponseDto> {
    return this.mediaGenService.remove(id);
  }
}
