// modules/publisher/dto/publish-video.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsArray,
  ArrayNotEmpty,
  IsOptional,
} from 'class-validator';
import { PublishPlatform } from '@prisma/client';

export class PublishVideoDto {
  @IsString()
  @IsNotEmpty()
  videoId: string; // ID from Video record

  @IsEnum(PublishPlatform, { message: 'Invalid publish platform' })
  platform: PublishPlatform = PublishPlatform.YOUTUBE; // Currently only supporting YouTube

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

  @IsOptional()
  @IsEnum(['private', 'public', 'unlisted'], {
    message: 'Privacy status must be one of: private, public, unlisted',
  })
  privacyStatus?: 'private' | 'public' | 'unlisted' = 'private';
}
