import { useSyncExternalStore } from "react";
import { isoDate, seedAppointments, type Appointment } from "./fixtures";

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
  };
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
      if (parsed.version === 2 && parsed.seededFor === today) state = parsed;
      else if (parsed.version === 2) state = { ...fresh(), theme: parsed.theme, session: parsed.session, profile: parsed.profile, form: parsed.form, requests: parsed.requests };
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
