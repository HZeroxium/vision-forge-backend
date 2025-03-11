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
import {
  generateScriptMessages,
  summarizeScriptToImagePrompts,
} from 'src/common/utils/ai.util';
import { AppLoggerService } from 'src/common/logger/logger.service';
import { AIService } from 'src/ai/ai.service';

@Injectable()
export class ScriptsService {
  private readonly logger = new AppLoggerService();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly aiService: AIService,
  ) {}

  async createScript(
    createScriptDto: CreateScriptDto,
    userId: string,
  ): Promise<ScriptResponseDto> {
    const { rawContent, style, title } = createScriptDto;
    if (!rawContent || !style) {
      throw new BadRequestException('Raw content and style are required.');
    }

    const language = 'Vietnamese';
    const maxTokens = this.configService.get<number>(
      'huggingFace.textGeneration.maxTokens',
    )!;
    const messages = generateScriptMessages(
      rawContent,
      style,
      language,
      maxTokens,
    );

    let generatedScript = '';
    try {
      // Gọi AIService thay vì gọi trực tiếp HfInference
      generatedScript = await this.aiService.generateText(messages);
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

    // Lưu DB
    try {
      const newScript = await this.prisma.script.create({
        data: {
          userId,
          title: title || 'Untitled Script',
          content: generatedScript,
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

  // Function to summarize the generated script into multiple image prompts.
  async summarizeScriptForImages(
    scriptContent: string,
    numPrompts: string,
  ): Promise<Object> {
    this.logger.log('Summarize script for image prompts');
    this.logger.log(scriptContent);
    const language = 'Vietnamese';
    // Use the same style as the script (or allow a different one if needed)
    const style = 'phổ thông';
    const maxTokens = this.configService.get<number>(
      'huggingFace.textGeneration.maxTokens',
    )!;
    const messages = summarizeScriptToImagePrompts(
      scriptContent,
      language,
      style,
      maxTokens,
      Number(numPrompts),
    );
    let summarizedPrompts = '';

    try {
      summarizedPrompts = await this.aiService.generateText(messages);
    } catch (error) {
      throw new HttpException(
        {
          errorCode: 'HF_API_ERROR',
          message: 'Failed to summarize script for image prompts.',
          details: error.response?.data || error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Assume that the summarized result contains multiple prompts separated by newline.
    // You can customize the splitting logic as needed.
    const promptsArray = summarizedPrompts
      .split('\n')
      .map((prompt) => prompt.trim())
      .filter((prompt) => prompt);
    return {
      count: promptsArray.length,
      prompts: promptsArray,
      summarizedPrompts,
    };
  }
}
