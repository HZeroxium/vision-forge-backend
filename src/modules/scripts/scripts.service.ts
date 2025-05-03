// modules/scripts/scripts.service.ts
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateScriptDto } from './dto/create-script.dto';
import { UpdateScriptDto } from './dto/update-script.dto';
import { PrismaService } from '@database/prisma.service';
import { ScriptsPaginationDto } from './dto/scripts-pagination.dto';
import { ScriptResponseDto } from './dto/script-response.dto';
import { AppLoggerService } from '@common/logger/logger.service';
import { AIService } from '@ai/ai.service';
import {
  CreateImagePromptsResponse,
  CreateScriptResponse,
} from '@ai/dto/fastapi.dto';
import { CreateImagePromptsDto } from './dto/create-image-prompts.dto';
import { CacheService, CacheType } from '@/common/cache/cache.service';
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

  mapScriptToResponse = (script: any, sources?: any[]): ScriptResponseDto => {
    return {
      id: script.id,
      title: script.title,
      content: script.content,
      style: script.style,
      sources: sources || script.sources,
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
    const { title, style, language } = createScriptDto;
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
    const cachedResponse = await this.cacheService.getCache(cacheKey);
    if (cachedResponse) {
      this.logger.log(`Cache hit for key: ${cacheKey}`);
      generatedScript = JSON.parse(cachedResponse);
    } else {
      this.logger.log(
        `Cache miss for key: ${cacheKey}. Calling AIService to generate script.`,
      );
      try {
        generatedScript = await this.aiService.createScript({ title, style });
        // Cache the full response object including content and sources
        await this.cacheService.setCache(
          cacheKey,
          JSON.stringify(generatedScript),
        );
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

    if (!generatedScript) {
      throw new HttpException(
        {
          errorCode: 'AI_ERROR',
          message: 'Failed to generate script content.',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Store sources separately as they won't be saved to the database
    const sources = generatedScript.sources;

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
      await this.cacheService.deleteCache(
        generateCacheKey(['scripts', 'findOne', newScript.id]),
      );
      await this.cacheService.deleteCache(
        generateCacheKey(['scripts', 'findAll', '1', '10']),
      );

      // Return the response with sources added for frontend display
      return this.mapScriptToResponse(newScript, sources);
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

  /**
   * Retrieves a paginated list of scripts with optional filtering by userId
   * @param page - Page number
   * @param limit - Number of items per page
   * @param userId - Optional user ID to filter scripts by creator
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    userId?: string,
  ): Promise<ScriptsPaginationDto> {
    // Build cache key including userId if provided
    const cacheKey = generateCacheKey([
      'scripts',
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

    // Build where clause, adding userId filter if provided
    const whereClause: any = { deletedAt: null };
    if (userId) {
      whereClause.userId = userId;
    }

    const [scripts, totalCount] = await this.prisma.$transaction([
      this.prisma.script.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.script.count({ where: whereClause }),
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

    await this.cacheService.setCache(
      cacheKey,
      JSON.stringify(result),
      undefined,
      CacheType.DATA,
    );

    return result;
  }

  async findOne(id: string): Promise<ScriptResponseDto> {
    const cacheKey = generateCacheKey(['scripts', 'findOne', id]);
    const cached = await this.cacheService.getCache(cacheKey, CacheType.DATA);
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
    await this.cacheService.setCache(
      cacheKey,
      JSON.stringify(response),
      undefined,
      CacheType.DATA,
    );
    return response;
  }

  /**
   * Updates a script, ensuring the user has permission
   * @param id - Script ID
   * @param updateScriptDto - Update data
   * @param userId - User ID of the requester
   */
  async update(
    id: string,
    updateScriptDto: UpdateScriptDto,
    userId: string,
  ): Promise<ScriptResponseDto> {
    const script = await this.prisma.script.findUnique({
      where: { id, deletedAt: null },
    });

    if (!script) {
      throw new NotFoundException(`Script with ID ${id} not found`);
    }

    // Check if the user is the creator of the script
    if (script.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this script',
      );
    }

    const updatedScript = await this.prisma.script.update({
      where: { id },
      data: updateScriptDto,
    });

    // Invalidate cache for this script and all pagination results
    await this.cacheService.deleteCache(
      generateCacheKey(['scripts', 'findOne', id]),
    );

    // Clear both all users' scripts cache and this specific user's scripts cache
    await this.cacheService.deleteCache(
      generateCacheKey(['scripts', 'findAll', '1', '10', 'all']),
    );
    await this.cacheService.deleteCache(
      generateCacheKey(['scripts', 'findAll', '1', '10', userId]),
    );

    return this.mapScriptToResponse(updatedScript);
  }

  /**
   * Removes a script (soft delete), ensuring the user has permission
   * @param id - Script ID
   * @param userId - User ID of the requester
   */
  async remove(id: string, userId: string): Promise<ScriptResponseDto> {
    const script = await this.prisma.script.findUnique({
      where: { id, deletedAt: null },
    });

    if (!script) {
      throw new NotFoundException(`Script with ID ${id} not found`);
    }

    // Check if the user is the creator of the script
    if (script.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this script',
      );
    }

    const deletedScript = await this.prisma.script.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Invalidate cache for this script and all pagination results
    await this.cacheService.deleteCache(
      generateCacheKey(['scripts', 'findOne', id]),
    );

    // Clear both all users' scripts cache and this specific user's scripts cache
    await this.cacheService.deleteCache(
      generateCacheKey(['scripts', 'findAll', '1', '10', 'all']),
    );
    await this.cacheService.deleteCache(
      generateCacheKey(['scripts', 'findAll', '1', '10', userId]),
    );

    return this.mapScriptToResponse(deletedScript);
  }
}
