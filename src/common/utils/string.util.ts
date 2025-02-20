// common/utils/string.util.ts

export class StringUtil {
  static toTitleCase(str: string): string {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
