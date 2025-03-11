// src/ai/providers/huggingface-image.provider.ts
import { AIImageProvider } from '../ai-image-provider.interface';
import { HfInference } from '@huggingface/inference';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';

export class HuggingFaceImageProvider implements AIImageProvider {
  private readonly hfClient: HfInference;
  private readonly logger = new Logger(HuggingFaceImageProvider.name);

  constructor(private readonly apiKey: string) {
    this.hfClient = new HfInference(apiKey);
  }

  async generateImage(
    prompt: string,
    parameters?: Record<string, any>,
  ): Promise<Buffer> {
    try {
      const imageBlob = await this.hfClient.textToImage({
        model: parameters?.model,
        inputs: prompt,
        parameters: parameters,
      });
      // Convert Blob to Buffer
      const arrayBuffer = await imageBlob.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      this.logger.error('HuggingFace textToImage error:', error);
      throw new HttpException(
        {
          errorCode: 'HF_TEXT_TO_IMAGE_ERROR',
          message: 'Failed to generate image using HuggingFace provider.',
          details: error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
