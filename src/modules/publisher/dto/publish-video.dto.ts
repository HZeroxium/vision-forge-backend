// modules/publisher/dto/publish-video.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { PublishPlatform } from '@prisma/client';

export class PublishVideoDto {
  @IsString()
  @IsNotEmpty()
  videoId: string; // ID from Video record

  @IsEnum(PublishPlatform, { message: 'Invalid publish platform' })
  platform: PublishPlatform; // YOUTUBE, TIKTOK, or FACEBOOK

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tags: string[];

  // TODO: Optionally add more parameters like privacy settings
}
