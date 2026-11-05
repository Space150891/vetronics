/** Presentation only: retain the US locale already used by the clinic's patient portal. */
export const CLINIC_LOCALE = "en-US";

export function clinicDate(value: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(CLINIC_LOCALE, options);
}

export const clinicTimestamp = (value: string, options: Intl.DateTimeFormatOptions = { dateStyle: "short", timeStyle: "short" }) => new Date(value).toLocaleString(CLINIC_LOCALE, options);