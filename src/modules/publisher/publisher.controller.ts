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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PublisherService } from './publisher.service';
import { PublishVideoDto } from './dto/publish-video.dto';
import { UpdatePublisherDto } from './dto/update-publisher.dto';
import { PublisherResponseDto } from './dto/publisher-response.dto';
import { PublisherPaginationDto } from './dto/publisher-pagination.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

interface RequestWithUser {
  user: {
    userId: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('publisher')
export class PublisherController {
  constructor(private readonly publisherService: PublisherService) {}

  @Post('publish')
  @HttpCode(HttpStatus.CREATED)
  async publishVideo(
    @Body() publishVideoDto: PublishVideoDto,
    @Req() req: RequestWithUser,
  ): Promise<PublisherResponseDto> {
    return this.publisherService.publishVideo(publishVideoDto, req.user.userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Req() req: RequestWithUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ): Promise<PublisherPaginationDto> {
    return this.publisherService.findAll(req.user.userId, page, limit);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<PublisherResponseDto> {
    return this.publisherService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updatePublisherDto: UpdatePublisherDto,
    @Req() req: RequestWithUser,
  ): Promise<PublisherResponseDto> {
    return this.publisherService.update(
      id,
      updatePublisherDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<PublisherResponseDto> {
    return this.publisherService.remove(id, req.user.userId);
  }
}
