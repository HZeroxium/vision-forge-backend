// modules/videos/dto/video-response.dto.ts
/**
 * Response DTO for a video asset.
 */
export class VideoResponseDto {
  id: string;
  userId: string;
  scriptId?: string;
  status: string;
  url: string;
  thumbnailUrl?: string;
  publishingHistoryId?: string; // ID of the latest publishing history if video has been published
  createdAt: Date;
  updatedAt: Date;
}
