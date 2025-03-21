import { ImageResponseDto } from './dto/image-response.dto';

/**
 * Maps a Prisma Image record to ImageResponseDto.
 */
export function mapImageToResponse(image: any): ImageResponseDto {
  return {
    id: image.id,
    prompt: image.prompt,
    style: image.style,
    url: image.url,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt,
  };
}
