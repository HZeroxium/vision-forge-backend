// modules/publisher/dto/update-publisher.dto.ts

import { IsString, IsArray, IsOptional, IsEnum } from 'class-validator';
import { PublishPlatform } from '@prisma/client';

export class UpdatePublisherDto {
  @IsOptional()
  @IsString()
  videoId?: string;

  @IsOptional()
  @IsEnum(PublishPlatform, { message: 'Invalid publish platform' })
  platform?: PublishPlatform;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(['private', 'public', 'unlisted'], {
    message: 'Privacy status must be one of: private, public, unlisted',
  })
  privacyStatus?: 'private' | 'public' | 'unlisted';
}
