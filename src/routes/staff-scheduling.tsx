import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";
import { headFor } from "@/components/ListDetail";
import { Card, PageHeader, Table, Td, Th } from "@/components/kit";
import { DAYS, STAFF } from "@/lib/staff";

export const Route = createFileRoute("/staff-scheduling")({
  head: headFor("Staff Scheduling", "Weekly staff schedule overview."),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader title="Staff Scheduling" sub="This week's shifts. Clinic hours 8:00 AM – 5:00 PM." />
      <Card className="overflow-hidden">
        <Table>
          <thead><tr><Th>Staff member</Th><Th>Role</Th>{DAYS.map((d) => <Th key={d} className="text-center">{d}</Th>)}<Th className="text-right">Days</Th></tr></thead>
          <tbody>
            {STAFF.map((s) => (
              <tr key={s.id}>
                <Td className="font-semibold">{s.name}</Td>
                <Td className="text-muted-foreground">{s.role}</Td>
                {DAYS.map((d) => (
                  <Td key={d} className="text-center">
                    {s.days.includes(d)
                      ? <span className="inline-flex items-center gap-1 rounded-md bg-st-info-bg px-2 py-0.5 text-xs font-semibold text-st-info"><Check className="size-3.5" aria-hidden />8–5</span>
                      : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Minus className="size-3.5" aria-hidden />Off</span>}
                  </Td>
                ))}
                <Td className="text-right tabular-nums">{s.days.length}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
