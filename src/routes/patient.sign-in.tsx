import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Info } from "lucide-react";
import { headFor } from "@/components/ListDetail";
import { Button, Card, Field, Input } from "@/components/kit";
import { PTitle } from "@/components/patient-ui";
import { CLINIC, ME, SUPPORT } from "@/lib/patient-data";
import { signIn } from "@/lib/store";

export const Route = createFileRoute("/patient/sign-in")({
  head: headFor("Sign in", "Sign in to the Vectronics Patient Portal."),
  component: SignIn,
});

function SignIn() {
  const nav = useNavigate();
  const [email, setEmail] = useState(ME.email);
  const [pw, setPw] = useState("");
  const [errors, setErrors] = useState<{ email?: string; pw?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter the email address your clinic has on file.";
    if (!pw) next.pw = "Enter your password.";
    if (!next.email && email.trim().toLowerCase() !== ME.email) next.form = `We couldn't find that account. In this prototype, use ${ME.email}.`;
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    // Simulated: the password is checked for presence only and never stored.
    setTimeout(() => {
      const s = signIn();
      setPw("");
      nav({ to: s.passwordChanged ? "/patient" : "/patient/change-password" });
    }, 500);
  };

  return (
    <>
      <PTitle title="Welcome back" sub={`Sign in to manage your care at ${CLINIC.name}.`} />
      <Card className="p-5">
        <form onSubmit={submit} noValidate className="space-y-4">
          {errors.form && <p role="alert" className="rounded-lg border border-st-danger/30 bg-st-danger-bg px-3 py-2 text-sm font-medium text-st-danger">{errors.form}</p>}
          <Field label="Email" htmlFor="si-email" error={errors.email}>
            <Input id="si-email" type="email" autoComplete="email" className="h-11 text-base" value={email} aria-invalid={!!errors.email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password" htmlFor="si-pw" error={errors.pw} hint="Use the temporary password from your invitation email.">
            <Input id="si-pw" type="password" autoComplete="current-password" className="h-11 text-base" value={pw} aria-invalid={!!errors.pw} onChange={(e) => setPw(e.target.value)} />
          </Field>
          <Button type="submit" size="lg" className="h-11 w-full text-base" loading={loading}>Sign in</Button>
        </form>
      </Card>
      <p className="mt-4 flex gap-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>Trouble signing in? Call {SUPPORT.phone} ({SUPPORT.hours}).</span>
      </p>
    </>
  );
}
