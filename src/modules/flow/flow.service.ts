// modules/flow/flow.service.ts
import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ScriptsService } from '@scripts/scripts.service';
import { AudiosService } from '@audios/audios.service';
import { ImagesService } from '@images/images.service';
import { VideosService } from '@videos/videos.service';
import { GenerateVideoFlowDto } from './dto/generate-video.dto';
import { CreateAudioDto } from '@audios/dto/create-audio.dto';
import { CreateVideoDto } from '@videos/dto/create-video.dto';
import { CreateImagePromptsDto } from '@scripts/dto/create-image-prompts.dto';
import { AIService } from '@ai/ai.service';
import { AppLoggerService } from '@common/logger/logger.service';
import { VideoResponseDto } from '@videos/dto/video-response.dto';
import { ImagesReponseDto } from './dto/images-reponse.dto';
import { PreviewVoiceReponse } from '@ai/dto/fastapi.dto';

@Injectable()
export class FlowService {
  private readonly logger = new AppLoggerService();

  constructor(
    private readonly scriptsService: ScriptsService,
    private readonly audiosService: AudiosService,
    private readonly imagesService: ImagesService,
    private readonly videosService: VideosService,
    private readonly aiService: AIService,
  ) {}

  /**
   * Orchestrates the complete video generation flow.
   *
   * Flow:
   * 1. Retrieve the confirmed script content from DB.
   * 2. In parallel:
   *    a) Generate audio from the confirmed content.
   *    b) Generate image prompts from the confirmed content, then concurrently generate images.
   * 3. After both branches complete, combine audio URL and image URLs and call VideosService.
   *
   * Note: If video generation takes a long time or load is high, consider using a job queue (e.g., Bull)
   * for background processing.
   *
   * @param generateVideoFlowDto - DTO containing the scriptId and title.
   * @param userId - The authenticated user’s ID.
   * @returns The final generated video response.
   */
  async generateVideoFromScriptsAndImages(
    generateVideoFlowDto: GenerateVideoFlowDto,
    userId: string,
  ): Promise<VideoResponseDto> {
    const { scriptId, scripts, imageUrls } = generateVideoFlowDto;

    // Retrieve confirmed script from DB.
    const script = await this.scriptsService.findOne(scriptId);
    if (!script) {
      throw new NotFoundException(`Script with ID ${scriptId} not found.`);
    }

    // Check if the concactenation of scripts is not equal to the original script. Update the script content if needed.
    const concatenatedScripts = scripts.join(' ');
    if (concatenatedScripts !== script.content) {
      await this.scriptsService.update(scriptId, {
        content: concatenatedScripts,
      });
    }

    this.logger.log(
      `User ${userId} confirmed content for title "${script.title}".`,
    );

    // Prepare DTOs for both branches.
    const createAudioDto: CreateAudioDto = { scriptId };

    // Execute audio generation and image prompt generation concurrently.
    const audioResponse = await this.audiosService.createAudio(
      createAudioDto,
      userId,
    );

    const audioUrl = audioResponse.url;
    this.logger.log(`Generated audio URL: ${audioUrl}`);

    // Validate that both branches returned valid data.
    if (!audioUrl || imageUrls.length === 0) {
      throw new HttpException(
        'Failed to generate required media assets.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Create video using audio and images.
    const createVideoDto: CreateVideoDto = {
      imageUrls,
      audioUrl,
      scriptId, // Associate with the script if needed.
      scripts, // Include the script content for the video.
      transitionDuration: 1, // Default transition duration (can be parameterized).
    };
    const videoResponse = await this.videosService.createVideo(
      createVideoDto,
      userId,
    );

    return videoResponse;
  }

  async generateImagesFromScript(
    createImagePromptsDto: CreateImagePromptsDto,
    userId: string,
  ): Promise<ImagesReponseDto> {
    const { content, style } = createImagePromptsDto;
    if (!content || !style) {
      throw new HttpException(
        'Content and style are required.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Call AIService to generate image prompts
    const imagePrompts = await this.aiService.createImagePrompts({
      content,
      style,
    });

    if (!imagePrompts || !imagePrompts.prompts) {
      throw new HttpException(
        'Failed to generate image prompts.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const { prompts } = imagePrompts;
    const imageUrls = await Promise.all(
      prompts.map(async (item) => {
        const imageResponse = await this.imagesService.createImage(
          {
            prompt: item.prompt,
            style,
          },
          userId,
        );
        return imageResponse.url;
      }),
    );

    if (!imageUrls || imageUrls.length === 0) {
      throw new HttpException(
        'Failed to generate images.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    // Map the image URLs to the response DTO.
    const imagesResponse: ImagesReponseDto = {
      image_urls: imageUrls,
      scripts: prompts.map((item) => item.script),
    };

    return imagesResponse;
  }

  async getPreviewVoice(voiceId?: string): Promise<PreviewVoiceReponse> {
    const voice = await this.aiService.getPreviewVoice(voiceId);
    if (!voice) {
      throw new HttpException(
        'Failed to retrieve preview voice.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return voice;
  }
}
