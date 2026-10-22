import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Select } from "./kit";
import { cn } from "@/lib/utils";
import { PROVIDERS, addDays, isoDate, nums, type Provider } from "@/lib/fixtures";
import { toTime } from "@/lib/schedule";

export const HOUR_PX = 56;
export const PX = HOUR_PX / 60;

export const longDate = (d: string) => { const [y, m, day] = nums(d, "-"); const dt = new Date(y, m - 1, day); return `${dt.getDate()} ${dt.toLocaleDateString("en-GB", { month: "long" })} · ${dt.toLocaleDateString("en-GB", { weekday: "long" })}, ${y}`; };
const sundayOf = (d: string) => { const [y, m, day] = nums(d, "-"); return addDays(d, -new Date(y, m - 1, day).getDay()); };

export function WeekStrip({ selected, onSelect, summary }: { selected: string; onSelect: (d: string) => void; summary: (d: string) => React.ReactNode }) {
  const today = isoDate(new Date());
  const start = sundayOf(selected);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div className="mb-3 flex items-stretch gap-2">
      <Button variant="outline" size="icon" className="h-auto self-center" aria-label="Previous week" onClick={() => onSelect(addDays(selected, -7))}><ChevronLeft /></Button>
      <div className="grid min-w-0 flex-1 grid-cols-7 gap-1.5 overflow-x-auto">
        {days.map((d) => {
          const [y, m, day] = nums(d, "-");
          const dt = new Date(y, m - 1, day);
          const sel = d === selected;
          return (
            <button key={d} onClick={() => onSelect(d)} aria-pressed={sel} aria-label={longDate(d)}
              className={cn("min-w-[84px] rounded-xl border px-2 py-2 text-center text-xs transition-colors focus-ring", sel ? "border-primary bg-card ring-2 ring-primary/25" : "border-transparent bg-surface hover:bg-muted")}>
              <span className="flex items-center justify-center gap-1 font-semibold text-foreground">
                {dt.toLocaleDateString("en-GB", { weekday: "short" })}
                {d === today && <span className="rounded bg-st-warning-bg px-1 text-[10px] font-bold text-st-warning">Today</span>}
              </span>
              <span className="my-1 block min-h-5 font-semibold">{summary(d)}</span>
              <span className="block text-muted-foreground">{dt.getDate()} {dt.toLocaleDateString("en-GB", { month: "short" })}</span>
            </button>
          );
        })}
      </div>
      <Button variant="outline" size="icon" className="h-auto self-center" aria-label="Next week" onClick={() => onSelect(addDays(selected, 7))}><ChevronRight /></Button>
    </div>
  );
}

export function ProviderFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select aria-label="Provider" className="w-52" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="all">All providers</option>
      {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </Select>
  );
}

export function ViewBar({ view, onView, date, onToday }: { view: "day" | "month"; onView: (v: "day" | "month") => void; date: string; onToday: () => void }) {
  const [y, m, d] = nums(date, "-");
  const heading = view === "day" ? longDate(date) : new Date(y, m - 1, d).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border bg-card px-3 py-2 shadow-card">
      <div role="tablist" aria-label="Calendar view" className="flex rounded-lg border p-0.5">
        {(["day", "month"] as const).map((v) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => onView(v)}
            className={cn("h-8 rounded-md px-3 text-[13px] font-semibold capitalize focus-ring", view === v ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>{v}</button>
        ))}
      </div>
      <Button size="sm" variant="outline" onClick={onToday}>Today</Button>
      <h2 className="flex-1 text-center text-base font-bold" aria-live="polite">{heading}</h2>
    </div>
  );
}

export function Avatar({ p }: { p: Provider }) {
  return <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-primary/40 bg-st-info-bg text-xs font-bold text-st-info">{p.initials}</span>;
}

/** Day timeline: sticky time labels and provider headers; children positioned per column. */
export function DayGrid({ providers, startMin, endMin, header, column }: {
  providers: Provider[]; startMin: number; endMin: number;
  header: (p: Provider) => React.ReactNode; column: (p: Provider) => React.ReactNode;
}) {
  const hours = Array.from({ length: (endMin - startMin) / 60 }, (_, i) => startMin + i * 60);
  const h = (endMin - startMin) * PX;
  return (
    <div className="max-h-[70vh] overflow-auto rounded-xl border bg-card shadow-card">
      <div className="grid" style={{ gridTemplateColumns: `56px repeat(${providers.length}, minmax(220px, 1fr))` }}>
        <div className="sticky left-0 top-0 z-30 border-b border-r bg-card" />
        {providers.map((p) => <div key={p.id} className="sticky top-0 z-20 flex items-center justify-center gap-2 border-b border-r bg-card px-2 py-2 last:border-r-0">{header(p)}</div>)}
        <div className="sticky left-0 z-10 border-r bg-card" style={{ height: h }}>
          {hours.map((m) => <div key={m} className="relative border-b pr-1.5 text-right text-[11px] font-medium text-muted-foreground tabular-nums" style={{ height: HOUR_PX }}><span className="relative top-1">{toTime(m)}</span></div>)}
        </div>
        {providers.map((p) => (
          <div key={p.id} className="relative border-r last:border-r-0" style={{ height: h }}>
            {hours.map((m) => <div key={m} className="border-b border-border/60" style={{ height: HOUR_PX }} />)}
            {column(p)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Blocked({ s, e, startMin, label, tone = "closed" }: { s: number; e: number; startMin: number; label: string; tone?: "closed" | "lunch" | "off" }) {
  return (
    <div className={cn("absolute inset-x-0 grid place-items-center overflow-hidden text-[11px] font-bold", tone === "lunch" ? "cal-stripe-warn text-st-warning" : tone === "off" ? "cal-stripe-danger text-st-danger" : "cal-stripe text-muted-foreground")}
      style={{ top: (s - startMin) * PX, height: (e - s) * PX }}>
      <span className="rounded bg-card/80 px-1.5">{label}</span>
    </div>
  );
}

export function MonthGrid({ selected, onSelect, cell }: { selected: string; onSelect: (d: string) => void; cell: (d: string) => React.ReactNode }) {
  const [y, m] = nums(selected, "-");
  const first = isoDate(new Date(y, m - 1, 1));
  const start = sundayOf(first);
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const today = isoDate(new Date());
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
      <div className="grid min-w-[640px] grid-cols-7">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="border-b bg-surface px-2 py-1.5 text-xs font-semibold uppercase text-muted-foreground">{d}</div>)}
        {days.map((d) => {
          const out = nums(d, "-")[1] !== m;
          return (
            <button key={d} onClick={() => onSelect(d)} aria-label={longDate(d)}
              className={cn("min-h-24 border-b border-r p-1.5 text-left align-top text-xs focus-ring hover:bg-muted", out && "bg-surface/60 text-muted-foreground", d === selected && "ring-2 ring-inset ring-primary")}>
              <span className={cn("mb-1 inline-grid size-6 place-items-center rounded-full font-semibold", d === today && "bg-primary text-primary-foreground")}>{nums(d, "-")[2]}</span>
              {cell(d)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
