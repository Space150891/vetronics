import { PROVIDERS } from "./fixtures";

export type StaffMember = { id: string; name: string; role: string; group: "Provider" | "Front Desk" | "Admin"; email: string; active: boolean; days: string[] };
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export const STAFF: StaffMember[] = [
  ...PROVIDERS.map((p, i) => ({ id: p.id, name: p.name, role: p.role, group: "Provider" as const, email: `${p.initials.toLowerCase()}@clinic.example`, active: true, days: DAYS.filter((_, d) => (d + i) % 5 !== 0) })),
  { id: "s1", name: "Jordan Reyes", role: "Receptionist", group: "Front Desk", email: "jreyes@clinic.example", active: true, days: DAYS },
  { id: "s2", name: "Tess Whitlock", role: "Receptionist", group: "Front Desk", email: "twhitlock@clinic.example", active: true, days: ["Mon", "Wed", "Fri"] },
  { id: "s3", name: "Omar Bassi", role: "Medical Assistant", group: "Front Desk", email: "obassi@clinic.example", active: true, days: ["Tue", "Thu", "Fri"] },
  { id: "s4", name: "Lena Hart", role: "Clinic Administrator", group: "Admin", email: "lhart@clinic.example", active: true, days: DAYS },
  { id: "s5", name: "Ravi Menon", role: "Billing Specialist", group: "Admin", email: "rmenon@clinic.example", active: false, days: ["Mon", "Tue"] },
];
