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
    job: Job<{ userId: string; scriptId: string; scripts: string[] }>,
  ) {
    const { userId, scriptId } = job.data;
    this.logger.log(`Processing job ${job.id}`);

    // Step 1: script validated
    const script = await this.scriptsService.findOne(scriptId);
    if (!script) throw new NotFoundException('Script not found');
    await job.progress(10);

    // Step 2: audio + prompts
    const [audio, prompts] = await Promise.all([
      this.audiosService.createAudio({ scriptId }, userId),
      this.aiService.createImagePrompts({
        content: script.content,
        style: script.style || 'default',
      }),
    ]);
    await job.progress(40);

    // Step 3: generate images
    const imageResponses = await Promise.all(
      prompts.prompts.map((p) =>
        this.imagesService.createImage(
          { prompt: p.prompt, style: script.style },
          userId,
        ),
      ),
    );
    const imageUrls = imageResponses.map((img) => img.url);
    await job.progress(70);

    // Step 4: assemble video
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

    return video;
  }
}
