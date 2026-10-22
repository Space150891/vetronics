import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CalendarSearch, Search, Users } from "lucide-react";
import { headFor } from "@/components/ListDetail";
import { Button, DL, Drawer, EmptyState, Field, Input, PageHeader, Select, StatusBadge } from "@/components/kit";
import { Avatar, Blocked, DayGrid, MonthGrid, PX, ProviderFilter, ViewBar, WeekStrip } from "@/components/calendar";
import { PATIENTS, PROVIDERS, STATUS_META, addDays, isoDate, patientById, providerById, type Appointment, type Status } from "@/lib/fixtures";
import { CLOSE, LUNCH, OPEN, active, apptInterval, bookable, bookingProblem, dayStats, freeSlots, isClosed, isConflict, shiftsOn, subtract, timeOffOn, toMin, toTime, type SchedData } from "@/lib/schedule";
import { bookAppointment, markArrived, moveToReady, rescheduleAppt, setApptStatus } from "@/lib/store";
import { fmtH, useSched } from "@/lib/use-sched";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patient-scheduling")({
  head: headFor("Patient Scheduling", "Provider day calendar with bookable slots, utilisation and a find-a-time search."),
  validateSearch: (s: Record<string, unknown>): { patient?: string } => (typeof s["patient"] === "string" ? { patient: s["patient"] } : {}),
  component: Page,
});

const TYPES = [
  { type: "Follow-up", duration: 20 }, { type: "New patient", duration: 40 }, { type: "Annual physical", duration: 30 },
  { type: "Sick visit", duration: 20 }, { type: "Telehealth", duration: 15 }, { type: "Lab review", duration: 15 },
];
const START = 7 * 60, END = 18 * 60;
type Slot = { providerId: string; date: string; time: string; duration?: number | undefined };

const blockTone: Partial<Record<Status, string>> = {
  completed: "border-st-success bg-st-success-bg",
  cancelled: "border-st-neutral bg-st-neutral-bg opacity-70 line-through",
  no_show: "border-st-danger bg-st-danger-bg",
};

