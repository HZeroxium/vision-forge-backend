// modules/flow/dto/generate-video-flow.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for orchestrating the complete video generation flow.
 * The user first submits a title, then later confirms the generated content.
 */
export class GenerateVideoFlowDto {
  // The confirmed content from the user (after reviewing the initial generated script)
  @IsString()
  @IsNotEmpty()
  scriptId: string;
}
