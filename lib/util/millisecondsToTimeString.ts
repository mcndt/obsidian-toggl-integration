import moment from "moment";
import "moment-duration-format";

export default function millisecondsToTimeString(ms: number): string {
  // @ts-expect-error
  return moment.duration(ms).format(
    'h:mm:ss',
    { trim: false, trunc: true },
  )
}

export function secondsToTimeString(seconds: number): string {
  // @ts-expect-error
  return moment.duration(seconds, 'seconds').format(
    'h:mm:ss',
    { trim: false, trunc: true },
  )
}
