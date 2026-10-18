import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, MessagesSquare, Send } from "lucide-react";
import { headFor } from "@/components/ListDetail";
import { Badge, Button, Card, EmptyState, Textarea } from "@/components/kit";
import { PTitle } from "@/components/patient-ui";
import { CLINIC, CONVERSATIONS, ME, UNREAD_SEED } from "@/lib/patient-data";
import { markConvRead, sendChat, setDraft, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patient/messages")({
  head: headFor("Messages", "Conversations with your clinic."),
  validateSearch: (s: Record<string, unknown>): { c?: string } => (typeof s.c === "string" ? { c: s.c } : {}),
  component: Messages,
});

function Messages() {
  const { c } = Route.useSearch();
  const nav = useNavigate({ from: "/patient/messages" });
  const chats = useStore((s) => s.chats);
  const read = useStore((s) => s.readConvs);
  const mine = CONVERSATIONS.filter((x) => x.patientId === ME.id);
  const conv = c ? mine.find((x) => x.id === c) : undefined;

  if (c && !conv) {
    return <Card><EmptyState icon={MessagesSquare} title="Conversation not found" action={<Button variant="outline" onClick={() => nav({ search: {} })}>Back to messages</Button>} /></Card>;
  }
  if (conv) return <Thread id={conv.id} subject={conv.subject} seed={conv.seed} onBack={() => nav({ search: {} })} />;

  return (
    <>
      <PTitle title="Messages" sub={`Non-urgent questions for ${CLINIC.name}. Replies usually within 1 business day.`} />
      <div className="space-y-2.5">
        {mine.map((x) => {
          const all = [...x.seed, ...(chats[x.id] ?? [])];
          const last = all[all.length - 1];
          const unread = UNREAD_SEED.has(x.id) && !read.includes(x.id);
          return (
            <button key={x.id} onClick={() => nav({ search: { c: x.id } })} className="flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3.5 text-left shadow-card focus-ring hover:bg-muted">
              <span className="min-w-0 flex-1">
                <span className={cn("block", unread ? "font-bold" : "font-semibold")}>{x.subject}</span>
                <span className="block truncate text-sm text-muted-foreground">{last?.from === "patient" ? "You: " : "Clinic: "}{last?.text}</span>
              </span>
              {unread && <Badge tone="info">New</Badge>}
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          );
        })}
      </div>
    </>
  );
}

function Thread({ id, subject, seed, onBack }: { id: string; subject: string; seed: { id: string; from: "staff" | "patient"; text: string }[]; onBack: () => void }) {
  const extra = useStore((s) => s.chats[id] ?? []);
  const draft = useStore((s) => s.drafts[`patient:${id}`] ?? "");
  const endRef = useRef<HTMLDivElement>(null);
  const msgs = [...seed, ...extra];
  useEffect(() => markConvRead(id), [id]);
  useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), [msgs.length]);
  const send = () => { if (draft.trim()) sendChat(id, draft, "patient"); };

  return (
    <>
      <button onClick={onBack} className="mb-2 inline-flex items-center gap-1 rounded text-sm font-semibold text-primary focus-ring"><ChevronLeft className="size-4" aria-hidden /> Messages</button>
      <h1 className="mb-4 text-xl font-bold">{subject}</h1>
      <div className="space-y-2.5" aria-live="polite">
        {msgs.map((m) => (
          <div key={m.id} className={cn("max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px]", m.from === "patient" ? "ml-auto rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border bg-card")}>
            <span className="sr-only">{m.from === "patient" ? "You said: " : "Clinic said: "}</span>{m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="fixed inset-x-0 bottom-16 z-20 border-t bg-card/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-end gap-2">
          <Textarea aria-label="Write a message" className="min-h-11 text-base" rows={1} placeholder="Write a message…" value={draft} onChange={(e) => setDraft(`patient:${id}`, e.target.value)} />
          <Button size="lg" className="h-11" icon={Send} onClick={send} disabled={!draft.trim()} disabledReason="Type a message first" aria-label="Send message">Send</Button>
        </div>
        <p className="mx-auto mt-1 max-w-xl text-xs text-muted-foreground">Draft saves automatically. For emergencies, call 911.</p>
      </div>
      <div className="h-32" aria-hidden />
    </>
  );
}
