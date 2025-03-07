// modules/script-gen/script-gen.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateScriptDto } from './dto/create-script.dto';
import { ScriptResponseDto } from './dto/script-response.dto';
import { PrismaService } from '../../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ScriptGenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // Generates a script using an external NLP API (e.g., OpenAI or Hugging Face)
  async generateScript(
    createScriptDto: CreateScriptDto,
    userId: string,
  ): Promise<ScriptResponseDto> {
    const { rawContent, style, title } = createScriptDto;

    // Prepare prompt for API call
    const prompt = `Generate a ${style} style script based on the following scientific content:\n\n${rawContent}`;

    // Get API configuration from environment/config
    const openAiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    const openAiEndpoint =
      this.configService.get<string>('OPENAI_API_ENDPOINT') ||
      'https://api.openai.com/v1/engines/text-davinci-003/completions';

    // Variable to store generated content
    let generatedContent: string;

    try {
      // Call external NLP API (OpenAI as primary)
      const response = await firstValueFrom(
        this.httpService.post(
          openAiEndpoint,
          {
            prompt,
            max_tokens: 300, // Adjust token limit as needed
            temperature: 0.7,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openAiApiKey}`,
            },
          },
        ),
      );
      // Assume generated text is in response.data.choices[0].text
      generatedContent = response.data.choices[0].text.trim();
    } catch (error) {
      // TODO: Optionally add fallback using Hugging Face Inference API
      throw new HttpException(
        'Failed to generate script content',
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Create a new Script record in PostgreSQL using Prisma
    const newScript = await this.prisma.script.create({
      data: {
        userId,
        title: title || 'Untitled Script',
        content: generatedContent,
        style,
      },
    });

    // Map new script to response DTO
    const scriptResponse: ScriptResponseDto = {
      id: newScript.id,
      title: newScript.title,
      content: newScript.content,
      style: newScript.style,
      createdAt: newScript.createdAt,
      updatedAt: newScript.updatedAt,
    };

    return scriptResponse;
  }
}
