import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import * as DM from "@radix-ui/react-dropdown-menu";
import { ChevronLeft, FlaskConical, Mail, Moon, RotateCcw, Stethoscope, Sun } from "lucide-react";
import { toast } from "sonner";
import { nums } from "@/lib/fixtures";
import { resetDemo, setTheme, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string | undefined }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-primary" />
        <path d="M8 9l8 15 8-15" fill="none" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary-foreground" />
      </svg>
      <span className="text-[17px] font-extrabold tracking-tight">Vectronics</span>
    </span>
  );
}

export function PTitle({ title, sub, back }: { title: string; sub?: ReactNode; back?: { to: string; label: string } | undefined }) {
  return (
    <div className="mb-4">
      {back && (
        <Link to={back.to} className="mb-2 inline-flex items-center gap-1 rounded text-sm font-semibold text-primary focus-ring">
          <ChevronLeft className="size-4" aria-hidden /> {back.label}
        </Link>
      )}
      <h1 className="text-2xl font-bold leading-tight tracking-tight">{title}</h1>
      {sub && <p className="mt-1 text-[15px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-center justify-between gap-2">
      <h2 className="text-[13px] font-bold uppercase tracking-wide text-muted-foreground">{children}</h2>
      {action}
    </div>
  );
}

export function fmtLongDate(d: string) {
  const [y, m, day] = nums(d, "-");
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
export function fmtShortDate(d: string) {
  const [y, m, day] = nums(d, "-");
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
export function fmtSlot(t: string) {
  const [h, m] = nums(t, ":");
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** Prototype review menu: portal switch, theme, invite email, reset. */
export function ReviewMenu() {
  const theme = useStore((s) => s.theme);
  const item = "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-muted";
  return (
    <DM.Root>
      <DM.Trigger aria-label="Prototype review menu" className="inline-flex size-10 items-center justify-center rounded-lg border border-input bg-card focus-ring hover:bg-muted">
        <FlaskConical className="size-[18px]" />
      </DM.Trigger>
      <DM.Portal>
        <DM.Content align="end" sideOffset={6} className="z-50 w-64 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-pop">
          <DM.Label className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Prototype review</DM.Label>
          <DM.Item asChild className={item}><Link to="/"><Stethoscope className="size-4" /> Switch to Provider Portal</Link></DM.Item>
          <DM.Item asChild className={item}><Link to="/invite-email"><Mail className="size-4" /> Invitation email preview</Link></DM.Item>
          <DM.Item className={item} onSelect={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />} {theme === "dark" ? "Light theme" : "Dark theme"}
          </DM.Item>
          <DM.Separator className="my-1 h-px bg-border" />
          <DM.Item className={item} onSelect={() => { resetDemo(); toast.success("Demo data reset"); }}><RotateCcw className="size-4" /> Reset demo data</DM.Item>
          <p className="px-2.5 pb-1.5 pt-1 text-xs text-muted-foreground">Sign-in is simulated. Passwords are never stored; data stays in this browser.</p>
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}

export function ListLink({ to, icon: Icon, title, sub, right, search }: { to: string; icon: React.ComponentType<{ className?: string }>; title: string; sub?: string; right?: ReactNode; search?: Record<string, string> }) {
  return (
    <Link to={to} search={search as never} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 shadow-card transition-colors focus-ring hover:bg-muted">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"><Icon className="size-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        {sub && <span className="block text-sm text-muted-foreground">{sub}</span>}
      </span>
      {right}
    </Link>
  );
}
