import { useSyncExternalStore } from "react";
import { addDays, isoDate, seedAppointments, type Appointment, type Status } from "./fixtures";
import { seedShifts, weekday, type Shift, type TimeOff } from "./schedule";

export interface ChatMsg {
  id: string;
  from: "staff" | "patient";
  text: string;
  at: string;
}

export interface ApptRequest {
  id: string;
  providerId: string;
  type: string;
  preferredDate: string;
  timeOfDay: string;
  reason: string;
  status: "Pending";
  createdAt: string;
}

export interface PatientProfile {
  preferredName: string;
  phone: string;
  email: string;
  address: string;
  emergencyName: string;
  emergencyPhone: string;
}

/** Visit note linked 1:1 to an appointment (keyed by appointment id, so duplicates are impossible). */
export interface Encounter {
  apptId: string;
  text: string;
  status: "in_progress" | "final";
  startedAt: string;
  savedAt: string;
  finalizedAt?: string | undefined;
}

export type NewPatientForm = Record<string, string | boolean>;

interface State {
  version: 2;
  seededFor: string;
  hydrated: boolean;
  appts: Appointment[];
  chats: Record<string, ChatMsg[]>;
  drafts: Record<string, string>;
  readConvs: string[];
  theme: "light" | "dark";
  // Patient portal (simulated session — passwords are never stored)
  session: { signedIn: boolean; passwordChanged: boolean };
  requests: ApptRequest[];
  profile: PatientProfile;
  form: { data: NewPatientForm; status: "empty" | "draft" | "submitted"; savedAt?: string | undefined };
  shifts: Shift[];
  skips: string[];
  timeOff: TimeOff[];
  encounters: Record<string, Encounter>;
}

const KEY = "vectronics-proto-v2";
const today = isoDate(new Date());

export const DEFAULT_PROFILE: PatientProfile = {
  preferredName: "Alex",
  phone: "(555) 0110-1000",
  email: "alex.demo@example.com",
  address: "",
  emergencyName: "",
  emergencyPhone: "",
};

function fresh(): State {
  return {
    version: 2,
    seededFor: today,
    hydrated: false,
    appts: seedAppointments(today),
    chats: {},
    drafts: {},
    readConvs: [],
    theme: "light",
    session: { signedIn: false, passwordChanged: false },
    requests: [],
    profile: DEFAULT_PROFILE,
    form: { data: {}, status: "empty" },
    shifts: seedShifts(addDays(today, 1 - (weekday(today) || 7))),
    skips: [],
    timeOff: [{ id: "to-seed", providerId: "p2", from: addDays(today, 7), to: addDays(today, 8), allDay: true, start: "08:00", end: "17:00", reason: "Conference" }],
    encounters: seedEncounters(),
  };
}

function seedEncounters(): Record<string, Encounter> {
  const at = new Date(Date.now() - 3600_000).toISOString();
  const out: Record<string, Encounter> = {};
  // Today's first finished visits: one finalized, one in progress; the rest stay "Missing note".
  out[`ap-${today}-0`] = { apptId: `ap-${today}-0`, text: "Follow-up visit. Patient reports improvement since last visit.", status: "final", startedAt: at, savedAt: at, finalizedAt: at };
  out[`ap-${today}-1`] = { apptId: `ap-${today}-1`, text: "Visit in progress — draft started.", status: "in_progress", startedAt: at, savedAt: at };
  out[`ap-${today}-4`] = { apptId: `ap-${today}-4`, text: "", status: "in_progress", startedAt: at, savedAt: at };
  return out;
}

let state: State = fresh();
const initialState = state;
const listeners = new Set<() => void>();
let didHydrate = false;

function emit() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function hydrateStore() {
  if (didHydrate || typeof window === "undefined") return;
  didHydrate = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      const f = fresh();
      if (parsed.version === 2 && parsed.seededFor === today) state = { ...f, ...parsed };
      else if (parsed.version === 2) state = { ...f, theme: parsed.theme, session: parsed.session, profile: parsed.profile, form: parsed.form, requests: parsed.requests, shifts: parsed.shifts ?? f.shifts, skips: parsed.skips ?? [], timeOff: parsed.timeOff ?? f.timeOff, encounters: { ...f.encounters, ...(parsed.encounters ?? {}) } };
    }
  } catch {
    /* ignore corrupt storage */
  }
  state = { ...state, hydrated: true };
  document.documentElement.classList.toggle("dark", state.theme === "dark");
  emit();
}

function set(fn: (s: State) => State) {
  state = fn(state);
  emit();
}

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => sel(state),
    () => sel(initialState),
  );
}

const nowIso = () => new Date().toISOString();

function patchAppt(id: string, fn: (a: Appointment) => Appointment | null): boolean {
  let changed = false;
  set((s) => ({
    ...s,
    appts: s.appts.map((a) => {
      if (a.id !== id) return a;
      const next = fn(a);
      if (!next) return a;
      changed = true;
      return next;
    }),
  }));
  return changed;
}

