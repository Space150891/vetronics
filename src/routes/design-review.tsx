import { createFileRoute } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Bell, CheckCircle2, Clock, Flag, LogIn, MessageSquare, Plus, Receipt, UserCircle2, X,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { NAV } from "@/components/AppShell";
import { CLINIC, CURRENT_USER, PROVIDERS, isoDate, nums, patientById, providerById, type Appointment } from "@/lib/fixtures";
import { INVOICES, usd } from "@/lib/patient-data";
import { stageOf, useStore, type Stage } from "@/lib/store";
import { cn } from "@/lib/utils";
import "../components/design-review.css";

export const Route = createFileRoute("/design-review")({
  head: () => ({
    meta: [
      { title: "Design review · Vectronics" },
      { name: "description", content: "Internal design exploration: two visual concepts for the Vectronics Provider Portal." },
      { name: "robots", content: "noindex" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Sans+3:wght@400;600;700;800&display=swap",
      },
    ],
  }),
  component: DesignReview,
});

/* "Current" embeds the real Front Desk page in an iframe — fully isolated, zero coupling,
   and always shows the production screen exactly as it is. */

type View = "applied" | "a" | "b" | "notes";
const VIEWS: { key: View; label: string }[] = [
  { key: "applied", label: "Applied — live portal" },
  { key: "a", label: "Concept A — Editorial Precision" },
  { key: "b", label: "Concept B — Connected Care (selected)" },
  { key: "notes", label: "Decisions & states" },
];

