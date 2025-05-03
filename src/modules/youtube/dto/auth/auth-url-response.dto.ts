// /src/modules/youtube/dto/auth/auth-url-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class AuthUrlResponseDto {
  @ApiProperty({
    description: 'URL for YouTube OAuth authentication',
    example: 'https://accounts.google.com/o/oauth2/auth?...',
  })
  url: string;
}
