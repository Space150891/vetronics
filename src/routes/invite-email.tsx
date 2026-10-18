import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Info } from "lucide-react";
import { headFor } from "@/components/ListDetail";
import { Button, Card, buttonVariants } from "@/components/kit";
import { Logo } from "@/components/patient-ui";
import { CLINIC, ME, SUPPORT } from "@/lib/patient-data";
import { signOut } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/invite-email")({
  head: headFor("Invitation email preview", "Preview of the Patient Portal invitation email."),
  component: InviteEmail,
});

function InviteEmail() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-surface px-4 py-6">
      <div className="mx-auto max-w-xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Link to="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}><ArrowLeft /> Provider Portal</Link>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Info className="size-3.5" aria-hidden /> Preview only — this email is never sent.</p>
        </div>
        <Card className="mb-2 px-4 py-3 text-sm">
          <p><span className="text-muted-foreground">From:</span> {CLINIC.name} via Vectronics</p>
          <p><span className="text-muted-foreground">To:</span> {ME.email}</p>
          <p><span className="text-muted-foreground">Subject:</span> <span className="font-semibold">Activate your {CLINIC.name} Patient Portal</span></p>
        </Card>
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <Logo />
            <span className="text-sm font-semibold text-muted-foreground">{CLINIC.name}</span>
          </div>
          <div className="space-y-4 px-6 py-6 text-[15px] leading-relaxed">
            <h1 className="text-xl font-bold">Hi {ME.name.split(" ")[0]}, your patient portal is ready</h1>
            <p>{CLINIC.name} has created a secure Vectronics Patient Portal account for you. You can use it to see your appointments, request visits, message the clinic and view your bills.</p>
            <p>To get started, activate your account and choose your own password. The link works for 7 days.</p>
            <Button size="lg" className="h-12 w-full text-base sm:w-auto" onClick={() => { signOut(); nav({ to: "/patient/change-password" }); }}>Activate Account</Button>
            <p className="text-sm text-muted-foreground">Didn't expect this email? You can ignore it — nothing changes until you activate.</p>
          </div>
          <div className="border-t bg-surface px-6 py-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Need help?</p>
            <p>Call {SUPPORT.phone} · {SUPPORT.hours}</p>
            <p>{SUPPORT.email}</p>
            <p className="mt-2">{CLINIC.name}, {CLINIC.location}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
