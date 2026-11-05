import { createFileRoute } from "@tanstack/react-router";
import { Flag } from "lucide-react";
import { ListDetailPage, headFor } from "@/components/ListDetail";
import { Badge, DL, StatusBadge } from "@/components/kit";
import { PATIENTS, providerById, type Patient } from "@/lib/fixtures";
import { useStore } from "@/lib/store";
import { clinicDate } from "@/lib/display";

export const Route = createFileRoute("/patients")({
  head: headFor("Patients and Visit Notes", "Searchable patient list with record and visit note preview."),
  component: Page,
});

function Page() {
  const appts = useStore((s) => s.appts);
  return (
    <ListDetailPage<Patient>
      title="Patients and Visit Notes"
      sub="Patient records and their visit history."
      rows={PATIENTS}
      tabs={[{ value: "all", label: "All" }, { value: "flags", label: "With indicators" }]}
      tabFilter={(p, t) => t === "all" || p.flags.length > 0}
      search={(p) => `${p.name} ${p.mrn} ${p.dob} ${p.phone}`}
      searchPlaceholder="Name, DOB, phone or MRN"
      columns={[
        { label: "Patient", render: (p) => <span className="font-semibold">{p.name}</span> },
        { label: "DOB", render: (p) => clinicDate(p.dob) },
        { label: "MRN", render: (p) => <span className="tabular-nums text-muted-foreground">{p.mrn}</span> },
        { label: "Insurance", render: (p) => p.insurance },
        { label: "Last visit", render: (p) => clinicDate(p.lastVisit) },
      ]}
      previewTitle={(p) => p.name}
      preview={(p) => {
        const visits = appts.filter((a) => a.patientId === p.id).sort((a, b) => b.date.localeCompare(a.date));
        return (
          <div className="space-y-4">
            <DL items={[["DOB", clinicDate(p.dob)], ["MRN", p.mrn], ["Phone", p.phone], ["Email", p.email], ["Insurance", p.insurance], ["Indicators", p.flags.length ? <span className="flex flex-wrap gap-1">{p.flags.map((f) => <Badge key={f} icon={Flag}>{f}</Badge>)}</span> : "None on file"]]} />
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold"><span aria-hidden className="size-2 rounded-full border-2 border-primary" />Visits</h3>
              <ul className="divide-y border-y">
                {visits.slice(0, 5).map((v) => (
                  <li key={v.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-2 text-sm">
                    <span className="min-w-0"><span className="block font-semibold">{clinicDate(v.date)}</span><span className="block text-xs text-muted-foreground">{v.type} · {providerById(v.providerId).name}</span></span>
                    <StatusBadge status={v.status} />
                  </li>
                ))}
                {visits.length === 0 && <li className="text-sm text-muted-foreground">No visits this week.</li>}
              </ul>
            </div>
          </div>
        );
      }}
    />
  );
}
