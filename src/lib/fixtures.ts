// Synthetic, non-identifying demo data. No real patients, staff or records.

export type Status = "scheduled" | "arrived" | "ready" | "in_room" | "completed" | "no_show";

export const STATUS_META: Record<Status, { label: string; tone: Tone }> = {
  scheduled: { label: "Scheduled", tone: "info" },
  arrived: { label: "Arrived", tone: "teal" },
  ready: { label: "Ready", tone: "success" },
  in_room: { label: "In room", tone: "warning" },
  completed: { label: "Completed", tone: "neutral" },
  no_show: { label: "No show", tone: "danger" },
};

/** Index into a non-empty array, wrapping. */
export const pick = <T,>(arr: readonly T[], i: number): T => arr[((i % arr.length) + arr.length) % arr.length] as T;
export const nums = (s: string, sep: string) => s.split(sep).map(Number) as [number, number, number];

export type Tone = "info" | "success" | "warning" | "danger" | "teal" | "neutral";

export interface Provider {
  id: string;
  name: string;
  role: string;
  initials: string;
}
export interface Patient {
  id: string;
  name: string;
  dob: string;
  mrn: string;
  phone: string;
  email: string;
  insurance: string;
  /** Supplied administrative/clinical indicators — shown as-is, never interpreted. */
  flags: string[];
  lastVisit: string;
}
export interface Note {
  id: string;
  at: string;
  by: string;
  text: string;
}
export interface HistoryItem {
  at: string;
  text: string;
}
export interface Appointment {
  id: string;
  date: string;
  time: string;
  duration: number;
  patientId: string;
  providerId: string;
  type: string;
  room: string;
  status: Status;
  arrivedAt?: string | undefined;
  readyAt?: string | undefined;
  notes: Note[];
  history: HistoryItem[];
}

export const CLINIC = { name: "Northside Family Clinic", location: "Suite 200" };
export const CURRENT_USER = { name: "Jordan Reyes", role: "Front Desk" };

export const PROVIDERS: Provider[] = [
  { id: "p1", name: "Dr. Elena Marsh", role: "Family Medicine", initials: "EM" },
  { id: "p2", name: "Dr. Samuel Okafor", role: "Internal Medicine", initials: "SO" },
  { id: "p3", name: "Dr. Priya Nair", role: "Pediatrics", initials: "PN" },
  { id: "p4", name: "Maya Lindqvist, NP", role: "Nurse Practitioner", initials: "ML" },
];

const FIRST = ["Alex", "Bianca", "Carlos", "Dana", "Ethan", "Fatima", "Grace", "Hiro", "Iris", "Jonah", "Keira", "Liam", "Mina", "Noah", "Olive", "Pablo", "Quinn", "Rosa"];
const LAST = ["Turner", "Delgado", "Whitfield", "Kowalski", "Brennan", "Haddad", "Sato", "Moreau", "Ellison", "Park", "Novak", "Fischer", "Abara", "Lund", "Ortega", "Vance", "Chen", "Rhodes"];
const FLAGS = [[], ["Allergy on file"], [], ["Interpreter: Spanish"], [], ["Mobility assistance"], [], [], ["Allergy on file", "Balance due"], [], ["Balance due"], []];
const INS = ["BlueShield PPO", "Aetna HMO", "Self-pay", "Medicare Part B", "UnitedHealth"];

export const PATIENTS: Patient[] = FIRST.map((f, i) => ({
  id: `pt${i + 1}`,
  name: `${f} ${pick(LAST, i)}`,
  dob: `${String((i % 12) + 1).padStart(2, "0")}/${String(((i * 7) % 27) + 1).padStart(2, "0")}/${1950 + ((i * 3) % 60)}`,
  mrn: `DEMO-${String(10200 + i * 37)}`,
  phone: `(555) 01${String(10 + i).padStart(2, "0")}-${String(1000 + i * 113).slice(0, 4)}`,
  email: `${f.toLowerCase()}.demo@example.com`,
  insurance: pick(INS, i),
  flags: pick(FLAGS, i) as string[],
  lastVisit: `0${(i % 9) + 1}/1${i % 9}/2026`,
}));

