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
  ParseIntPipe,
  DefaultValuePipe,
  ForbiddenException,
} from '@nestjs/common';
import { ScriptsService } from './scripts.service';
import { CreateScriptDto } from './dto/create-script.dto';
import { UpdateScriptDto } from './dto/update-script.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { ScriptResponseDto } from './dto/script-response.dto';
import { ScriptsPaginationDto } from './dto/scripts-pagination.dto';
import { CreateImagePromptsDto } from './dto/create-image-prompts.dto';

interface RequestWithUser {
  user: {
    userId: string;
  };
}

@Controller('scripts')
export class ScriptsController {
  constructor(private readonly scriptsService: ScriptsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createScript(
    @Body() createScriptDto: CreateScriptDto,
    @Req() req: RequestWithUser,
  ): Promise<ScriptResponseDto> {
    return this.scriptsService.createScript(createScriptDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('image-prompts')
  async createImagePrompts(
    @Body() createImagePromptsDto: CreateImagePromptsDto,
  ) {
    return this.scriptsService.createImagePrompts(createImagePromptsDto);
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), new ParseIntPipe())
    page: number = 1,
    @Query('limit', new DefaultValuePipe(10), new ParseIntPipe())
    limit: number = 10,
    @Query('userId') userId?: string,
  ): Promise<ScriptsPaginationDto> {
    return this.scriptsService.findAll(page, limit, userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ScriptResponseDto> {
    return this.scriptsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateScriptDto: UpdateScriptDto,
    @Req() req: RequestWithUser,
  ): Promise<ScriptResponseDto> {
    return this.scriptsService.update(id, updateScriptDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ScriptResponseDto> {
    return this.scriptsService.remove(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/me')
  async findMyScripts(
    @Query('page', new DefaultValuePipe(1), new ParseIntPipe())
    page: number = 1,
    @Query('limit', new DefaultValuePipe(10), new ParseIntPipe())
    limit: number = 10,
    @Req() req: RequestWithUser,
  ): Promise<ScriptsPaginationDto> {
    return this.scriptsService.findAll(page, limit, req.user.userId);
  }
}
