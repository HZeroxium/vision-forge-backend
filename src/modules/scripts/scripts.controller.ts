// modules/scripts/scripts.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ScriptsService } from './scripts.service';
import { CreateScriptDto } from './dto/create-script.dto';
import { UpdateScriptDto } from './dto/update-script.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ScriptResponseDto } from './dto/script-response.dto';
import { ScriptsPaginationDto } from './dto/scripts-pagination.dto';
import { CreateImagePromptsDto } from './dto/create-image-prompts.dto';

@Controller('scripts')
export class ScriptsController {
  constructor(private readonly scriptsService: ScriptsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createScript(
    @Body() createScriptDto: CreateScriptDto,
    @Req() req: any,
  ): Promise<ScriptResponseDto> {
    return this.scriptsService.createScript(createScriptDto, req.user.userId);
  }

  /**
   * Generate image prompts based on script content.
   */
  @UseGuards(JwtAuthGuard)
  @Post('image-prompts')
  async createImagePrompts(
    @Body() createImagePromptsDto: CreateImagePromptsDto,
  ) {
    return this.scriptsService.createImagePrompts(createImagePromptsDto);
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<ScriptsPaginationDto> {
    return this.scriptsService.findAll(page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ScriptResponseDto> {
    return this.scriptsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateScriptDto: UpdateScriptDto,
  ): Promise<ScriptResponseDto> {
    return this.scriptsService.update(id, updateScriptDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ScriptResponseDto> {
    return this.scriptsService.remove(id);
  }
}
