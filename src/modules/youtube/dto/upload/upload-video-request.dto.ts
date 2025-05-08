// modules/youtube/dto/upload-video.dto.ts

import { IsString, IsArray, IsEnum, IsNotEmpty } from 'class-validator';

export class UploadVideoRequestDto {
  @IsString()
  @IsNotEmpty()
  videoId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  tags: string[];

  @IsEnum(['private', 'public', 'unlisted'], {
    message: 'Privacy status must be one of: private, public, unlisted',
  })
  privacyStatus: 'private' | 'public' | 'unlisted' = 'private';
}
