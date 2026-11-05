<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Frontend-only prototype: all data lives in `src/lib/fixtures.ts` / `src/lib/patient-data.ts` and the localStorage store `src/lib/store.ts` — no backend, so both portals share one source of truth.
- Store selectors passed to `useStore` must return stable references (no `?? []` inside the selector) — new objects cause render loops.
- Provider pages render inside `AppShell`; `/patient/*` and `/invite-email` bypass it in `__root.tsx` and use the phone-first `patient.tsx` layout.
- Shared UI primitives live in `src/components/kit.tsx`; patient-specific helpers in `src/components/patient-ui.tsx`.
- Scheduling rules (bookable time, utilisation, conflicts, free slots) are pure functions in `src/lib/schedule.ts`; both scheduling pages and their calendar UI (`src/components/calendar.tsx`) derive everything from store data so the two calendars never disagree.
- Internal staff chat (`src/lib/staff-chat.ts`, `StaffChat.tsx`) is a separate store from patient messaging; it is demo-only (local persistence, simulated replies, "/fail" prefix simulates a failed send) — real delivery and access enforcement need a backend.
- Visit notes are `encounters` in the store keyed by appointment id (one note per visit); note status (`src/lib/visits.ts`) is derived separately from appointment status. The note editor is a single free-text field because the clinic's real template hasn't been supplied.
- The production theme is the "Connected Care" direction: tokens in `src/styles.css` (pale blue canvas #F2F7FC, primary #1267D6, teal #147D85, Source Sans 3), node-dot active nav in `AppShell`, numbered node stage headers on the Front Desk. Presentation only — no functional/data files were changed for it.
- `/design-review` is a dev-only concept gallery: all concept styles live scoped under `.dr-a`/`.dr-b` in `src/components/design-review.css` (loaded only by that route), its concept previews are read-only/inert, and its "Applied" view embeds the live portal in an iframe (a nested router was rejected — it re-renders the document shell and recurses on the browser URL).
