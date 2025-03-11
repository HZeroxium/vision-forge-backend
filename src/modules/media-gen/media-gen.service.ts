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
import { ConfigService } from '@nestjs/config';
import { HfInference } from '@huggingface/inference';
import { AppLoggerService } from 'src/common/logger/logger.service';
import { Upload } from '@aws-sdk/lib-storage';
import { S3Client } from '@aws-sdk/client-s3';
import { AIService } from 'src/ai/ai.service';

@Injectable()
export class MediaGenService {
  private readonly logger = new AppLoggerService();
  private readonly s3: S3Client;
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly aiService: AIService,
  ) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('aws.region')!,
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKeyId')!,
        secretAccessKey: this.configService.get<string>('aws.secretAccessKey')!,
      },
    });
  }

  // Reusable helper to map a MediaAsset record to MediaResponseDto
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

  // Helper to upload Buffer to S3 and return the S3 URL
  private async uploadBufferToS3(buffer: Buffer, key: string): Promise<string> {
    const bucket_name = this.configService.get<string>('aws.bucketName')!;
    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: bucket_name,
        Key: key,
        Body: buffer,
        ContentType: 'image/png', // Adjust if needed
        ACL: 'public-read', // Make public if required
      },
    });

    try {
      const data = await upload.done();
      return `https://${bucket_name}.s3.amazonaws.com/${key}`;
    } catch (error) {
      this.logger.error('S3 upload error:', error);
      throw new HttpException(
        {
          errorCode: 'S3_UPLOAD_ERROR',
          message: 'Failed to upload media to S3.',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateImage(
    createMediaDto: CreateMediaDto,
  ): Promise<MediaResponseDto> {
    const {
      prompt,
      style,
      mediaType, // expected: 'IMAGE'
      guidanceScale,
      negativePrompt,
      numInferenceSteps,
      width,
      height,
    } = createMediaDto;

    if (!prompt || !style || !mediaType) {
      throw new BadRequestException(
        'Prompt, style, and mediaType are required.',
      );
    }

    // Prepare parameters for image generation
    const parameters = {
      model: this.configService.get<string>('huggingFace.textToImage.model'),
      guidance_scale:
        guidanceScale ??
        this.configService.get<number>('huggingFace.textToImage.guidanceScale'),
      negative_prompt:
        negativePrompt ??
        this.configService.get<string>(
          'huggingFace.textToImage.negativePrompt',
        ),
      num_inference_steps:
        numInferenceSteps ??
        this.configService.get<number>(
          'huggingFace.textToImage.numInferenceSteps',
        ),
      width:
        width ??
        this.configService.get<number>('huggingFace.textToImage.width'),
      height:
        height ??
        this.configService.get<number>('huggingFace.textToImage.height'),
    };

    let imageBuffer: Buffer;
    try {
      imageBuffer = await this.aiService.generateImage(prompt, parameters);
    } catch (error) {
      this.logger.error('Error generating image:', error);
      throw new HttpException(
        {
          errorCode: 'IMAGE_GENERATION_ERROR',
          message: 'Failed to generate image from AI provider.',
          details: error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Upload image buffer to S3
    const s3Key = `media/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.png`;
    const bucketName = this.configService.get<string>('aws.bucketName')!;
    let s3Url: string;
    try {
      // You can use the helper method uploadBufferToS3() here
      s3Url = await this.uploadBufferToS3(imageBuffer, s3Key);
    } catch (error) {
      this.logger.error('S3 upload error:', error);
      throw new HttpException(
        {
          errorCode: 'S3_UPLOAD_ERROR',
          message: 'Failed to upload generated image to S3.',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Save media asset to database
    let newMedia;
    try {
      newMedia = await this.prisma.mediaAsset.create({
        data: {
          type: mediaType,
          prompt,
          style,
          s3Url,
        },
      });
    } catch (dbError) {
      this.logger.error('Database error:', dbError);
      throw new HttpException(
        {
          errorCode: 'DB_ERROR',
          message: 'Failed to save media asset.',
          details: dbError.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return this.mapToResponse(newMedia);
  }

  /**
   * Retrieves a paginated list of media assets.
   */
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

  /**
   * Retrieves a single media asset by ID.
   */
  async findOne(id: string): Promise<MediaResponseDto> {
    const media = await this.prisma.mediaAsset.findUnique({
      where: { id, deletedAt: null },
    });
    if (!media) {
      throw new NotFoundException(`Media asset with ID ${id} not found`);
    }
    return this.mapToResponse(media);
  }

  /**
   * Updates an existing media asset.
   */
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

  /**
   * Soft deletes a media asset.
   */
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

  async generateImageBuffer(createMediaDto: CreateMediaDto): Promise<Buffer> {
    const {
      prompt,
      style,
      mediaType,
      guidanceScale,
      negativePrompt,
      numInferenceSteps,
      width,
      height,
    } = createMediaDto;

    // Validate required fields
    if (!prompt) {
      throw new BadRequestException(
        'Prompt, style, and mediaType are required.',
      );
    }

    // Prepare parameters with defaults from config
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
        'huggingFace.textToImage.numInferenceSteps',
      );
    const finalWidth =
      width ?? this.configService.get<number>('huggingFace.textToImage.width');
    const finalHeight =
      height ??
      this.configService.get<number>('huggingFace.textToImage.height');

    const parameters = {
      model,
      guidanceScale: finalGuidanceScale,
      negativePrompt: finalNegativePrompt,
      numInferenceSteps: finalSteps,
      width: finalWidth,
      height: finalHeight,
    };

    let buffer: Buffer;
    try {
      this.logger.log('Generating media via Hugging Face textToImage...');
      // Call external API; adjust parameters as per your API's documentation
      buffer = await this.aiService.generateImage(prompt, parameters);
      return buffer;
    } catch (error) {
      this.logger.error('Hugging Face textToImage error:', error);
      throw new HttpException(
        {
          errorCode: 'HF_TEXT_TO_IMAGE_ERROR',
          message: 'Failed to generate media content from text prompt.',
          details: error.response?.data || error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
