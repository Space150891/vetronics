import { createFileRoute } from "@tanstack/react-router";
import { ListDetailPage, headFor } from "@/components/ListDetail";
import { Badge, DL } from "@/components/kit";
import { PATIENTS, PROVIDERS } from "@/lib/fixtures";

export const Route = createFileRoute("/care-plans")({
  head: headFor("Care Plans", "Care plan list with plan preview."),
  component: Page,
});

type Plan = { id: string; patient: string; owner: string; name: string; status: "Active" | "Draft" | "Closed"; review: string; tasks: string[] };
const PLANS: Plan[] = PATIENTS.slice(2, 11).map((p, i) => ({
  id: `cp${i}`, patient: p.name, owner: PROVIDERS[i % PROVIDERS.length].name,
  name: ["Follow-up schedule", "Annual wellness plan", "Lab review series"][i % 3],
  status: (["Active", "Active", "Draft", "Closed"] as const)[i % 4],
  review: `11/${String(3 + i).padStart(2, "0")}/2026`,
  tasks: ["Schedule next visit", "Send reminder", "Provider review"],
}));

function Page() {
  return (
    <ListDetailPage<Plan>
      title="Care Plans"
      sub="Plans authored by providers. Content shown as entered; the portal adds no recommendations."
      rows={PLANS}
      tabs={[{ value: "all", label: "All" }, { value: "Active", label: "Active" }, { value: "Draft", label: "Draft" }]}
      tabFilter={(r, t) => t === "all" || r.status === t}
      search={(r) => `${r.patient} ${r.name} ${r.owner}`}
      searchPlaceholder="Patient, plan or owner"
      columns={[
        { label: "Plan", render: (r) => <span className="font-semibold">{r.name}</span> },
        { label: "Patient", render: (r) => r.patient },
        { label: "Owner", render: (r) => r.owner },
        { label: "Next review", render: (r) => r.review },
        { label: "Status", render: (r) => <Badge tone={r.status === "Active" ? "success" : r.status === "Draft" ? "info" : "neutral"}>{r.status}</Badge> },
      ]}
      previewTitle={(r) => r.name}
      preview={(r) => (
        <div className="space-y-4">
          <DL items={[["Patient", r.patient], ["Owner", r.owner], ["Next review", r.review], ["Status", r.status]]} />
          <div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tasks</h3>
            <ul className="space-y-1 text-sm">{r.tasks.map((t) => <li key={t} className="rounded-lg border px-3 py-1.5">{t}</li>)}</ul></div>
        </div>
      )}
    />
  );
}
