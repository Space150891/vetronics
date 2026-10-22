import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, Info, Loader2, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { headFor } from "@/components/ListDetail";
import { Badge, Button, Card, EmptyState, SearchInput, Select, StatusBadge, Textarea } from "@/components/kit";
import { PatientInfoDialog } from "@/components/PatientInfo";
import { PROVIDERS, addDays, isoDate, patientById, providerById, type Appointment } from "@/lib/fixtures";
import { finalizeEncounter, saveEncounter, startEncounter, useStore, type Encounter } from "@/lib/store";
import { NOTE_META, noteStatus, overdue, startMs, upcoming, type NoteStatus } from "@/lib/visits";
import { cn } from "@/lib/utils";
import { CalendarCheck } from "lucide-react";

export const Route = createFileRoute("/appointments")({
  head: headFor("Appointments", "Upcoming patients, outstanding visit notes and the appointment list."),
  validateSearch: (s: Record<string, unknown>): { note?: string } => (typeof s["note"] === "string" ? { note: s["note"] } : {}),
  component: Page,
});

const when = (a: Appointment) => new Date(startMs(a)).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
function rel(ms: number, now: number) {
  const m = Math.round((ms - now) / 60000);
  const abs = Math.abs(m);
  const t = abs < 60 ? `${abs} min` : abs < 1440 ? `${Math.round(abs / 60)} h` : `${Math.round(abs / 1440)} d`;
  return m >= 0 ? `in ${t}` : `${t} ago`;
}
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  return now;
}

function NoteBadge({ s }: { s: NoteStatus }) {
  return <Badge tone={NOTE_META[s].tone}>{NOTE_META[s].label}</Badge>;
}

