// modules/media-gen/media-gen.service.ts

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { MediaResponseDto } from './dto/media-response.dto';
import { PrismaService } from '../../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MediaGenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // Generates media (image/video) based on the provided prompt and style.
  async generateMedia(
    createMediaDto: CreateMediaDto,
    videoId: string,
  ): Promise<MediaResponseDto> {
    const { prompt, style, mediaType } = createMediaDto;

    // Prepare the request body for the external media generation API
    const requestBody = {
      prompt,
      style,
      mediaType: mediaType.toLowerCase(), // expected: 'image' or 'video'
      // TODO: Add additional parameters if required (e.g., resolution)
    };

    // Retrieve API configuration from the environment
    // Primary: Hugging Face Inference API (or alternative providers)
    const hfApiKey = this.configService.get<string>('HUGGINGFACE_API_KEY');
    const hfEndpoint =
      this.configService.get<string>('HUGGINGFACE_MEDIA_ENDPOINT') ||
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion';

    let mediaUrl: string;

    try {
      // Call external media generation API
      const response = await firstValueFrom(
        this.httpService.post(hfEndpoint, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hfApiKey}`,
          },
        }),
      );
      // Assume the API returns a media URL in response.data.url
      mediaUrl = response.data.url;
      if (!mediaUrl) {
        throw new Error('No media URL returned');
      }
    } catch (error) {
      // TODO: Implement fallback to alternative API such as DALL-E or Midjourney if available
      throw new HttpException(
        'Failed to generate media content',
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Save the generated media metadata into the database (MediaAsset table)
    const newMediaAsset = await this.prisma.mediaAsset.create({
      data: {
        videoId,
        type: mediaType, // Use enum from Prisma (IMAGE or VIDEO)
        prompt,
        style,
        s3Url: mediaUrl, // This should be the S3 URL or external URL of the media file
      },
    });

    // Map the database record to a response DTO
    const mediaResponse: MediaResponseDto = {
      id: newMediaAsset.id,
      prompt: newMediaAsset.prompt,
      style: newMediaAsset.style,
      mediaType: newMediaAsset.type,
      s3Url: newMediaAsset.s3Url,
      createdAt: newMediaAsset.createdAt,
      updatedAt: newMediaAsset.updatedAt,
    };

    return mediaResponse;
  }
}
