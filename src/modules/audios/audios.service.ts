// modules/audios/audios.service.ts
import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { AIService } from '@ai/ai.service';
import { CreateAudioDto } from './dto/create-audio.dto';
import { UpdateAudioDto } from './dto/update-audio.dto';
import { AudioResponseDto } from './dto/audio-response.dto';
import { AudiosPaginationDto } from './dto/audios-pagination.dto';
import { TTSProvider } from '@prisma/client';
import { ScriptsService } from '@scripts/scripts.service';
import { CacheService, CacheType } from '@/common/cache/cache.service';
import { generateCacheKey } from '@/common/cache/utils';
import { AppLoggerService } from '@/common/logger/logger.service';

@Injectable()
export class AudiosService {
  private readonly logger = this.appLogger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly scriptsService: ScriptsService,
    private readonly cacheService: CacheService,
    private readonly appLogger: AppLoggerService,
  ) {}

  /**
   * Maps a Prisma Audio record to AudioResponseDto.
   */
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
   * 1. Retrieves the associated script content.
   * 2. Calls AIService to generate audio from the provided script.
   * 3. Persists the generated audio record in the database.
   * 4. Invalidates related cache keys.
   *
   * @param createAudioDto - DTO for creating audio.
   * @param userId - ID of the authenticated user.
   * @returns The created audio asset as AudioResponseDto.
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

    let newAudio;
    try {
      newAudio = await this.prisma.audio.create({
        data: {
          userId,
          scriptId,
          provider: provider || TTSProvider.OPENAI,
          voiceParams: {},
          url: generatedAudio.audio_url,
          durationSeconds: generatedAudio.audio_duration,
        },
      });
      // Invalidate cache for this audio and common pagination keys.
      await this.cacheService.deleteCache(
        generateCacheKey(['audios', 'findOne', newAudio.id]),
      );
      await this.cacheService.deleteCache(
        generateCacheKey(['audios', 'findAll', '1', '10']),
      );
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
   * Uses caching to reduce database load.
   *
   * @param page - Page number (default 1).
   * @param limit - Number of records per page (default 10).
   * @param userId - Optional filter by user ID.
   * @returns Paginated audio assets as AudiosPaginationDto.
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    userId?: string,
  ): Promise<AudiosPaginationDto> {
    const cacheKey = generateCacheKey([
      'audios',
      'findAll',
      page.toString(),
      limit.toString(),
      userId || 'all',
    ]);

    const cached = await this.cacheService.getCache(cacheKey, CacheType.DATA);
    if (cached) {
      this.logger.log(`Cache hit for key: ${cacheKey}`);
      return JSON.parse(cached);
    }

    const skip = (page - 1) * limit;

    // Add userId filter if provided
    const whereClause: any = { deletedAt: null };
    if (userId) {
      whereClause.userId = userId;
    }

    const [audios, totalCount] = await this.prisma.$transaction([
      this.prisma.audio.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.audio.count({ where: whereClause }),
    ]);
    const totalPages = Math.ceil(totalCount / limit);
    const audioResponses = audios.map((audio) =>
      this.mapAudioToResponse(audio),
    );
    const result: AudiosPaginationDto = {
      totalCount,
      page,
      limit,
      totalPages,
      audios: audioResponses,
    };

    await this.cacheService.setCache(
      cacheKey,
      JSON.stringify(result),
      undefined,
      CacheType.DATA,
    );
    return result;
  }

  /**
   * Retrieves a single audio asset by its ID.
   * Uses caching to reduce database load.
   *
   * @param id - The ID of the audio asset.
   * @returns The audio asset as AudioResponseDto.
   */
  async findOne(id: string): Promise<AudioResponseDto> {
    const cacheKey = generateCacheKey(['audios', 'findOne', id]);
    const cached = await this.cacheService.getCache(cacheKey, CacheType.DATA);
    if (cached) {
      this.logger.log(`Cache hit for key: ${cacheKey}`);
      return JSON.parse(cached);
    }
    const audio = await this.prisma.audio.findUnique({
      where: { id, deletedAt: null },
    });
    if (!audio) {
      throw new NotFoundException(`Audio with ID ${id} not found.`);
    }
    const response = this.mapAudioToResponse(audio);
    await this.cacheService.setCache(
      cacheKey,
      JSON.stringify(response),
      undefined,
      CacheType.DATA,
    );
    return response;
  }

  /**
   * Updates an existing audio asset.
   * Invalidates related cache keys after update.
   *
   * @param id - The ID of the audio asset to update.
   * @param updateAudioDto - DTO with updated fields.
   * @param userId - The ID of the user making the request.
   * @returns The updated audio asset as AudioResponseDto.
   */
  async update(
    id: string,
    updateAudioDto: UpdateAudioDto,
    userId: string,
  ): Promise<AudioResponseDto> {
    const audio = await this.prisma.audio.findUnique({
      where: { id, deletedAt: null },
    });

    if (!audio) {
      throw new NotFoundException(`Audio with ID ${id} not found.`);
    }

    // Check if the user owns the audio
    if (audio.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this audio',
      );
    }

    const updatedAudio = await this.prisma.audio.update({
      where: { id },
      data: updateAudioDto,
    });

    // Invalidate cache
    await this.cacheService.deleteCache(
      generateCacheKey(['audios', 'findOne', id]),
    );
    await this.cacheService.deleteCache(
      generateCacheKey(['audios', 'findAll', '1', '10']),
    );
    await this.cacheService.deleteCache(
      generateCacheKey(['audios', 'findAll', '1', '10', userId]),
    );

    return this.mapAudioToResponse(updatedAudio);
  }

  /**
   * Soft deletes an audio asset.
   * Invalidates related cache keys after deletion.
   *
   * @param id - The ID of the audio asset to delete.
   * @param userId - The ID of the user making the request.
   * @returns The soft-deleted audio asset as AudioResponseDto.
   */
  async remove(id: string, userId: string): Promise<AudioResponseDto> {
    const audio = await this.prisma.audio.findUnique({
      where: { id, deletedAt: null },
    });

    if (!audio) {
      throw new NotFoundException(`Audio with ID ${id} not found.`);
    }

    // Check if the user owns the audio
    if (audio.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this audio',
      );
    }

    const deletedAudio = await this.prisma.audio.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Invalidate cache
    await this.cacheService.deleteCache(
      generateCacheKey(['audios', 'findOne', id]),
    );
    await this.cacheService.deleteCache(
      generateCacheKey(['audios', 'findAll', '1', '10']),
    );
    await this.cacheService.deleteCache(
      generateCacheKey(['audios', 'findAll', '1', '10', userId]),
    );

    return this.mapAudioToResponse(deletedAudio);
  }
}
