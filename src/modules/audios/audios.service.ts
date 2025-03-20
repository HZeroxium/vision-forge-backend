// modules/audios/audios.service.ts
import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { AIService } from 'src/ai/ai.service';
import { CreateAudioDto } from './dto/create-audio.dto';
import { UpdateAudioDto } from './dto/update-audio.dto';
import { AudioResponseDto } from './dto/audio-response.dto';
import { AudiosPaginationDto } from './dto/audios-pagination.dto';
import { TTSProvider } from '@prisma/client';
import { ScriptsService } from '../scripts/scripts.service';

@Injectable()
export class AudiosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly scriptsService: ScriptsService,
  ) {}

  mapAudioToResponse(audio: any): AudioResponseDto {
    return {
      id: audio.id,
      script: audio.script, // May be null if not linked to a script
      provider: audio.provider,
      voiceParams: audio.voiceParams,
      url: audio.url,
      durationSeconds: audio.durationSeconds,
      createdAt: audio.createdAt,
      updatedAt: audio.updatedAt,
    };
  }
  /**
   * Creates a new audio asset.
   * 1. Calls AIService to generate audio from the provided script.
   * 2. Saves the generated audio record into the database.
   * @param createAudioDto - DTO for creating audio.
   * @param userId - ID of the authenticated user.
   */
  async createAudio(
    createAudioDto: CreateAudioDto,
    userId: string,
  ): Promise<AudioResponseDto> {
    const { scriptId, provider } = createAudioDto;
    if (!scriptId) {
      throw new BadRequestException('Script is required.');
    }

    const _script = await this.scriptsService.findOne(scriptId);
    const script = _script.content;
    // Call AIService to generate audio (using dummy endpoint for testing)
    let generatedAudio;
    try {
      generatedAudio = await this.aiService.createAudio({ script }, provider);
    } catch (error) {
      throw new HttpException(
        {
          errorCode: 'AI_ERROR',
          message: 'Failed to generate audio from AI provider.',
          details: error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Save the generated audio asset into the database.
    let newAudio;
    try {
      newAudio = await this.prisma.audio.create({
        data: {
          userId,
          scriptId,
          provider: provider || TTSProvider.OPENAI,
          // voiceParams can be extended later (set as empty JSON for now)
          voiceParams: {},
          url: generatedAudio.audio_url,
          durationSeconds: generatedAudio.audio_duration, // Ideally, duration should be determined by another process.
        },
      });
    } catch (dbError) {
      throw new HttpException(
        {
          errorCode: 'DB_ERROR',
          message: 'Failed to save generated audio.',
          details: dbError.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return this.mapAudioToResponse(newAudio);
  }

  /**
   * Retrieves a paginated list of audio assets.
   * @param page - Page number (default 1).
   * @param limit - Number of records per page (default 10).
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<AudiosPaginationDto> {
    const skip = (page - 1) * limit;
    const [audios, totalCount] = await this.prisma.$transaction([
      this.prisma.audio.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.audio.count({ where: { deletedAt: null } }),
    ]);
    const totalPages = Math.ceil(totalCount / limit);
    const audioResponses = audios.map((audio) =>
      this.mapAudioToResponse(audio),
    );
    return { totalCount, page, limit, totalPages, audios: audioResponses };
  }

  /**
   * Retrieves a single audio asset by its ID.
   * @param id - The ID of the audio asset.
   */
  async findOne(id: string): Promise<AudioResponseDto> {
    const audio = await this.prisma.audio.findUnique({
      where: { id, deletedAt: null },
    });
    if (!audio) {
      throw new NotFoundException(`Audio with ID ${id} not found.`);
    }
    return this.mapAudioToResponse(audio);
  }

  /**
   * Updates an existing audio asset.
   * @param id - The ID of the audio asset to update.
   * @param updateAudioDto - DTO with updated fields.
   */
  async update(
    id: string,
    updateAudioDto: UpdateAudioDto,
  ): Promise<AudioResponseDto> {
    const audio = await this.prisma.audio.findUnique({
      where: { id, deletedAt: null },
    });
    if (!audio) {
      throw new NotFoundException(`Audio with ID ${id} not found.`);
    }
    const updatedAudio = await this.prisma.audio.update({
      where: { id },
      data: updateAudioDto,
    });
    return this.mapAudioToResponse(updatedAudio);
  }

  /**
   * Soft deletes an audio asset.
   * @param id - The ID of the audio asset to delete.
   */
  async remove(id: string): Promise<AudioResponseDto> {
    const audio = await this.prisma.audio.findUnique({
      where: { id, deletedAt: null },
    });
    if (!audio) {
      throw new NotFoundException(`Audio with ID ${id} not found.`);
    }
    const deletedAudio = await this.prisma.audio.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return this.mapAudioToResponse(deletedAudio);
  }
}
