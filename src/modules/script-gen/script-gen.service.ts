// modules/script-gen/script-gen.service.ts
import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { CreateScriptDto } from './dto/create-script.dto';
import { ScriptResponseDto } from './dto/script-response.dto';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { HfInference } from '@huggingface/inference';
import { AppLoggerService } from 'src/common/logger/logger.service';
import { generateScriptMessages } from 'src/common/utils/ai.util';

@Injectable()
export class ScriptGenService {
  private readonly hfClient: HfInference;
  private readonly logger = new AppLoggerService();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const hfApiKey = this.configService.get<string>('huggingFace.apiKey');
    this.hfClient = new HfInference(hfApiKey);
  }

  async generateScript(
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
        model: this.configService.get<string>('huggingFace.model'),
        messages: messages,
        temperature: this.configService.get<number>('huggingFace.temperature'),
        max_tokens: this.configService.get<number>('huggingFace.maxTokens'),
        top_p: this.configService.get<number>('huggingFace.topP'),
      });

      for await (const chunk of stream) {
        if (chunk.choices?.length > 0) {
          const newContent = chunk.choices[0].delta.content;
          generatedContent += newContent;
        }
      }
    } catch (error) {
      // Handle Hugging Face API error
      this.logger.error('Hugging Face API error:', error);
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
      // Save generated script to the database
      const newScript = await this.prisma.script.create({
        data: {
          userId,
          title: title || 'Untitled Script',
          content: generatedContent,
          style,
        },
      });

      return {
        id: newScript.id,
        title: newScript.title,
        content: newScript.content,
        style: newScript.style,
        createdAt: newScript.createdAt,
        updatedAt: newScript.updatedAt,
      };
    } catch (dbError) {
      this.logger.error('Database error:', dbError);
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
}
