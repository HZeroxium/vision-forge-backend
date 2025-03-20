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
import { PrismaService } from 'src/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ScriptsPaginationDto } from './dto/scripts-pagination.dto';
import { mapScriptToResponse } from './utils';
import { ScriptResponseDto } from './dto/script-response.dto';
import { AppLoggerService } from 'src/common/logger/logger.service';
import { AIService } from 'src/ai/ai.service';
import {
  CreateImagePromptsRequest,
  CreateImagePromptsResponse,
  CreateScriptResponse,
} from 'src/ai/dto/fastapi.dto';
import { CreateImagePromptsDto } from './dto/create-image-prompts.dto';

@Injectable()
export class ScriptsService {
  private readonly logger = new AppLoggerService();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly aiService: AIService,
  ) {}

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
    let generatedScript: CreateScriptResponse;
    try {
      // Call AIService to generate the script (using dummy endpoint for testing)
      generatedScript = await this.aiService.createScript({ title, style });
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

    try {
      const newScript = await this.prisma.script.create({
        data: {
          userId,
          title,
          content: generatedScript.content,
          style,
        },
      });
      return mapScriptToResponse(newScript);
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
    page = parseInt(page.toString(), 10);
    limit = parseInt(limit.toString(), 10);
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
      mapScriptToResponse(script),
    );
    return { totalCount, page, limit, totalPages, scripts: scriptResponses };
  }

  async findOne(id: string): Promise<ScriptResponseDto> {
    const script = await this.prisma.script.findUnique({
      where: { id, deletedAt: null },
    });
    if (!script) {
      throw new NotFoundException(`Script with ID ${id} not found`);
    }
    return mapScriptToResponse(script);
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
    return mapScriptToResponse(updatedScript);
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
    return mapScriptToResponse(deletedScript);
  }
}
