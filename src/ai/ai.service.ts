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
  PreviewVoiceReponse,
} from './dto/fastapi.dto';

import { TTSProvider } from '@prisma/client';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly fastApiUrl: string;
  private IS_DUMMY_MODE: boolean = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    // Get FastAPI base URL from environment variable FASTAPI_URL, defaulting to localhost if not set.
    this.fastApiUrl = this.configService.get<string>(
      'fastAPI.url',
      'http://127.0.0.1:8000',
    );

    this.IS_DUMMY_MODE =
      this.configService.get<string>('fastAPI.isDummyMode', 'false') === 'true';

    this.logger.debug(`FastAPI URL: ${this.fastApiUrl}`);
    this.logger.debug(`IS_DUMMY_MODE: ${this.IS_DUMMY_MODE}`);
  }

  /**
   * Calls FastAPI endpoint to create a scientific video script.
   */
  async createScript(
    request: CreateScriptRequest,
  ): Promise<CreateScriptResponse> {
    let url = `${this.fastApiUrl}/text/script/create`;
    this.logger.log(`IS_DUMMY_MODE: ${this.IS_DUMMY_MODE}`);

    if (this.IS_DUMMY_MODE) {
      url += '/dummy';
      this.logger.log(`Appending '/dummy' to URL: ${url}`);
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
  async createImage(request: CreateImageRequest): Promise<CreateImageResponse> {
    let url = `${this.fastApiUrl}/image/generate`;
    if (this.IS_DUMMY_MODE) {
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
  ): Promise<CreateImagePromptsResponse> {
    let url = `${this.fastApiUrl}/text/create-image-prompts`;
    if (this.IS_DUMMY_MODE) {
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
  ): Promise<CreateAudioResponse> {
    let endpoint =
      provider === TTSProvider.OPENAI
        ? '/audio/tts/openai'
        : '/audio/tts/google';
    if (this.IS_DUMMY_MODE) {
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
  async createVideo(request: CreateVideoRequest): Promise<CreateVideoResponse> {
    let url = `${this.fastApiUrl}/video/create-simple`;
    if (this.IS_DUMMY_MODE) {
      url += '/dummy';
    }
    this.logger.log(`Calling FastAPI create video at ${url}`);
    const response = await lastValueFrom(
      this.httpService.post<CreateVideoResponse>(url, request),
    );
    return response.data;
  }

  /**
   * Calls FastAPI endpoint to preview available voices for TTS.
   * @param voiceId Optional voice ID to retrieve a specific voice preview
   */
  async getPreviewVoice(voiceId?: string): Promise<PreviewVoiceReponse> {
    let url = `${this.fastApiUrl}/audio/tts/openai/voices`;

    // If a specific voice ID is provided, add it as a query parameter
    if (voiceId) {
      url += `?voice_id=${voiceId}`;
      this.logger.log(`Requesting specific voice preview for ID: ${voiceId}`);
    }

    this.logger.log(`Calling FastAPI preview voices at ${url}`);
    const response = await lastValueFrom(this.httpService.get(url));
    return response.data;
  }
}
