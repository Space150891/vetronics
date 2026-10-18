import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { headFor } from "@/components/ListDetail";
import { Button, Card, Field, Select, Textarea, Input } from "@/components/kit";
import { PTitle } from "@/components/patient-ui";
import { PROVIDERS, addDays, isoDate } from "@/lib/fixtures";
import { DOCTORS, VISIT_TYPES } from "@/lib/patient-data";
import { addRequest } from "@/lib/store";

export const Route = createFileRoute("/patient/request")({
  head: headFor("Request Appointment", "Ask your clinic for an appointment."),
  validateSearch: (s: Record<string, unknown>): { provider?: string } => (typeof s['provider'] === "string" ? { provider: s['provider'] } : {}),
  component: RequestPage,
});

const TIMES = ["Morning (8–12)", "Afternoon (12–5)", "Any time"];

function RequestPage() {
  const { provider: pre } = Route.useSearch();
  const nav = useNavigate();
  const today = isoDate(new Date());
  const [v, setV] = useState({ providerId: pre ?? "", type: "", preferredDate: addDays(today, 3), timeOfDay: TIMES[2]!, reason: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const up = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setV({ ...v, [k]: e.target.value }); setErr({ ...err, [k]: "" }); };
  const accepting = (id: string) => DOCTORS.find((d) => d.id === id)?.accepting ?? true;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n: Record<string, string> = {};
    if (!v.providerId) n['providerId'] = "Choose a provider.";
    if (!v.type) n['type'] = "Choose a visit type.";
    if (!v.preferredDate || v.preferredDate <= today) n['preferredDate'] = "Choose a date after today.";
    if (v.reason.trim().length < 3) n['reason'] = "Add a short note so the clinic can plan your visit.";
    setErr(n);
    if (Object.values(n).some(Boolean)) { document.getElementById(`rq-${Object.keys(n)[0]}`)?.focus(); return; }
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      const r = addRequest({ ...v, reason: v.reason.trim() });
      toast.success("Request sent — it's Pending until the clinic confirms.");
      nav({ to: "/patient/appointments", search: { open: r.id } });
    }, 500);
  };

  return (
    <>
      <PTitle title="Request Appointment" sub="Tell us what works for you. The clinic will confirm a time." back={{ to: "/patient/appointments", label: "Appointments" }} />
      <Card className="p-5">
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Provider" htmlFor="rq-providerId" error={err['providerId']}>
            <Select id="rq-providerId" className="h-11 text-base" value={v.providerId} aria-invalid={!!err['providerId']} onChange={up("providerId")}>
              <option value="">Select a provider…</option>
              {PROVIDERS.map((p) => <option key={p.id} value={p.id} disabled={!accepting(p.id)}>{p.name}{accepting(p.id) ? "" : " — not taking new requests"}</option>)}
            </Select>
          </Field>
          <Field label="Visit type" htmlFor="rq-type" error={err['type']}>
            <Select id="rq-type" className="h-11 text-base" value={v.type} aria-invalid={!!err['type']} onChange={up("type")}>
              <option value="">Select a visit type…</option>
              {VISIT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preferred date" htmlFor="rq-preferredDate" error={err['preferredDate']}>
              <Input id="rq-preferredDate" type="date" min={addDays(today, 1)} className="h-11 text-base" value={v.preferredDate} aria-invalid={!!err['preferredDate']} onChange={up("preferredDate")} />
            </Field>
            <Field label="Time of day" htmlFor="rq-timeOfDay">
              <Select id="rq-timeOfDay" className="h-11 text-base" value={v.timeOfDay} onChange={up("timeOfDay")}>{TIMES.map((t) => <option key={t}>{t}</option>)}</Select>
            </Field>
          </div>
          <Field label="Reason for visit" htmlFor="rq-reason" error={err['reason']} hint="Shared with clinic staff only. For emergencies, call 911.">
            <Textarea id="rq-reason" className="text-base" value={v.reason} aria-invalid={!!err['reason']} onChange={up("reason")} placeholder="e.g. Follow-up on recent lab results" />
          </Field>
          <Button type="submit" size="lg" className="h-12 w-full text-base" loading={loading}>Send request</Button>
        </form>
      </Card>
    </>
  );
}
