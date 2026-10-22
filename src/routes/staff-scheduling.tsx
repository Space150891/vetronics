import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CalendarPlus, Download, Plus, Repeat, Trash2, Users } from "lucide-react";
import { headFor } from "@/components/ListDetail";
import { Button, EmptyState, Field, Input, PageHeader, Select, Textarea, Drawer, Badge } from "@/components/kit";
import { Avatar, Blocked, DayGrid, MonthGrid, PX, ProviderFilter, ViewBar, WeekStrip } from "@/components/calendar";
import { PROVIDERS, addDays, isoDate, patientById, providerById } from "@/lib/fixtures";
import { CLOSE, LOCATIONS, OPEN, isClosed, isConflict, scheduledMinutes, shiftsOn, timeOffOn, toMin, type Occurrence, type SchedData, type Shift } from "@/lib/schedule";
import { addShift, addTimeOff, deleteShift, deleteTimeOff, updateShift } from "@/lib/store";
import { fmtH, useSched } from "@/lib/use-sched";

export const Route = createFileRoute("/staff-scheduling")({
  head: headFor("Staff Scheduling", "Weekly staff availability calendar with time off and shift editing."),
  component: Page,
});

type ShiftDraft = Omit<Shift, "id">;

function Page() {
  const d = useSched();
  const today = isoDate(new Date());
  const [date, setDate] = useState(today);
  const [pid, setPid] = useState("all");
  const [view, setView] = useState<"day" | "month">("day");
  const [allHours, setAllHours] = useState(false);
  const [form, setForm] = useState<{ draft: ShiftDraft; edit?: Occurrence | undefined } | null>(null);
  const [offOpen, setOffOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const providers = pid === "all" ? PROVIDERS : PROVIDERS.filter((p) => p.id === pid);
  const startMin = allHours ? 0 : 7 * 60;
  const endMin = allHours ? 24 * 60 : 18 * 60;

  const summary = (day: string) => {
    if (isClosed(day)) return "Closed";
    const ps = providers.map((p) => scheduledMinutes(d, day, p.id)).filter((m) => m > 0);
    const off = providers.some((p) => timeOffOn(d, day, p.id).length);
    return <>{ps.length} staff · {fmtH(ps.reduce((a, b) => a + b, 0))}{off && <span className="block text-[10px] text-st-danger">Time off</span>}</>;
  };
  const blank = (): ShiftDraft => ({ providerId: pid === "all" ? PROVIDERS[0]!.id : pid, date, recurring: false, start: "08:00", end: "17:00", location: "Clinic", notes: "" });

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader title="Staff Scheduling" sub="Staff availability drives which patient slots can be booked." actions={<>
        <Button variant="outline" aria-pressed={allHours} onClick={() => setAllHours((v) => !v)}>{allHours ? "Clinic hours" : "Show all hours"}</Button>
        <Button variant="outline" onClick={() => setOffOpen(true)}>Time off</Button>
        <Button variant="outline" icon={CalendarPlus} onClick={() => setSubOpen(true)}>Subscribe in my calendar</Button>
        <Button icon={Plus} onClick={() => setForm({ draft: blank() })}>Add staff time</Button>
      </>} />
      <WeekStrip selected={date} onSelect={setDate} summary={summary} />
      <div className="mb-3"><ProviderFilter value={pid} onChange={setPid} /></div>
      <ViewBar view={view} onView={setView} date={date} onToday={() => setDate(today)} />
      {view === "month" ? (
        <MonthGrid selected={date} onSelect={(x) => { setDate(x); setView("day"); }} cell={(x) => <span className="block font-medium">{summary(x)}</span>} />
      ) : providers.length === 0 ? <EmptyState icon={Users} title="No providers match" /> : (
        <DayGrid providers={providers} startMin={startMin} endMin={endMin}
          header={(p) => <><Avatar p={p} /><div className="min-w-0 text-left"><p className="truncate text-sm font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">{fmtH(scheduledMinutes(d, date, p.id))} scheduled</p></div></>}
          column={(p) => <StaffColumn d={d} date={date} pid={p.id} startMin={startMin} endMin={endMin} onOpen={(o) => setForm({ draft: { ...o.shift, date }, edit: o })} />} />
      )}
      {form && <ShiftDrawer d={d} date={date} init={form} onClose={() => setForm(null)} />}
      <TimeOffDrawer d={d} open={offOpen} onClose={() => setOffOpen(false)} defaults={{ pid: pid === "all" ? PROVIDERS[0]!.id : pid, date }} />
      <SubscribeDrawer d={d} open={subOpen} onClose={() => setSubOpen(false)} />
    </div>
  );
}