/** Idempotent: only transitions from Scheduled. */
export function markArrived(id: string) {
  return patchAppt(id, (a) => {
    if (a.status !== "scheduled") return null;
    const at = nowIso();
    return { ...a, status: "arrived", arrivedAt: at, history: [...a.history, { at, text: "Marked Arrived" }] };
  });
}

/** Idempotent: only transitions from Arrived. */
export function moveToReady(id: string) {
  return patchAppt(id, (a) => {
    if (a.status !== "arrived") return null;
    const at = nowIso();
    return { ...a, status: "ready", readyAt: at, history: [...a.history, { at, text: "Moved to Ready" }] };
  });
}

export function addNote(id: string, text: string, by: string) {
  const t = text.trim();
  if (!t) return false;
  return patchAppt(id, (a) => {
    const at = nowIso();
    return {
      ...a,
      notes: [...a.notes, { id: `n-${Date.now()}`, at, by, text: t }],
      history: [...a.history, { at, text: "Operational note added" }],
    };
  });
}

export function sendChat(convId: string, text: string, from: ChatMsg["from"] = "staff") {
  const t = text.trim();
  if (!t) return;
  set((s) => ({
    ...s,
    drafts: { ...s.drafts, [`${from}:${convId}`]: "" },
    chats: { ...s.chats, [convId]: [...(s.chats[convId] ?? []), { id: `m-${Date.now()}`, from, text: t, at: nowIso() }] },
  }));
}

export function setDraft(key: string, text: string) {
  set((s) => ({ ...s, drafts: { ...s.drafts, [key]: text } }));
}

export function markConvRead(convId: string) {
  if (state.readConvs.includes(convId)) return;
  set((s) => ({ ...s, readConvs: [...s.readConvs, convId] }));
}

export function setTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  set((s) => ({ ...s, theme }));
}

export function resetDemo() {
  const theme = state.theme;
  state = { ...fresh(), theme, hydrated: true };
  emit();
}

/* ---------- Patient portal ---------- */
export function signIn() {
  set((s) => ({ ...s, session: { ...s.session, signedIn: true } }));
  return state.session;
}
export function completePasswordChange() {
  set((s) => ({ ...s, session: { signedIn: true, passwordChanged: true } }));
}
export function signOut() {
  set((s) => ({ ...s, session: { ...s.session, signedIn: false } }));
}

/** Requests are always created as Pending — the clinic confirms them. */
export function addRequest(r: Omit<ApptRequest, "id" | "status" | "createdAt">) {
  const req: ApptRequest = { ...r, id: `rq-${Date.now()}`, status: "Pending", createdAt: nowIso() };
  set((s) => ({ ...s, requests: [req, ...s.requests] }));
  return req;
}

export function saveProfile(p: PatientProfile) {
  set((s) => ({ ...s, profile: p }));
}

export function saveFormDraft(data: NewPatientForm) {
  set((s) => ({ ...s, form: { data, status: "draft", savedAt: nowIso() } }));
}
export function submitForm(data: NewPatientForm) {
  set((s) => ({ ...s, form: { data, status: "submitted", savedAt: nowIso() } }));
}

export const peekAppointments = () => state.appts;
export const peekState = () => state;

/* ---------- Scheduling ---------- */
const uid = (p: string) => `${p}-${Date.now()}-${Math.round(Math.random() * 1e4)}`;

export function addShift(sh: Omit<Shift, "id">) {
  const n = { ...sh, id: uid("sh") };
  set((s) => ({ ...s, shifts: [...s.shifts, n] }));
  return n;
}
/** scope "one" edits only `date` of a weekly series (skip + one-off copy); "series" edits the whole series. */
export function updateShift(id: string, patch: Omit<Shift, "id">, scope: "one" | "series", date: string) {
  const cur = state.shifts.find((x) => x.id === id);
  if (!cur) return;
  if (cur.recurring && scope === "one") {
    set((s) => ({ ...s, skips: [...s.skips, `${id}|${date}`], shifts: [...s.shifts, { ...patch, recurring: false, date: patch.date, id: uid("sh") }] }));
  } else {
    set((s) => ({ ...s, shifts: s.shifts.map((x) => (x.id === id ? { ...patch, id, date: cur.recurring && scope === "series" ? cur.date : patch.date } : x)) }));
  }
}
export function deleteShift(id: string, scope: "one" | "series", date: string) {
  const cur = state.shifts.find((x) => x.id === id);
  if (!cur) return;
  if (cur.recurring && scope === "one") set((s) => ({ ...s, skips: [...s.skips, `${id}|${date}`] }));
  else set((s) => ({ ...s, shifts: s.shifts.filter((x) => x.id !== id) }));
}
export function addTimeOff(t: Omit<TimeOff, "id">) {
  set((s) => ({ ...s, timeOff: [...s.timeOff, { ...t, id: uid("to") }] }));
}
export function deleteTimeOff(id: string) {
  set((s) => ({ ...s, timeOff: s.timeOff.filter((t) => t.id !== id) }));
}
export function bookAppointment(a: { date: string; time: string; duration: number; providerId: string; patientId: string; type: string }) {
  const at = nowIso();
  const appt: Appointment = { ...a, id: uid("ap"), room: a.type === "Telehealth" ? "Virtual" : "Room 1", status: "scheduled", notes: [], history: [{ at, text: "Booked from Patient Scheduling" }] };
  set((s) => ({ ...s, appts: [...s.appts, appt] }));
  return appt;
}
export function rescheduleAppt(id: string, p: { date: string; time: string; duration: number; providerId: string; type: string }) {
  return patchAppt(id, (a) => ({ ...a, ...p, history: [...a.history, { at: nowIso(), text: `Rescheduled to ${p.date} ${p.time}` }] }));
}
export function setApptStatus(id: string, status: Status) {
  return patchAppt(id, (a) => (a.status === status ? null : { ...a, status, history: [...a.history, { at: nowIso(), text: `Status set to ${status.replace("_", " ")}` }] }));
}

