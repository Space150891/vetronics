// Pure scheduling rules shared by Staff Scheduling and Patient Scheduling.
import { PROVIDERS, nums, type Appointment } from "./fixtures";

export interface Shift {
  id: string;
  providerId: string;
  /** One-off date, or first date of a weekly series. */
  date: string;
  recurring: boolean;
  start: string; // HH:MM
  end: string;
  location: string;
  notes: string;
}
export interface TimeOff {
  id: string;
  providerId: string;
  from: string;
  to: string;
  allDay: boolean;
  start: string;
  end: string;
  reason: string;
}
export interface SchedData {
  shifts: Shift[];
  /** Skipped occurrences of weekly series: `${shiftId}|${date}` */
  skips: string[];
  timeOff: TimeOff[];
  appts: Appointment[];
}
export interface Interval { s: number; e: number }

export const OPEN = 8 * 60;
export const CLOSE = 17 * 60;
export const LUNCH: Interval = { s: 12 * 60, e: 13 * 60 };
export const LOCATIONS = ["Clinic", "Telehealth", "Admin time"];

export const toMin = (t: string) => { const [h, m] = nums(t, ":"); return h * 60 + m; };
export const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const weekday = (date: string) => { const [y, m, d] = nums(date, "-"); return new Date(y, m - 1, d).getDay(); };
export const isClosed = (date: string) => { const w = weekday(date); return w === 0 || w === 6; };

export function seedShifts(monday: string): Shift[] {
  const out: Shift[] = [];
  PROVIDERS.forEach((p) => {
    for (let i = 0; i < 5; i++) {
      const [y, m, d] = nums(monday, "-");
      const dt = new Date(y, m - 1, d + i - 7);
      const date = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      out.push({ id: `sh-${p.id}-${i}`, providerId: p.id, date, recurring: true, start: "08:00", end: "17:00", location: "Clinic", notes: "" });
    }
  });
  return out;
}

export interface Occurrence { shift: Shift; s: number; e: number }

export function shiftsOn(d: SchedData, date: string, providerId: string): Occurrence[] {
  const wd = weekday(date);
  return d.shifts
    .filter((sh) => sh.providerId === providerId && (sh.recurring ? sh.date <= date && weekday(sh.date) === wd && !d.skips.includes(`${sh.id}|${date}`) : sh.date === date))
    .map((shift) => ({ shift, s: toMin(shift.start), e: toMin(shift.end) }))
    .sort((a, b) => a.s - b.s);
}

export function timeOffOn(d: SchedData, date: string, providerId: string): (Interval & { t: TimeOff })[] {
  return d.timeOff
    .filter((t) => t.providerId === providerId && t.from <= date && t.to >= date)
    .map((t) => (t.allDay ? { s: 0, e: 24 * 60, t } : { s: toMin(t.start), e: toMin(t.end), t }));
}

/** Subtract `cuts` from `base`. */
export function subtract(base: Interval[], cuts: Interval[]): Interval[] {
  let out = base.map((b) => ({ ...b }));
  for (const c of cuts) {
    out = out.flatMap((b) => {
      if (c.e <= b.s || c.s >= b.e) return [b];
      const parts: Interval[] = [];
      if (c.s > b.s) parts.push({ s: b.s, e: c.s });
      if (c.e < b.e) parts.push({ s: c.e, e: b.e });
      return parts;
    });
  }
  return out;
}
const len = (xs: Interval[]) => xs.reduce((n, x) => n + x.e - x.s, 0);

/** Bookable = shifts within clinic hours, minus lunch and time off. Closed days have none. */
export function bookable(d: SchedData, date: string, providerId: string): Interval[] {
  if (isClosed(date)) return [];
  const base = shiftsOn(d, date, providerId).map((o) => ({ s: Math.max(o.s, OPEN), e: Math.min(o.e, CLOSE) })).filter((x) => x.e > x.s);
  return subtract(base, [LUNCH, ...timeOffOn(d, date, providerId)]);
}

export const scheduledMinutes = (d: SchedData, date: string, pid: string) => (isClosed(date) ? 0 : len(shiftsOn(d, date, pid).map((o) => ({ s: o.s, e: o.e }))));

export const active = (a: Appointment) => a.status !== "cancelled";
export const apptInterval = (a: Appointment): Interval => ({ s: toMin(a.time), e: toMin(a.time) + a.duration });

export function dayStats(d: SchedData, date: string, pids: string[]) {
  let avail = 0, booked = 0, sched = 0, staff = 0;
  for (const pid of pids) {
    const b = bookable(d, date, pid);
    const sm = scheduledMinutes(d, date, pid);
    if (sm > 0) staff++;
    sched += sm;
    avail += len(b);
    const appts = d.appts.filter((a) => a.date === date && a.providerId === pid && active(a));
    // Count only the booked minutes that fall inside bookable time.
    booked += appts.reduce((n, a) => { const i = apptInterval(a); return n + b.reduce((k, x) => k + Math.max(0, Math.min(i.e, x.e) - Math.max(i.s, x.s)), 0); }, 0);
  }
  return { avail, booked, sched, staff, util: avail ? Math.round((booked / avail) * 100) : 0 };
}

/** Why a slot can't be booked, or null if it can. */
export function bookingProblem(d: SchedData, a: { date: string; time: string; duration: number; providerId: string; id?: string | undefined }): string | null {
  const s = toMin(a.time), e = s + a.duration;
  if (isClosed(a.date)) return "The clinic is closed that day.";
  const b = bookable(d, a.date, a.providerId);
  if (!b.some((x) => x.s <= s && x.e >= e)) return "That time is outside the provider's bookable hours (shift, lunch break or time off).";
  const clash = d.appts.find((x) => x.id !== a.id && x.date === a.date && x.providerId === a.providerId && active(x) && toMin(x.time) < e && apptInterval(x).e > s);
  if (clash) return `Overlaps another appointment at ${clash.time}.`;
  return null;
}

/** Active appointments sitting outside bookable time (e.g. after time off was added). */
export const isConflict = (d: SchedData, a: Appointment) => active(a) && a.status === "scheduled" && bookingProblem(d, a) !== null;

export function freeSlots(d: SchedData, providerId: string, date: string, duration: number, step = 15): string[] {
  const out: string[] = [];
  for (const x of bookable(d, date, providerId)) {
    for (let t = Math.ceil(x.s / step) * step; t + duration <= x.e; t += step) {
      if (!bookingProblem(d, { date, time: toTime(t), duration, providerId })) out.push(toTime(t));
    }
  }
  return out;
}
