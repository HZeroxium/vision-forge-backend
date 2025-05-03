// /src/modules/youtube/dto/statistics/video-statistics-response.dto.ts

export class VideoStatisticsDto {
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  favoriteCount: number;
  lastUpdated: string;
}

export class VideoStatisticsResponseDto {
  statistics: VideoStatisticsDto;
  youtubeVideoId: string;
  youtubeUrl: string;
}
