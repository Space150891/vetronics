import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { toast } from "sonner";
import { headFor } from "@/components/ListDetail";
import { Button, Card, Field, Input, Select } from "@/components/kit";
import { PTitle } from "@/components/patient-ui";
import { ME } from "@/lib/patient-data";
import { saveFormDraft, submitForm, useStore, type NewPatientForm } from "@/lib/store";

export const Route = createFileRoute("/patient/new-patient-form")({
  head: headFor("New Patient Form", "Share your details before your first visit."),
  component: Page,
});

const FIELDS: { k: string; label: string; required?: boolean; type?: string; options?: string[]; hint?: string }[] = [
  { k: "legalName", label: "Legal name", required: true },
  { k: "dob", label: "Date of birth", required: true, hint: "MM/DD/YYYY" },
  { k: "address", label: "Home address", required: true },
  { k: "phone", label: "Mobile phone", required: true, type: "tel" },
  { k: "language", label: "Preferred language", options: ["English", "Spanish", "Other"] },
  { k: "insurer", label: "Insurance provider", required: true },
  { k: "memberId", label: "Member ID", required: true },
  { k: "emergencyName", label: "Emergency contact name", required: true },
  { k: "emergencyPhone", label: "Emergency contact phone", required: true, type: "tel" },
  { k: "pharmacy", label: "Preferred pharmacy" },
];

function Page() {
  const nav = useNavigate();
  const form = useStore((s) => s.form);
  const profile = useStore((s) => s.profile);
  const [v, setV] = useState<NewPatientForm>(() => ({ legalName: ME.name, dob: ME.dob, phone: profile.phone, insurer: ME.insurance, address: profile.address, ...form.data }));
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<"draft" | "submit" | null>(null);
  const val = (k: string) => (typeof v[k] === "string" ? (v[k] as string) : "");
  const up = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setV({ ...v, [k]: e.target.value }); setErr({ ...err, [k]: "" }); };

  if (form.status === "submitted") {
    return (
      <>
        <PTitle title="New Patient Form" back={{ to: "/patient/profile", label: "Profile" }} />
        <Card className="p-6 text-center">
          <CheckCircle2 className="mx-auto size-10 text-st-success" aria-hidden />
          <p className="mt-2 text-lg font-bold">Form submitted</p>
          <p className="mt-1 text-[15px] text-muted-foreground">Thank you. The clinic will review it before your visit.</p>
          <Button size="lg" className="mt-4 w-full" onClick={() => nav({ to: "/patient" })}>Back to Home</Button>
        </Card>
      </>
    );
  }

  const draft = () => { setBusy("draft"); setTimeout(() => { saveFormDraft(v); setBusy(null); toast.success("Draft saved. You can come back any time."); }, 350); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n: Record<string, string> = {};
    FIELDS.forEach((f) => { if (f.required && !val(f.k).trim()) n[f.k] = `${f.label} is required.`; });
    if (!v.consent) n.consent = "Please confirm to continue.";
    setErr(n);
    const first = Object.keys(n)[0];
    if (first) { document.getElementById(`np-${first}`)?.focus(); toast.error(`${Object.keys(n).length} field(s) need attention.`); return; }
    setBusy("submit");
    setTimeout(() => { submitForm(v); setBusy(null); toast.success("Form submitted"); }, 500);
  };
  const done = FIELDS.filter((f) => f.required && val(f.k).trim()).length;
  const total = FIELDS.filter((f) => f.required).length;

  return (
    <>
      <PTitle title="New Patient Form" sub={form.status === "draft" ? `Resuming your draft from ${new Date(form.savedAt ?? "").toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.` : "Takes about 5 minutes. You can save and finish later."} back={{ to: "/patient", label: "Home" }} />
      <div className="mb-3" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Required fields completed">
        <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(done / total) * 100}%` }} /></div>
        <p className="mt-1 text-sm text-muted-foreground">{done} of {total} required fields complete</p>
      </div>
      <Card className="p-5">
        <form onSubmit={submit} noValidate className="space-y-4">
          {FIELDS.map((f) => (
            <Field key={f.k} label={`${f.label}${f.required ? "" : " (optional)"}`} htmlFor={`np-${f.k}`} error={err[f.k] || undefined} hint={f.hint}>
              {f.options ? (
                <Select id={`np-${f.k}`} className="h-11 text-base" value={val(f.k)} onChange={up(f.k)}><option value="">Select…</option>{f.options.map((o) => <option key={o}>{o}</option>)}</Select>
              ) : (
                <Input id={`np-${f.k}`} type={f.type ?? "text"} className="h-11 text-base" value={val(f.k)} aria-invalid={!!err[f.k]} onChange={up(f.k)} />
              )}
            </Field>
          ))}
          <div>
            <label className="flex items-start gap-2.5 text-[15px]">
              <input id="np-consent" type="checkbox" className="mt-1 size-5 accent-[var(--color-primary)]" checked={!!v.consent} onChange={(e) => { setV({ ...v, consent: e.target.checked }); setErr({ ...err, consent: "" }); }} />
              <span>I confirm this information is accurate to the best of my knowledge.</span>
            </label>
            {err.consent && <p role="alert" className="mt-1 text-xs font-medium text-destructive">{err.consent}</p>}
          </div>
          <Button type="submit" size="lg" className="h-12 w-full text-base" loading={busy === "submit"}>Submit form</Button>
          <Button type="button" variant="outline" size="lg" className="w-full" icon={Save} loading={busy === "draft"} onClick={draft}>Save draft</Button>
        </form>
      </Card>
    </>
  );
}
