// common/cache/utils.ts

export function generateCacheKey(parts: string[]): string {
  return parts.join(':');
}
