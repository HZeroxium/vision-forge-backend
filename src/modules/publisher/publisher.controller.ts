// modules/publisher/publisher.controller.ts

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
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { PublisherService } from './publisher.service';
import { PublishVideoDto } from './dto/publish-video.dto';
import { UpdatePublisherDto } from './dto/update-publisher.dto';
import { PublisherResponseDto } from './dto/publisher-response.dto';
import { PublisherPaginationDto } from './dto/publisher-pagination.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

@Controller('publisher')
export class PublisherController {
  constructor(private readonly publisherService: PublisherService) {}

  @UseGuards(JwtAuthGuard)
  @Post('publish')
  async publishVideo(
    @Body() publishVideoDto: PublishVideoDto,
    @Req() req: any, // JWT injected user
  ): Promise<PublisherResponseDto> {
    // Optionally verify ownership/permissions here
    return this.publisherService.publishVideo(publishVideoDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), new ParseIntPipe())
    page: number = 1,
    @Query('limit', new DefaultValuePipe(10), new ParseIntPipe())
    limit: number = 10,
  ): Promise<PublisherPaginationDto> {
    return this.publisherService.findAll(page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PublisherResponseDto> {
    return this.publisherService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePublisherDto: UpdatePublisherDto,
  ): Promise<PublisherResponseDto> {
    return this.publisherService.update(id, updatePublisherDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<PublisherResponseDto> {
    return this.publisherService.remove(id);
  }
}
