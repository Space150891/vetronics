import { createFileRoute } from "@tanstack/react-router";
import { ListDetailPage, headFor } from "@/components/ListDetail";
import { Badge, DL } from "@/components/kit";
import { INVOICES, INVOICE_TONE, usd, type Invoice } from "@/lib/patient-data";

export const Route = createFileRoute("/billing")({
  head: headFor("Billing", "Invoice list and invoice details for the clinic."),
  component: Page,
});

type Inv = Invoice;
const STAT = INVOICE_TONE;

function Page() {
  return (
    <ListDetailPage<Inv>
      title="Billing"
      sub="Invoices and payment status. Payments are not processed in this prototype."
      rows={INVOICES}
      tabs={[{ value: "all", label: "All" }, { value: "Open", label: "Open" }, { value: "Overdue", label: "Overdue" }, { value: "Paid", label: "Paid" }]}
      tabFilter={(r, t) => t === "all" || r.status === t}
      search={(r) => `${r.number} ${r.patient}`}
      searchPlaceholder="Invoice number or patient"
      columns={[
        { label: "Invoice", render: (r) => <span className="font-semibold tabular-nums">{r.number}</span> },
        { label: "Patient", render: (r) => r.patient },
        { label: "Date", render: (r) => r.date },
        { label: "Amount", className: "text-right", render: (r) => <span className="tabular-nums">{usd(r.amount)}</span> },
        { label: "Status", render: (r) => <Badge tone={STAT[r.status]}>{r.status}</Badge> },
      ]}
      previewTitle={(r) => r.number}
      preview={(r) => (
        <div className="space-y-4">
          <DL items={[["Patient", r.patient], ["Issued", r.date], ["Status", <Badge key="s" tone={STAT[r.status]}>{r.status}</Badge>]]} />
          <table className="w-full text-sm">
            <tbody>
              {r.items.map(([k, v]) => <tr key={k} className="border-b"><td className="py-1.5">{k}</td><td className="py-1.5 text-right tabular-nums">{usd(v)}</td></tr>)}
              <tr><td className="py-1.5 font-bold">Total</td><td className="py-1.5 text-right font-bold tabular-nums">{usd(r.amount)}</td></tr>
            </tbody>
          </table>
        </div>
      )}
    />
  );
}
