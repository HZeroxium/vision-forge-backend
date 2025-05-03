// /src/modules/youtube/dto/auth/callback-request.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CallbackRequestDto {
  @ApiProperty({
    description: 'Authorization code returned from YouTube OAuth',
    example: '4/P7q7W91a-oMsCeLvIaQm6bTrgtp7',
  })
  @IsString()
  code: string;

  @ApiPropertyOptional({
    description: 'Error code if authorization failed',
    example: 'access_denied',
  })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional({
    description:
      'State parameter used to maintain state between the request and callback',
    example: 'dXNlcklkMTIz',
  })
  @IsOptional()
  @IsString()
  state?: string;
}
