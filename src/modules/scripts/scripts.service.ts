// modules/scripts/scripts.service.ts
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateScriptDto } from './dto/create-script.dto';
import { UpdateScriptDto } from './dto/update-script.dto';
import { PrismaService } from '@database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ScriptsPaginationDto } from './dto/scripts-pagination.dto';
import { ScriptResponseDto } from './dto/script-response.dto';
import { AppLoggerService } from '@common/logger/logger.service';
import { AIService } from '@ai/ai.service';
import {
  CreateImagePromptsResponse,
  CreateScriptResponse,
} from '@ai/dto/fastapi.dto';
import { CreateImagePromptsDto } from './dto/create-image-prompts.dto';
import { CacheService } from '@/common/cache/cache.service';
import { generateCacheKey } from '@/common/cache/utils';

@Injectable()
export class ScriptsService {
  private readonly logger = this.appLogger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly cacheService: CacheService,
    private readonly appLogger: AppLoggerService,
  ) {}

  mapScriptToResponse = (script: any): ScriptResponseDto => {
    return {
      id: script.id,
      title: script.title,
      content: script.content,
      style: script.style,
      createdAt: script.createdAt,
      updatedAt: script.updatedAt,
    };
  };

  /**
   * Create a new script by calling AIService to generate content, then saving into DB.
   */
  async createScript(
    createScriptDto: CreateScriptDto,
    userId: string,
  ): Promise<ScriptResponseDto> {
    const { title, style } = createScriptDto;
    if (!title || !style) {
      throw new BadRequestException('Title and style are required.');
    }

    // Build a cache key (lowercase trimmed title and style)
    const cacheKey = generateCacheKey([
      'scripts',
      'ai',
      title.trim().toLowerCase(),
      style.trim().toLowerCase(),
    ]);

    let generatedScript: CreateScriptResponse | null = null;
    // Check cache first
    const cachedContent = await this.cacheService.getCache(cacheKey);
    if (cachedContent) {
      this.logger.log(`Cache hit for key: ${cacheKey}`);
      generatedScript = { content: cachedContent };
    } else {
      this.logger.log(
        `Cache miss for key: ${cacheKey}. Calling AIService to generate script.`,
      );
      try {
        generatedScript = await this.aiService.createScript({ title, style });
        // Cache the result; TTL can be set in config (default provided)
        await this.cacheService.setCache(cacheKey, generatedScript.content);
      } catch (error) {
        throw new HttpException(
          {
            errorCode: 'AI_ERROR',
            message: 'Failed to generate script content from AI provider.',
            details: error.message,
          },
          HttpStatus.BAD_GATEWAY,
        );
      }
    }

    try {
      const newScript = await this.prisma.script.create({
        data: {
          userId,
          title,
          content: generatedScript.content,
          style,
        },
      });
      // Invalidate relevant cache keys after creation
      // Invalidate cache for individual script and common pagination keys.
      await this.cacheService.deleteCache(
        generateCacheKey(['scripts', 'findOne', newScript.id]),
      );
      await this.cacheService.deleteCache(
        generateCacheKey(['scripts', 'findAll', '1', '10']),
      );
      return this.mapScriptToResponse(newScript);
    } catch (dbError) {
      throw new HttpException(
        {
          errorCode: 'DB_ERROR',
          message: 'Failed to save generated script.',
          details: dbError.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate image prompts from script content via AIService.
   */
  async createImagePrompts(
    createImagePromptsDto: CreateImagePromptsDto,
  ): Promise<CreateImagePromptsResponse> {
    try {
      return await this.aiService.createImagePrompts(createImagePromptsDto);
    } catch (error) {
      throw new HttpException(
        {
          errorCode: 'AI_ERROR',
          message: 'Failed to generate image prompts.',
          details: error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<ScriptsPaginationDto> {
    const cacheKey = generateCacheKey([
      'scripts',
      'findAll',
      page.toString(),
      limit.toString(),
    ]);
    const cached = await this.cacheService.getCache(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for key: ${cacheKey}`);
      return JSON.parse(cached);
    }

    const skip = (page - 1) * limit;
    const [scripts, totalCount] = await this.prisma.$transaction([
      this.prisma.script.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.script.count({ where: { deletedAt: null } }),
    ]);
    const totalPages = Math.ceil(totalCount / limit);
    const scriptResponses = scripts.map((script) =>
      this.mapScriptToResponse(script),
    );
    const result: ScriptsPaginationDto = {
      totalCount,
      page,
      limit,
      totalPages,
      scripts: scriptResponses,
    };
    await this.cacheService.setCache(cacheKey, JSON.stringify(result));
    return result;
  }

  async findOne(id: string): Promise<ScriptResponseDto> {
    const cacheKey = generateCacheKey(['scripts', 'findOne', id]);
    const cached = await this.cacheService.getCache(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for key: ${cacheKey}`);
      return JSON.parse(cached);
    }
    const script = await this.prisma.script.findUnique({
      where: { id, deletedAt: null },
    });
    if (!script) {
      throw new NotFoundException(`Script with ID ${id} not found`);
    }
    const response = this.mapScriptToResponse(script);
    await this.cacheService.setCache(cacheKey, JSON.stringify(response));
    return response;
  }

  async update(
    id: string,
    updateScriptDto: UpdateScriptDto,
  ): Promise<ScriptResponseDto> {
    const script = await this.prisma.script.findUnique({
      where: { id, deletedAt: null },
    });
    if (!script) {
      throw new NotFoundException(`Script with ID ${id} not found`);
    }
    const updatedScript = await this.prisma.script.update({
      where: { id },
      data: updateScriptDto,
    });
    // Invalidate cache for this script and general pagination.
    await this.cacheService.deleteCache(
      generateCacheKey(['scripts', 'findOne', id]),
    );
    await this.cacheService.deleteCache(
      generateCacheKey(['scripts', 'findAll', '1', '10']),
    );
    return this.mapScriptToResponse(updatedScript);
  }

  async remove(id: string): Promise<ScriptResponseDto> {
    const script = await this.prisma.script.findUnique({
      where: { id, deletedAt: null },
    });
    if (!script) {
      throw new NotFoundException(`Script with ID ${id} not found`);
    }
    const deletedScript = await this.prisma.script.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    // Invalidate cache for this script and general pagination.
    await this.cacheService.deleteCache(
      generateCacheKey(['scripts', 'findOne', id]),
    );
    await this.cacheService.deleteCache(
      generateCacheKey(['scripts', 'findAll', '1', '10']),
    );
    return this.mapScriptToResponse(deletedScript);
  }
}