function Page() {
  const appts = useStore((s) => s.appts);
  const encounters = useStore((s) => s.encounters);
  const now = useNow();
  const today = isoDate(new Date(now));
  const { note: openNote } = Route.useSearch();
  const navigate = useNavigate({ from: "/appointments" });
  const [q, setQ] = useState("");
  const [pid, setPid] = useState("all");
  const [hideFinal, setHideFinal] = useState(true);
  const [info, setInfo] = useState<string | null>(null);

  const scoped = useMemo(() => appts.filter((a) => (pid === "all" || a.providerId === pid) && a.date >= addDays(today, -7) && a.date <= addDays(today, 7)), [appts, pid, today]);
  const ns = (a: Appointment) => noteStatus(a, encounters[a.id], now);
  const next = upcoming(scoped, now);
  const late = overdue(scoped, now, today);
  const outstanding = scoped.filter((a) => { const s = ns(a); return (s === "missing" || s === "in_progress") && startMs(a) <= now; }).sort((x, y) => startMs(x) - startMs(y));
  const toSee = next.filter((a) => a.date === today).length + late.length;

  const needle = q.trim().toLowerCase();
  const list = scoped
    .filter((a) => a.status !== "cancelled")
    .filter((a) => !hideFinal || ns(a) !== "final")
    .filter((a) => !needle || `${patientById(a.patientId).name} ${providerById(a.providerId).name}`.toLowerCase().includes(needle))
    .sort((x, y) => startMs(x) - startMs(y));

  const open = (id: string) => { startEncounter(id); navigate({ search: { note: id } }); };
  const view = (id: string) => (encounters[id] ? navigate({ search: { note: id } }) : open(id));
  const openAppt = openNote ? appts.find((a) => a.id === openNote) : undefined;

  const action = (a: Appointment) => {
    const s = ns(a);
    const label = s === "final" ? "View note" : encounters[a.id] ? "Resume" : "Start";
    return <Button size="sm" variant={s === "final" ? "outline" : "outline"} onClick={() => view(a.id)} aria-label={`${label} — ${patientById(a.patientId).name}`}>{label}</Button>;
  };
  const Name = ({ a, className }: { a: Appointment; className?: string }) => (
    <button onClick={() => setInfo(a.patientId)} className={cn("inline-flex items-center gap-1 rounded text-left font-semibold hover:text-primary hover:underline focus-ring", className)}>
      {patientById(a.patientId).name}<Info className="size-3.5 text-muted-foreground" aria-label="Patient information" />
    </button>
  );
  const featured = next[0];

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
        <p className="text-sm text-muted-foreground">{toSee} to see</p>
      </div>

      {featured ? (
        <Card className="mb-3 border-primary/30 bg-accent/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-foreground">Next scheduled · {rel(startMs(featured), now)}</p>
              <Name a={featured} className="mt-1 text-xl" />
              <p className="text-sm text-muted-foreground">{when(featured)} · {providerById(featured.providerId).name} · {featured.type}</p>
              <div className="mt-1.5 flex gap-1.5"><StatusBadge status={featured.status} /><NoteBadge s={ns(featured)} /></div>
            </div>
            <Button onClick={() => open(featured.id)}>{encounters[featured.id] ? "Resume appointment" : "Start appointment"}</Button>
          </div>
          {next.length > 1 && (
            <ul className="mt-3 divide-y rounded-lg border bg-card">
              {next.slice(1, 3).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="min-w-0"><Name a={a} className="text-sm" /><span className="block truncate text-xs text-muted-foreground">{when(a)} · {providerById(a.providerId).name} · {rel(startMs(a), now)}</span></span>
                  {action(a)}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : (
        <Card className="mb-3 p-4 text-sm text-muted-foreground">No upcoming appointments for this filter.</Card>
      )}

      {(late.length > 0 || outstanding.length > 0) && (
        <div className="mb-3 grid gap-3 md:grid-cols-2">
          <Card className="p-3">
            <h2 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold"><AlertCircle className="size-4 text-st-warning" aria-hidden />Overdue today <span className="text-muted-foreground">{late.length}</span></h2>
            {late.length === 0 ? <p className="text-xs text-muted-foreground">Nobody running late.</p> : (
              <ul className="space-y-1">{late.slice(0, 4).map((a) => <li key={a.id} className="flex items-center justify-between gap-2 text-sm"><span className="min-w-0 truncate"><Name a={a} /> <span className="text-xs text-muted-foreground">{a.time} · {rel(startMs(a), now)}</span></span>{action(a)}</li>)}</ul>
            )}
          </Card>
          <Card className="p-3">
            <h2 className="mb-1.5 text-sm font-semibold">Outstanding notes <span className="text-muted-foreground">{outstanding.length}</span></h2>
            {outstanding.length === 0 ? <p className="text-xs text-muted-foreground">All notes are finalized.</p> : (
              <ul className="space-y-1">{outstanding.slice(0, 4).map((a) => <li key={a.id} className="flex items-center justify-between gap-2 text-sm"><span className="min-w-0 truncate"><Name a={a} /> <span className="text-xs text-muted-foreground">{a.date}</span></span><span className="flex items-center gap-2"><NoteBadge s={ns(a)} />{action(a)}</span></li>)}</ul>
            )}
          </Card>
        </div>
      )}

      <div className={cn("grid gap-3", openAppt && "xl:grid-cols-[minmax(0,1fr)_520px]")}>
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SearchInput className="w-full sm:w-64" placeholder="Search patient or provider…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search patient or provider" />
            <Select aria-label="Provider" className="w-auto" value={pid} onChange={(e) => setPid(e.target.value)}>
              <option value="all">All providers</option>
              {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="size-4" checked={hideFinal} onChange={(e) => setHideFinal(e.target.checked)} />Hide finalized</label>
            <span className="ml-auto text-xs text-muted-foreground">{list.length} appointments · past and next 7 days</span>
          </div>
          <Card className="overflow-hidden">
            {list.length === 0 ? <EmptyState icon={CalendarCheck} title="No appointments match" body="Clear the search or show finalized notes." /> : (
              <ul className="divide-y">
                {list.map((a) => (
                  <li key={a.id} className={cn("flex items-center justify-between gap-3 px-3 py-2", openNote === a.id && "bg-accent/60")}>
                    <span className="min-w-0"><Name a={a} className="text-sm" /><span className="block truncate text-xs text-muted-foreground">{when(a)} · {providerById(a.providerId).name} · {a.type}</span></span>
                    <span className="flex shrink-0 items-center gap-2"><span className="hidden sm:inline"><StatusBadge status={a.status} /></span><NoteBadge s={ns(a)} />{action(a)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        {openAppt && encounters[openAppt.id] && (
          <NoteEditor key={openAppt.id} a={openAppt} e={encounters[openAppt.id]!} onInfo={() => setInfo(openAppt.patientId)} onClose={() => navigate({ search: {} })} />
        )}
      </div>

      <PatientInfoDialog patientId={info} onClose={() => setInfo(null)} onVisit={(id) => { setInfo(null); view(id); }} />
    </div>
  );
}

/** Prototype visit-note editor (single free-text field). The clinic's real note template was not provided. */
function NoteEditor({ a, e, onInfo, onClose }: { a: Appointment; e: Encounter; onInfo: () => void; onClose: () => void }) {
  const [text, setText] = useState(e.text);
  const [state, setState] = useState<"saved" | "saving" | "error">("saved");
  const pending = useRef<string | null>(null);
  const final = e.status === "final";
  const p = patientById(a.patientId);

  const flush = () => {
    if (pending.current === null) return;
    const t = pending.current;
    pending.current = null;
    setState(saveEncounter(a.id, t) ? "saved" : "error");
  };
  useEffect(() => {
    if (pending.current === null) return;
    const t = setTimeout(flush, 600);
    return () => clearTimeout(t);
  }, [text]);
  // Protect unsaved changes when switching patients, closing or leaving the page.
  useEffect(() => {
    window.addEventListener("beforeunload", flush);
    return () => { window.removeEventListener("beforeunload", flush); flush(); };
  }, []);

  const finalize = () => {
    flush();
    if (finalizeEncounter(a.id)) toast.success(`Note finalized for ${p.name}`);
    else toast.error("Write the note before finalizing.");
  };

  return (
    <Card className="flex min-h-[420px] flex-col self-start xl:sticky xl:top-16">
      <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <button onClick={onInfo} className="inline-flex items-center gap-1 text-lg font-bold hover:text-primary focus-ring">{p.name}<Info className="size-4 text-muted-foreground" aria-label="Patient information" /></button>
          <p className="text-xs text-muted-foreground">{when(a)} · {providerById(a.providerId).name} · {a.type}</p>
        </div>
        <button onClick={() => { flush(); onClose(); }} aria-label="Close note" className="grid size-8 place-items-center rounded-md hover:bg-muted focus-ring"><X className="size-4" /></button>
      </div>
      <div className="flex-1 space-y-2 p-4">
        <label htmlFor="visit-note" className="text-sm font-semibold">Visit note</label>
        <Textarea id="visit-note" value={text} readOnly={final} rows={12}
          onChange={(ev) => { setText(ev.target.value); pending.current = ev.target.value; setState("saving"); }}
          className="min-h-[260px]" placeholder="Document the visit…" />
        <p className="text-xs" aria-live="polite">
          {final ? <span className="inline-flex items-center gap-1 text-muted-foreground"><Lock className="size-3" />Finalized {e.finalizedAt ? new Date(e.finalizedAt).toLocaleString() : ""} — read-only</span>
            : state === "saving" ? <span className="inline-flex items-center gap-1 text-muted-foreground"><Loader2 className="size-3 animate-spin" />Saving…</span>
            : state === "error" ? <span className="inline-flex items-center gap-1 text-destructive"><AlertCircle className="size-3" />Couldn't save. Your text is kept here — try again.</span>
            : <span className="inline-flex items-center gap-1 text-muted-foreground"><Check className="size-3" />Saved {new Date(e.savedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>}
        </p>
      </div>
      {!final && (
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <Button variant="outline" onClick={flush} disabled={state !== "saving"} disabledReason="All changes saved">Save draft</Button>
          <Button onClick={finalize}>Finalize note</Button>
        </div>
      )}
    </Card>
  );
}
