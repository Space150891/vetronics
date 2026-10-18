// Shared fictional data used by both portals.
import { CLINIC, PATIENTS, PROVIDERS, pick, type Tone } from "./fixtures";

/** The signed-in fictional patient for the Patient Portal. */
export const ME = PATIENTS[0]!;

export const SUPPORT = { phone: "(555) 010-2000", email: "frontdesk@clinic.example", hours: "Mon–Fri, 8:00 AM – 5:00 PM" };
export { CLINIC };

/* ---------- Conversations (shared by Provider Messages and Patient Messages) ---------- */
export interface Conversation {
  id: string;
  patientId: string;
  patient: string;
  subject: string;
  seed: { id: string; from: "staff" | "patient"; text: string; at: string }[];
}
const SUBJECTS = ["Appointment reschedule", "Form question", "Parking information", "Billing question", "Refill request routing", "Directions"];
export const CONVERSATIONS: Conversation[] = [
  {
    id: "c0", patientId: ME.id, patient: ME.name, subject: "Your upcoming visit",
    seed: [{ id: "c0-1", from: "staff", text: "Hi Alex, please arrive 10 minutes early and bring your insurance card. Reply here if you need to reschedule.", at: "" }],
  },
  {
    id: "c-me-2", patientId: ME.id, patient: ME.name, subject: "Billing question",
    seed: [
      { id: "c1-1", from: "patient", text: "Hello, could you explain the administrative fee on my last invoice?", at: "" },
      { id: "c1-2", from: "staff", text: "Of course — it covers records handling for new patients. You can see the breakdown under Bills.", at: "" },
    ],
  },
  ...PATIENTS.slice(1, 8).map((p, i) => ({
    id: `c${i + 1}`, patientId: p.id, patient: p.name, subject: pick(SUBJECTS, i),
    seed: [{ id: `s${i}`, from: "patient" as const, text: `Hello, I have a question about: ${pick(SUBJECTS, i).toLowerCase()}.`, at: "" }],
  })),
];
/** Conversations whose latest seeded message is from staff start unread for the patient. */
export const UNREAD_SEED = new Set(["c0", "c-me-2"]);

/* ---------- Invoices (shared by Provider Billing and Patient Bills) ---------- */
export type InvoiceStatus = "Paid" | "Open" | "Overdue";
export interface Invoice {
  id: string;
  number: string;
  patientId: string;
  patient: string;
  date: string;
  amount: number;
  status: InvoiceStatus;
  items: [string, number][];
  payments: { date: string; method: string; amount: number }[];
}
export const INVOICE_TONE: Record<InvoiceStatus, Tone> = { Paid: "success", Open: "info", Overdue: "danger" };
export const INVOICES: Invoice[] = [
  { id: "inv-me-1", number: "INV-2026-4090", patientId: ME.id, patient: ME.name, date: "10/02/2026", amount: 85, status: "Open", items: [["Office visit", 65], ["Administrative fee", 20]], payments: [] },
  { id: "inv-me-2", number: "INV-2026-3871", patientId: ME.id, patient: ME.name, date: "08/14/2026", amount: 140, status: "Paid", items: [["New patient visit", 110], ["Administrative fee", 30]], payments: [{ date: "08/20/2026", method: "Card at front desk", amount: 140 }] },
  { id: "inv-me-3", number: "INV-2026-3512", patientId: ME.id, patient: ME.name, date: "06/03/2026", amount: 45, status: "Paid", items: [["Lab review", 45]], payments: [{ date: "06/03/2026", method: "Card at front desk", amount: 25 }, { date: "06/30/2026", method: "Check", amount: 20 }] },
  ...PATIENTS.slice(1, 12).map((p, i) => {
    const amount = pick([85, 140, 60, 220, 45, 95], i);
    return {
      id: `inv${i}`, number: `INV-2026-${4100 + i}`, patientId: p.id, patient: p.name,
      date: `10/${String(1 + i).padStart(2, "0")}/2026`, amount,
      status: pick(["Paid", "Open", "Overdue", "Paid"] as const, i),
      items: [["Office visit", amount - 20], ["Administrative fee", 20]] as [string, number][],
      payments: [],
    };
  }),
];
export const balance = (inv: Invoice) => inv.amount - inv.payments.reduce((s, p) => s + p.amount, 0);
export const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/* ---------- Doctor directory ---------- */
export interface DoctorInfo {
  id: string;
  bio: string;
  languages: string[];
  accepting: boolean;
  visitTypes: string[];
}
export const DOCTORS: DoctorInfo[] = PROVIDERS.map((p, i) => ({
  id: p.id,
  bio: `${p.name.split(",")[0]} sees patients at ${CLINIC.name}. ${pick(["Focuses on long-term relationships with families.", "Enjoys explaining care options in plain language.", "Sees children and teens from newborn to 18.", "Offers same-week visits for established patients."], i)}`,
  languages: pick([["English", "Spanish"], ["English"], ["English", "Hindi"], ["English", "Swedish"]], i),
  accepting: i !== 1,
  visitTypes: pick([["Follow-up", "Annual physical", "Telehealth"], ["Follow-up", "Lab review"], ["Sick visit", "Annual physical"], ["Follow-up", "Sick visit", "Telehealth"]], i),
}));
export const VISIT_TYPES = ["Follow-up", "New patient", "Annual physical", "Sick visit", "Telehealth", "Lab review"];
