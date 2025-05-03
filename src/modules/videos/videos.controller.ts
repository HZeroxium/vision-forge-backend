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
  DefaultValuePipe,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideoResponseDto } from './dto/video-response.dto';
import { VideosPaginationDto } from './dto/videos-pagination.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

interface RequestWithUser {
  user: {
    userId: string;
  };
}

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
    @Req() req: RequestWithUser,
  ): Promise<VideoResponseDto> {
    return this.videosService.createVideo(createVideoDto, req.user.userId);
  }

  /**
   * Retrieve a paginated list of video assets.
   */
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), new ParseIntPipe())
    page: number = 1,
    @Query('limit', new DefaultValuePipe(10), new ParseIntPipe())
    limit: number = 10,
    @Query('userId') userId?: string,
  ): Promise<VideosPaginationDto> {
    return this.videosService.findAll(page, limit, userId);
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
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVideoDto: UpdateVideoDto,
    @Req() req: RequestWithUser,
  ): Promise<VideoResponseDto> {
    return this.videosService.update(id, updateVideoDto, req.user.userId);
  }

  /**
   * Soft delete a video asset.
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<VideoResponseDto> {
    return this.videosService.remove(id, req.user.userId);
  }

  /**
   * Get current user's videos.
   */
  @UseGuards(JwtAuthGuard)
  @Get('user/me')
  async findMyVideos(
    @Query('page', new DefaultValuePipe(1), new ParseIntPipe())
    page: number = 1,
    @Query('limit', new DefaultValuePipe(10), new ParseIntPipe())
    limit: number = 10,
    @Req() req: RequestWithUser,
  ): Promise<VideosPaginationDto> {
    return this.videosService.findAll(page, limit, req.user.userId);
  }
}
