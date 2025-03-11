// ai/providers/huggingface.provider.ts

import { AIProvider } from '../ai-provider.interface';
import { HfInference } from '@huggingface/inference';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';

export class HuggingFaceProvider implements AIProvider {
  private readonly hfClient: HfInference;
  private readonly logger = new Logger(HuggingFaceProvider.name);

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly temperature: number,
    private readonly maxTokens: number,
    private readonly topP: number,
  ) {
    this.hfClient = new HfInference(apiKey);
  }

  async generateText(
    messages: { role: string; content: string }[],
  ): Promise<string> {
    let output = '';
    try {
      const stream = this.hfClient.chatCompletionStream({
        model: this.model,
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        top_p: this.topP,
      });
      for await (const chunk of stream) {
        if (chunk.choices?.length > 0) {
          output += chunk.choices[0].delta.content;
        }
      }
      return output;
    } catch (error) {
      this.logger.error('HuggingFace error:', error);
      throw new HttpException(
        {
          errorCode: 'HF_API_ERROR',
          message: 'Failed to generate text from HuggingFace provider.',
          details: error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
