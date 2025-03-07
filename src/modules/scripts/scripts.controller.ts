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
} from '@nestjs/common';
import { ScriptsService } from './scripts.service';
import { CreateScriptDto } from './dto/create-script.dto';
import { UpdateScriptDto } from './dto/update-script.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ScriptResponseDto } from './dto/script-response.dto';

@Controller('scripts')
export class ScriptsController {
  constructor(private readonly scriptsService: ScriptsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createScriptDto: CreateScriptDto,
    @Req() req: any,
  ): Promise<ScriptResponseDto> {
    return this.scriptsService.create(createScriptDto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.scriptsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scriptsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateScriptDto: UpdateScriptDto) {
    return this.scriptsService.update(id, updateScriptDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scriptsService.remove(id);
  }
}
