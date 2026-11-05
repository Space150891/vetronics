import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CalendarPlus, CalendarClock, Clock, Flag, GripVertical, LogIn, Plus, Receipt, Stethoscope, Undo2, UserX, XCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Drawer, DL, Field, StatusBadge, Textarea } from "@/components/kit";
import { ProviderFilter } from "@/components/calendar";
import { nums, CURRENT_USER, isoDate, patientById, providerById, type Appointment } from "@/lib/fixtures";
import { INVOICES, INVOICE_TONE, usd } from "@/lib/patient-data";
import { addNote, completeCheckout, finishVisit, markArrived, peekAppointments, sendToProvider, setApptStatus, stageOf, undoStage, useStore, type Stage } from "@/lib/store";
import { cn } from "@/lib/utils";
import { clinicDate } from "@/lib/display";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Front Desk · Vectronics Provider" },
      { name: "description", content: "Today's visits from the door to the till: check in, send to provider, check out." },
      { property: "og:title", content: "Front Desk · Vectronics Provider" },
      { property: "og:description", content: "Today's visit board for front desk staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FrontDesk,
});

type BoardStage = Exclude<Stage, "done">;
const COLUMNS: { key: BoardStage; title: string; sub: string }[] = [
  { key: "expected", title: "Expected", sub: "Booked for today, not arrived yet." },
  { key: "waiting", title: "Waiting", sub: "Arrived. Send them back when their provider's free." },
  { key: "with_provider", title: "With provider", sub: "In the room now." },
  { key: "checkout", title: "Ready to check out", sub: "Finished. Settle the bill and book anything next." },
];
/** Only the forward moves the existing workflow actions support — no backward or skipped stages. */
const NEXT_STAGE: Record<BoardStage, BoardStage | null> = { expected: "waiting", waiting: "with_provider", with_provider: "checkout", checkout: null };
const stageTitle = (s: BoardStage) => COLUMNS.find((c) => c.key === s)!.title;