function Page() {
  const d = useSched();
  const today = isoDate(new Date());
  const [date, setDate] = useState(today);
  const [pid, setPid] = useState("all");
  const [view, setView] = useState<"day" | "month">("day");
  const [showCancelled, setShowCancelled] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [book, setBook] = useState<Slot | null>(null);
  const { patient: followUp } = Route.useSearch();
  const [findOpen, setFindOpen] = useState(!!followUp);
  const providers = pid === "all" ? PROVIDERS : PROVIDERS.filter((p) => p.id === pid);
  const pids = providers.map((p) => p.id);
  const open = d.appts.find((a) => a.id === openId);

  const summary = (day: string) => {
    if (isClosed(day)) return "—";
    const s = dayStats(d, day, pids);
    return (
      <span className="block">
        <span className="tabular-nums">{s.util}%</span>
        <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden><span className="block h-full bg-primary" style={{ width: `${s.util}%` }} /></span>
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader title="Patient Scheduling" sub="Bookable time comes from Staff Scheduling, minus breaks, time off and booked visits." actions={<Button icon={Search} onClick={() => setFindOpen(true)}>Find a time</Button>} />
      <WeekStrip selected={date} onSelect={setDate} summary={summary} />
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <ProviderFilter value={pid} onChange={setPid} />
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" role="switch" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} className="size-4" />Show cancelled</label>
        <ul className="ml-auto flex flex-wrap gap-3 text-xs text-muted-foreground" aria-label="Status legend">
          {(["scheduled", "completed", "cancelled", "no_show"] as Status[]).map((s) => <li key={s}><StatusBadge status={s} /></li>)}
        </ul>
      </div>
      <ViewBar view={view} onView={setView} date={date} onToday={() => setDate(today)} />
      {view === "month" ? (
        <MonthGrid selected={date} onSelect={(x) => { setDate(x); setView("day"); }} cell={(x) => {
          if (isClosed(x)) return <span className="text-muted-foreground">Closed</span>;
          const list = d.appts.filter((a) => a.date === x && pids.includes(a.providerId) && active(a));
          const ns = list.filter((a) => a.status === "no_show").length;
          return <span className="block space-y-0.5"><span className="block font-semibold">{list.length} appts</span><span className="block text-muted-foreground">{dayStats(d, x, pids).util}% booked</span>{ns > 0 && <span className="block text-st-danger">{ns} no show</span>}</span>;
        }} />
      ) : providers.length === 0 ? <EmptyState icon={Users} title="No providers match" /> : (
        <DayGrid providers={providers} startMin={START} endMin={END}
          header={(p) => { const s = dayStats(d, date, [p.id]); return <><Avatar p={p} /><div className="min-w-0 text-left"><p className="truncate text-sm font-semibold">{p.name}</p><p className="text-xs text-muted-foreground tabular-nums">{s.util}% booked · {fmtH(s.booked)} / {fmtH(s.avail)}</p></div></>; }}
          column={(p) => <Column d={d} date={date} pid={p.id} showCancelled={showCancelled} onAppt={setOpenId} onSlot={(time) => setBook({ providerId: p.id, date, time })} />} />
      )}
      {open && <ApptDrawer d={d} a={open} onClose={() => setOpenId(null)} />}
      {book && <BookDrawer d={d} slot={book} patientId={followUp} onClose={() => setBook(null)} />}
      <FindDrawer d={d} open={findOpen} onClose={() => setFindOpen(false)} defaultPid={pid} date={date} onPick={(s) => { setFindOpen(false); setDate(s.date); setBook(s); }} />
    </div>
  );
}

function Column({ d, date, pid, showCancelled, onAppt, onSlot }: { d: SchedData; date: string; pid: string; showCancelled: boolean; onAppt: (id: string) => void; onSlot: (t: string) => void }) {
  if (isClosed(date)) return <Blocked s={START} e={END} startMin={START} label="Clinic closed" />;
  const shifts = shiftsOn(d, date, pid).map((o) => ({ s: o.s, e: o.e }));
  const off = timeOffOn(d, date, pid);
  const unavailable = subtract([{ s: OPEN, e: CLOSE }], [...shifts, LUNCH, ...off]);
  const free = bookable(d, date, pid);
  const slots: number[] = [];
  for (const x of free) for (let t = Math.ceil(x.s / 30) * 30; t + 15 <= x.e; t += 30) slots.push(t);
  const appts = d.appts.filter((a) => a.date === date && a.providerId === pid && (showCancelled || active(a))).sort((a, b) => a.time.localeCompare(b.time));
  return (
    <>
      <Blocked s={START} e={OPEN} startMin={START} label="Clinic closed" />
      <Blocked s={CLOSE} e={END} startMin={START} label="Clinic closed" />
      <Blocked s={LUNCH.s} e={LUNCH.e} startMin={START} tone="lunch" label="Lunch break" />
      {unavailable.map((u) => <Blocked key={u.s} s={u.s} e={u.e} startMin={START} label="Unavailable" />)}
      {off.map((t) => { const s = Math.max(t.s, OPEN), e = Math.min(t.e, CLOSE); return e > s ? <Blocked key={t.t.id} s={s} e={e} startMin={START} tone="off" label={`Time off${t.t.reason ? ` · ${t.t.reason}` : ""}`} /> : null; })}
      {slots.map((t) => (
        <button key={t} onClick={() => onSlot(toTime(t))} aria-label={`Book ${toTime(t)}`} className="group absolute inset-x-0 text-left focus-ring" style={{ top: (t - START) * PX, height: 30 * PX }}>
          <span className="ml-2 hidden text-[11px] font-semibold text-primary group-hover:inline group-focus-visible:inline">+ Book {toTime(t)}</span>
        </button>
      ))}
      {appts.map((a) => {
        const i = apptInterval(a);
        const conflict = isConflict(d, a);
        return (
          <button key={a.id} onClick={() => onAppt(a.id)} className={cn("absolute inset-x-1 z-[5] overflow-hidden rounded-md border-l-4 px-1.5 py-0.5 text-left text-[11px] leading-tight text-foreground shadow-card focus-ring", blockTone[a.status] ?? "border-primary bg-st-info-bg", conflict && "ring-2 ring-st-warning")}
            style={{ top: (i.s - START) * PX, height: Math.max(a.duration * PX, 18) }}>
            <span className="font-bold">{patientById(a.patientId).name}</span> <span className="tabular-nums">{a.time} · {a.duration}m</span> · {a.type} · <span className="font-semibold">{STATUS_META[a.status].label}</span>
            {conflict && <span className="ml-1 font-bold text-st-warning">· Conflict</span>}
          </button>
        );
      })}
    </>
  );
}

function SlotFields({ f, set, patient }: { f: Slot & { duration: number; type: string; patientId?: string }; set: (p: Partial<Slot & { duration: number; type: string; patientId: string }>) => void; patient?: boolean }) {
  return (
    <>
      {patient && <Field label="Patient" htmlFor="b-pt"><Select id="b-pt" value={f.patientId ?? ""} onChange={(e) => set({ patientId: e.target.value })}><option value="">Select patient…</option>{PATIENTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>}
      <Field label="Provider" htmlFor="b-p"><Select id="b-p" value={f.providerId} onChange={(e) => set({ providerId: e.target.value })}>{PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" htmlFor="b-d"><Input id="b-d" type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} /></Field>
        <Field label="Time" htmlFor="b-t"><Input id="b-t" type="time" step={300} value={f.time} onChange={(e) => set({ time: e.target.value })} /></Field>
      </div>
      <Field label="Visit type" htmlFor="b-ty"><Select id="b-ty" value={f.type} onChange={(e) => set({ type: e.target.value, duration: TYPES.find((t) => t.type === e.target.value)!.duration })}>{TYPES.map((t) => <option key={t.type} value={t.type}>{t.type} ({t.duration} min)</option>)}</Select></Field>
    </>
  );
}

function BookDrawer({ d, slot, onClose, patientId }: { d: SchedData; slot: Slot; onClose: () => void; patientId?: string | undefined }) {
  const t0 = TYPES.find((t) => t.duration === slot.duration) ?? TYPES[0]!;
  const [f, setF] = useState({ ...slot, type: t0.type, duration: t0.duration, patientId: patientId && PATIENTS.some((p) => p.id === patientId) ? patientId : "" });
  const [tried, setTried] = useState(false);
  const problem = !f.patientId ? "Choose a patient." : bookingProblem(d, f);
  const save = () => {
    setTried(true);
    if (problem) return;
    bookAppointment(f);
    toast.success(`Booked ${patientById(f.patientId).name} · ${f.date} ${f.time}`);
    onClose();
  };
  return (
    <Drawer open onOpenChange={(o) => !o && onClose()} title="New appointment" sub={`${providerById(f.providerId).name} · ${f.date} ${f.time}`} footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Book appointment</Button></div>}>
      <div className="space-y-3">
        <SlotFields f={f} set={(p) => setF((x) => ({ ...x, ...p }))} patient />
        {tried && problem && <p role="alert" className="text-sm font-medium text-destructive">{problem}</p>}
      </div>
    </Drawer>
  );
}

function ApptDrawer({ d, a, onClose }: { d: SchedData; a: Appointment; onClose: () => void }) {
  const [resched, setResched] = useState(false);
  const [f, setF] = useState({ providerId: a.providerId, date: a.date, time: a.time, duration: a.duration, type: a.type });
  const [tried, setTried] = useState(false);
  const problem = bookingProblem(d, { ...f, id: a.id });
  const conflict = isConflict(d, a);
  const status = (s: Status, msg: string) => { setApptStatus(a.id, s); toast.success(msg); };
  return (
    <Drawer open onOpenChange={(o) => !o && onClose()} title={patientById(a.patientId).name} sub={<StatusBadge status={a.status} />}
      footer={resched ? <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setResched(false)}>Back</Button><Button onClick={() => { setTried(true); if (problem) return; rescheduleAppt(a.id, f); toast.success(`Rescheduled to ${f.date} ${f.time}`); setResched(false); }}>Save new time</Button></div> : undefined}>
      {resched ? (
        <div className="space-y-3">
          <SlotFields f={f} set={(p) => setF((x) => ({ ...x, ...p }))} />
          {tried && problem && <p role="alert" className="text-sm font-medium text-destructive">{problem}</p>}
          {!problem && <p className="text-sm text-st-success">This time is available.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {conflict && <p role="alert" className="flex items-start gap-1.5 rounded-lg border border-st-warning/30 bg-st-warning-bg p-3 text-sm text-st-warning"><AlertTriangle className="mt-0.5 size-4 shrink-0" />This visit is outside the provider's current availability. Reschedule or confirm with the provider.</p>}
          <DL items={[["Date", a.date], ["Time", `${a.time} · ${a.duration} min`], ["Provider", providerById(a.providerId).name], ["Type", a.type], ["Location", a.room], ["Notes", a.notes.length ? a.notes.map((n) => n.text).join("; ") : "—"]]} />
          <div className="flex flex-wrap gap-2">
            {a.status === "scheduled" && <Button size="sm" variant="outline" onClick={() => { markArrived(a.id); toast.success("Marked Arrived"); }}>Mark arrived</Button>}
            {a.status === "arrived" && <Button size="sm" variant="outline" onClick={() => { moveToReady(a.id); toast.success("Moved to Ready"); }}>Move to ready</Button>}
            {["arrived", "ready", "in_room"].includes(a.status) && <Button size="sm" variant="outline" onClick={() => status("completed", "Marked Completed")}>Mark completed</Button>}
            {a.status === "scheduled" && <Button size="sm" variant="outline" onClick={() => status("no_show", "Marked No show")}>No show</Button>}
            {a.status !== "cancelled" && a.status !== "completed" && <Button size="sm" variant="outline" onClick={() => setResched(true)}>Reschedule</Button>}
            {a.status !== "cancelled" && a.status !== "completed" && <Button size="sm" variant="danger" onClick={() => status("cancelled", "Appointment cancelled · slot released")}>Cancel appointment</Button>}
            {a.status === "cancelled" && <Button size="sm" variant="outline" disabledReason={bookingProblem(d, a) ?? undefined} disabled={!!bookingProblem(d, a)} onClick={() => status("scheduled", "Appointment restored")}>Restore</Button>}
          </div>
          <div>
            <h3 className="mb-1 text-sm font-bold">History</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">{[...a.history].reverse().map((h, i) => <li key={i}>{new Date(h.at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })} · {h.text}</li>)}</ul>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function FindDrawer({ d, open, onClose, defaultPid, date, onPick }: { d: SchedData; open: boolean; onClose: () => void; defaultPid: string; date: string; onPick: (s: Slot) => void }) {
  const [f, setF] = useState({ pid: defaultPid, from: date < isoDate(new Date()) ? isoDate(new Date()) : date, to: addDays(date, 6), duration: 20 });
  const [results, setResults] = useState<Slot[] | null>(null);
  const run = () => {
    const out: Slot[] = [];
    const pids = f.pid === "all" ? PROVIDERS.map((p) => p.id) : [f.pid];
    const now = new Date();
    for (let day = f.from; day <= f.to && out.length < 40; day = addDays(day, 1)) {
      for (const pid of pids) for (const time of freeSlots(d, pid, day, f.duration, 15)) {
        if (day === isoDate(now) && toMin(time) < now.getHours() * 60 + now.getMinutes()) continue;
        out.push({ providerId: pid, date: day, time, duration: f.duration });
      }
    }
    setResults(out.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 40));
  };
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} title="Find a time" sub="Searches staff availability, breaks, time off and existing bookings.">
      <div className="space-y-3">
        <Field label="Provider" htmlFor="f-p"><Select id="f-p" value={f.pid} onChange={(e) => setF({ ...f, pid: e.target.value })}><option value="all">Any provider</option>{PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From" htmlFor="f-f"><Input id="f-f" type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></Field>
          <Field label="To" htmlFor="f-t"><Input id="f-t" type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field>
        </div>
        <Field label="Duration" htmlFor="f-d"><Select id="f-d" value={f.duration} onChange={(e) => setF({ ...f, duration: Number(e.target.value) })}>{[15, 20, 30, 40].map((m) => <option key={m} value={m}>{m} min</option>)}</Select></Field>
        <Button icon={CalendarSearch} className="w-full" onClick={run}>Search</Button>
        {results && (results.length === 0 ? <EmptyState icon={CalendarSearch} title="No free times" body="Try a wider date range, another provider or a shorter duration." /> : (
          <ul className="divide-y rounded-lg border" aria-label="Available times">
            {results.map((s) => (
              <li key={`${s.providerId}${s.date}${s.time}`}>
                <button onClick={() => onPick(s)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted focus-ring">
                  <span><span className="font-semibold tabular-nums">{s.date} · {s.time}</span><span className="block text-muted-foreground">{providerById(s.providerId).name}</span></span>
                  <span className="text-xs font-semibold text-primary">Book</span>
                </button>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </Drawer>
  );
}
