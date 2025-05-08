// /src/modules/youtube/dto/auth/callback-request.dto.ts

import { IsString, IsOptional } from 'class-validator';

export class CallbackRequestDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  state?: string;
}
