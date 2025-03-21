// src/modules/images/dto/image-response.dto.ts

export class ImageResponseDto {
  id: string;
  prompt: string;
  style: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}
