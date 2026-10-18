import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";
import { headFor } from "@/components/ListDetail";
import { Badge, Button, Card, PageHeader, SearchInput, Textarea } from "@/components/kit";
import { PATIENTS } from "@/lib/fixtures";
import { sendChat, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages")({
  head: headFor("Messages", "Patient conversations for clinic staff."),
  component: Page,
});

const SUBJECTS = ["Appointment reschedule", "Form question", "Parking information", "Billing question", "Refill request routing", "Directions"];
const CONVS = PATIENTS.slice(0, 8).map((p, i) => ({
  id: `c${i}`, patient: p.name, subject: SUBJECTS[i % SUBJECTS.length], unread: i < 2,
  seed: [{ id: `s${i}`, from: "patient" as const, text: `Hello, I have a question about: ${SUBJECTS[i % SUBJECTS.length].toLowerCase()}.`, at: "" }],
}));

function Page() {
  const chats = useStore((s) => s.chats);
  const [sel, setSel] = useState(CONVS[0].id);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");
  const conv = CONVS.find((c) => c.id === sel)!;
  const msgs = [...conv.seed, ...(chats[sel] ?? [])];
  const list = CONVS.filter((c) => `${c.patient} ${c.subject}`.toLowerCase().includes(q.toLowerCase()));
  const send = () => { if (draft.trim()) { sendChat(sel, draft); setDraft(""); } };
  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader title="Messages" sub="Conversations with patients. Messages stay on this device in the prototype." />
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="border-b p-3"><SearchInput placeholder="Search conversations" aria-label="Search conversations" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <ul>
            {list.map((c) => (
              <li key={c.id}>
                <button onClick={() => setSel(c.id)} aria-current={sel === c.id} className={cn("w-full border-b px-4 py-3 text-left focus-ring hover:bg-muted", sel === c.id && "bg-accent shadow-[inset_3px_0_0_var(--color-primary)]")}>
                  <span className="flex items-center justify-between gap-2"><span className="font-semibold">{c.patient}</span>{c.unread && !chats[c.id] && <Badge tone="info">New</Badge>}</span>
                  <span className="block truncate text-[13px] text-muted-foreground">{c.subject}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="flex min-h-[480px] flex-col">
          <div className="border-b px-4 py-3"><h2 className="font-bold">{conv.patient}</h2><p className="text-[13px] text-muted-foreground">{conv.subject}</p></div>
          <div className="flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite">
            {msgs.map((m) => (
              <div key={m.id} className={cn("max-w-[75%] rounded-xl px-3 py-2 text-sm", m.from === "staff" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>{m.text}</div>
            ))}
          </div>
          <div className="flex items-end gap-2 border-t p-3">
            <Textarea aria-label="Reply" className="min-h-10" placeholder="Write a reply…" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
            <Button icon={Send} onClick={send} disabled={!draft.trim()} disabledReason="Type a message first">Send</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