/* ---------- Front desk board ---------- */
export type Stage = "expected" | "waiting" | "with_provider" | "checkout" | "done";
/** Board stage derived from the appointment's existing status (no duplicate records). */
export function stageOf(a: Appointment): Stage {
  if (a.status === "scheduled") return "expected";
  if (a.status === "arrived" || a.status === "ready") return "waiting";
  if (a.status === "in_room") return "with_provider";
  if (a.status === "completed" && !a.checkedOutAt) return "checkout";
  return "done";
}
/** Waiting → With provider. Idempotent. */
export function sendToProvider(id: string) {
  return patchAppt(id, (a) => {
    if (a.status !== "arrived" && a.status !== "ready") return null;
    const at = nowIso();
    return { ...a, status: "in_room", readyAt: a.readyAt ?? at, history: [...a.history, { at, text: "Sent to provider" }] };
  });
}
/** With provider → Ready to check out. Never touches invoices. */
export function finishVisit(id: string) {
  return patchAppt(id, (a) => (a.status !== "in_room" ? null : { ...a, status: "completed", checkedOutAt: undefined, history: [...a.history, { at: nowIso(), text: "Visit finished, ready for checkout" }] }));
}
/** Completes front-desk checkout; invoice payment is a separate step in Billing. */
export function completeCheckout(id: string) {
  return patchAppt(id, (a) => (a.status !== "completed" || a.checkedOutAt ? null : { ...a, checkedOutAt: nowIso(), history: [...a.history, { at: nowIso(), text: "Checked out" }] }));
}
/** Correct an accidental transition by stepping back one stage. */
export function undoStage(id: string) {
  return patchAppt(id, (a) => {
    const at = nowIso();
    const h = (text: string) => [...a.history, { at, text }];
    if (a.status === "arrived" || a.status === "ready") return { ...a, status: "scheduled", arrivedAt: undefined, readyAt: undefined, history: h("Check-in undone") };
    if (a.status === "in_room") return { ...a, status: "ready", history: h("Moved back to Waiting") };
    if (a.status === "completed" && !a.checkedOutAt) return { ...a, status: "in_room", history: h("Moved back to With provider") };
    return null;
  });
}

/* ---------- Visit notes ---------- */
/** Start or resume the note for an appointment. Idempotent — repeated clicks never duplicate. */
export function startEncounter(apptId: string) {
  const existing = state.encounters[apptId];
  const a = state.appts.find((x) => x.id === apptId);
  if (!a) return;
  if (!existing) {
    const at = nowIso();
    set((s) => ({ ...s, encounters: { ...s.encounters, [apptId]: { apptId, text: "", status: "in_progress", startedAt: at, savedAt: at } } }));
  }
  // Starting brings the patient into the room, matching the Front Desk "With provider" stage.
  if (a.status === "scheduled" || a.status === "arrived" || a.status === "ready") {
    patchAppt(apptId, (x) => ({ ...x, status: "in_room", arrivedAt: x.arrivedAt ?? nowIso(), history: [...x.history, { at: nowIso(), text: "Appointment started" }] }));
  }
}
/** Save draft text; finalized notes are read-only. Returns false if not saved. */
export function saveEncounter(apptId: string, text: string) {
  const e = state.encounters[apptId];
  if (!e || e.status === "final") return false;
  try {
    set((s) => ({ ...s, encounters: { ...s.encounters, [apptId]: { ...e, text, savedAt: nowIso() } } }));
    return true;
  } catch { return false; }
}
/** Finalize: locks the note. Does not touch billing, payment or checkout. */
export function finalizeEncounter(apptId: string) {
  const e = state.encounters[apptId];
  if (!e || e.status === "final" || !e.text.trim()) return false;
  set((s) => ({ ...s, encounters: { ...s.encounters, [apptId]: { ...e, status: "final", finalizedAt: nowIso() } } }));
  return true;
}
