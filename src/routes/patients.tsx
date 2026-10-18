import { createFileRoute } from "@tanstack/react-router";
import { Flag } from "lucide-react";
import { ListDetailPage, headFor } from "@/components/ListDetail";
import { Badge, DL, StatusBadge } from "@/components/kit";
import { PATIENTS, providerById, type Patient } from "@/lib/fixtures";
import { useStore } from "@/lib/store";

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
        { label: "DOB", render: (p) => p.dob },
        { label: "MRN", render: (p) => <span className="tabular-nums text-muted-foreground">{p.mrn}</span> },
        { label: "Insurance", render: (p) => p.insurance },
        { label: "Last visit", render: (p) => p.lastVisit },
      ]}
      previewTitle={(p) => p.name}
      preview={(p) => {
        const visits = appts.filter((a) => a.patientId === p.id).sort((a, b) => b.date.localeCompare(a.date));
        return (
          <div className="space-y-4">
            <DL items={[["DOB", p.dob], ["MRN", p.mrn], ["Phone", p.phone], ["Email", p.email], ["Insurance", p.insurance], ["Indicators", p.flags.length ? <span className="flex flex-wrap gap-1">{p.flags.map((f) => <Badge key={f} icon={Flag}>{f}</Badge>)}</span> : "None on file"]]} />
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visits</h3>
              <ul className="space-y-1.5">
                {visits.slice(0, 5).map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                    <span><span className="font-medium">{v.date}</span> · {v.type}<br /><span className="text-xs text-muted-foreground">{providerById(v.providerId).name}</span></span>
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
