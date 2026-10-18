import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Circle, ShieldCheck } from "lucide-react";
import { headFor } from "@/components/ListDetail";
import { Button, Card, Field, Input } from "@/components/kit";
import { PTitle } from "@/components/patient-ui";
import { completePasswordChange } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patient/change-password")({
  head: headFor("Create your password", "Set a new password for your Patient Portal account."),
  component: ChangePassword,
});

function ChangePassword() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<{ pw?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);
  const rules = [
    { ok: pw.length >= 8, label: "At least 8 characters" },
    { ok: /\d/.test(pw), label: "Includes a number" },
    { ok: /[A-Za-z]/.test(pw), label: "Includes a letter" },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof err = {};
    if (!rules.every((r) => r.ok)) next.pw = "Your password doesn't meet all the requirements yet.";
    if (confirm !== pw || !confirm) next.confirm = "Passwords don't match.";
    setErr(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    setTimeout(() => { completePasswordChange(); setPw(""); setConfirm(""); nav({ to: "/patient" }); }, 500);
  };

  return (
    <>
      <PTitle title="Create your password" sub="For your security, replace the temporary password from your invitation." />
      <Card className="p-5">
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="New password" htmlFor="cp-pw" error={err.pw}>
            <Input id="cp-pw" type="password" autoComplete="new-password" className="h-11 text-base" value={pw} aria-invalid={!!err.pw} aria-describedby="cp-rules" onChange={(e) => setPw(e.target.value)} />
          </Field>
          <ul id="cp-rules" className="space-y-1 text-sm">
            {rules.map((r) => (
              <li key={r.label} className={cn("flex items-center gap-2", r.ok ? "text-st-success" : "text-muted-foreground")}>
                {r.ok ? <Check className="size-4" aria-hidden /> : <Circle className="size-4" aria-hidden />}
                {r.label}<span className="sr-only">{r.ok ? " — met" : " — not met"}</span>
              </li>
            ))}
          </ul>
          <Field label="Confirm new password" htmlFor="cp-confirm" error={err.confirm}>
            <Input id="cp-confirm" type="password" autoComplete="new-password" className="h-11 text-base" value={confirm} aria-invalid={!!err.confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
          <Button type="submit" size="lg" className="h-11 w-full text-base" loading={loading}>Save password and continue</Button>
        </form>
      </Card>
      <p className="mt-4 flex gap-2 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />Only you will know this password. Clinic staff will never ask for it.</p>
    </>
  );
}
