// src/modules/flow/flow.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { FlowService } from './flow.service';
import { Logger, NotFoundException } from '@nestjs/common';
import { ScriptsService } from '@scripts/scripts.service';
import { AudiosService } from '@audios/audios.service';
import { ImagesService } from '@images/images.service';
import { VideosService } from '@videos/videos.service';
import { AIService } from '@ai/ai.service';

@Processor('video-generation')
export class FlowProcessor {
  private readonly logger = new Logger(FlowProcessor.name);

  constructor(
    private readonly flowService: FlowService,
    private readonly scriptsService: ScriptsService,
    private readonly audiosService: AudiosService,
    private readonly imagesService: ImagesService,
    private readonly videosService: VideosService,
    private readonly aiService: AIService,
  ) {}

  @Process({ name: 'generate', concurrency: 2 })
  async handleVideoGeneration(
    job: Job<{
      userId: string;
      scriptId: string;
      scripts?: string[];
      imageUrls?: string[];
    }>,
  ) {
    const {
      userId,
      scriptId,
      scripts: providedScripts,
      imageUrls: providedImageUrls,
    } = job.data;
    this.logger.log(`Processing job ${job.id}`);

    try {
      // Step 1: script validation (5%)
      await job.progress(5);
      this.logger.log(`Validating script ${scriptId}`);

      const script = await this.scriptsService.findOne(scriptId);
      if (!script) throw new NotFoundException('Script not found');

      await job.progress(10);
      this.logger.log('Script validated');

      // If scripts and imageUrls are provided, use them directly
      if (
        providedScripts &&
        providedImageUrls &&
        providedScripts.length > 0 &&
        providedImageUrls.length > 0
      ) {
        this.logger.log('Using provided scripts and images');

        // Step 2: Generate audio only (40%)
        this.logger.log('Generating audio from script');
        const audio = await this.audiosService.createAudio(
          { scriptId },
          userId,
        );
        await job.progress(40);
        this.logger.log(`Audio generated: ${audio.url}`);

        // Step 3: Skip image generation and jump to video assembly (70%)
        await job.progress(70);

        // Step 4: assemble video (100%)
        this.logger.log('Assembling final video');
        const video = await this.videosService.createVideo(
          {
            imageUrls: providedImageUrls,
            audioUrl: audio.url,
            scriptId,
            transitionDuration: 1,
            scripts: providedScripts,
          },
          userId,
        );

        await job.progress(100);
        this.logger.log(`Video created: ${video.id}`);

        return video;
      } else {
        // Full generation flow
        // Step 2: Generate audio and image prompts in parallel (25%)
        this.logger.log('Generating audio and image prompts');

        const [audio, prompts] = await Promise.all([
          this.audiosService.createAudio({ scriptId }, userId),
          this.aiService.createImagePrompts({
            content: script.content,
            style: script.style || 'default',
          }),
        ]);

        await job.progress(40);
        this.logger.log(`Generated ${prompts.prompts.length} image prompts`);

        // Step 3: Generate images (70%)
        this.logger.log('Generating images from prompts');
        const imagePromises = prompts.prompts.map((p, index) => {
          this.logger.log(
            `Generating image ${index + 1}/${prompts.prompts.length}`,
          );
          return this.imagesService.createImage(
            { prompt: p.prompt, style: script.style },
            userId,
          );
        });

        // Process images in batches to avoid overloading the system
        const imageResponses = await Promise.all(imagePromises);
        const imageUrls = imageResponses.map((img) => img.url);

        await job.progress(70);
        this.logger.log(`Generated ${imageUrls.length} images`);

        // Step 4: Assemble video (100%)
        this.logger.log('Assembling final video');
        const video = await this.videosService.createVideo(
          {
            imageUrls,
            audioUrl: audio.url,
            scriptId,
            transitionDuration: 1,
            scripts: prompts.prompts.map((p) => p.prompt),
          },
          userId,
        );

        await job.progress(100);
        this.logger.log(`Video created: ${video.id}`);

        return video;
      }
    } catch (error) {
      this.logger.error(`Error in video generation job: ${error.message}`);
      throw error;
    }
  }
}