function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  return now;
}
const mins = (iso: string | undefined, now: number | null) => (iso && now ? Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000)) : null);
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const fmtSlot = (t: string) => {
  const [h, m] = nums(t, ":");
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
const balanceFor = (patientId: string) => INVOICES.filter((i) => i.patientId === patientId && i.status !== "Paid");

function FrontDesk() {
  const appts = useStore((s) => s.appts);
  const now = useNow();
  const today = isoDate(new Date());
  const [provider, setProvider] = useState("all");
  const [tab, setTab] = useState<BoardStage>("expected");
  const [openId, setOpenId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [drag, setDrag] = useState<{ id: string; stage: BoardStage; x: number; y: number } | null>(null);
  const [over, setOver] = useState<BoardStage | null>(null);
  const [announce, setAnnounce] = useState("");
  const dragRef = useRef(drag);
  dragRef.current = drag;

  const byStage = useMemo(() => {
    const out: Record<BoardStage, Appointment[]> = { expected: [], waiting: [], with_provider: [], checkout: [] };
    appts
      .filter((a) => a.date === today && (provider === "all" || a.providerId === provider))
      .sort((a, b) => a.time.localeCompare(b.time))
      .forEach((a) => { const s = stageOf(a); if (s !== "done") out[s].push(a); });
    return out;
  }, [appts, today, provider]);
  const total = byStage.expected.length + byStage.waiting.length + byStage.with_provider.length + byStage.checkout.length;

  const open = appts.find((a) => a.id === openId) ?? null;
  const openCard = (id: string, el: HTMLElement) => { triggerRef.current = el; setOpenId(id); };

  const startDrag = (e: React.PointerEvent, a: Appointment) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    const stage = stageOf(a);
    if (stage === "done") return;
    setDrag({ id: a.id, stage, x: e.clientX, y: e.clientY });
  };

  // Pointer-based drag: the handle starts it, window listeners track it, and the drop
  // commits through the same store actions as the card buttons (never raw status writes).
  const dragId = drag?.id ?? null;
  useEffect(() => {
    if (!dragId) return;
    const targetAt = (x: number, y: number) => {
      const el = document.elementFromPoint(x, y);
      return (el?.closest?.("[data-stage]") as HTMLElement | null)?.dataset.stage as BoardStage | undefined;
    };
    const move = (e: PointerEvent) => {
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
      setOver(targetAt(e.clientX, e.clientY) ?? null);
    };
    const up = (e: PointerEvent) => {
      const d = dragRef.current;
      const target = targetAt(e.clientX, e.clientY);
      setDrag(null);
      setOver(null);
      if (!d || !target || target === d.stage) return; // same-column drops never reorder
      const a = peekAppointments().find((x) => x.id === d.id);
      if (!a) return;
      const name = patientById(a.patientId).name;
      if (target !== NEXT_STAGE[d.stage]) {
        toast.error(`Can't move ${name} from ${stageTitle(d.stage)} to ${stageTitle(target)}`);
        return;
      }
      const ok =
        target === "waiting" ? markArrived(a.id)
        : target === "with_provider" ? sendToProvider(a.id)
        : finishVisit(a.id);
      if (ok) {
        const msg = target === "waiting" ? `${name} checked in` : target === "with_provider" ? `${name} sent to ${providerById(a.providerId).name}` : `${name} ready for checkout`;
        toast.success(msg);
        setAnnounce(`${name} moved to ${stageTitle(target)}.`);
      } else {
        toast.error(`Couldn't move ${name} — use the button on the card instead`);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [dragId]);

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Front desk</h1>
          <p className="text-sm text-muted-foreground">Today's visits, from the door to the till.</p>
        </div>
        <Link to="/patient-scheduling" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground focus-ring"><Plus className="size-4" aria-hidden /> Book appointment</Link>
      </div>
      <div className="mb-4"><ProviderFilter value={provider} onChange={setProvider} /></div>
      <p className="mb-3 text-sm font-semibold" aria-live="polite">{total} {total === 1 ? "visit" : "visits"} on board</p>

      <div role="tablist" aria-label="Visit stages" className="mb-3 grid grid-cols-2 gap-1 rounded-lg border bg-card p-1 sm:grid-cols-4 lg:hidden">
        {COLUMNS.map((c) => (
          <button key={c.key} role="tab" aria-selected={tab === c.key} onClick={() => setTab(c.key)}
            className={cn("rounded-md px-2 py-1.5 text-[13px] font-semibold focus-ring", tab === c.key ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
            {c.title} <span className="tabular-nums">{byStage[c.key].length}</span>
          </button>
        ))}
      </div>

      <div className="relative grid gap-4 lg:grid-cols-4">
        <span aria-hidden className="absolute inset-x-2 top-0 hidden h-px bg-border lg:block" />
        {COLUMNS.map((c) => {
          const list = byStage[c.key];
          const isTarget = drag !== null && NEXT_STAGE[drag.stage] === c.key;
          return (
            <section key={c.key} data-stage={c.key} aria-labelledby={`col-${c.key}`}
              className={cn("min-w-0 rounded-lg pt-3 transition-colors", tab !== c.key && "hidden lg:block",
                drag && drag.stage !== c.key && !isTarget && "opacity-60",
                isTarget && "ring-2 ring-primary/40 bg-accent/30",
                isTarget && over === c.key && "ring-primary bg-accent/50")}>
              <div className="mb-2 px-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id={`col-${c.key}`} className="text-[15px] font-bold">{c.title}</h2>
                  <Badge tone="neutral" className="tabular-nums">{list.length} {list.length === 1 ? "visit" : "visits"}</Badge>
                </div>
                <p className="mt-1 min-h-8 text-xs text-muted-foreground">{c.sub}</p>
              </div>
              <ul className="min-h-10 space-y-2 px-1 pb-1">
                {list.length === 0 && <li className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">Nobody here</li>}
                {list.map((a) => <VisitCard key={a.id} a={a} now={now} selected={openId === a.id} dragging={drag?.id === a.id} onOpen={openCard} onDragStart={startDrag} />)}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="sr-only" role="status">{announce}</p>
      {drag && (() => {
        const a = appts.find((x) => x.id === drag.id);
        if (!a) return null;
        return (
          <div aria-hidden className="pointer-events-none fixed z-50 w-52 -translate-x-1/2 -translate-y-8 rounded-lg border bg-card p-2.5 shadow-lg" style={{ left: drag.x, top: drag.y }}>
            <p className="truncate text-sm font-bold">{patientById(a.patientId).name}</p>
            <p className="text-xs text-muted-foreground">{fmtSlot(a.time)} · {a.type}</p>
          </div>
        );
      })()}

      {open && <VisitDrawer a={open} now={now} onClose={() => setOpenId(null)} returnFocusRef={triggerRef} />}
    </div>
  );
}

function PrimaryAction({ a, size = "sm" }: { a: Appointment; size?: "sm" | "md" }) {
  const name = patientById(a.patientId).name;
  const s = size === "md" ? undefined : "sm";
  switch (stageOf(a)) {
    case "expected": return <Button size={s} icon={LogIn} onClick={() => markArrived(a.id) && toast.success(`${name} checked in`)}>Check in</Button>;
    case "waiting": return <Button size={s} icon={ArrowRight} onClick={() => sendToProvider(a.id) && toast.success(`${name} sent to ${providerById(a.providerId).name}`)}>Send to provider</Button>;
    case "with_provider": return <Button size={s} icon={Receipt} onClick={() => finishVisit(a.id) && toast.success(`${name} ready for checkout`)}>Ready for checkout</Button>;
    default: return null;
  }
}

function VisitCard({ a, now, selected, onOpen }: { a: Appointment; now: number | null; selected: boolean; onOpen: (id: string, el: HTMLElement) => void }) {
  const p = patientById(a.patientId);
  const pr = providerById(a.providerId);
  const stage = stageOf(a);
  const wait = stage === "waiting" ? mins(a.arrivedAt, now) : null;
  const owed = stage === "checkout" ? balanceFor(a.patientId).reduce((n, i) => n + i.amount, 0) : 0;
  return (
    <li className={cn("rounded-lg border bg-card p-3", selected && "border-primary ring-1 ring-primary")}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <button className="min-w-0 rounded text-left font-semibold text-primary hover:underline focus-ring" onClick={(e) => onOpen(a.id, e.currentTarget)}>
          <span className="block break-words text-[15px] font-bold leading-tight">{p.name}</span>
        </button>
        <span className="shrink-0 rounded-md bg-st-info-bg px-1.5 py-0.5 text-sm font-bold tabular-nums text-st-info">{fmtSlot(a.time)}</span>
      </div>
      <p className="mt-1 text-xs font-semibold">{pr.name}</p>
      <p className="text-xs text-muted-foreground">{a.type} · <span className="font-medium text-foreground">{a.room}</span></p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {wait !== null && <Badge tone={wait > 20 ? "warning" : "teal"} icon={Clock}>Waiting {wait} min</Badge>}
        {a.status === "ready" && <Badge tone="success">Ready</Badge>}
        {owed > 0 && <Badge tone="warning">Balance {usd(owed)}</Badge>}
        {p.flags.map((f) => <Badge key={f} tone="neutral" icon={Flag} className="font-medium">{f}</Badge>)}
      </div>
      <div className="mt-2.5 flex gap-2 border-t pt-2.5">
        {stage === "checkout"
          ? <Button size="sm" icon={Receipt} onClick={(e) => onOpen(a.id, e.currentTarget)}>Open checkout</Button>
          : <PrimaryAction a={a} />}
      </div>
    </li>
  );
}

function VisitDrawer({ a, now, onClose, returnFocusRef }: { a: Appointment; now: number | null; onClose: () => void; returnFocusRef: React.RefObject<HTMLElement | null> }) {
  const p = patientById(a.patientId);
  const pr = providerById(a.providerId);
  const stage = stageOf(a);
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string>();
  const invoices = balanceFor(a.patientId);

  const save = () => {
    if (!note.trim()) { setErr("Enter a note before saving."); return; }
    addNote(a.id, note, CURRENT_USER.name);
    setNote(""); setErr(undefined);
    toast.success("Note added");
  };
  const checkout = () => {
    if (completeCheckout(a.id)) { toast.success(`${p.name} checked out`); onClose(); }
  };
  const step = (fn: () => boolean, msg: string) => { if (fn()) toast(msg); };

  return (
    <Drawer
      open
      onOpenChange={(o) => !o && onClose()}
      returnFocusRef={returnFocusRef}
      title={p.name}
      sub={<span className="flex flex-wrap items-center gap-2">{fmtSlot(a.time)} · {a.type} · <StatusBadge status={a.status} /></span>}
      footer={
        <div className="flex flex-wrap gap-2">
          {stage === "checkout" ? (
            <>
              <Button icon={CheckCircle2} onClick={checkout}>Complete checkout</Button>
              <Link to="/patient-scheduling" search={{ patient: a.patientId }} className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold hover:bg-muted focus-ring"><CalendarPlus className="size-4" aria-hidden /> Book follow-up</Link>
            </>
          ) : stage === "done" ? <span className="text-sm text-muted-foreground">This visit is no longer on the board.</span> : <PrimaryAction a={a} size="md" />}
        </div>
      }
    >
      <section className="space-y-4">
        {stage === "checkout" && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Checkout</h3>
            {invoices.length === 0 ? <p className="text-sm text-muted-foreground">No open balance on file.</p> : (
              <ul className="space-y-1.5">
                {invoices.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                    <span className="tabular-nums">{i.number} · {clinicDate(i.date)}</span>
                    <span className="flex items-center gap-2"><span className="font-semibold tabular-nums">{usd(i.amount)}</span><Badge tone={INVOICE_TONE[i.status]}>{i.status}</Badge></span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-muted-foreground">Completing checkout does not mark invoices paid. Take payments in <Link to="/billing" className="font-semibold text-primary underline">Billing</Link>.</p>
          </div>
        )}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Appointment</h3>
          <DL items={[["Provider", `${pr.name} · ${pr.role}`], ["Location", a.room], ["Duration", `${a.duration} min`], ["Arrived", a.arrivedAt ? fmtTime(a.arrivedAt) : "—"], ["Waiting", stage === "waiting" ? `${mins(a.arrivedAt, now) ?? 0} min` : "—"]]} />
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Patient</h3>
          <DL items={[["DOB", clinicDate(p.dob)], ["MRN", p.mrn], ["Phone", p.phone], ["Insurance", p.insurance], ["Indicators", p.flags.length ? <span className="flex flex-wrap gap-1">{p.flags.map((f) => <Badge key={f} icon={Flag}>{f}</Badge>)}</span> : "None on file"]]} />
          <Link to="/patients" className="mt-2 inline-block text-sm font-semibold text-primary underline">Open patient records</Link>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Other actions</h3>
          <div className="flex flex-wrap gap-2">
            {stage !== "expected" && stage !== "done" && <Button size="sm" variant="outline" icon={Undo2} onClick={() => step(() => undoStage(a.id), "Moved back one stage")}>Undo last step</Button>}
            {stage === "expected" && <Button size="sm" variant="outline" icon={UserX} onClick={() => step(() => setApptStatus(a.id, "no_show"), `${p.name} marked no-show`)}>Mark no-show</Button>}
            {(stage === "expected" || stage === "waiting") && <Button size="sm" variant="outline" icon={XCircle} onClick={() => step(() => setApptStatus(a.id, "cancelled"), "Appointment cancelled")}>Cancel visit</Button>}
            <Link to="/patient-scheduling" className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-semibold hover:bg-muted focus-ring"><CalendarClock className="size-4" aria-hidden /> Reschedule</Link>
            {stage === "with_provider" && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Stethoscope className="size-3.5" aria-hidden /> With {pr.name}</span>}
          </div>
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
