// modules/videos/dto/update-video.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateVideoDto } from './create-video.dto';
import { VideoStatus } from '@prisma/client';

/**
 * DTO for updating an existing video asset.
 */
export class UpdateVideoDto extends PartialType(CreateVideoDto) {
  // Optionally, you can add fields for status or thumbnailUrl here.
  status?: VideoStatus;
  thumbnailUrl?: string;
  url?: string;
}
