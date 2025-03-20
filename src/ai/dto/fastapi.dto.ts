// src/ai/dto/fastapi.dto.ts

export interface CreateScriptRequest {
  title: string;
  style: string;
  language?: string;
}

export interface CreateScriptResponse {
  content: string;
}

export interface CreateImageRequest {
  prompt: string;
}

export interface CreateImageResponse {
  image_url: string;
}

export interface CreateImagePromptsRequest {
  content: string;
  style: string;
}

export interface CreateImagePromptsResponse {
  prompts: { prompt: string }[];
  style: string;
}

export interface CreateAudioRequest {
  script: string;
}

export interface CreateAudioResponse {
  audio_url: string;
}

export interface CreateVideoRequest {
  image_urls: string[];
  audio_url: string;
  title?: string;
  transition_duration?: number;
}

export interface CreateVideoResponse {
  video_url: string;
}
