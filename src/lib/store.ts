import { useSyncExternalStore } from "react";
import { isoDate, seedAppointments, type Appointment } from "./fixtures";

export interface ChatMsg {
  id: string;
  from: "staff" | "patient";
  text: string;
  at: string;
}

interface State {
  version: 1;
  seededFor: string;
  appts: Appointment[];
  chats: Record<string, ChatMsg[]>;
  theme: "light" | "dark";
}

const KEY = "vectronics-provider-v1";
const today = isoDate(new Date());

function fresh(): State {
  return { version: 1, seededFor: today, appts: seedAppointments(today), chats: {}, theme: "light" };
}

let state: State = fresh();
const listeners = new Set<() => void>();
let hydrated = false;

function emit() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function hydrateStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.version === 1 && parsed.seededFor === today) state = parsed;
      else state = { ...fresh(), theme: parsed.theme ?? "light" };
    }
  } catch {
    /* ignore corrupt storage */
  }
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
    () => sel(state),
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

export function sendChat(convId: string, text: string) {
  const t = text.trim();
  if (!t) return;
  set((s) => ({
    ...s,
    chats: { ...s.chats, [convId]: [...(s.chats[convId] ?? []), { id: `m-${Date.now()}`, from: "staff", text: t, at: nowIso() }] },
  }));
}

export function setTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  set((s) => ({ ...s, theme }));
}

export function resetDemo() {
  const theme = state.theme;
  state = { ...fresh(), theme };
  emit();
}
