// modules/videos/dto/video-response.dto.ts
/**
 * Response DTO for a video asset.
 */
export class VideoResponseDto {
  id: string;
  userId: string;
  scriptId?: string;
  status: string;
  url?: string;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
