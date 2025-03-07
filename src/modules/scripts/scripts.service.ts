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
import { HfInference } from '@huggingface/inference';
import { PrismaService } from 'src/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ScriptsPaginationDto } from './dto/scripts-pagination.dto';
import { mapScriptToResponse } from './utils';
import { ScriptResponseDto } from './dto/script-response.dto';
import { generateScriptMessages } from 'src/common/utils/ai.util';

@Injectable()
export class ScriptsService {
  private readonly hfClient: HfInference;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const hfApiKey = this.configService.get<string>('huggingFace.apiKey');
    this.hfClient = new HfInference(hfApiKey);
  }

  async create(
    createScriptDto: CreateScriptDto,
    userId: string,
  ): Promise<ScriptResponseDto> {
    const { rawContent, style, title } = createScriptDto;
    if (!rawContent || !style) {
      throw new BadRequestException('Raw content and style are required.');
    }

    const language = 'Vietnamese';
    const messages = generateScriptMessages(rawContent, style, language);
    let generatedContent = '';

    try {
      const stream = this.hfClient.chatCompletionStream({
        model: this.configService.get<string>(
          'huggingFace.textGeneration.model',
        ),
        messages,
        temperature: this.configService.get<number>(
          'huggingFace.textGeneration.temperature',
        ),
        max_tokens: this.configService.get<number>(
          'huggingFace.textGeneration.maxTokens',
        ),
        top_p: this.configService.get<number>(
          'huggingFace.textGeneration.topP',
        ),
      });

      for await (const chunk of stream) {
        if (chunk.choices?.length > 0) {
          const newContent = chunk.choices[0].delta.content;
          generatedContent += newContent;
        }
      }
    } catch (error) {
      // Log and rethrow error if external API call fails
      throw new HttpException(
        {
          errorCode: 'HF_API_ERROR',
          message:
            'Failed to generate script content due to external API error.',
          details: error.response?.data || error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }

    try {
      const newScript = await this.prisma.script.create({
        data: {
          userId,
          title: title || 'Untitled Script',
          content: generatedContent,
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
}