const TYPES = [
  { type: "Follow-up", duration: 20 },
  { type: "New patient", duration: 40 },
  { type: "Annual physical", duration: 30 },
  { type: "Sick visit", duration: 20 },
  { type: "Telehealth", duration: 15 },
  { type: "Lab review", duration: 15 },
];

export function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(date: string, n: number) {
  const [y, m, d] = nums(date, "-");
  return isoDate(new Date(y, m - 1, d + n));
}

function atToday(time: string, date: string) {
  const [y, m, d] = nums(date, "-");
  const [h, mi] = nums(time, ":");
  return new Date(y, m - 1, d, h, mi).toISOString();
}

/** Deterministic schedule for the 7 days around `today`. */
export function seedAppointments(today: string): Appointment[] {
  const out: Appointment[] = [];
  for (let offset = -3; offset <= 3; offset++) {
    const date = addDays(today, offset);
    const count = offset === 0 ? 16 : 10 + ((offset + 3) % 4);
    for (let i = 0; i < count; i++) {
      const minutes = 8 * 60 + i * 25 + (offset + 3) * 5;
      const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
      const t = pick(TYPES, i + offset + 6);
      const pIdx = (i * 5 + offset + 18) % PATIENTS.length;
      let status: Status = "scheduled";
      if (offset < 0) status = i % 9 === 4 ? "no_show" : "completed";
      if (offset === 0) {
        if (i < 4) status = "completed";
        else if (i === 4) status = "in_room";
        else if (i < 7) status = "ready";
        else if (i < 9) status = "arrived";
      }
      const id = `ap-${date}-${i}`;
      const history: HistoryItem[] = [{ at: atToday("07:30", date), text: "Appointment confirmed by SMS" }];
      let arrivedAt: string | undefined;
      let readyAt: string | undefined;
      if (status !== "scheduled" && status !== "no_show") {
        const minsAgo = 8 + i * 4;
        arrivedAt = offset === 0 ? new Date(Date.now() - minsAgo * 60000).toISOString() : atToday(time, date);
        history.push({ at: arrivedAt, text: "Marked Arrived" });
        if (status !== "arrived") {
          readyAt = offset === 0 ? new Date(Date.now() - (minsAgo - 5) * 60000).toISOString() : atToday(time, date);
          history.push({ at: readyAt, text: "Moved to Ready" });
        }
      }
      out.push({
        id,
        date,
        time,
        duration: t.duration,
        type: t.type,
        patientId: pick(PATIENTS, pIdx).id,
        providerId: pick(PROVIDERS, i + offset + 4).id,
        room: t.type === "Telehealth" ? "Virtual" : `Room ${(i % 6) + 1}`,
        status,
        arrivedAt,
        readyAt,
        notes: i === 5 && offset === 0 ? [{ id: "n-seed", at: atToday("07:45", date), by: "Front Desk", text: "Updated insurance card scanned." }] : [],
        history,
      });
    }
  }
  // Guaranteed visits for the Patient Portal's fictional account (pt1).
  const mine = (date: string, time: string, providerId: string, type: string, status: Status): Appointment => ({
    id: `ap-me-${date}`, date, time, duration: 20, type, patientId: "pt1", providerId, room: "Room 3", status,
    notes: [], history: [{ at: atToday("07:30", date), text: "Appointment confirmed by SMS" }],
  });
  out.push(mine(addDays(today, 2), "10:30", "p1", "Follow-up", "scheduled"));
  out.push(mine(addDays(today, -2), "09:15", "p1", "Lab review", "completed"));
  return out;
}

export const patientById = (id: string) => PATIENTS.find((p) => p.id === id)!;
export const providerById = (id: string) => PROVIDERS.find((p) => p.id === id)!;
