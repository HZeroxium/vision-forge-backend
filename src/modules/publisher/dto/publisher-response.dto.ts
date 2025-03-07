// modules/publisher/dto/publisher-response.dto.ts

export class PublisherResponseDto {
  id: string;
  videoId: string;
  platform: string;
  platformVideoId: string;
  publishStatus: string;
  publishLogs: any;
  createdAt: Date;
  updatedAt: Date;
}
