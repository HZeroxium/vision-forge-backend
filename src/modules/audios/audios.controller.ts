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
} from '@nestjs/common';
import { AudiosService } from './audios.service';
import { CreateAudioDto } from './dto/create-audio.dto';
import { UpdateAudioDto } from './dto/update-audio.dto';
import { AudioResponseDto } from './dto/audio-response.dto';
import { AudiosPaginationDto } from './dto/audios-pagination.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

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
    @Req() req: any,
  ): Promise<AudioResponseDto> {
    return this.audiosService.createAudio(createAudioDto, req.user.userId);
  }

  /**
   * Retrieve a paginated list of audio assets.
   */
  @Get()
  async findAll(
    @Query('page', new ParseIntPipe()) page: number = 1,
    @Query('limit', new ParseIntPipe()) limit: number = 10,
  ): Promise<AudiosPaginationDto> {
    return this.audiosService.findAll(page, limit);
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
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAudioDto: UpdateAudioDto,
  ): Promise<AudioResponseDto> {
    return this.audiosService.update(id, updateAudioDto);
  }

  /**
   * Soft delete an audio asset.
   */
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<AudioResponseDto> {
    return this.audiosService.remove(id);
  }
}
