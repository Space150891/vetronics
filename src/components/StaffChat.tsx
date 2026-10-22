import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, MessageSquare, PenSquare, Search, Send, X, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ME, chat, colleagues, last, otherOf, staffById, totalUnread, unreadIn, useChat, visibleConvs, type Conversation,
} from "@/lib/staff-chat";

const initials = (n: string) => n.replace(/^Dr\.\s*/, "").split(" ").map((p) => p[0]).slice(0, 2).join("");
const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const day = (iso: string) => {
  const d = new Date(iso), t = new Date();
  const y = new Date(); y.setDate(t.getDate() - 1);
  if (d.toDateString() === t.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};
const stamp = (iso: string) => (day(iso) === "Today" ? time(iso) : day(iso));

function Avatar({ name }: { name: string }) {
  return <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary" aria-hidden>{initials(name)}</span>;
}

export function StaffChat() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<{ kind: "list" } | { kind: "new" } | { kind: "conv"; id: string }>({ kind: "list" });
  const unread = useChat(totalUnread);
  const launcher = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const close = () => { setOpen(false); requestAnimationFrame(() => launcher.current?.focus()); };
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    panel.current?.querySelector<HTMLElement>("input,textarea")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {open && (
        <div
          ref={panel}
          role="dialog"
          aria-label="Staff messages"
          className="fixed inset-0 z-50 flex flex-col bg-card pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] sm:inset-auto sm:bottom-20 sm:right-5 sm:h-[min(560px,calc(100vh-7rem))] sm:w-[380px] sm:rounded-xl sm:border sm:pb-0 sm:pt-0 sm:shadow-drawer"
        >
          {view.kind === "conv" ? (
            <ConvView key={view.id} id={view.id} active={open} onBack={() => setView({ kind: "list" })} onClose={close} />
          ) : view.kind === "new" ? (
            <Picker onBack={() => setView({ kind: "list" })} onClose={close} onPick={(sid) => setView({ kind: "conv", id: chat.open(sid) })} />
          ) : (
            <List onClose={close} onNew={() => setView({ kind: "new" })} onOpen={(id) => setView({ kind: "conv", id })} />
          )}
        </div>
      )}
      <button
        ref={launcher}
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={`Staff messages${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        className={cn("fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-drawer focus-ring", open && "hidden sm:grid")}
      >
        <MessageSquare className="size-5" aria-hidden />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[11px] font-bold text-destructive-foreground ring-2 ring-background">{unread}</span>
        )}
      </button>
    </>
  );
}

function Header({ title, sub, onBack, onClose, action }: { title: string; sub: string; onBack?: () => void; onClose: () => void; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b px-3 py-2.5">
      {onBack && <button onClick={onBack} aria-label="Back" className="grid size-8 place-items-center rounded-md hover:bg-muted focus-ring"><ArrowLeft className="size-4" /></button>}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[15px] font-semibold">{title}</h2>
        <p className="truncate text-xs text-muted-foreground">{sub}</p>
      </div>
      {action}
      <button onClick={onClose} aria-label="Close messages" className="grid size-8 place-items-center rounded-md hover:bg-muted focus-ring"><X className="size-4" /></button>
    </div>
  );
}

function SearchBox({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="relative px-3 py-2">
      <Search className="pointer-events-none absolute left-5.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} placeholder={label}
        className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-2 text-sm focus-ring" />
    </div>
  );
}

function List({ onClose, onNew, onOpen }: { onClose: () => void; onNew: () => void; onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const all = useChat((s) => s.convs);
  const convs = useMemo(() => visibleConvs({ convs: all, drafts: {} }).filter((c) => {
    const o = staffById(otherOf(c));
    return `${o?.name} ${o?.role}`.toLowerCase().includes(q.toLowerCase());
  }), [all, q]);
  return (
    <>
      <Header title="Messages" sub="Staff only" onClose={onClose}
        action={<button onClick={onNew} aria-label="New message" className="grid size-8 place-items-center rounded-md hover:bg-muted focus-ring"><PenSquare className="size-4" /></button>} />
      <SearchBox value={q} onChange={setQ} label="Search conversations" />
      <ul className="flex-1 overflow-y-auto">
        {convs.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">{q ? "No conversations match." : "No conversations yet. Start one with New message."}</li>}
        {convs.map((c) => <Row key={c.id} c={c} onOpen={onOpen} />)}
      </ul>
    </>
  );
}

function Row({ c, onOpen }: { c: Conversation; onOpen: (id: string) => void }) {
  const o = staffById(otherOf(c));
  const l = last(c);
  const n = unreadIn(c);
  return (
    <li>
      <button onClick={() => onOpen(c.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted focus-ring">
        <Avatar name={o?.name ?? "?"} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className={cn("truncate text-sm", n ? "font-semibold" : "font-medium")}>{o?.name}</span>
            <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{l ? stamp(l.at) : ""}</span>
          </span>
          <span className="block truncate text-xs text-muted-foreground">{o?.role}</span>
          <span className="flex items-center gap-2">
            <span className={cn("truncate text-xs", n ? "text-foreground" : "text-muted-foreground")}>{l ? `${l.from === ME ? "You: " : ""}${l.text}` : "No messages yet"}</span>
            {n > 0 && <span className="ml-auto grid min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground" aria-label={`${n} unread`}>{n}</span>}
          </span>
        </span>
      </button>
    </li>
  );
}

function Picker({ onBack, onClose, onPick }: { onBack: () => void; onClose: () => void; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const list = colleagues().filter((s) => `${s.name} ${s.role}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <Header title="New message" sub="Active staff directory" onBack={onBack} onClose={onClose} />
      <SearchBox value={q} onChange={setQ} label="Search staff" />
      <ul className="flex-1 overflow-y-auto">
        {list.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No staff match.</li>}
        {list.map((s) => (
          <li key={s.id}>
            <button onClick={() => onPick(s.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted focus-ring">
              <Avatar name={s.name} />
              <span className="min-w-0"><span className="block truncate text-sm font-medium">{s.name}</span><span className="block truncate text-xs text-muted-foreground">{s.role}</span></span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function ConvView({ id, active, onBack, onClose }: { id: string; active: boolean; onBack: () => void; onClose: () => void }) {
  const conv = useChat((s) => s.convs.find((c) => c.id === id));
  const draft = useChat((s) => s.drafts[id] ?? "");
  const other = staffById(conv ? otherOf(conv) : "");
  const scroller = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const [newBelow, setNewBelow] = useState(false);
  const count = conv?.messages.length ?? 0;
  const ta = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (atBottom.current) { el.scrollTop = el.scrollHeight; setNewBelow(false); }
    else setNewBelow(true);
  }, [count]);

  useEffect(() => {
    const visible = () => active && document.visibilityState === "visible" && atBottom.current;
    if (visible()) chat.read(id);
    const f = () => visible() && chat.read(id);
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, [id, active, count]);

  if (!conv || !other) return <Header title="Conversation unavailable" sub="Staff only" onBack={onBack} onClose={onClose} />;

  const onScroll = () => {
    const el = scroller.current!;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (atBottom.current) { setNewBelow(false); chat.read(id); }
  };
  const send = () => { if (draft.trim()) { atBottom.current = true; chat.send(id, draft); ta.current?.focus(); } };

  return (
    <>
      <Header title={other.name} sub={other.role} onBack={onBack} onClose={onClose} />
      <div className="relative min-h-0 flex-1">
        <div ref={scroller} onScroll={onScroll} className="h-full space-y-1.5 overflow-y-auto px-3 py-3" aria-live="polite">
          {conv.messages.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No messages yet. Say hello to {other.name.split(" ")[0]}.</p>}
          {conv.messages.map((m, i) => {
            const mine = m.from === ME;
            const sep = i === 0 || day(conv.messages[i - 1]!.at) !== day(m.at);
            return (
              <div key={m.id}>
                {sep && <div className="my-2 text-center text-[11px] font-medium text-muted-foreground">{day(m.at)}</div>}
                <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                  <div className={cn("max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm",
                    mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted text-foreground",
                    m.state === "failed" && "opacity-70")}>{m.text}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    {time(m.at)}
                    {mine && m.state === "sending" && <><Loader2 className="size-3 animate-spin" aria-hidden /> Sending</>}
                    {mine && m.state === "sent" && <><Check className="size-3" aria-hidden /> Sent</>}
                    {mine && m.state === "failed" && (
                      <span className="flex items-center gap-1 text-destructive"><AlertCircle className="size-3" aria-hidden /> Failed ·
                        <button onClick={() => chat.retry(id, m.id)} className="font-semibold underline focus-ring">Retry</button></span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {newBelow && (
          <button onClick={() => { const el = scroller.current!; el.scrollTop = el.scrollHeight; }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-card focus-ring">New messages ↓</button>
        )}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2 border-t p-2.5">
        <textarea ref={ta} rows={1} value={draft} aria-label={`Message ${other.name}`} placeholder="Write a message…"
          onChange={(e) => chat.draft(id, e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
          className="max-h-32 min-h-9 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-ring field-sizing-content" />
        <button type="submit" disabled={!draft.trim()} aria-label="Send" className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 focus-ring"><Send className="size-4" /></button>
      </form>
    </>
  );
}
