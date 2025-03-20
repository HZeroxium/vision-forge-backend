// src/ai/ai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import {
  CreateScriptRequest,
  CreateScriptResponse,
  CreateImageRequest,
  CreateImageResponse,
  CreateImagePromptsRequest,
  CreateImagePromptsResponse,
  CreateAudioRequest,
  CreateAudioResponse,
  CreateVideoRequest,
  CreateVideoResponse,
} from './dto/fastapi.dto';

import { TTSProvider } from '@prisma/client';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly fastApiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    // Get FastAPI base URL from environment variable FASTAPI_URL, defaulting to localhost if not set.
    this.fastApiUrl = this.configService.get<string>(
      'FASTAPI_URL',
      'http://127.0.0.1:8000',
    );
  }

  /**
   * Calls FastAPI endpoint to create a scientific video script.
   */
  async createScript(
    request: CreateScriptRequest,
    dummy: boolean = false,
  ): Promise<CreateScriptResponse> {
    let url = `${this.fastApiUrl}/text/script/create`;
    if (dummy) {
      url += '/dummy';
    }
    this.logger.log(`Calling FastAPI create script at ${url}`);
    const response = await lastValueFrom(
      this.httpService.post<CreateScriptResponse>(url, request),
    );
    return response.data;
  }

  /**
   * Calls FastAPI endpoint to generate an image based on a prompt.
   */
  async createImage(
    request: CreateImageRequest,
    dummy: boolean = false,
  ): Promise<CreateImageResponse> {
    let url = `${this.fastApiUrl}/image/generate`;
    if (dummy) {
      url += '/dummy';
    }
    this.logger.log(`Calling FastAPI generate image at ${url}`);
    const response = await lastValueFrom(
      this.httpService.post<CreateImageResponse>(url, request),
    );
    return response.data;
  }

  /**
   * Calls FastAPI endpoint to generate image prompts from a script.
   */
  async createImagePrompts(
    request: CreateImagePromptsRequest,
    dummy: boolean = false,
  ): Promise<CreateImagePromptsResponse> {
    let url = `${this.fastApiUrl}/text/create-image-prompts`;
    if (dummy) {
      url += '/dummy';
    }
    this.logger.log(`Calling FastAPI create image prompts at ${url}`);
    const response = await lastValueFrom(
      this.httpService.post<CreateImagePromptsResponse>(url, request),
    );
    return response.data;
  }

  /**
   * Calls FastAPI endpoint to generate audio from a script.
   * The provider can be 'openai' (default) or 'google'.
   */
  async createAudio(
    request: CreateAudioRequest,
    provider: TTSProvider = 'OPENAI',
    dummy: boolean = false,
  ): Promise<CreateAudioResponse> {
    let endpoint =
      provider === TTSProvider.OPENAI
        ? '/audio/tts/openai'
        : '/audio/tts/google';
    if (dummy) {
      endpoint += '/dummy';
    }
    const url = `${this.fastApiUrl}${endpoint}`;
    this.logger.log(`Calling FastAPI create audio at ${url}`);
    const response = await lastValueFrom(
      this.httpService.post<CreateAudioResponse>(url, request),
    );
    return response.data;
  }

  /**
   * Calls FastAPI endpoint to generate a video from images and audio.
   * The mode can be 'full' (with transitions) or 'simple' (slideshow).
   */
  async createVideo(
    request: CreateVideoRequest,
    mode: 'full' | 'simple' = 'simple',
    dummy: boolean = false,
  ): Promise<CreateVideoResponse> {
    let endpoint = mode === 'full' ? '/video/create' : '/video/create-simple';
    if (dummy) {
      endpoint += '/dummy';
    }
    const url = `${this.fastApiUrl}${endpoint}`;
    this.logger.log(`Calling FastAPI create video at ${url}`);
    const response = await lastValueFrom(
      this.httpService.post<CreateVideoResponse>(url, request),
    );
    return response.data;
  }
}
