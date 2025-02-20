// common/utils/date.util.ts

export class DateUtil {
  static getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }
}
