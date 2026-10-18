import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ChevronRight, CreditCard, Receipt } from "lucide-react";
import { headFor } from "@/components/ListDetail";
import { Badge, Button, Card, DL, Drawer, EmptyState } from "@/components/kit";
import { PTitle, SectionTitle } from "@/components/patient-ui";
import { INVOICES, INVOICE_TONE, ME, SUPPORT, balance, usd, type Invoice } from "@/lib/patient-data";

export const Route = createFileRoute("/patient/bills")({
  head: headFor("Bills", "Your bills, balances and payment history."),
  component: Bills,
});

function Bills() {
  const mine = INVOICES.filter((i) => i.patientId === ME.id);
  const owed = mine.reduce((s, i) => s + balance(i), 0);
  const payments = mine.flatMap((i) => i.payments.map((p) => ({ ...p, number: i.number })));
  const [open, setOpen] = useState<Invoice | null>(null);
  const trigger = useRef<HTMLElement | null>(null);

  return (
    <>
      <PTitle title="Bills" back={{ to: "/patient/profile", label: "Profile" }} />
      <Card className="p-5">
        <p className="text-sm font-semibold text-muted-foreground">Amount due</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{usd(owed)}</p>
        <Button size="lg" className="mt-4 h-12 w-full text-base" icon={CreditCard} disabled disabledReason="Online payment isn't available in this prototype.">Pay bill</Button>
        <p className="mt-2 text-center text-sm text-muted-foreground">To pay now, call {SUPPORT.phone} or pay at the front desk.</p>
      </Card>

      <SectionTitle>Bills</SectionTitle>
      <div className="space-y-2.5">
        {mine.map((i) => (
          <button key={i.id} onClick={(e) => { trigger.current = e.currentTarget; setOpen(i); }} className="flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3.5 text-left shadow-card focus-ring hover:bg-muted">
            <span className="min-w-0 flex-1"><span className="block font-semibold">{i.date}</span><span className="block text-sm text-muted-foreground">{i.items[0]?.[0]} · {i.number}</span></span>
            <span className="text-right"><span className="block font-bold tabular-nums">{usd(i.amount)}</span><Badge tone={INVOICE_TONE[i.status]}>{i.status}</Badge></span>
            <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
          </button>
        ))}
      </div>

      <SectionTitle>Payment history</SectionTitle>
      {payments.length === 0 ? <Card><EmptyState icon={Receipt} title="No payments yet" /></Card> : (
        <Card className="divide-y">
          {payments.map((p, k) => (
            <div key={k} className="flex items-center justify-between gap-3 px-4 py-3 text-[15px]">
              <span><span className="block font-semibold">{p.date}</span><span className="text-sm text-muted-foreground">{p.method} · {p.number}</span></span>
              <span className="font-semibold tabular-nums">{usd(p.amount)}</span>
            </div>
          ))}
        </Card>
      )}

      {open && (
        <Drawer open onOpenChange={(o) => !o && setOpen(null)} returnFocusRef={trigger} title={open.number} sub={<Badge tone={INVOICE_TONE[open.status]}>{open.status}</Badge>}>
          <DL items={[["Date", open.date], ["Patient", open.patient]]} />
          <table className="mt-4 w-full text-[15px]">
            <caption className="sr-only">Charges</caption>
            <tbody>
              {open.items.map(([k, v]) => <tr key={k} className="border-b"><td className="py-2">{k}</td><td className="py-2 text-right tabular-nums">{usd(v)}</td></tr>)}
              <tr className="border-b"><td className="py-2 font-semibold">Total</td><td className="py-2 text-right font-semibold tabular-nums">{usd(open.amount)}</td></tr>
              {open.payments.map((p, k) => <tr key={k} className="border-b text-muted-foreground"><td className="py-2">Paid {p.date} · {p.method}</td><td className="py-2 text-right tabular-nums">−{usd(p.amount)}</td></tr>)}
              <tr><td className="py-2 font-bold">Balance</td><td className="py-2 text-right font-bold tabular-nums">{usd(balance(open))}</td></tr>
            </tbody>
          </table>
        </Drawer>
      )}
    </>
  );
}
