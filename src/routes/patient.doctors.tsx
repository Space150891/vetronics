import { Link, createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ChevronRight, SearchX } from "lucide-react";
import { headFor } from "@/components/ListDetail";
import { Badge, Button, Card, DL, Drawer, EmptyState, SearchInput, buttonVariants } from "@/components/kit";
import { PTitle } from "@/components/patient-ui";
import { PROVIDERS, type Provider } from "@/lib/fixtures";
import { DOCTORS } from "@/lib/patient-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patient/doctors")({
  head: headFor("Find a Doctor", "Browse providers at your clinic."),
  component: Doctors,
});

const info = (id: string) => DOCTORS.find((d) => d.id === id)!;

function Doctors() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Provider | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const n = q.trim().toLowerCase();
  const list = PROVIDERS.filter((p) => !n || `${p.name} ${p.role} ${info(p.id).languages.join(" ")}`.toLowerCase().includes(n));

  return (
    <>
      <PTitle title="Find a Doctor" back={{ to: "/patient/profile", label: "Profile" }} />
      <SearchInput className="mb-4 [&_input]:h-11 [&_input]:text-base" placeholder="Name, specialty or language" aria-label="Search doctors" value={q} onChange={(e) => setQ(e.target.value)} />
      {list.length === 0 ? (
        <Card><EmptyState icon={SearchX} title="No doctors match" body="Try a different name, specialty or language." action={<Button variant="outline" onClick={() => setQ("")}>Clear search</Button>} /></Card>
      ) : (
        <div className="space-y-2.5">
          {list.map((p) => (
            <button key={p.id} onClick={(e) => { trigger.current = e.currentTarget; setOpen(p); }} className="flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3.5 text-left shadow-card focus-ring hover:bg-muted">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground" aria-hidden>{p.initials}</span>
              <span className="min-w-0 flex-1"><span className="block font-semibold">{p.name}</span><span className="block text-sm text-muted-foreground">{p.role} · {info(p.id).languages.join(", ")}</span></span>
              {!info(p.id).accepting && <Badge tone="neutral">Not accepting</Badge>}
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          ))}
        </div>
      )}
      {open && (
        <Drawer open onOpenChange={(o) => !o && setOpen(null)} returnFocusRef={trigger} title={open.name} sub={open.role}
          footer={info(open.id).accepting
            ? <Link to="/patient/request" search={{ provider: open.id }} className={cn(buttonVariants({ size: "lg" }), "h-12 w-full text-base")}>Request Appointment</Link>
            : <Button size="lg" className="h-12 w-full" disabled disabledReason="This provider isn't taking new requests right now.">Request Appointment</Button>}>
          <p className="mb-4 text-[15px]">{info(open.id).bio}</p>
          <DL items={[["Languages", info(open.id).languages.join(", ")], ["Visit types", info(open.id).visitTypes.join(", ")], ["New requests", info(open.id).accepting ? "Accepting" : "Not accepting"]]} />
        </Drawer>
      )}
    </>
  );
}
