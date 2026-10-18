import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, FileText, MessageSquareText, Video } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { headFor } from "@/components/ListDetail";
import { Badge, Button, Card, PageHeader } from "@/components/kit";

export const Route = createFileRoute("/add-ons")({
  head: headFor("Add-ons", "Optional portal features for the clinic."),
  component: Page,
});

const ADDONS = [
  { id: "sms", name: "SMS reminders", body: "Automatic appointment reminders by text.", icon: MessageSquareText, on: true },
  { id: "online", name: "Online booking", body: "Let patients request appointments from the Patient Portal.", icon: CalendarCheck, on: true },
  { id: "tele", name: "Telehealth", body: "Video visits for eligible appointment types.", icon: Video, on: false },
  { id: "forms", name: "Intake forms", body: "Digital forms patients complete before arrival.", icon: FileText, on: false },
];

function Page() {
  const [on, setOn] = useState<Record<string, boolean>>(Object.fromEntries(ADDONS.map((a) => [a.id, a.on])));
  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader title="Add-ons" sub="Features available for this clinic." />
      <div className="grid gap-3 sm:grid-cols-2">
        {ADDONS.map((a) => (
          <Card key={a.id} className="flex items-start gap-3 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"><a.icon className="size-5" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><h2 className="font-bold">{a.name}</h2><Badge tone={on[a.id] ? "success" : "neutral"}>{on[a.id] ? "Enabled" : "Off"}</Badge></div>
              <p className="mt-0.5 text-sm text-muted-foreground">{a.body}</p>
            </div>
            <Button size="sm" variant={on[a.id] ? "outline" : "primary"} onClick={() => { setOn({ ...on, [a.id]: !on[a.id] }); toast(`${a.name} ${on[a.id] ? "disabled" : "enabled"}`); }}>
              {on[a.id] ? "Disable" : "Enable"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