function DesignReview() {
  const [view, setView] = useState<View>("applied");
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 flex flex-wrap items-center gap-3 border-b bg-card px-4 py-2.5">
        <span className="text-[13px] font-bold uppercase tracking-wide text-muted-foreground">Design review</span>
        <div role="tablist" aria-label="Concept" className="flex flex-wrap gap-1 rounded-lg border p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              role="tab"
              aria-selected={view === v.key}
              onClick={() => setView(v.key)}
              className={cn(
                "h-8 rounded-md px-3 text-[13px] font-semibold focus-ring",
                view === v.key ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">Concept boards are inert — actions there never change demo data.</span>
      </div>
      {view === "applied" ? (
        <iframe src="/" title="Live portal with Connected Care applied" className="h-[calc(100vh-53px)] w-full border-0" />
      ) : view === "notes" ? (
        <DecisionsPanel />
      ) : (
        <ConceptBoard variant={view} />
      )}
    </div>
  );
}

/* ---------- Decisions, component states, open questions ---------- */
const DECISIONS: [string, string][] = [
  ["Palette", "Pale blue canvas (#F2F7FC) with white panels, vivid blue (#1267D6) for actions and active states, quiet teal (#147D85) as the secondary accent. Clinical status colours are unchanged — blue/teal never compete with warning or danger."],
  ["Connected-node wayfinding", "The logo's node motif marks position: a ringed node on the active sidebar item, and numbered nodes joined by a hairline across the four Front Desk stages. It marks state and sequence only — never background decoration."],
  ["Typography", "Source Sans 3 throughout, tabular numerals for times, counts and money so columns of figures align. Headings use tight tracking; body density is unchanged."],
  ["Surfaces and density", "10px panels, 8px buttons, hairline borders and minimal elevation. Visit cards gained a top rule separating the action from the content, and times moved into tinted chips so they scan as a column."],
  ["Sidebar", "The dark navy rail became a pale blue rail with a white active pill and node marker, matching the concept. Dark mode keeps a dark rail deliberately."],
];

const BEFORE_AFTER: [string, string, string][] = [
  ["Shared frame", "Dark navy sidebar, solid blue active pill, Figtree.", "Pale blue sidebar, white active pill with a node dot on the rail edge, Source Sans 3."],
  ["Front Desk", "Plain column titles with counts; floating cards; bare time text.", "Numbered stage nodes joined by a connecting line; time chips aligned right; actions separated by a top rule."],
  ["Patient Scheduling", "Default tokens, rounded-xl strips.", "Same structure and rules; tokens, radii and selected-day ring now match the system."],
  ["Patients & Visit Notes", "Selected row: faint accent wash.", "Selected row: stronger accent wash with a 3px primary inset bar; panel relationship unchanged."],
];

const COMPONENT_STATES: [string, string][] = [
  ["Buttons", "Primary (blue), outline, ghost, link, danger; loading spinner; disabled-with-reason shows a tooltip explaining why."],
  ["Fields", "Default, focus (2px blue ring), error (red border + role=alert message), disabled. Labels, hints and errors unchanged."],
  ["Badges & statuses", "Six tones (info, success, warning, danger, teal, neutral); every status keeps its text label and dot icon — colour is never the only signal."],
  ["Tabs & filters", "Segmented tabs with counts; selected tab is filled blue with white text."],
  ["Tables", "Hover wash, keyboard focus ring with inset bar, selected row with primary inset bar."],
  ["Dialogs & drawers", "White surfaces, hairline borders, soft elevation; focus returns to the triggering element on close."],
  ["Empty states", "Dashed panel with icon, title and guidance — e.g. \"Nobody here\" on empty board columns."],
];

const OPEN_QUESTIONS: string[] = [
  "Should the patient portal inherit the Connected Care palette, or keep its own calmer patient-facing look?",
  "Staff-chat launcher and panel still use the old visual weight — restyle to match, or leave until messaging becomes real?",
  "Mobile navigation is still a native select; a slide-over drawer would match the node wayfinding better but is a functional change.",
  "Dark mode keeps a dark sidebar by choice — confirm that split is intended.",
];

function DecisionsPanel() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Connected Care — applied</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Concept B is now the portal's design system. This pass changed presentation only: tokens, fonts, navigation treatment and screen styling. No data, logic, routes or workflows were touched.
      </p>

      <section aria-labelledby="dr-ba" className="mt-8">
        <h2 id="dr-ba" className="mb-3 text-[15px] font-bold">Before / after</h2>
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b bg-surface px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Screen</th>
                <th className="border-b bg-surface px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Before</th>
                <th className="border-b bg-surface px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">After</th>
              </tr>
            </thead>
            <tbody>
              {BEFORE_AFTER.map(([s, b, aft]) => (
                <tr key={s}>
                  <td className="border-b px-3 py-2 align-top font-semibold">{s}</td>
                  <td className="border-b px-3 py-2 align-top text-muted-foreground">{b}</td>
                  <td className="border-b px-3 py-2 align-top">{aft}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Compare live: "Applied" shows the new design; the Concept A and B boards preserve the exploration for reference.</p>
      </section>

      <section aria-labelledby="dr-dec" className="mt-8">
        <h2 id="dr-dec" className="mb-3 text-[15px] font-bold">Design decisions</h2>
        <dl className="space-y-3">
          {DECISIONS.map(([k, v]) => (
            <div key={k} className="rounded-lg border bg-card p-4">
              <dt className="text-[13px] font-bold">{k}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="dr-states" className="mt-8">
        <h2 id="dr-states" className="mb-3 text-[15px] font-bold">Component states</h2>
        <dl className="space-y-3">
          {COMPONENT_STATES.map(([k, v]) => (
            <div key={k} className="rounded-lg border bg-card p-4">
              <dt className="text-[13px] font-bold">{k}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="dr-open" className="mt-8 pb-16">
        <h2 id="dr-open" className="mb-3 text-[15px] font-bold">Open questions</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          {OPEN_QUESTIONS.map((q) => <li key={q}>{q}</li>)}
        </ul>
      </section>
    </div>
  );
}

/* ---------- Shared data helpers (read-only) ---------- */
type BoardStage = Exclude<Stage, "done">;
const COLUMNS: { key: BoardStage; title: string; sub: string }[] = [
  { key: "expected", title: "Expected", sub: "Booked for today, not arrived yet." },
  { key: "waiting", title: "Waiting", sub: "Arrived. Send them back when their provider's free." },
  { key: "with_provider", title: "With provider", sub: "In the room now." },
  { key: "checkout", title: "Ready to check out", sub: "Finished. Settle the bill and book anything next." },
];
const fmtSlot = (t: string) => {
  const [h, m] = nums(t, ":");
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const mins = (iso: string | undefined, now: number | null) =>
  iso && now ? Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000)) : null;
const balanceFor = (patientId: string) => INVOICES.filter((i) => i.patientId === patientId && i.status !== "Paid");
const PREVIEW_HINT = "Preview only — no changes saved";

function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const NOTES: Record<"a" | "b", { identity: string; usability: string; extends: string }> = {
  a: {
    identity:
      "A carefully organised clinical workspace: warm paper canvas, graphite type and one restrained cobalt. The identity comes from typography, thin rules and precise alignment rather than decoration.",
    usability:
      "Continuous ruled columns read like a ledger — names, times and statuses share one grid, so scanning a busy queue is faster than scanning floating cards. Tabular numerals keep times and counts aligned; small radii and flat surfaces reduce visual noise.",
    extends:
      "Calendars become ruled grids with the same hairlines and tabular times; patient records become document-style sheets with strong name hierarchy and section rules. The same tokens cover both without new components.",
  },
  b: {
    identity:
      "Architectural wayfinding built on the logo's connected-node idea: pale blue surfaces, a vivid blue rail and a quiet teal. A connecting line links the four stage markers, mirroring the visit sequence in the brand mark.",
    usability:
      "Stage headers are distinct zones with node markers, so position in the workflow is legible at a glance. Compact panels group metadata tightly and keep actions separated; the active navigation node makes the current section unmissable.",
    extends:
      "Calendars adopt the node motif for busy/free markers along the same connecting line; patient records group details into zoned panels with the same headers. The motif stays functional — it marks state and sequence, never background decoration.",
  },
};

/* ---------- Concept board ---------- */
function ConceptBoard({ variant }: { variant: "a" | "b" }) {
  const appts = useStore((s) => s.appts);
  const now = useNow();
  const today = isoDate(new Date());
  const [provider, setProvider] = useState("all");
  const [patientId, setPatientId] = useState<string | null>(null);
  const a = variant === "a";
  const notes = NOTES[variant];

  const byStage = useMemo(() => {
    const out: Record<BoardStage, Appointment[]> = { expected: [], waiting: [], with_provider: [], checkout: [] };
    appts
      .filter((x) => x.date === today && (provider === "all" || x.providerId === provider))
      .sort((x, y) => x.time.localeCompare(y.time))
      .forEach((x) => {
        const s = stageOf(x);
        if (s !== "done") out[s].push(x);
      });
    return out;
  }, [appts, today, provider]);

  return (
    <div className={cn("dr-shell", a ? "dr-a" : "dr-b")}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={cn(
            "sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r md:flex",
            a ? "border-[var(--dr-line)] bg-[var(--dr-surface)]" : "border-[var(--dr-line)] bg-[#eaf2fa]",
          )}
        >
          <div className="border-b border-[var(--dr-line)] px-4 pb-4 pt-5">
            <div className="flex items-center gap-2.5">
              <BrandMark className={cn("size-8", a ? "text-[#1769d2]" : "text-[#1267d6]")} />
              <span className="text-[19px] font-extrabold tracking-tight">Vectronics</span>
            </div>
            <p className="mt-1.5 text-[13px] font-medium text-[var(--dr-muted)]">Provider Portal</p>
          </div>
          <nav aria-label="Main (preview)" className="flex-1 space-y-0.5 overflow-y-auto p-2.5">
            {NAV.map((n) => {
              const active = n.to === "/";
              return (
                <span
                  key={n.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2.5 px-3 py-2 text-[14px] font-medium",
                    a ? "rounded-md" : "rounded-lg",
                    active
                      ? a
                        ? "bg-[color-mix(in_srgb,var(--dr-accent)_8%,var(--dr-surface))] font-semibold text-[var(--dr-accent)]"
                        : "bg-[var(--dr-surface)] font-semibold text-[var(--dr-accent)] shadow-sm"
                      : "text-[var(--dr-ink)]",
                  )}
                >
                  {active && (
                    a ? (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[var(--dr-accent)]" aria-hidden />
                    ) : (
                      <span className="absolute -left-2.5 size-2.5 rounded-full border-2 border-[var(--dr-accent)] bg-[var(--dr-surface)]" aria-hidden />
                    )
                  )}
                  <n.icon className="size-[18px] shrink-0" aria-hidden />
                  <span className="truncate">{n.label}</span>
                </span>
              );
            })}
          </nav>
          <div className="border-t border-[var(--dr-line)] px-4 py-3 text-xs text-[var(--dr-muted)]">
            {CLINIC.name}
            <br />
            {CLINIC.location}
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--dr-line)] bg-[var(--dr-surface)] px-4 lg:px-6">
            <span className="hidden text-sm font-semibold lg:inline">{CLINIC.name}</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-1.5 text-[13px] font-medium text-[var(--dr-muted)] sm:flex">
                <CheckCircle2 className="size-4 text-[var(--dr-teal)]" aria-hidden /> Saved locally
              </span>
              <button
                title={PREVIEW_HINT}
                aria-label="Notifications, 2 unread (preview)"
                className="relative inline-flex size-9 items-center justify-center rounded-lg border border-[var(--dr-line)] bg-[var(--dr-surface)]"
              >
                <Bell className="size-4" />
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#c2410c] text-[10px] font-bold text-white">2</span>
              </button>
              <button
                title={PREVIEW_HINT}
                aria-label="Staff chat (preview)"
                className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--dr-line)] bg-[var(--dr-surface)]"
              >
                <MessageSquare className="size-4" />
              </button>
              <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--dr-line)] bg-[var(--dr-surface)] px-2.5 text-sm font-semibold">
                <UserCircle2 className="size-4 text-[var(--dr-accent)]" aria-hidden />
                <span className="hidden sm:inline">{CURRENT_USER.name}</span>
              </span>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 pb-16 pt-5 lg:px-6">
            <div className="mx-auto max-w-[1600px]">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Front desk</h1>
                  <p className="text-sm text-[var(--dr-muted)]">Today's visits, from the door to the till.</p>
                </div>
                <button className="dr-btn" title={PREVIEW_HINT}>
                  <Plus className="size-4" aria-hidden /> Book appointment
                </button>
              </div>

              <div className="mb-4">
                <select
                  aria-label="Provider"
                  className="dr-input w-52"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                >
                  <option value="all">All providers</option>
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Board */}
              <div className={cn("grid gap-4 lg:grid-cols-4", !a && "relative")}>
                {!a && (
                  <span
                    aria-hidden
                    className="absolute left-0 right-0 top-[13px] hidden h-px bg-[var(--dr-line)] lg:block"
                  />
                )}
                {COLUMNS.map((c, ci) => (
                  <section key={c.key} aria-labelledby={`dr-col-${variant}-${c.key}`} className="min-w-0">
                    <div className="mb-2 px-1">
                      {a ? (
                        <>
                          <div className="flex items-baseline justify-between gap-2 border-b-2 border-[var(--dr-ink)] pb-1.5">
                            <h2 id={`dr-col-${variant}-${c.key}`} className="text-[15px] font-semibold">{c.title}</h2>
                            <span className="text-sm tabular-nums text-[var(--dr-muted)]" aria-label={`${byStage[c.key].length} visits`}>
                              {byStage[c.key].length}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[var(--dr-muted)]">{c.sub}</p>
                        </>
                      ) : (
                        <>
                          <div className="relative flex items-center gap-2">
                            <span
                              className="relative z-10 grid size-[26px] shrink-0 place-items-center rounded-full border-2 border-[var(--dr-accent)] bg-[var(--dr-surface)] text-[11px] font-bold text-[var(--dr-accent)]"
                              aria-hidden
                            >
                              {ci + 1}
                            </span>
                            <h2 id={`dr-col-${variant}-${c.key}`} className="text-[15px] font-bold">{c.title}</h2>
                            <span className="ml-auto text-sm tabular-nums text-[var(--dr-muted)]" aria-label={`${byStage[c.key].length} visits`}>
                              {byStage[c.key].length}
                            </span>
                          </div>
                          <p className="mt-1 pl-[34px] text-xs text-[var(--dr-muted)]">{c.sub}</p>
                        </>
                      )}
                    </div>
                    <ul className={cn(a ? "space-y-0 divide-y divide-[var(--dr-line)] border-y border-[var(--dr-line)]" : "space-y-2")}>
                      {byStage[c.key].length === 0 && (
                        <li className={cn("px-3 py-4 text-center text-sm text-[var(--dr-muted)]", !a && "rounded-[10px] border border-dashed border-[var(--dr-line)]")}>
                          Nobody here
                        </li>
                      )}
                      {byStage[c.key].map((appt) => (
                        <DrCard key={appt.id} a={a} appt={appt} now={now} onPatient={() => setPatientId(appt.patientId)} />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>

              {/* UI sample */}
              <section aria-labelledby="dr-kit" className="mt-10">
                <h2 id="dr-kit" className="mb-3 text-[15px] font-bold">Interface sample</h2>
                <div className="dr-panel dr-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button className="dr-btn">Primary action</button>
                    <button className="dr-btn dr-btn-outline">Secondary</button>
                    <button className="dr-btn" disabled>Disabled</button>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--dr-line)] bg-[color-mix(in_srgb,var(--dr-accent)_8%,var(--dr-surface))] px-2 py-0.5 text-xs font-semibold text-[var(--dr-accent)]">
                      <span className="size-1.5 rounded-full bg-[var(--dr-accent)]" aria-hidden /> Scheduled
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--dr-line)] bg-[color-mix(in_srgb,var(--dr-teal)_10%,var(--dr-surface))] px-2 py-0.5 text-xs font-semibold text-[var(--dr-teal)]">
                      <span className="size-1.5 rounded-full bg-[var(--dr-teal)]" aria-hidden /> Arrived
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-[#e7c88f] bg-[#fdf6e7] px-2 py-0.5 text-xs font-semibold text-[#8a5a00]">
                      <span className="size-1.5 rounded-full bg-[#b97a00]" aria-hidden /> In room
                    </span>
                  </div>
                  <div className="mt-3 grid max-w-md gap-2">
                    <input className="dr-input" placeholder="Search patients" aria-label="Sample input" />
                    <input className="dr-input" defaultValue="Focused state" aria-label="Sample input focused" autoFocus={false} />
                  </div>
                </div>
              </section>

              {/* Review notes */}
              <section aria-labelledby="dr-notes" className="mt-10 max-w-3xl">
                <h2 id="dr-notes" className="mb-3 text-[15px] font-bold">Review notes</h2>
                <dl className="space-y-3">
                  {([
                    ["The identity it expresses", notes.identity],
                    ["Practical usability improvements", notes.usability],
                    ["How it extends to calendars and patient records", notes.extends],
                  ] as const).map(([k, v]) => (
                    <div key={k} className="dr-panel dr-card p-4">
                      <dt className="text-[13px] font-bold">{k}</dt>
                      <dd className="mt-1 text-sm leading-relaxed text-[var(--dr-muted)]">{v}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>
          </main>
        </div>
      </div>

      <DrPatientDialog variant={variant} patientId={patientId} onClose={() => setPatientId(null)} />
    </div>
  );
}

/* ---------- Visit card ---------- */
function DrCard({ a, appt, now, onPatient }: { a: boolean; appt: Appointment; now: number | null; onPatient: () => void }) {
  const p = patientById(appt.patientId);
  const pr = providerById(appt.providerId);
  const stage = stageOf(appt);
  const wait = stage === "waiting" ? mins(appt.arrivedAt, now) : null;
  const owed = stage === "checkout" ? balanceFor(appt.patientId).reduce((n, i) => n + i.amount, 0) : 0;

  const action =
    stage === "expected" ? (
      <button className="dr-btn" title={PREVIEW_HINT}><LogIn className="size-4" aria-hidden /> Check in</button>
    ) : stage === "waiting" ? (
      <button className="dr-btn" title={PREVIEW_HINT}><ArrowRight className="size-4" aria-hidden /> Send to provider</button>
    ) : stage === "with_provider" ? (
      <button className="dr-btn" title={PREVIEW_HINT}><Receipt className="size-4" aria-hidden /> Ready for checkout</button>
    ) : (
      <button className="dr-btn" title={PREVIEW_HINT}><Receipt className="size-4" aria-hidden /> Open checkout</button>
    );

  const badges = (
    <>
      {wait !== null && (
        <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-semibold",
          wait > 20 ? "border-[#e7c88f] bg-[#fdf6e7] text-[#8a5a00]" : "border-[var(--dr-line)] bg-[color-mix(in_srgb,var(--dr-teal)_10%,var(--dr-surface))] text-[var(--dr-teal)]")}>
          <Clock className="size-3.5" aria-hidden /> Waiting {wait} min
        </span>
      )}
      {appt.status === "ready" && (
        <span className="inline-flex items-center rounded-md border border-[var(--dr-line)] bg-[color-mix(in_srgb,var(--dr-teal)_10%,var(--dr-surface))] px-1.5 py-0.5 text-xs font-semibold text-[var(--dr-teal)]">Ready</span>
      )}
      {owed > 0 && (
        <span className="inline-flex items-center rounded-md border border-[#e7c88f] bg-[#fdf6e7] px-1.5 py-0.5 text-xs font-semibold text-[#8a5a00]">Balance {usd(owed)}</span>
      )}
      {p.flags.map((f) => (
        <span key={f} className="inline-flex items-center gap-1 rounded-md border border-[var(--dr-line)] px-1.5 py-0.5 text-xs font-medium text-[var(--dr-muted)]">
          <Flag className="size-3.5" aria-hidden /> {f}
        </span>
      ))}
    </>
  );

  if (a) {
    /* Concept A: ruled ledger row, not a floating card. */
    return (
      <li className="bg-[var(--dr-surface)] px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <button onClick={onPatient} className="min-w-0 truncate text-left text-[15px] font-bold text-[var(--dr-ink)] underline decoration-[var(--dr-line)] underline-offset-4 hover:decoration-[var(--dr-accent)]">
            {p.name}
          </button>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--dr-ink)]">{fmtSlot(appt.time)}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-[var(--dr-muted)]">{pr.name} · {appt.type} · {appt.room}</p>
        <div className="mt-1.5 flex flex-wrap gap-1">{badges}</div>
        <div className="mt-2">{action}</div>
      </li>
    );
  }
  /* Concept B: compact zoned panel. */
  return (
    <li className="dr-card border border-[var(--dr-line)] bg-[var(--dr-surface)] p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <button onClick={onPatient} className="min-w-0 truncate text-left text-[15px] font-bold text-[var(--dr-accent)] hover:underline">
          {p.name}
        </button>
        <span className="shrink-0 rounded-md bg-[color-mix(in_srgb,var(--dr-accent)_8%,var(--dr-surface))] px-1.5 py-0.5 text-sm font-bold tabular-nums text-[var(--dr-accent)]">
          {fmtSlot(appt.time)}
        </span>
      </div>
      <p className="mt-0.5 truncate text-xs text-[var(--dr-muted)]">{pr.name} · {appt.type} · {appt.room}</p>
      <div className="mt-1.5 flex flex-wrap gap-1">{badges}</div>
      <div className="mt-2.5 border-t border-[var(--dr-line)] pt-2.5">{action}</div>
    </li>
  );
}

/* ---------- Patient information pop-up (preview) ---------- */
function DrPatientDialog({ variant, patientId, onClose }: { variant: "a" | "b"; patientId: string | null; onClose: () => void }) {
  const appts = useStore((s) => s.appts);
  const p = patientId ? patientById(patientId) : null;
  const visits = p
    ? appts.filter((x) => x.patientId === p.id).sort((x, y) => (y.date + y.time).localeCompare(x.date + x.time))
    : [];
  return (
    <Dialog.Root open={!!p} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/25" />
        <Dialog.Content
          className={cn(
            "dr-shell fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col border border-[var(--dr-line)] bg-[var(--dr-surface)] text-[var(--dr-ink)] focus:outline-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[400px] sm:-translate-x-1/2 sm:-translate-y-1/2",
            variant === "a" ? "dr-a rounded-t-lg sm:rounded-md" : "dr-b rounded-t-2xl sm:rounded-xl shadow-xl",
          )}
        >
          {p && (
            <>
              <div className="flex items-center justify-between border-b border-[var(--dr-line)] px-5 py-3.5">
                <Dialog.Title className="text-lg font-bold">{p.name}</Dialog.Title>
                <Dialog.Description className="sr-only">Patient information and visits (preview)</Dialog.Description>
                <Dialog.Close aria-label="Close" className="grid size-8 place-items-center rounded-md hover:bg-[color-mix(in_srgb,var(--dr-accent)_8%,var(--dr-surface))]">
                  <X className="size-4" />
                </Dialog.Close>
              </div>
              <div className="space-y-4 overflow-y-auto px-5 py-4">
                <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-sm">
                  {([
                    ["DOB", p.dob],
                    ["MRN", p.mrn],
                    ["Phone", p.phone],
                    ["Insurance", p.insurance],
                  ] as const).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-[var(--dr-muted)]">{k}</dt>
                      <dd className="min-w-0 font-medium">{v}</dd>
                    </div>
                  ))}
                  <dt className="text-[var(--dr-muted)]">Indicators</dt>
                  <dd className="min-w-0 font-medium">
                    {p.flags.length ? (
                      <span className="flex flex-wrap gap-1">
                        {p.flags.map((f) => (
                          <span key={f} className="inline-flex items-center gap-1 rounded-md border border-[var(--dr-line)] px-1.5 py-0.5 text-xs font-medium">
                            <Flag className="size-3.5" aria-hidden /> {f}
                          </span>
                        ))}
                      </span>
                    ) : (
                      "None on file"
                    )}
                  </dd>
                </dl>
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--dr-muted)]">Visits</h3>
                  <ul className="space-y-1.5">
                    {visits.length === 0 && <li className="text-sm text-[var(--dr-muted)]">No visits on file.</li>}
                    {visits.map((v) => (
                      <li key={v.id} className="flex items-center justify-between gap-2 rounded-md border border-[var(--dr-line)] px-3 py-2 text-sm">
                        <span className="min-w-0">
                          <span className="font-medium tabular-nums">{v.date}</span> · {v.type}
                          <span className="block truncate text-xs text-[var(--dr-muted)]">{providerById(v.providerId).name}</span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-[var(--dr-muted)]">{v.status.replace("_", " ")}</span>
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
