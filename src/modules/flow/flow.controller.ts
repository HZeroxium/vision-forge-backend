// modules/flow/flow.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { FlowService } from './flow.service';
import { GenerateVideoFlowDto } from './dto/generate-video.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { VideoResponseDto } from '@videos/dto/video-response.dto';

@Controller('flow')
export class FlowController {
  constructor(private readonly flowService: FlowService) {}

  /**
   * Orchestrates the full video generation flow.
   * Protected by JWT authentication.
   */
  @UseGuards(JwtAuthGuard)
  @Post('generate-video')
  async generateVideoFlow(
    @Body() generateVideoFlowDto: GenerateVideoFlowDto,
    @Req() req: any,
  ): Promise<VideoResponseDto> {
    return this.flowService.generateVideoFlow(
      generateVideoFlowDto,
      req.user.userId,
    );
  }
}
