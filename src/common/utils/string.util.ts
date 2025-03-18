// common/utils/string.util.ts

export class StringUtil {
  static toTitleCase(str: string): string {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  static removeTags (str: string) : string {
    str = str.replaceAll(/<.*>/gs, " ");
    return str;
  }

  static removeDoubleSpace (str: string) : string {
    str = str.replaceAll(/  +/g, " ");
    return str;
  }
}