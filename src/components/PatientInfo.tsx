import * as Dialog from "@radix-ui/react-dialog";
import { Flag, X } from "lucide-react";
import { Badge, DL, StatusBadge } from "@/components/kit";
import { patientById, providerById } from "@/lib/fixtures";
import { useStore } from "@/lib/store";

const orMissing = (v: string | undefined) => (v && v.trim() ? v : <span className="text-muted-foreground">Not on file</span>);

/** Patient information pop-up. Read-only: opening it never starts or changes a visit. */
export function PatientInfoDialog({ patientId, onClose, onVisit }: { patientId: string | null; onClose: () => void; onVisit?: (apptId: string) => void }) {
  const appts = useStore((s) => s.appts);
  const p = patientId ? patientById(patientId) : null;
  const visits = p ? appts.filter((a) => a.patientId === p.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)) : [];
  return (
    <Dialog.Root open={!!p} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/25" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col rounded-t-2xl border bg-card shadow-drawer focus:outline-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[400px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
          {p && (
            <>
              <div className="flex items-center justify-between border-b px-5 py-3.5">
                <Dialog.Title className="text-lg font-bold">{p.name}</Dialog.Title>
                <Dialog.Description className="sr-only">Patient information and visits</Dialog.Description>
                <Dialog.Close aria-label="Close" className="grid size-8 place-items-center rounded-md hover:bg-muted focus-ring"><X className="size-4" /></Dialog.Close>
              </div>
              <div className="space-y-4 overflow-y-auto px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <DL items={[["DOB", orMissing(p.dob)], ["MRN", orMissing(p.mrn)], ["Phone", orMissing(p.phone)], ["Email", orMissing(p.email)], ["Insurance", orMissing(p.insurance)],
                  ["Indicators", p.flags.length ? <span className="flex flex-wrap gap-1">{p.flags.map((f) => <Badge key={f} icon={Flag}>{f}</Badge>)}</span> : "None on file"]]} />
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visits</h3>
                  <ul className="space-y-1.5">
                    {visits.length === 0 && <li className="text-sm text-muted-foreground">No visits on file.</li>}
                    {visits.map((v) => (
                      <li key={v.id}>
                        <button onClick={() => onVisit?.(v.id)} disabled={!onVisit}
                          className="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted focus-ring disabled:hover:bg-transparent">
                          <span className="min-w-0"><span className="font-medium tabular-nums">{v.date}</span> · {v.type}<span className="block truncate text-xs text-muted-foreground">{providerById(v.providerId).name}</span></span>
                          <StatusBadge status={v.status} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
