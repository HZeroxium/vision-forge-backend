// modules/media-gen/media-gen.service.ts

import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediaResponseDto } from './dto/media-response.dto';
import { MediaPaginationDto } from './dto/media-pagination.dto';
import { PrismaService } from '../../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { HfInference } from '@huggingface/inference';
import { AppLoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class MediaGenService {
  private readonly hfClient: HfInference;
  private readonly logger = new AppLoggerService();
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const hfApiKey = this.configService.get<string>('huggingFace.apiKey');
    this.hfClient = new HfInference(hfApiKey);
  }

  // Reusable mapper for MediaAsset to MediaResponseDto
  private mapToResponse(media: any): MediaResponseDto {
    return {
      id: media.id,
      prompt: media.prompt,
      style: media.style,
      mediaType: media.type,
      s3Url: media.s3Url,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    };
  }

  // Create/Generate media using an external API
  async generateMedia(
    createMediaDto: CreateMediaDto,
    // videoId: string,
  ): Promise<Buffer> {
    const {
      prompt,
      guidanceScale,
      negativePrompt,
      numInferenceSteps,
      width,
      height,
    } = createMediaDto;
    const model = this.configService.get<string>(
      'huggingFace.textToImage.model',
    );
    const finalGuidanceScale =
      guidanceScale ??
      this.configService.get<number>('huggingFace.textToImage.guidanceScale');
    const finalNegativePrompt =
      negativePrompt ??
      this.configService.get<string>('huggingFace.textToImage.negativePrompt');
    const finalSteps =
      numInferenceSteps ??
      this.configService.get<number>(
        'huggingFace.textToImage.textToImage.textToImage.textToImage.textToImage.textToImage.textToImage.textToImage.textToImage.textToImage.numInferenceSteps',
      );
    const finalWidth =
      width ?? this.configService.get<number>('huggingFace.textToImage.width');
    const finalHeight =
      height ??
      this.configService.get<number>('huggingFace.textToImage.height');

    try {
      this.logger.log('Generating image from text prompt...');
      const imageBlob = await this.hfClient.textToImage({
        model: model,
        inputs: prompt,
        parameters: {
          // guidance_scale: finalGuidanceScale,
          // negative_prompt: finalNegativePrompt,
          num_inference_steps: finalSteps,
          // width: finalWidth,
          // height: finalHeight,
        },
      });
      this.logger.log('Image generated successfully.');
      const arrayBuffer = await imageBlob.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      this.logger.error('Hugging Face textToImage error:', error);
      throw new HttpException(
        {
          errorCode: 'HF_TEXT_TO_IMAGE_ERROR',
          message: 'Failed to generate image from text prompt.',
          details: error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // private async createMediaFromImageBuffer(
  //   buffer: Buffer,
  //   prompt: string,
  //   userId: string,
  // ): Promise<string> {
  //   // Upload to S3
  //   const fakeS3Url = 'https://my-s3-bucket.com/path/to/image.png';

  //   // Lưu DB (MediaAsset) -> prisma
  //   const newMedia = await this.prisma.mediaAsset.create({
  //     data: {
  //       prompt,
  //       style: 'text-to-image',
  //       type: 'IMAGE',
  //       s3Url: fakeS3Url,
  //       // videoId: ???
  //     },
  //   });
  //   return newMedia.id;
  // }

  // Retrieve paginated list of media assets
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<MediaPaginationDto> {
    page = parseInt(page.toString(), 10);
    limit = parseInt(limit.toString(), 10);
    const skip = (page - 1) * limit;
    const [mediaAssets, totalCount] = await this.prisma.$transaction([
      this.prisma.mediaAsset.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.mediaAsset.count({ where: { deletedAt: null } }),
    ]);
    const totalPages = Math.ceil(totalCount / limit);
    const responses = mediaAssets.map((asset) => this.mapToResponse(asset));
    return { totalCount, page, limit, totalPages, mediaAssets: responses };
  }

  // Retrieve a single media asset by ID
  async findOne(id: string): Promise<MediaResponseDto> {
    const media = await this.prisma.mediaAsset.findUnique({
      where: { id, deletedAt: null },
    });
    if (!media) {
      throw new NotFoundException(`Media asset with ID ${id} not found`);
    }
    return this.mapToResponse(media);
  }

  // Update a media asset
  async update(
    id: string,
    updateMediaDto: UpdateMediaDto,
  ): Promise<MediaResponseDto> {
    const media = await this.prisma.mediaAsset.findUnique({
      where: { id, deletedAt: null },
    });
    if (!media) {
      throw new NotFoundException(`Media asset with ID ${id} not found`);
    }
    const updatedMedia = await this.prisma.mediaAsset.update({
      where: { id },
      data: updateMediaDto,
    });
    return this.mapToResponse(updatedMedia);
  }

  // Soft delete a media asset
  async remove(id: string): Promise<MediaResponseDto> {
    const media = await this.prisma.mediaAsset.findUnique({
      where: { id, deletedAt: null },
    });
    if (!media) {
      throw new NotFoundException(`Media asset with ID ${id} not found`);
    }
    const deletedMedia = await this.prisma.mediaAsset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return this.mapToResponse(deletedMedia);
  }
}
