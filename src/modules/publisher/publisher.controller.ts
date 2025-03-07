// modules/publisher/publisher.controller.ts

import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PublisherService } from './publisher.service';
import { PublishVideoDto } from './dto/publish-video.dto';
import { PublisherResponseDto } from './dto/publisher-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('publisher')
export class PublisherController {
  constructor(private readonly publisherService: PublisherService) {}

  @UseGuards(JwtAuthGuard)
  @Post('publish')
  async publishVideo(
    @Body() publishVideoDto: PublishVideoDto,
    @Req() req: any, // JWT injected user
  ): Promise<PublisherResponseDto> {
    // Optionally: Verify ownership or permissions before publishing
    return this.publisherService.publishVideo(publishVideoDto);
  }
}
