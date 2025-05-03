// modules/publisher/dto/publisher-response.dto.ts

import { PublishPlatform } from '@prisma/client';

export class PublisherResponseDto {
  id: string;
  videoId: string;
  platform: PublishPlatform;
  platformVideoId: string;
  publishStatus: string;
  publishLogs: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  platformVideoUrl?: string;
}
