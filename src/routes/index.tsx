import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CalendarX2, ChevronLeft, ChevronRight, Clock, Flag, LogIn, Plus, UserCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Badge, Button, Card, Drawer, DL, EmptyState, Field, PageHeader, SearchInput, Select, StatusBadge, Table, Td, Textarea, Th,
} from "@/components/kit";
import { nums, CLINIC, CURRENT_USER, PROVIDERS, STATUS_META, addDays, isoDate, patientById, providerById, type Appointment, type Status } from "@/lib/fixtures";
import { addNote, markArrived, moveToReady, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Front Desk · Vectronics Provider" },
      { name: "description", content: "Today's clinic worklist: check patients in, move them to Ready and track wait times." },
      { property: "og:title", content: "Front Desk · Vectronics Provider" },
      { property: "og:description", content: "Today's clinic worklist for front desk staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FrontDesk,
});

type CounterKey = "scheduled" | "arrived" | "ready" | "completed";
const COUNTERS: { key: CounterKey; label: string }[] = [
  { key: "scheduled", label: "Scheduled" },
  { key: "arrived", label: "Arrived" },
  { key: "ready", label: "Waiting (Ready)" },
  { key: "completed", label: "Completed" },
];

function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function waitMins(a: Appointment, now: number | null) {
  if (!now || !a.arrivedAt || (a.status !== "arrived" && a.status !== "ready")) return null;
  return Math.max(0, Math.round((now - new Date(a.arrivedAt).getTime()) / 60000));
}

