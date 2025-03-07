// modules/media-gen/dto/media-response.dto.ts

export class MediaResponseDto {
  id: string;
  prompt: string;
  style: string;
  mediaType: string;
  s3Url: string;
  createdAt: Date;
  updatedAt: Date;
}
