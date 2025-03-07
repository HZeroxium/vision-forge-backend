// modules/scripts/dto/scripts-pagination.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ScriptResponseDto } from './script-response.dto';

export class ScriptsPaginationDto {
  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty({ type: [ScriptResponseDto] })
  scripts: ScriptResponseDto[];
}
