// modules/media-gen/media-gen.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
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
  @Post('generate')
  async generateMedia(
    @Body() createMediaDto: CreateMediaDto,
    @Req() req: any, // JWT injected user
  ): Promise<MediaResponseDto> {
    // For now, videoId is assumed to be provided in the request body.
    // In production, this should be passed from previous workflow modules.
    const videoId = req.body.videoId || '// TODO: Obtain videoId from workflow';
    return this.mediaGenService.generateMedia(createMediaDto, videoId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<MediaPaginationDto> {
    return this.mediaGenService.findAll(page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<MediaResponseDto> {
    return this.mediaGenService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ): Promise<MediaResponseDto> {
    return this.mediaGenService.update(id, updateMediaDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<MediaResponseDto> {
    return this.mediaGenService.remove(id);
  }
}
