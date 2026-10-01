import 'temporal-polyfill/global';

export const browserTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const todayIso = (timeZone = browserTimeZone()): string =>
  Temporal.Now.plainDateISO(timeZone).toString();
