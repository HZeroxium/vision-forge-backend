// modules/scripts/utils.ts

import { ScriptResponseDto } from './dto/script-response.dto';

export const mapScriptToResponse = (script: any): ScriptResponseDto => {
  return {
    id: script.id,
    title: script.title,
    content: script.content,
    style: script.style,
    createdAt: script.createdAt,
    updatedAt: script.updatedAt,
  };
};
