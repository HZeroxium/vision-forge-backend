// modules/media-gen/media-gen.controller.ts

import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { MediaGenService } from './media-gen.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { MediaResponseDto } from './dto/media-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('media-gen')
export class MediaGenController {
  constructor(private readonly mediaGenService: MediaGenService) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  async generateMedia(
    @Body() createMediaDto: CreateMediaDto,
    @Req() req: any, // User info injected by JwtAuthGuard
  ): Promise<MediaResponseDto> {
    // For now, videoId is assumed to be provided in the request body.
    // In production, this should be passed from previous workflow modules.
    const videoId = req.body.videoId || '// TODO: Obtain videoId from workflow';
    return this.mediaGenService.generateMedia(createMediaDto, videoId);
  }
}
