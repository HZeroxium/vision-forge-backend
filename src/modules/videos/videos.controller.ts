// modules/videos/videos.controller.ts
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
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideoResponseDto } from './dto/video-response.dto';
import { VideosPaginationDto } from './dto/videos-pagination.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  /**
   * Create a new video asset.
   * Protected by JWT authentication.
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async createVideo(
    @Body() createVideoDto: CreateVideoDto,
    @Req() req: any,
  ): Promise<VideoResponseDto> {
    return this.videosService.createVideo(createVideoDto, req.user.userId);
  }

  /**
   * Retrieve a paginated list of video assets.
   */
  @Get()
  async findAll(
    @Query('page', new ParseIntPipe()) page: number = 1,
    @Query('limit', new ParseIntPipe()) limit: number = 10,
  ): Promise<VideosPaginationDto> {
    return this.videosService.findAll(page, limit);
  }

  /**
   * Retrieve a single video asset by ID.
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<VideoResponseDto> {
    return this.videosService.findOne(id);
  }

  /**
   * Update an existing video asset.
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVideoDto: UpdateVideoDto,
  ): Promise<VideoResponseDto> {
    return this.videosService.update(id, updateVideoDto);
  }

  /**
   * Soft delete a video asset.
   */
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<VideoResponseDto> {
    return this.videosService.remove(id);
  }
}
