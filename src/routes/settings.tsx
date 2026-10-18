import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { headFor } from "@/components/ListDetail";
import { Button, Card, CardHeader, Field, Input, PageHeader, Select, Tabs } from "@/components/kit";
import { CLINIC } from "@/lib/fixtures";

export const Route = createFileRoute("/settings")({
  head: headFor("Clinic Settings", "Clinic profile, hours and scheduling preferences."),
  component: Page,
});

function Page() {
  const [tab, setTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const save = () => { setSaving(true); setTimeout(() => { setSaving(false); toast.success("Settings saved"); }, 600); };
  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader title="Clinic Settings" sub="Organisation details used across the portal." actions={<Button loading={saving} onClick={save}>Save changes</Button>} />
      <div className="mb-3"><Tabs label="Settings sections" value={tab} onChange={setTab} items={[{ value: "profile", label: "Profile" }, { value: "hours", label: "Hours" }, { value: "scheduling", label: "Scheduling" }]} /></div>
      {tab === "profile" && (
        <Card><CardHeader title="Clinic profile" /><div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Clinic name" htmlFor="c-name"><Input id="c-name" defaultValue={CLINIC.name} /></Field>
          <Field label="Location" htmlFor="c-loc"><Input id="c-loc" defaultValue={CLINIC.location} /></Field>
          <Field label="Phone" htmlFor="c-ph"><Input id="c-ph" defaultValue="(555) 010-2000" /></Field>
          <Field label="Time zone" htmlFor="c-tz"><Select id="c-tz"><option>America/New_York</option><option>America/Chicago</option><option>America/Los_Angeles</option></Select></Field>
        </div></Card>
      )}
      {tab === "hours" && (
        <Card><CardHeader title="Opening hours" /><div className="grid gap-3 p-4 sm:grid-cols-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => <Field key={d} label={d} htmlFor={`h-${d}`}><Input id={`h-${d}`} defaultValue="8:00 AM – 5:00 PM" /></Field>)}
          <Field label="Sat – Sun" htmlFor="h-we"><Input id="h-we" defaultValue="Closed" disabled /></Field>
        </div></Card>
      )}
      {tab === "scheduling" && (
        <Card><CardHeader title="Scheduling" /><div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Default slot length" htmlFor="s-len"><Select id="s-len"><option>15 min</option><option>20 min</option><option>30 min</option></Select></Field>
          <Field label="Reminder" htmlFor="s-rem" hint="Sent by SMS before the visit."><Select id="s-rem"><option>24 hours</option><option>48 hours</option></Select></Field>
        </div></Card>
      )}
    </div>
  );
}
