// modules/flow/flow.service.ts
import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ScriptsService } from 'src/modules/scripts/scripts.service';
import { AudiosService } from 'src/modules/audios/audios.service';
import { ImagesService } from 'src/modules/images/images.service';
import { VideosService } from 'src/modules/videos/videos.service';
import { GenerateVideoFlowDto } from './dto/generate-video.dto';
import { CreateAudioDto } from 'src/modules/audios/dto/create-audio.dto';
import { CreateVideoDto } from 'src/modules/videos/dto/create-video.dto';
import { CreateImagePromptsDto } from 'src/modules/scripts/dto/create-image-prompts.dto';
import { AIService } from 'src/ai/ai.service';
import { AppLoggerService } from 'src/common/logger/logger.service';
import { VideoResponseDto } from 'src/modules/videos/dto/video-response.dto';

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
  async generateVideoFlow(
    generateVideoFlowDto: GenerateVideoFlowDto,
    userId: string,
  ): Promise<VideoResponseDto> {
    const { scriptId } = generateVideoFlowDto;

    // Retrieve confirmed script from DB.
    const script = await this.scriptsService.findOne(scriptId);
    if (!script) {
      throw new NotFoundException(`Script with ID ${scriptId} not found.`);
    }
    const confirmedContent = script.content;
    this.logger.log(
      `User ${userId} confirmed content for title "${script.title}".`,
    );

    // Prepare DTOs for both branches.
    const createAudioDto: CreateAudioDto = { scriptId };
    const createImagePromptsDto: CreateImagePromptsDto = {
      content: confirmedContent,
      style: script.style || 'default',
    };

    // Execute audio generation and image prompt generation concurrently.
    const [audioResponse, imagePromptsResponse] = await Promise.all([
      this.audiosService.createAudio(createAudioDto, userId),
      this.aiService.createImagePrompts(createImagePromptsDto),
    ]);

    const audioUrl = audioResponse.url;

    // For each image prompt, generate image concurrently.
    const prompts = imagePromptsResponse.prompts.map((p) => p.prompt);
    const imagePromises = prompts.map((prompt) =>
      this.imagesService.createImage(
        { prompt, style: script.style || 'default' },
        userId,
      ),
    );
    const imageResponses = await Promise.all(imagePromises);
    const imageUrls = imageResponses.map((img) => img.url);

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
      transitionDuration: 1, // Default transition duration (can be parameterized).
    };
    const videoResponse = await this.videosService.createVideo(
      createVideoDto,
      userId,
    );

    return videoResponse;
  }
}
