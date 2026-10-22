import { BrandMark } from "./BrandMark";
import { type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import * as DM from "@radix-ui/react-dropdown-menu";
import {
  Bell, CalendarClock, CalendarDays, ChevronDown, ClipboardList, CreditCard, FileHeart, LayoutGrid,
  MessageSquare, Mail, Moon, Puzzle, RotateCcw, Settings, Sun, UserCircle2, Users, UsersRound, CalendarRange, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CLINIC, CURRENT_USER } from "@/lib/fixtures";
import { resetDemo, setTheme, useStore } from "@/lib/store";
import { Tip } from "./kit";
import { toast } from "sonner";
import { StaffChat } from "./StaffChat";

export const NAV = [
  { to: "/", label: "Front Desk", icon: LayoutGrid },
  { to: "/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/patient-scheduling", label: "Patient Scheduling", icon: CalendarClock },
  { to: "/patients", label: "Patients and Visit Notes", icon: ClipboardList },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/care-plans", label: "Care Plans", icon: FileHeart },
  { to: "/staff-scheduling", label: "Staff Scheduling", icon: CalendarRange },
  { to: "/staff", label: "Staff", icon: UsersRound },
  { to: "/settings", label: "Clinic Settings", icon: Settings },
  { to: "/add-ons", label: "Add-ons", icon: Puzzle },
] as const;

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark tile className="size-8" />
      <span className="text-[19px] font-extrabold tracking-tight text-sidebar-accent-foreground">Vectronics</span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const theme = useStore((s) => s.theme);

  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border px-4 pb-4 pt-5">
          <Wordmark />
          <p className="mt-1.5 text-[13px] font-medium text-sidebar-muted">Provider Portal</p>
        </div>
        <nav aria-label="Main" className="flex-1 space-y-0.5 overflow-y-auto p-2.5">
          {NAV.map((n) => {
            const active = n.to === "/" ? path === "/" : (path === n.to || path.startsWith(`${n.to}/`));
            return (
              <Link
                key={n.to}
                to={n.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors focus-ring",
                  active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-card" : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <n.icon className="size-[18px] shrink-0" aria-hidden />
                <span className="truncate">{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border px-4 py-3 text-xs text-sidebar-muted">
          {CLINIC.name}
          <br />
          {CLINIC.location}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur lg:px-6">
          <nav aria-label="Main mobile" className="md:hidden">
            <select
              aria-label="Go to area"
              className="h-9 rounded-lg border border-input bg-card px-2 text-sm"
              value={NAV.find((n) => (n.to === "/" ? path === "/" : (path === n.to || path.startsWith(`${n.to}/`))))?.to}
              onChange={(e) => (window.location.href = e.target.value)}
            >
              {NAV.map((n) => <option key={n.to} value={n.to}>{n.label}</option>)}
            </select>
          </nav>
          <div className="hidden min-w-0 items-center gap-2 text-sm lg:flex">
            <span className="font-semibold">{CLINIC.name}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-[13px] font-medium text-muted-foreground sm:flex">
              <CheckCircle2 className="size-4 text-st-success" aria-hidden /> Saved locally
            </span>
            <Tip label="2 unread notifications">
              <button className="relative inline-flex size-9 items-center justify-center rounded-lg border border-input bg-card focus-ring hover:bg-muted" aria-label="Notifications, 2 unread" onClick={() => toast("No new alerts beyond Messages.")}>
                <Bell className="size-4" />
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">2</span>
              </button>
            </Tip>
            <DM.Root>
              <DM.Trigger className="inline-flex h-9 items-center gap-2 rounded-lg border border-input bg-card px-2.5 text-sm font-semibold focus-ring hover:bg-muted">
                <UserCircle2 className="size-4 text-primary" aria-hidden />
                <span className="hidden sm:inline">{CURRENT_USER.name}</span>
                <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
              </DM.Trigger>
              <DM.Portal>
                <DM.Content align="end" sideOffset={6} className="z-50 w-60 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-pop">
                  <div className="px-2.5 py-2">
                    <p className="text-sm font-semibold">{CURRENT_USER.name}</p>
                    <p className="text-xs text-muted-foreground">{CURRENT_USER.role} · {CLINIC.name}</p>
                  </div>
                  <DM.Separator className="my-1 h-px bg-border" />
                  <DM.Label className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Prototype review</DM.Label>
                  <div className="mx-1 mb-1 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="group" aria-label="Portal">
                    <DM.Item disabled className="rounded-md bg-card px-2 py-1 text-center text-[13px] font-semibold shadow-card outline-none" aria-current="page">Provider</DM.Item>
                    <DM.Item asChild className="cursor-pointer rounded-md px-2 py-1 text-center text-[13px] font-medium text-muted-foreground outline-none data-[highlighted]:bg-card data-[highlighted]:text-foreground">
                      <Link to="/patient">Patient</Link>
                    </DM.Item>
                  </div>
                  <DM.Item asChild className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none data-[highlighted]:bg-muted">
                    <Link to="/invite-email"><Mail className="size-4" /> Invitation email preview</Link>
                  </DM.Item>
                  <DM.Separator className="my-1 h-px bg-border" />
                  <DM.Item onSelect={() => setTheme(theme === "dark" ? "light" : "dark")} className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none data-[highlighted]:bg-muted">
                    {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    {theme === "dark" ? "Light theme" : "Dark theme"}
                  </DM.Item>
                  <DM.Item onSelect={() => { resetDemo(); toast.success("Demo data reset"); }} className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none data-[highlighted]:bg-muted">
                    <RotateCcw className="size-4" /> Reset demo data
                  </DM.Item>
                  <DM.Item asChild className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none data-[highlighted]:bg-muted">
                    <Link to="/staff"><Users className="size-4" /> My staff profile</Link>
                  </DM.Item>
                </DM.Content>
              </DM.Portal>
            </DM.Root>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 pb-20 pt-5 lg:px-6">{children}</main>
        <StaffChat />
      </div>
    </div>
  );
}
