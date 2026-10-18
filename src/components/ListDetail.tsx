import { useMemo, useState, type ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Card, EmptyState, PageHeader, SearchInput, Table, Td, Th, Tabs } from "./kit";
import { cn } from "@/lib/utils";

export interface Column<T> {
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export function ListDetailPage<T extends { id: string }>({
  title, sub, actions, rows, columns, search, searchPlaceholder, tabs, tabFilter, preview, previewTitle,
}: {
  title: string;
  sub: string;
  actions?: ReactNode;
  rows: T[];
  columns: Column<T>[];
  search: (row: T) => string;
  searchPlaceholder: string;
  tabs?: { value: string; label: string }[];
  tabFilter?: (row: T, tab: string) => boolean;
  preview: (row: T) => ReactNode;
  previewTitle: (row: T) => string;
}) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState(tabs?.[0]?.value ?? "all");
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return rows.filter((r) => (!tabFilter || tabFilter(r, tab)) && (!n || search(r).toLowerCase().includes(n)));
  }, [rows, q, tab, search, tabFilter]);
  const [selId, setSelId] = useState<string | null>(rows[0]?.id ?? null);
  const sel = filtered.find((r) => r.id === selId) ?? filtered[0];

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader title={title} sub={sub} actions={actions} />
      {tabs && (
        <div className="mb-3">
          <Tabs label={`${title} views`} value={tab} onChange={setTab} items={tabs.map((t) => ({ ...t, count: rows.filter((r) => !tabFilter || tabFilter(r, t.value)).length }))} />
        </div>
      )}
      <SearchInput className="mb-3" placeholder={searchPlaceholder} aria-label={`Search ${title}`} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0 overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={Inbox} title="Nothing found" body="Adjust the search or view." />
          ) : (
            <Table>
              <thead><tr>{columns.map((c) => <Th key={c.label} className={c.className}>{c.label}</Th>)}</tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    tabIndex={0}
                    aria-selected={sel?.id === r.id}
                    onClick={() => setSelId(r.id)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelId(r.id))}
                    className={cn("cursor-pointer outline-none transition-colors hover:bg-muted/60 focus-visible:bg-accent focus-visible:shadow-[inset_3px_0_0_var(--color-ring)]", sel?.id === r.id && "bg-accent/70 shadow-[inset_3px_0_0_var(--color-primary)]")}
                  >
                    {columns.map((c) => <Td key={c.label} className={c.className}>{c.render(r)}</Td>)}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        <Card className="h-fit lg:sticky lg:top-[72px]" aria-live="polite">
          {sel ? (
            <>
              <div className="border-b px-4 py-3"><h2 className="text-[15px] font-bold">{previewTitle(sel)}</h2></div>
              <div className="p-4">{preview(sel)}</div>
            </>
          ) : (
            <EmptyState icon={Inbox} title="Select a row" />
          )}
        </Card>
      </div>
    </div>
  );
}

export function headFor(title: string, description: string) {
  return () => ({
    meta: [
      { title: `${title} · Vectronics Provider` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · Vectronics Provider` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  });
}
