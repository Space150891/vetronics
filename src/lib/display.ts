/** Presentation only: retain the US locale already used by the clinic's patient portal. */
export const CLINIC_LOCALE = "en-US";

export function clinicDate(value: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const us = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value);
  if (!iso && !us) return value;
  const parts = value.split(iso ? "-" : "/").map(Number);
  const [year, month, day] = iso ? parts : [parts[2], parts[0], parts[1]];
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(CLINIC_LOCALE, options);
}

export const clinicTimestamp = (value: string, options: Intl.DateTimeFormatOptions = { dateStyle: "short", timeStyle: "short" }) => new Date(value).toLocaleString(CLINIC_LOCALE, options);