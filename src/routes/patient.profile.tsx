import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardList, CreditCard, LogOut, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { headFor } from "@/components/ListDetail";
import { Badge, Button, Card, DL, Field, Input } from "@/components/kit";
import { ListLink, PTitle, SectionTitle } from "@/components/patient-ui";
import { ME } from "@/lib/patient-data";
import { saveProfile, signOut, useStore, type PatientProfile } from "@/lib/store";

export const Route = createFileRoute("/patient/profile")({
  head: headFor("Profile", "Your contact details and account."),
  component: Profile,
});

function Profile() {
  const nav = useNavigate();
  const profile = useStore((s) => s.profile);
  const form = useStore((s) => s.form);
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState<PatientProfile>(profile);
  const [err, setErr] = useState<Partial<Record<keyof PatientProfile, string>>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!edit) setV(profile); }, [profile, edit]);
  const up = (k: keyof PatientProfile) => (e: React.ChangeEvent<HTMLInputElement>) => { setV({ ...v, [k]: e.target.value }); setErr({ ...err, [k]: undefined }); };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const n: typeof err = {};
    if (!/^\S+@\S+\.\S+$/.test(v.email)) n.email = "Enter a valid email.";
    if (v.phone.replace(/\D/g, "").length < 10) n.phone = "Enter a 10-digit phone number.";
    if (v.emergencyPhone && v.emergencyPhone.replace(/\D/g, "").length < 10) n.emergencyPhone = "Enter a 10-digit phone number.";
    setErr(n);
    if (Object.values(n).some(Boolean)) return;
    setSaving(true);
    setTimeout(() => { saveProfile(v); setSaving(false); setEdit(false); toast.success("Profile updated"); }, 400);
  };

  return (
    <>
      <PTitle title="Profile" sub={ME.name} />
      {!edit ? (
        <Card className="p-5">
          <DL items={[["Preferred name", profile.preferredName || "—"], ["Date of birth", ME.dob], ["Phone", profile.phone], ["Email", profile.email], ["Address", profile.address || <span key="a" className="text-muted-foreground">Not added</span>], ["Emergency contact", profile.emergencyName ? `${profile.emergencyName} · ${profile.emergencyPhone}` : <span key="e" className="text-muted-foreground">Not added</span>]]} />
          <Button variant="outline" size="lg" className="mt-4 w-full" icon={Pencil} onClick={() => setEdit(true)}>Edit details</Button>
        </Card>
      ) : (
        <Card className="p-5">
          <form onSubmit={save} noValidate className="space-y-4">
            <Field label="Preferred name" htmlFor="pf-pn"><Input id="pf-pn" className="h-11 text-base" value={v.preferredName} onChange={up("preferredName")} /></Field>
            <Field label="Phone" htmlFor="pf-ph" error={err.phone}><Input id="pf-ph" type="tel" className="h-11 text-base" value={v.phone} aria-invalid={!!err.phone} onChange={up("phone")} /></Field>
            <Field label="Email" htmlFor="pf-em" error={err.email}><Input id="pf-em" type="email" className="h-11 text-base" value={v.email} aria-invalid={!!err.email} onChange={up("email")} /></Field>
            <Field label="Address" htmlFor="pf-ad"><Input id="pf-ad" className="h-11 text-base" value={v.address} onChange={up("address")} placeholder="Street, city, ZIP" /></Field>
            <Field label="Emergency contact name" htmlFor="pf-en"><Input id="pf-en" className="h-11 text-base" value={v.emergencyName} onChange={up("emergencyName")} /></Field>
            <Field label="Emergency contact phone" htmlFor="pf-ep" error={err.emergencyPhone}><Input id="pf-ep" type="tel" className="h-11 text-base" value={v.emergencyPhone} aria-invalid={!!err.emergencyPhone} onChange={up("emergencyPhone")} /></Field>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => { setEdit(false); setErr({}); }}>Cancel</Button>
              <Button type="submit" size="lg" className="flex-1" loading={saving}>Save</Button>
            </div>
          </form>
        </Card>
      )}

      <SectionTitle>More</SectionTitle>
      <div className="space-y-2.5">
        <ListLink to="/patient/new-patient-form" icon={ClipboardList} title="New Patient Form" right={<Badge tone={form.status === "submitted" ? "success" : "warning"}>{form.status === "submitted" ? "Submitted" : form.status === "draft" ? "In progress" : "To do"}</Badge>} />
        <ListLink to="/patient/bills" icon={CreditCard} title="Bills and payment history" />
        <ListLink to="/patient/doctors" icon={Search} title="Find a Doctor" />
      </div>
      <Button variant="ghost" size="lg" className="mt-6 w-full" icon={LogOut} onClick={() => { signOut(); nav({ to: "/patient/sign-in" }); }}>Sign out</Button>
    </>
  );
}