function StaffColumn({ d, date, pid, startMin, endMin, onOpen }: { d: SchedData; date: string; pid: string; startMin: number; endMin: number; onOpen: (o: Occurrence) => void }) {
  if (isClosed(date)) return <Blocked s={startMin} e={endMin} startMin={startMin} label="Clinic closed" />;
  const clip = (s: number, e: number) => ({ s: Math.max(s, startMin), e: Math.min(e, endMin) });
  return (
    <>
      {startMin < OPEN && <Blocked s={startMin} e={OPEN} startMin={startMin} label="Clinic closed" />}
      {endMin > CLOSE && <Blocked s={CLOSE} e={endMin} startMin={startMin} label="Clinic closed" />}
      {shiftsOn(d, date, pid).map((o) => {
        const c = clip(o.s, o.e);
        if (c.e <= c.s) return null;
        return (
          <button key={o.shift.id} onClick={() => onOpen(o)} className="absolute inset-x-1 overflow-hidden rounded-md border-l-4 border-primary bg-st-info-bg/80 p-1.5 text-left text-xs text-foreground focus-ring hover:bg-st-info-bg"
            style={{ top: (c.s - startMin) * PX, height: (c.e - c.s) * PX }}>
            <span className="block font-bold">{o.shift.location}</span>
            <span className="block tabular-nums">{o.shift.start}–{o.shift.end}</span>
            {o.shift.recurring && <span className="inline-flex items-center gap-1 text-muted-foreground"><Repeat className="size-3" aria-hidden />Weekly</span>}
          </button>
        );
      })}
      {timeOffOn(d, date, pid).map((t) => { const c = clip(t.s, t.e); return c.e > c.s ? <Blocked key={t.t.id} s={c.s} e={c.e} startMin={startMin} tone="off" label={`Time off${t.t.reason ? ` · ${t.t.reason}` : ""}`} /> : null; })}
    </>
  );
}

