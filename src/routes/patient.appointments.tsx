import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef } from "react";
import { CalendarPlus, CalendarX2, ChevronRight, Clock, MapPin } from "lucide-react";
import { headFor } from "@/components/ListDetail";
import { Badge, Card, DL, Drawer, EmptyState, buttonVariants } from "@/components/kit";
import { PTitle, SectionTitle, fmtLongDate, fmtShortDate, fmtSlot } from "@/components/patient-ui";
import { isoDate, providerById, type Appointment, type Tone } from "@/lib/fixtures";
import { CLINIC, ME, SUPPORT } from "@/lib/patient-data";
import { useStore, type ApptRequest } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patient/appointments")({
  head: headFor("Appointments", "Your upcoming and past visits, and pending requests."),
  validateSearch: (s: Record<string, unknown>): { open?: string } => (typeof s.open === "string" ? { open: s.open } : {}),
  component: Appointments,
});

const PATIENT_STATUS: Record<Appointment["status"], { label: string; tone: Tone }> = {
  scheduled: { label: "Confirmed", tone: "info" },
  arrived: { label: "Checked in", tone: "teal" },
  ready: { label: "Checked in", tone: "teal" },
  in_room: { label: "In progress", tone: "warning" },
  completed: { label: "Completed", tone: "neutral" },
  no_show: { label: "Missed", tone: "danger" },
};

function Appointments() {
  const { open } = Route.useSearch();
  const nav = useNavigate({ from: "/patient/appointments" });
  const appts = useStore((s) => s.appts);
  const requests = useStore((s) => s.requests);
  const today = isoDate(new Date());
  const mine = appts.filter((a) => a.patientId === ME.id).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const upcoming = mine.filter((a) => a.date >= today && a.status !== "completed" && a.status !== "no_show");
  const past = mine.filter((a) => !upcoming.includes(a)).reverse();
  const trigger = useRef<HTMLElement | null>(null);
  const appt = open ? mine.find((a) => a.id === open) : undefined;
  const req = open ? requests.find((r) => r.id === open) : undefined;
  const setOpen = (id: string | undefined, el?: HTMLElement) => { if (el) trigger.current = el; nav({ search: id ? { open: id } : {}, replace: true }); };

  return (
    <>
      <PTitle title="Appointments" />
      <Link to="/patient/request" className={cn(buttonVariants({ size: "lg" }), "h-12 w-full text-base")}><CalendarPlus /> Request Appointment</Link>

      {requests.length > 0 && (
        <>
          <SectionTitle>Requests</SectionTitle>
          <div className="space-y-2.5">
            {requests.map((r) => (
              <Row key={r.id} onOpen={(el) => setOpen(r.id, el)} title={`${r.type} · ${fmtShortDate(r.preferredDate)}`} sub={`${providerById(r.providerId).name} · ${r.timeOfDay}`} badge={<Badge tone="warning" icon={Clock}>Pending</Badge>} />
            ))}
          </div>
        </>
      )}

      <SectionTitle>Upcoming</SectionTitle>
      {upcoming.length === 0 ? (
        <Card><EmptyState icon={CalendarX2} title="No upcoming appointments" body="Request a visit and the clinic will confirm a time." /></Card>
      ) : (
        <div className="space-y-2.5">{upcoming.map((a) => <ApptRow key={a.id} a={a} onOpen={(el) => setOpen(a.id, el)} />)}</div>
      )}

      <SectionTitle>Past</SectionTitle>
      <div className="space-y-2.5">{past.map((a) => <ApptRow key={a.id} a={a} onOpen={(el) => setOpen(a.id, el)} />)}</div>

      {appt && (
        <Drawer open onOpenChange={(o) => !o && setOpen(undefined)} returnFocusRef={trigger} title={appt.type} sub={<Badge tone={PATIENT_STATUS[appt.status].tone}>{PATIENT_STATUS[appt.status].label}</Badge>}>
          <DL items={[["Date", fmtLongDate(appt.date)], ["Time", fmtSlot(appt.time)], ["Length", `About ${appt.duration} min`], ["With", providerById(appt.providerId).name], ["Where", appt.room === "Virtual" ? "Video visit" : `${CLINIC.name}, ${CLINIC.location}`]]} />
          {appt.status === "scheduled" && (
            <Card className="mt-5 p-4 text-[15px]">
              <p className="font-semibold">Before your visit</p>
              <p className="mt-1 text-muted-foreground">Please arrive 10 minutes early and bring your insurance card. Need to change this time? Message the clinic or call {SUPPORT.phone}.</p>
              <Link to="/patient/messages" search={{ c: "c0" }} className={cn(buttonVariants({ variant: "outline" }), "mt-3 w-full")}>Message the clinic</Link>
            </Card>
          )}
        </Drawer>
      )}
      {req && <RequestDrawer r={req} onClose={() => setOpen(undefined)} trigger={trigger} />}
    </>
  );
}

function RequestDrawer({ r, onClose, trigger }: { r: ApptRequest; onClose: () => void; trigger: React.RefObject<HTMLElement | null> }) {
  return (
    <Drawer open onOpenChange={(o) => !o && onClose()} returnFocusRef={trigger} title={`${r.type} request`} sub={<Badge tone="warning" icon={Clock}>Pending</Badge>}>
      <p className="mb-4 rounded-lg border border-st-warning/30 bg-st-warning-bg px-3 py-2 text-sm font-medium text-st-warning">Not confirmed yet. The clinic will message you with a time.</p>
      <DL items={[["Preferred date", fmtLongDate(r.preferredDate)], ["Time of day", r.timeOfDay], ["Provider", providerById(r.providerId).name], ["Reason", r.reason], ["Sent", new Date(r.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })]]} />
    </Drawer>
  );
}

function ApptRow({ a, onOpen }: { a: Appointment; onOpen: (el: HTMLElement) => void }) {
  const st = PATIENT_STATUS[a.status];
  return <Row onOpen={onOpen} title={`${fmtShortDate(a.date)} · ${fmtSlot(a.time)}`} sub={`${a.type} · ${providerById(a.providerId).name}`} badge={<Badge tone={st.tone}>{st.label}</Badge>} />;
}

function Row({ title, sub, badge, onOpen }: { title: string; sub: string; badge: React.ReactNode; onOpen: (el: HTMLElement) => void }) {
  return (
    <button onClick={(e) => onOpen(e.currentTarget)} className="flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3.5 text-left shadow-card transition-colors focus-ring hover:bg-muted">
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5 shrink-0" aria-hidden /><span className="truncate">{sub}</span></span>
      </span>
      {badge}
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}
