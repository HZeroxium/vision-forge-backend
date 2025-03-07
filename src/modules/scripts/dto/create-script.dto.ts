// modules/scripts/dto/create-script.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateScriptDto {
  @IsString()
  @IsNotEmpty()
  rawContent: string; // Raw scientific content input

  @IsString()
  @IsNotEmpty()
  style: string; // e.g., 'child', 'common', 'in-depth'

  @IsOptional()
  @IsString()
  title?: string; // Optional title for the script
}