function ShiftDrawer({ d, date, init, onClose }: { d: SchedData; date: string; init: { draft: ShiftDraft; edit?: Occurrence | undefined }; onClose: () => void }) {
  const [f, setF] = useState(init.draft);
  const [scope, setScope] = useState<"one" | "series">("one");
  const [err, setErr] = useState<string>();
  const edit = init.edit;
  const set = <K extends keyof ShiftDraft>(k: K, v: ShiftDraft[K]) => { setF((x) => ({ ...x, [k]: v })); setErr(undefined); };
  // Preview conflicts: appointments that would fall outside bookable time after this change.
  const conflicts = useMemo(() => {
    const id = edit?.shift.id ?? "preview";
    const shifts = edit ? (edit.shift.recurring && scope === "one" ? [...d.shifts, { ...f, recurring: false, id: "preview" }] : d.shifts.map((s) => (s.id === id ? { ...f, id, date: edit.shift.recurring ? edit.shift.date : f.date } : s))) : [...d.shifts, { ...f, id }];
    const skips = edit?.shift.recurring && scope === "one" ? [...d.skips, `${id}|${date}`] : d.skips;
    const next = { ...d, shifts, skips };
    return d.appts.filter((a) => a.providerId === f.providerId && a.date >= isoDate(new Date()) && !isConflict(d, a) && isConflict(next, a));
  }, [d, f, scope, edit, date]);
  const save = () => {
    if (toMin(f.end) <= toMin(f.start)) return setErr("End time must be after start time.");
    if (edit) updateShift(edit.shift.id, f, scope, date); else addShift(f);
    toast.success(edit ? "Staff time updated" : "Staff time added");
    onClose();
  };
  return (
    <Drawer open onOpenChange={(o) => !o && onClose()} title={edit ? "Edit staff time" : "Add staff time"} sub={edit ? `${providerById(f.providerId).name} · ${date}` : "Availability opens bookable patient slots."}
      footer={<div className="flex flex-wrap justify-between gap-2">
        {edit ? <Button variant="ghost" icon={Trash2} onClick={() => { deleteShift(edit.shift.id, scope, date); toast.success(scope === "one" && edit.shift.recurring ? "Occurrence removed" : "Staff time removed"); onClose(); }}>Remove</Button> : <span />}
        <div className="flex gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Save</Button></div>
      </div>}>
      <div className="space-y-3">
        {edit?.shift.recurring && (
          <fieldset className="rounded-lg border p-3">
            <legend className="px-1 text-[13px] font-semibold">This is a weekly series. Apply changes to:</legend>
            {(["one", "series"] as const).map((v) => (
              <label key={v} className="flex items-center gap-2 py-1 text-sm"><input type="radio" name="scope" checked={scope === v} onChange={() => setScope(v)} />{v === "one" ? `Only this occurrence (${date})` : "Every week in the series"}</label>
            ))}
          </fieldset>
        )}
        <Field label="Provider" htmlFor="sh-p"><Select id="sh-p" value={f.providerId} disabled={!!edit} onChange={(e) => set("providerId", e.target.value)}>{PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
        <Field label="Date" htmlFor="sh-d"><Input id="sh-d" type="date" value={f.date} disabled={!!edit} onChange={(e) => set("date", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start" htmlFor="sh-s" error={err}><Input id="sh-s" type="time" step={900} value={f.start} aria-invalid={!!err} onChange={(e) => set("start", e.target.value)} /></Field>
          <Field label="End" htmlFor="sh-e"><Input id="sh-e" type="time" step={900} value={f.end} onChange={(e) => set("end", e.target.value)} /></Field>
        </div>
        <Field label="Location / type" htmlFor="sh-l"><Select id="sh-l" value={f.location} onChange={(e) => set("location", e.target.value)}>{LOCATIONS.map((l) => <option key={l}>{l}</option>)}</Select></Field>
        {!edit && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.recurring} onChange={(e) => set("recurring", e.target.checked)} />Repeat weekly</label>}
        <Field label="Notes" htmlFor="sh-n"><Textarea id="sh-n" value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        {conflicts.length > 0 && (
          <div role="alert" className="rounded-lg border border-st-warning/30 bg-st-warning-bg p-3 text-sm">
            <p className="flex items-center gap-1.5 font-semibold text-st-warning"><AlertTriangle className="size-4" />{conflicts.length} booked appointment{conflicts.length > 1 ? "s" : ""} would fall outside this availability</p>
            <ul className="mt-1 list-disc pl-5 text-foreground">{conflicts.slice(0, 5).map((a) => <li key={a.id}>{a.date} {a.time} · {patientById(a.patientId).name}</li>)}</ul>
            <p className="mt-1 text-muted-foreground">They won't be moved or deleted — reschedule them in Patient Scheduling.</p>
          </div>
        )}
      </div>
    </Drawer>
  );
}

function TimeOffDrawer({ d, open, onClose, defaults }: { d: SchedData; open: boolean; onClose: () => void; defaults: { pid: string; date: string } }) {
  const [f, setF] = useState({ providerId: defaults.pid, from: defaults.date, to: defaults.date, allDay: true, start: "13:00", end: "17:00", reason: "" });
  const [err, setErr] = useState<string>();
  const upcoming = d.timeOff.filter((t) => t.to >= isoDate(new Date())).sort((a, b) => a.from.localeCompare(b.from));
  const save = () => {
    if (f.to < f.from) return setErr("End date must be on or after the start date.");
    if (!f.allDay && toMin(f.end) <= toMin(f.start)) return setErr("End time must be after start time.");
    addTimeOff(f);
    const hit = d.appts.filter((a) => a.providerId === f.providerId && a.date >= f.from && a.date <= f.to && a.status === "scheduled").length;
    toast.success(hit ? `Time off saved · ${hit} booked appointment(s) now flagged as conflicts` : "Time off saved");
    setErr(undefined);
  };
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} title="Time off" sub="Time off removes bookable patient slots." footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Close</Button><Button onClick={save}>Save time off</Button></div>}>
      <div className="space-y-3">
        <Field label="Provider" htmlFor="to-p"><Select id="to-p" value={f.providerId} onChange={(e) => setF({ ...f, providerId: e.target.value })}>{PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From" htmlFor="to-f" error={err}><Input id="to-f" type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value, to: e.target.value > f.to ? e.target.value : f.to })} /></Field>
          <Field label="To" htmlFor="to-t"><Input id="to-t" type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.allDay} onChange={(e) => setF({ ...f, allDay: e.target.checked })} />All day</label>
        {!f.allDay && <div className="grid grid-cols-2 gap-3">
          <Field label="Start" htmlFor="to-s"><Input id="to-s" type="time" step={900} value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></Field>
          <Field label="End" htmlFor="to-e"><Input id="to-e" type="time" step={900} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></Field>
        </div>}
        <Field label="Reason (optional)" htmlFor="to-r"><Input id="to-r" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
        <div className="border-t pt-3">
          <h3 className="mb-2 text-sm font-bold">Upcoming time off</h3>
          {upcoming.length === 0 ? <p className="text-sm text-muted-foreground">None scheduled.</p> : (
            <ul className="divide-y rounded-lg border">
              {upcoming.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span><span className="font-semibold">{providerById(t.providerId).name}</span><span className="block text-muted-foreground">{t.from}{t.to !== t.from && ` → ${t.to}`} · {t.allDay ? "All day" : `${t.start}–${t.end}`}{t.reason && ` · ${t.reason}`}</span></span>
                  <Button size="sm" variant="ghost" aria-label="Remove time off" onClick={() => { deleteTimeOff(t.id); toast("Time off removed"); }}><Trash2 /></Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Drawer>
  );
}

function buildIcs(d: SchedData) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Vectronics//Staff schedule preview//EN"];
  const start = isoDate(new Date());
  for (let i = 0; i < 28; i++) {
    const day = addDays(start, i);
    if (isClosed(day)) continue;
    for (const p of PROVIDERS) for (const o of shiftsOn(d, day, p.id)) {
      const dt = day.replace(/-/g, "");
      lines.push("BEGIN:VEVENT", `UID:${o.shift.id}-${dt}@vectronics.demo`, `DTSTART:${dt}T${o.shift.start.replace(":", "")}00`, `DTEND:${dt}T${o.shift.end.replace(":", "")}00`, `SUMMARY:${p.name} · ${o.shift.location}`, "END:VEVENT");
    }
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function SubscribeDrawer({ d, open, onClose }: { d: SchedData; open: boolean; onClose: () => void }) {
  const download = () => {
    const url = URL.createObjectURL(new Blob([buildIcs(d)], { type: "text/calendar" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "vectronics-staff-schedule.ics" });
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Calendar file downloaded");
  };
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} title="Subscribe in my calendar" sub={<Badge tone="warning">Preview</Badge>}>
      <div className="space-y-3 text-sm">
        <p>Live calendar subscription isn't available in this preview, so changes won't sync automatically.</p>
        <p className="text-muted-foreground">You can download a one-time snapshot of the next 4 weeks of staff time and import it into Google Calendar, Outlook or Apple Calendar.</p>
        <Button icon={Download} onClick={download}>Download .ics snapshot</Button>
      </div>
    </Drawer>
  );
}
