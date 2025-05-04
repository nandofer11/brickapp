import { utcToZonedTime, format } from 'date-fns-tz';

export function getCurrentDateInLima() {
  const timeZone = 'America/Lima';
  const now = new Date();
  return format(utcToZonedTime(now, timeZone), 'yyyy-MM-dd HH:mm:ssXXX', { timeZone });
}
