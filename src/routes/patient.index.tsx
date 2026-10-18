import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarPlus, ChevronRight, ClipboardList, Clock, CreditCard, MapPin, MessageSquare, Search, UserRound } from "lucide-react";
import { headFor } from "@/components/ListDetail";
import { Badge, Card, buttonVariants } from "@/components/kit";
import { ListLink, SectionTitle, fmtLongDate, fmtSlot } from "@/components/patient-ui";
import { isoDate, providerById } from "@/lib/fixtures";
import { CLINIC, INVOICES, ME, balance, usd } from "@/lib/patient-data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useUnreadCount } from "./patient";

export const Route = createFileRoute("/patient/")({
  head: headFor("Home", "Your next appointment, messages and bills at a glance."),
  component: Dashboard,
});

function Dashboard() {
  const appts = useStore((s) => s.appts);
  const requests = useStore((s) => s.requests);
  const profile = useStore((s) => s.profile);
  const form = useStore((s) => s.form);
  const unread = useUnreadCount();
  const today = isoDate(new Date());
  const next = appts.filter((a) => a.patientId === ME.id && a.date >= today && a.status === "scheduled").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
  const owed = INVOICES.filter((i) => i.patientId === ME.id).reduce((s, i) => s + balance(i), 0);
  const profileIncomplete = !profile.address || !profile.emergencyName;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">{greet}, {profile.preferredName || ME.name.split(" ")[0]}</h1>
      <p className="mt-1 text-[15px] text-muted-foreground">{CLINIC.name}</p>

      <SectionTitle>Next appointment</SectionTitle>
      {next ? (
        <Link to="/patient/appointments" search={{ open: next.id }} className="block rounded-xl focus-ring">
          <Card className="p-4 transition-colors hover:bg-muted">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-bold">{fmtLongDate(next.date)}</p>
                <p className="flex items-center gap-1.5 text-[15px] font-semibold"><Clock className="size-4" aria-hidden /> {fmtSlot(next.time)}</p>
              </div>
              <Badge tone="info">Confirmed</Badge>
            </div>
            <p className="mt-2 text-[15px]">{next.type} with {providerById(next.providerId).name}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-4" aria-hidden /> {CLINIC.name}, {CLINIC.location}</p>
          </Card>
        </Link>
      ) : (
        <Card className="p-4 text-[15px] text-muted-foreground">You have no upcoming appointments.</Card>
      )}
      {requests.length > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          {requests.length} request{requests.length > 1 ? "s" : ""} <Badge tone="warning">Pending</Badge> — the clinic will confirm a time.
        </p>
      )}

      <Link to="/patient/request" className={cn(buttonVariants({ size: "lg" }), "mt-4 h-12 w-full text-base")}>
        <CalendarPlus /> Request Appointment
      </Link>

      <SectionTitle>For you</SectionTitle>
      <div className="space-y-2.5">
        {form.status !== "submitted" && (
          <ListLink to="/patient/new-patient-form" icon={ClipboardList} title="Complete your New Patient Form" sub={form.status === "draft" ? "Draft saved — pick up where you left off" : "About 5 minutes · helps us prepare for your visit"} right={<Badge tone="warning">{form.status === "draft" ? "In progress" : "To do"}</Badge>} />
        )}
        <ListLink to="/patient/messages" icon={MessageSquare} title="Messages" sub={unread ? `${unread} unread from your clinic` : "No unread messages"} right={unread ? <Badge tone="info">{unread} new</Badge> : <ChevronRight className="size-5 text-muted-foreground" />} />
        <ListLink to="/patient/bills" icon={CreditCard} title="Bills" sub={owed > 0 ? `${usd(owed)} outstanding` : "You're all paid up"} right={owed > 0 ? <Badge tone="danger">Due</Badge> : <Badge tone="success">Paid</Badge>} />
        {profileIncomplete && <ListLink to="/patient/profile" icon={UserRound} title="Finish your profile" sub="Add your address and an emergency contact" right={<ChevronRight className="size-5 text-muted-foreground" />} />}
        <ListLink to="/patient/doctors" icon={Search} title="Find a Doctor" sub="Browse providers at your clinic" right={<ChevronRight className="size-5 text-muted-foreground" />} />
      </div>
    </>
  );
}
