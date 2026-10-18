import { createFileRoute } from "@tanstack/react-router";
import { ListDetailPage, headFor } from "@/components/ListDetail";
import { DL, StatusBadge } from "@/components/kit";
import { nums, addDays, isoDate, patientById, providerById, type Appointment } from "@/lib/fixtures";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/appointments")({
  head: headFor("Appointments", "Clinic agenda for the week with appointment details."),
  component: Page,
});

const fmt = (d: string) => { const [y, m, day] = nums(d, "-"); return new Date(y, m - 1, day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); };

function Page() {
  const appts = useStore((s) => s.appts);
  const today = isoDate(new Date());
  const rows = [...appts].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return (
    <ListDetailPage<Appointment>
      title="Appointments"
      sub="Agenda across the clinic. Select an appointment to see its details."
      rows={rows}
      tabs={[{ value: "today", label: "Today" }, { value: "upcoming", label: "Upcoming" }, { value: "past", label: "Past" }]}
      tabFilter={(a, t) => (t === "today" ? a.date === today : t === "upcoming" ? a.date > today && a.date <= addDays(today, 7) : a.date < today)}
      search={(a) => `${patientById(a.patientId).name} ${providerById(a.providerId).name} ${a.type}`}
      searchPlaceholder="Patient, provider or appointment type"
      columns={[
        { label: "Date", render: (a) => <span className="font-medium">{fmt(a.date)}</span> },
        { label: "Time", render: (a) => <span className="tabular-nums">{a.time}</span> },
        { label: "Patient", render: (a) => <span className="font-semibold">{patientById(a.patientId).name}</span> },
        { label: "Provider", render: (a) => providerById(a.providerId).name },
        { label: "Type", render: (a) => a.type },
        { label: "Status", render: (a) => <StatusBadge status={a.status} /> },
      ]}
      previewTitle={(a) => `${patientById(a.patientId).name} · ${a.time}`}
      preview={(a) => <DL items={[["Date", fmt(a.date)], ["Provider", providerById(a.providerId).name], ["Type", a.type], ["Duration", `${a.duration} min`], ["Location", a.room], ["Status", <StatusBadge key="s" status={a.status} />], ["Notes", a.notes.length ? a.notes.map((n) => n.text).join("; ") : "—"]]} />}
    />
  );
}
