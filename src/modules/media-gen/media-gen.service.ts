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

@Injectable()
export class MediaGenService {
  private readonly hfClient: HfInference;
  private readonly logger = new AppLoggerService();
  private readonly s3: S3Client;
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const hfApiKey = this.configService.get<string>('huggingFace.apiKey');
    this.hfClient = new HfInference(hfApiKey);

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

  /**
   * Generates media content (image/video) based on a text prompt,
   * uploads the result to S3, saves metadata to the database,
   * and returns a MediaResponseDto.
   */
  async generateImage(
    createMediaDto: CreateMediaDto,
  ): Promise<MediaResponseDto> {
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
    if (!prompt || !style || !mediaType) {
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

    let buffer: Buffer;
    try {
      this.logger.log('Generating media via Hugging Face textToImage...');
      // Call external API; adjust parameters as per your API's documentation
      const imageBlob = await this.hfClient.textToImage({
        model: model,
        inputs: prompt,
        parameters: {
          // Optional parameters can be included here:
          // guidance_scale: finalGuidanceScale,
          // negative_prompt: finalNegativePrompt,
          num_inference_steps: finalSteps,
          // width: finalWidth,
          // height: finalHeight,
        },
      });
      this.logger.log('Media generated successfully.');
      // Convert Blob to Buffer
      const arrayBuffer = await imageBlob.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
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
    // Generate a unique S3 key for the file
    const s3Key = `media/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.png`;

    // TODO: Upload buffer to S3 and obtain the URL
    // const s3Url = await this.uploadBufferToS3(buffer, s3Key);

    // Mocking upload to S3
    const s3Url = 'https://example.com/media/123.png';

    // Save the media asset record in the database
    let newMediaAsset;
    try {
      newMediaAsset = await this.prisma.mediaAsset.create({
        data: {
          // If videoId is needed, pass it here (could be extended later)
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

    return this.mapToResponse(newMediaAsset);
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

    let buffer: Buffer;
    try {
      this.logger.log('Generating media via Hugging Face textToImage...');
      // Call external API; adjust parameters as per your API's documentation
      const imageBlob = await this.hfClient.textToImage({
        model: model,
        inputs: prompt,
        parameters: {
          // Optional parameters can be included here:
          // guidance_scale: finalGuidanceScale,
          // negative_prompt: finalNegativePrompt,
          // num_inference_steps: finalSteps,
          // width: finalWidth,
          // height: finalHeight,
        },
      });
      this.logger.log('Media generated successfully.');
      // Convert Blob to Buffer
      const arrayBuffer = await imageBlob.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
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
