// modules/script-gen/dto/script-response.dto.ts
export class ScriptResponseDto {
  id: string;
  title: string;
  content: string;
  style: string;
  sources?: Array<{
    title: string;
    content: string;
    url: string;
    source_type: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