function fmtDate(d: string) {
  const [y, m, day] = nums(d, "-");
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const fmtSlot = (t: string) => {
  const [h, m] = nums(t, ":");
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

function FrontDesk() {
  const appts = useStore((s) => s.appts);
  const now = useNow();
  const today = isoDate(new Date());
  const [date, setDate] = useState(today);
  const [q, setQ] = useState("");
  const [provider, setProvider] = useState("all");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Counters reflect date + provider + search; status filter narrows the list only.
  const base = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return appts
      .filter((a) => a.date === date)
      .filter((a) => provider === "all" || a.providerId === provider)
      .filter((a) => {
        if (!needle) return true;
        const p = patientById(a.patientId);
        return p.name.toLowerCase().includes(needle) || p.mrn.toLowerCase().includes(needle) || p.dob.includes(needle) || p.phone.includes(needle);
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appts, date, q, provider]);
  const rows = status === "all" ? base : base.filter((a) => a.status === status);
  const counts = useMemo(() => {
    const c: Record<CounterKey, number> = { scheduled: 0, arrived: 0, ready: 0, completed: 0 };
    base.forEach((a) => { if (a.status in c) c[a.status as CounterKey]++; });
    return c;
  }, [base]);

  const open = appts.find((a) => a.id === openId) ?? null;
  const openRow = (id: string, el: HTMLElement) => { triggerRef.current = el; setOpenId(id); };

  const doArrive = (a: Appointment) => {
    if (markArrived(a.id)) toast.success(`${patientById(a.patientId).name} marked Arrived`);
  };
  const doReady = (a: Appointment) => {
    if (moveToReady(a.id)) toast.success(`${patientById(a.patientId).name} moved to Ready`);
  };

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader
        title="Front Desk"
        sub={<>{CLINIC.name} · <span className="font-medium text-foreground">{fmtDate(date)}</span></>}
        actions={
          <Button icon={Plus} onClick={() => toast("Booking opens in Patient Scheduling.", { action: { label: "Open", onClick: () => (window.location.href = "/patient-scheduling") } })}>
            Book appointment
          </Button>
        }
      />

      <Card className="mb-3 flex flex-wrap items-center gap-2 p-3">
        <div className="flex items-center gap-1" role="group" aria-label="Date navigation">
          <Button variant="outline" size="icon" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}><ChevronLeft /></Button>
          <Button variant="outline" onClick={() => setDate(today)} disabled={date === today} disabledReason="Already showing today">Today</Button>
          <Button variant="outline" size="icon" aria-label="Next day" onClick={() => setDate(addDays(date, 1))}><ChevronRight /></Button>
          <input type="date" aria-label="Pick date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="h-9 rounded-lg border border-input bg-card px-2 text-sm focus-ring" />
        </div>
        <SearchInput className="min-w-[220px] flex-1" placeholder="Patient name, DOB, phone or MRN" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search patients" />
        <Select aria-label="Provider" className="w-auto min-w-[170px]" value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="all">All providers</option>
          {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select aria-label="Status" className="w-auto min-w-[140px]" value={status} onChange={(e) => setStatus(e.target.value as Status | "all")}>
          <option value="all">All statuses</option>
          {(Object.keys(STATUS_META) as Status[]).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </Select>
      </Card>

      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Status counts (click to filter)">
        {COUNTERS.map((c) => {
          const sel = status === c.key;
          return (
            <button
              key={c.key}
              aria-pressed={sel}
              onClick={() => setStatus(sel ? "all" : c.key)}
              className={cn("inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] font-semibold shadow-card focus-ring transition-colors", sel ? "border-primary bg-accent text-accent-foreground" : "bg-card hover:bg-muted")}
            >
              <StatusBadgeDot status={c.key} />
              {c.label}
              <span className="text-base font-bold tabular-nums">{counts[c.key]}</span>
            </button>
          );
        })}
        <span className="ml-auto self-center text-[13px] text-muted-foreground">{rows.length} of {base.length} appointments shown</span>
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={CalendarX2} title="No appointments match" body="Try another date, provider or status, or clear the search." action={<Button variant="outline" size="sm" onClick={() => { setQ(""); setProvider("all"); setStatus("all"); }}>Clear filters</Button>} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="w-[88px]">Time</Th>
                <Th>Patient</Th>
                <Th>Provider</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th className="w-[90px]">Wait</Th>
                <Th className="w-[170px]">Next action</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const p = patientById(a.patientId);
                const pr = providerById(a.providerId);
                const w = waitMins(a, now);
                return (
                  <tr key={a.id} className={cn("transition-colors hover:bg-muted/60", openId === a.id && "bg-accent/60")}>
                    <Td className="whitespace-nowrap font-semibold tabular-nums">{fmtSlot(a.time)}<div className="text-xs font-normal text-muted-foreground">{a.duration} min</div></Td>
                    <Td>
                      <button className="rounded text-left font-semibold text-primary hover:underline focus-ring" onClick={(e) => openRow(a.id, e.currentTarget)}>
                        {p.name}
                      </button>
                      <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                        <span>DOB {p.dob}</span>
                        {p.flags.map((f) => <Badge key={f} tone="neutral" icon={Flag} className="py-0 font-medium">{f}</Badge>)}
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap"><span className="font-medium">{pr.name}</span><div className="text-xs text-muted-foreground">{a.room}</div></Td>
                    <Td>{a.type}</Td>
                    <Td><StatusBadge status={a.status} /></Td>
                    <Td className="whitespace-nowrap tabular-nums">{w === null ? <span className="text-muted-foreground">—</span> : <span className="inline-flex items-center gap-1 font-semibold"><Clock className="size-3.5" aria-hidden />{w} min</span>}</Td>
                    <Td><NextAction a={a} onArrive={doArrive} onReady={doReady} /></Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {open && <AppointmentDrawer a={open} now={now} onClose={() => setOpenId(null)} returnFocusRef={triggerRef} onArrive={doArrive} onReady={doReady} />}
    </div>
  );
}

function StatusBadgeDot({ status }: { status: Status }) {
  const tone = STATUS_META[status].tone;
  const cls = { info: "bg-st-info", teal: "bg-st-teal", success: "bg-st-success", warning: "bg-st-warning", neutral: "bg-st-neutral", danger: "bg-st-danger" }[tone];
  return <span className={cn("size-2 rounded-full", cls)} aria-hidden />;
}

function NextAction({ a, onArrive, onReady, full }: { a: Appointment; onArrive: (a: Appointment) => void; onReady: (a: Appointment) => void; full?: boolean }) {
  if (a.status === "scheduled") return <Button size="sm" variant={full ? "primary" : "outline"} icon={LogIn} onClick={() => onArrive(a)}>Mark arrived</Button>;
  if (a.status === "arrived") return <Button size="sm" icon={UserCheck} onClick={() => onReady(a)}>Move to Ready</Button>;
  if (a.status === "ready") return <span className="text-[13px] text-muted-foreground">Waiting for provider</span>;
  if (a.status === "in_room") return <span className="text-[13px] text-muted-foreground">With provider</span>;
  return <span className="text-muted-foreground">—</span>;
}

function AppointmentDrawer({ a, now, onClose, returnFocusRef, onArrive, onReady }: {
  a: Appointment; now: number | null; onClose: () => void; returnFocusRef: React.RefObject<HTMLElement | null>;
  onArrive: (a: Appointment) => void; onReady: (a: Appointment) => void;
}) {
  const p = patientById(a.patientId);
  const pr = providerById(a.providerId);
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string>();
  const w = waitMins(a, now);

  const save = () => {
    if (!note.trim()) { setErr("Enter a note before saving."); return; }
    addNote(a.id, note, CURRENT_USER.name);
    setNote(""); setErr(undefined);
    toast.success("Note added");
  };

  const arriveReason = a.status === "scheduled" ? undefined : `Already ${STATUS_META[a.status].label.toLowerCase()}`;
  const readyReason = a.status === "arrived" ? undefined : a.status === "scheduled" ? "Mark the patient Arrived first" : `Already ${STATUS_META[a.status].label.toLowerCase()}`;

  return (
    <Drawer
      open
      onOpenChange={(o) => !o && onClose()}
      returnFocusRef={returnFocusRef}
      title={p.name}
      sub={<span className="flex flex-wrap items-center gap-2">{fmtSlot(a.time)} · {a.type} · <StatusBadge status={a.status} /></span>}
      footer={
        <div className="flex flex-wrap gap-2">
          <Button icon={LogIn} variant="outline" onClick={() => onArrive(a)} disabled={!!arriveReason} disabledReason={arriveReason}>Mark arrived</Button>
          <Button icon={ArrowRight} onClick={() => onReady(a)} disabled={!!readyReason} disabledReason={readyReason}>Move to Ready</Button>
        </div>
      }
    >
      <section className="space-y-4">
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Appointment</h3>
          <DL items={[["Provider", `${pr.name} · ${pr.role}`], ["Location", a.room], ["Duration", `${a.duration} min`], ["Wait time", w === null ? "—" : `${w} min`], ["Arrived", a.arrivedAt ? fmtTime(a.arrivedAt) : "—"]]} />
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Patient</h3>
          <DL items={[["DOB", p.dob], ["MRN", p.mrn], ["Phone", p.phone], ["Insurance", p.insurance], ["Indicators", p.flags.length ? <span className="flex flex-wrap gap-1">{p.flags.map((f) => <Badge key={f} icon={Flag}>{f}</Badge>)}</span> : "None on file"]]} />
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operational notes</h3>
          {a.notes.length === 0 && <p className="mb-2 text-sm text-muted-foreground">No notes yet.</p>}
          <ul className="mb-3 space-y-2">
            {a.notes.map((n) => (
              <li key={n.id} className="rounded-lg border bg-surface px-3 py-2 text-sm">
                <p>{n.text}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.by} · {fmtTime(n.at)}</p>
              </li>
            ))}
          </ul>
          <Field label="Add note" htmlFor="op-note" error={err} hint="Front desk logistics only — not clinical documentation.">
            <Textarea id="op-note" value={note} aria-invalid={!!err} onChange={(e) => { setNote(e.target.value); if (err) setErr(undefined); }} placeholder="e.g. Copay collected, parking validated" />
          </Field>
          <div className="mt-2 flex justify-end"><Button size="sm" variant="outline" icon={Plus} onClick={save}>Save note</Button></div>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activity</h3>
          <ol className="space-y-1.5 border-l pl-3">
            {[...a.history].reverse().map((h, i) => (
              <li key={i} className="text-sm"><span className="font-medium">{h.text}</span> <span className="text-xs text-muted-foreground">· {fmtTime(h.at)}</span></li>
            ))}
          </ol>
        </div>
      </section>
    </Drawer>
  );
}
