// Internal staff-only messaging (DEMO: local persistence, single browser).
// No backend is connected, so delivery between devices is NOT real. Incoming
// replies are simulated. Messages whose text starts with "/fail" simulate a
// failed send so the Retry flow can be exercised.
import { useSyncExternalStore } from "react";

export interface StaffMember { id: string; name: string; role: string; active: boolean }
export type SendState = "sending" | "sent" | "failed";
export interface StaffMsg { id: string; from: string; text: string; at: string; state: SendState; read: boolean }
export interface Conversation { id: string; members: [string, string]; messages: StaffMsg[] }
export interface ChatState { convs: Conversation[]; drafts: Record<string, string> }

export const ME = "s-jordan";
export const STAFF: StaffMember[] = [
  { id: ME, name: "Jordan Reyes", role: "Front Desk", active: true },
  { id: "s-priya", name: "Priya Nair", role: "Nurse Lead", active: true },
  { id: "s-marcus", name: "Marcus Bell", role: "Clinic Manager", active: true },
  { id: "s-elena", name: "Dr. Elena Ortiz", role: "Physician", active: true },
  { id: "s-tom", name: "Tom Hale", role: "Medical Assistant", active: false },
];
export const staffById = (id: string) => STAFF.find((s) => s.id === id);
export const colleagues = () => STAFF.filter((s) => s.active && s.id !== ME);

export const convIdFor = (a: string, b: string) => "dm:" + [a, b].sort().join("|");

const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();
const m = (id: string, from: string, text: string, min: number, read = true): StaffMsg => ({ id, from, text, at: ago(min), state: "sent", read });

function seed(): ChatState {
  return {
    drafts: {},
    convs: [
      { id: convIdFor(ME, "s-priya"), members: [ME, "s-priya"], messages: [
        m("p1", "s-priya", "Room 3 is being cleaned, should be free by 10:15.", 1500),
        m("p2", ME, "Thanks, I'll hold the 10:20 arrival in the waiting area.", 1490),
        m("p3", "s-priya", "Room 3 is ready now. Can you send the next patient back?", 12, false),
      ] },
      { id: convIdFor(ME, "s-marcus"), members: [ME, "s-marcus"], messages: [
        m("m1", "s-marcus", "Handover for the afternoon shift: two late arrivals expected.", 180),
        m("m2", ME, "Noted. I'll flag them on the Front Desk board.", 170),
      ] },
      { id: convIdFor(ME, "s-elena"), members: [ME, "s-elena"], messages: [
        m("e1", "s-elena", "Is the ECG cart back from servicing?", 60),
        m("e2", ME, "Yes, it's in Room 2 and checked.", 55),
        m("e3", "s-elena", "Perfect, thank you.", 50, false),
      ] },
    ],
  };
}

// ---------- pure helpers (tested) ----------
export function visibleConvs(s: ChatState, me = ME) {
  return s.convs
    .filter((c) => c.members.includes(me))
    .sort((a, b) => (last(b)?.at ?? "").localeCompare(last(a)?.at ?? ""));
}
export const last = (c: Conversation) => c.messages[c.messages.length - 1];
export const unreadIn = (c: Conversation, me = ME) => c.messages.filter((x) => x.from !== me && !x.read).length;
export const totalUnread = (s: ChatState, me = ME) => visibleConvs(s, me).reduce((n, c) => n + unreadIn(c, me), 0);
export const otherOf = (c: Conversation, me = ME) => c.members.find((x) => x !== me) ?? me;

export function ensureConv(s: ChatState, other: string, me = ME): { state: ChatState; id: string } {
  const id = convIdFor(me, other);
  if (s.convs.some((c) => c.id === id)) return { state: s, id };
  const target = staffById(other);
  if (!target || !target.active) throw new Error("Recipient is not active staff");
  return { state: { ...s, convs: [...s.convs, { id, members: [me, other] as [string, string], messages: [] }] }, id };
}
export function markRead(s: ChatState, id: string, me = ME): ChatState {
  return { ...s, convs: s.convs.map((c) => c.id !== id || unreadIn(c, me) === 0 ? c : { ...c, messages: c.messages.map((x) => x.from === me ? x : { ...x, read: true }) }) };
}
function patchMsg(s: ChatState, cid: string, mid: string, p: Partial<StaffMsg>): ChatState {
  return { ...s, convs: s.convs.map((c) => c.id !== cid ? c : { ...c, messages: c.messages.map((x) => x.id === mid ? { ...x, ...p } : x) }) };
}
export function appendMsg(s: ChatState, cid: string, msg: StaffMsg): ChatState {
  return { ...s, convs: s.convs.map((c) => c.id !== cid || c.messages.some((x) => x.id === msg.id) ? c : { ...c, messages: [...c.messages, msg] }) };
}

// ---------- store ----------
const KEY = "vectronics-staff-chat-v1";
let state: ChatState = seed();
let loaded = false;
const subs = new Set<() => void>();
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = JSON.parse(raw);
    // anything still "sending" after reload never completed
    state = { ...state, convs: state.convs.map((c) => ({ ...c, messages: c.messages.map((x) => x.state === "sending" ? { ...x, state: "failed" as const } : x) })) };
  } catch { /* ignore */ }
}
function set(fn: (s: ChatState) => ChatState) {
  state = fn(state);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  subs.forEach((f) => f());
}
export function useChat<T>(sel: (s: ChatState) => T): T {
  return useSyncExternalStore(
    (f) => { load(); subs.add(f); f(); return () => subs.delete(f); },
    () => { load(); return sel(state); },
    () => sel(state),
  );
}

export const chat = {
  open(other: string) { let id = ""; set((s) => { const r = ensureConv(s, other); id = r.id; return r.state; }); return id; },
  read(id: string) { if (state.convs.find((c) => c.id === id && unreadIn(c) > 0)) set((s) => markRead(s, id)); },
  draft(id: string, text: string) { set((s) => ({ ...s, drafts: { ...s.drafts, [id]: text } })); },
  send(cid: string, text: string) {
    const body = text.trim();
    if (!body) return;
    const mid = crypto.randomUUID();
    set((s) => ({ ...appendMsg(s, cid, { id: mid, from: ME, text: body, at: new Date().toISOString(), state: "sending", read: true }), drafts: { ...s.drafts, [cid]: "" } }));
    deliver(cid, mid, body);
  },
  retry(cid: string, mid: string) {
    const msg = state.convs.find((c) => c.id === cid)?.messages.find((x) => x.id === mid);
    if (!msg || msg.state !== "failed") return;
    set((s) => patchMsg(s, cid, mid, { state: "sending" }));
    deliver(cid, mid, msg.text.replace(/^\/fail\s*/, ""), true);
  },
};

const REPLIES = ["Got it, thanks.", "On it.", "Sounds good — I'll update the board.", "Thanks for the heads-up."];
function deliver(cid: string, mid: string, text: string, isRetry = false) {
  setTimeout(() => {
    const fail = !isRetry && /^\/fail/.test(text);
    set((s) => patchMsg(s, cid, mid, { state: fail ? "failed" : "sent" }));
    if (fail) return;
    // DEMO: simulated colleague reply
    const conv = state.convs.find((c) => c.id === cid);
    if (!conv) return;
    setTimeout(() => {
      set((s) => appendMsg(s, cid, { id: crypto.randomUUID(), from: otherOf(conv), text: REPLIES[Math.floor(Math.random() * REPLIES.length)]!, at: new Date().toISOString(), state: "sent", read: false }));
    }, 3500);
  }, 700);
}
