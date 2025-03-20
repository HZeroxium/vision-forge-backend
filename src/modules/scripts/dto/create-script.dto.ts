// modules/scripts/dto/create-script.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateScriptDto {
  @IsString()
  title: string; // Optional title for the script

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  style?: string; // e.g., 'child', 'common', 'in-depth'
}
