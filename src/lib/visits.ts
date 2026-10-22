import type { Appointment } from "./fixtures";
import type { Encounter } from "./store";

export type NoteStatus = "not_started" | "missing" | "in_progress" | "final";
export const NOTE_META: Record<NoteStatus, { label: string; tone: "neutral" | "danger" | "info" | "success" }> = {
  not_started: { label: "No note yet", tone: "neutral" },
  missing: { label: "Missing note", tone: "danger" },
  in_progress: { label: "In progress", tone: "info" },
  final: { label: "Finalized", tone: "success" },
};

/** Local clinic time (prototype uses the browser's timezone as the clinic's). */
export const startMs = (a: Appointment) => new Date(`${a.date}T${a.time}:00`).getTime();
export const endMs = (a: Appointment) => startMs(a) + a.duration * 60000;

/** Note status is independent from appointment status. */
export function noteStatus(a: Appointment, e: Encounter | undefined, now: number): NoteStatus {
  if (e) return e.status === "final" ? "final" : "in_progress";
  const seen = a.status === "completed" || a.status === "in_room";
  return seen || (a.status !== "cancelled" && a.status !== "no_show" && endMs(a) < now) ? "missing" : "not_started";
}

const awaiting = (a: Appointment) => a.status === "scheduled" || a.status === "arrived" || a.status === "ready";

/** Not yet started and its start time is still ahead. */
export const upcoming = (appts: Appointment[], now: number) =>
  appts.filter((a) => awaiting(a) && startMs(a) >= now).sort((x, y) => startMs(x) - startMs(y));

/** Still awaiting the provider although the start time has passed (today only — older ones are no-shows to resolve at the desk). */
export const overdue = (appts: Appointment[], now: number, today: string) =>
  appts.filter((a) => awaiting(a) && a.date === today && startMs(a) < now).sort((x, y) => startMs(x) - startMs(y));
