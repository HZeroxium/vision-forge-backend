// modules/script-gen/script-gen.controller.ts
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ScriptGenService } from './script-gen.service';
import { CreateScriptDto } from './dto/create-script.dto';
import { ScriptResponseDto } from './dto/script-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('script-gen')
export class ScriptGenController {
  constructor(private readonly scriptGenService: ScriptGenService) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  async generateScript(
    @Body() createScriptDto: CreateScriptDto,
    @Req() req: any, // User data injected by JwtAuthGuard
  ): Promise<ScriptResponseDto> {
    // Call service with user ID from authenticated request
    return this.scriptGenService.generateScript(
      createScriptDto,
      req.user.userId,
    );
  }
}
