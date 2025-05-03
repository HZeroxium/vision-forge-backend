// /src/modules/youtube/dto/upload/upload-video-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class UploadVideoResponseDto {
  @ApiProperty({
    description: 'Indicates if the video upload was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'YouTube video ID',
    example: 'dQw4w9WgXcQ',
  })
  youtubeVideoId: string;

  @ApiProperty({
    description: 'YouTube video URL',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  youtubeUrl: string;

  @ApiProperty({
    description: 'Publishing history record ID',
    example: 'd6edcf90-707e-4f03-a3de-593204ccef45',
  })
  publishingHistoryId: string;
}
