import { Link, Navigate, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Home, Loader2, MessageSquare, UserRound } from "lucide-react";
import { Logo, ReviewMenu } from "@/components/patient-ui";
import { CONVERSATIONS, ME, UNREAD_SEED } from "@/lib/patient-data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patient")({
  component: PatientLayout,
});

const PUBLIC = ["/patient/sign-in", "/patient/change-password"];
const TABS = [
  { to: "/patient", label: "Home", icon: Home },
  { to: "/patient/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/patient/messages", label: "Messages", icon: MessageSquare },
  { to: "/patient/profile", label: "Profile", icon: UserRound },
] as const;

export function useUnreadCount() {
  const read = useStore((s) => s.readConvs);
  return CONVERSATIONS.filter((c) => c.patientId === ME.id && UNREAD_SEED.has(c.id) && !read.includes(c.id)).length;
}

function PatientLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname }).replace(/\/$/, "") || "/patient";
  const hydrated = useStore((s) => s.hydrated);
  const session = useStore((s) => s.session);
  const unread = useUnreadCount();
  const isPublic = PUBLIC.includes(path);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" role="status">
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden /><span className="sr-only">Loading your portal</span>
      </div>
    );
  }
  if (!isPublic && !session.signedIn) return <Navigate to="/patient/sign-in" replace />;
  if (!isPublic && !session.passwordChanged) return <Navigate to="/patient/change-password" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
          <Link to="/patient" className="rounded focus-ring" aria-label="Vectronics home"><Logo /></Link>
          <ReviewMenu />
        </div>
      </header>
      <main className={cn("mx-auto max-w-xl px-4 pt-5", isPublic ? "pb-10" : "pb-28")}>
        <Outlet />
      </main>
      {!isPublic && (
        <nav aria-label="Patient" className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <ul className="mx-auto grid max-w-xl grid-cols-4">
            {TABS.map((t) => {
              const active = t.to === "/patient" ? path === "/patient" : path.startsWith(t.to);
              return (
                <li key={t.to}>
                  <Link
                    to={t.to}
                    aria-current={active ? "page" : undefined}
                    className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold focus-ring", active ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                  >
                    <t.icon className="size-[22px]" aria-hidden />
                    {t.label}
                    {t.label === "Messages" && unread > 0 && (
                      <span className="absolute right-[calc(50%-22px)] top-2 flex size-[18px] items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground" aria-label={`${unread} unread`}>{unread}</span>
                    )}
                    {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-primary" aria-hidden />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
