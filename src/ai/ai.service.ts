// ai/ai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider } from './ai-provider.interface';
import { AIImageProvider } from './ai-image-provider.interface';
import { HuggingFaceProvider } from './providers/huggingface.provider';
import { HuggingFaceImageProvider } from './providers/huggingface-image.provider';
import { LocalFastAPIProvider } from './providers/local-fastapi.provider';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AIService {
  private textProvider: AIProvider;
  private imageProvider: AIImageProvider;
  private readonly logger = new Logger(AIService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const providerType =
      this.configService.get<string>('ai.provider') || 'huggingface';
    this.logger.log(`Using AI provider for text: ${providerType}`);

    // Setup text provider
    if (providerType === 'huggingface') {
      const apiKey = this.configService.get<string>('huggingFace.apiKey')!;
      const model = this.configService.get<string>(
        'huggingFace.textGeneration.model',
      )!;
      const temperature = this.configService.get<number>(
        'huggingFace.textGeneration.temperature',
      )!;
      const maxTokens = this.configService.get<number>(
        'huggingFace.textGeneration.maxTokens',
      )!;
      const topP = this.configService.get<number>(
        'huggingFace.textGeneration.topP',
      )!;
      this.textProvider = new HuggingFaceProvider(
        apiKey,
        model,
        temperature,
        maxTokens,
        topP,
      );
    } else if (providerType === 'local-fastapi') {
      const endpointText = this.configService.get<string>(
        'ai.localFastApiTextEndpoint',
      )!;
      // LocalFastAPIProvider implements both interfaces, so we instantiate one for both
      const endpointImage = this.configService.get<string>(
        'ai.localFastApiImageEndpoint',
      )!;
      this.textProvider = new LocalFastAPIProvider(
        this.httpService,
        endpointText,
        endpointImage,
      );
    } else {
      throw new Error(`Unknown AI provider: ${providerType}`);
    }

    // Setup image provider - có thể chọn riêng, hoặc dùng chung provider
    // Ví dụ: nếu providerType là huggingface, sử dụng HuggingFaceImageProvider
    if (providerType === 'huggingface') {
      const apiKey = this.configService.get<string>('huggingFace.apiKey')!;
      this.imageProvider = new HuggingFaceImageProvider(apiKey);
    } else if (providerType === 'local-fastapi') {
      // Reuse the instance from LocalFastAPIProvider, vì nó đã implement AIImageProvider
      this.imageProvider = this.textProvider as unknown as AIImageProvider;
    } else {
      throw new Error(`Unknown AI provider: ${providerType}`);
    }
  }

  async generateText(
    messages: { role: string; content: string }[],
  ): Promise<string> {
    return this.textProvider.generateText(messages);
  }

  async generateImage(
    prompt: string,
    parameters?: Record<string, any>,
  ): Promise<Buffer> {
    return this.imageProvider.generateImage(prompt, parameters);
  }
}
