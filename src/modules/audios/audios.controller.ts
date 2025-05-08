// modules/audios/audios.controller.ts
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
import { AudiosService } from './audios.service';
import { CreateAudioDto } from './dto/create-audio.dto';
import { UpdateAudioDto } from './dto/update-audio.dto';
import { AudioResponseDto } from './dto/audio-response.dto';
import { AudiosPaginationDto } from './dto/audios-pagination.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

interface RequestWithUser {
  user: {
    userId: string;
  };
}

@Controller('audios')
export class AudiosController {
  constructor(private readonly audiosService: AudiosService) {}

  /**
   * Create a new audio asset.
   * Protected by JWT authentication.
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async createAudio(
    @Body() createAudioDto: CreateAudioDto,
    @Req() req: RequestWithUser,
  ): Promise<AudioResponseDto> {
    return this.audiosService.createAudio(createAudioDto, req.user.userId);
  }

  /**
   * Retrieve a paginated list of audio assets.
   */
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), new ParseIntPipe())
    page: number = 1,
    @Query('limit', new DefaultValuePipe(10), new ParseIntPipe())
    limit: number = 10,
    @Query('userId') userId?: string,
  ): Promise<AudiosPaginationDto> {
    return this.audiosService.findAll(page, limit, userId);
  }

  /**
   * Retrieve a single audio asset by ID.
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AudioResponseDto> {
    return this.audiosService.findOne(id);
  }

  /**
   * Update an existing audio asset.
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAudioDto: UpdateAudioDto,
    @Req() req: RequestWithUser,
  ): Promise<AudioResponseDto> {
    return this.audiosService.update(id, updateAudioDto, req.user.userId);
  }

  /**
   * Soft delete an audio asset.
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<AudioResponseDto> {
    return this.audiosService.remove(id, req.user.userId);
  }

  /**
   * Get current user's audios.
   */
  @UseGuards(JwtAuthGuard)
  @Get('user/me')
  async findMyAudios(
    @Query('page', new DefaultValuePipe(1), new ParseIntPipe())
    page: number = 1,
    @Query('limit', new DefaultValuePipe(10), new ParseIntPipe())
    limit: number = 10,
    @Req() req: RequestWithUser,
  ): Promise<AudiosPaginationDto> {
    return this.audiosService.findAll(page, limit, req.user.userId);
  }
}
