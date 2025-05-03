// /src/modules/youtube/dto/auth/callback-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class CallbackResponseDto {
  @ApiProperty({
    description: 'Indicates if the authentication was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'YouTube channel name',
    example: 'My Tech Channel',
  })
  channelName: string;

  @ApiProperty({
    description: 'YouTube channel ID',
    example: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
  })
  channelId: string;
}
