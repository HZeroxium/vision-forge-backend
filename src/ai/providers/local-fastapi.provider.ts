// src/ai/providers/local-fastapi.provider.ts
import { AIProvider } from '../ai-provider.interface';
import { AIImageProvider } from '../ai-image-provider.interface';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export class LocalFastAPIProvider implements AIProvider, AIImageProvider {
  private readonly logger = new Logger(LocalFastAPIProvider.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly endpointText: string, // e.g. http://localhost:8000/ai/generate-text
    private readonly endpointImage: string, // e.g. http://localhost:8000/ai/generate-image
  ) {}

  async generateText(
    messages: { role: string; content: string }[],
  ): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(this.endpointText, { messages }),
      );
      return response.data.text;
    } catch (error) {
      this.logger.error('LocalFastAPI text error:', error);
      throw new HttpException(
        {
          errorCode: 'LOCAL_FASTAPI_TEXT_ERROR',
          message: 'Failed to generate text from local FastAPI provider.',
          details: error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async generateImage(
    prompt: string,
    parameters?: Record<string, any>,
  ): Promise<Buffer> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(this.endpointImage, { prompt, parameters }),
      );
      // Giả sử FastAPI trả về binary data dưới dạng Buffer hoặc Base64 string
      // Ở đây ta giả sử trả về Base64 string và convert thành Buffer:
      const base64 = response.data.imageBase64;
      return Buffer.from(base64, 'base64');
    } catch (error) {
      this.logger.error('LocalFastAPI image error:', error);
      throw new HttpException(
        {
          errorCode: 'LOCAL_FASTAPI_IMAGE_ERROR',
          message: 'Failed to generate image from local FastAPI provider.',
          details: error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
