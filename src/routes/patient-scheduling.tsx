import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { headFor } from "@/components/ListDetail";
import { Button, Card, CardHeader, Field, PageHeader, Select, StatusBadge } from "@/components/kit";
import { PATIENTS, PROVIDERS, isoDate, patientById } from "@/lib/fixtures";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/patient-scheduling")({
  head: headFor("Patient Scheduling", "Provider day columns with booked slots and a booking form."),
  component: Page,
});

function Page() {
  const appts = useStore((s) => s.appts);
  const today = isoDate(new Date());
  const day = appts.filter((a) => a.date === today);
  const [patient, setPatient] = useState("");
  const [err, setErr] = useState<string>();
  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader title="Patient Scheduling" sub="Today's book by provider. Booking here is a preview only." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {PROVIDERS.map((p) => (
            <Card key={p.id} className="min-w-0">
              <CardHeader title={p.name} sub={p.role} />
              <ul className="divide-y">
                {day.filter((a) => a.providerId === p.id).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
                    <div className="min-w-0"><p className="font-semibold tabular-nums">{a.time}</p><p className="truncate text-muted-foreground">{patientById(a.patientId).name} · {a.type}</p></div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <Card className="h-fit">
          <CardHeader title="New appointment" sub="Preview form — slots are not saved." />
          <div className="space-y-3 p-4">
            <Field label="Patient" htmlFor="ps-patient" error={err}>
              <Select id="ps-patient" value={patient} aria-invalid={!!err} onChange={(e) => { setPatient(e.target.value); setErr(undefined); }}>
                <option value="">Select patient…</option>
                {PATIENTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <Field label="Provider" htmlFor="ps-prov"><Select id="ps-prov">{PROVIDERS.map((p) => <option key={p.id}>{p.name}</option>)}</Select></Field>
            <Field label="Type" htmlFor="ps-type"><Select id="ps-type">{["Follow-up", "New patient", "Annual physical", "Sick visit", "Telehealth", "Lab review"].map((t) => <option key={t}>{t}</option>)}</Select></Field>
            <Button className="w-full" onClick={() => (patient ? toast("Booking preview: next open slot is 2:40 PM.") : setErr("Choose a patient."))}>Find slot</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
