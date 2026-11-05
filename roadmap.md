# Roadmap — Connected Care client evaluation

- [x] Refine Front Desk visit hierarchy without hiding critical information.
- [x] Compact Patient Scheduling controls and make short visits readable at their true duration.
- [x] Align Appointments summaries and refine patient records / visit history.
- [x] Unify appointment status presentation and clinic date display.
- [x] Verify desktop/tablet layout, keyboard focus, interactions and existing tests (15 existing tests + date presentation test pass; note refresh, booking, check-in, patient dialog and navigation pass).

## Previous presentation pass

Presentation-only pass. No functional/data file changes (fixtures, store, schedule, visits, staff-chat stay untouched).

- [x] Extract Concept B tokens from design-review.css into the global theme (src/styles.css), light + dark
- [x] Load Source Sans 3 via <link> in __root.tsx head; set font tokens
- [x] Restyle shared frame (AppShell): node-dot active nav, pale blue sidebar, header, mobile nav
- [x] Restyle Front Desk: connected-node stage headers, calmer cards, scanning improvements
- [x] Restyle Patient Scheduling + shared calendar components (calendar.tsx): tokens, radii, selected-day ring
- [x] Restyle Patients & Visit Notes: selected-row treatment (stronger accent + inset bar)
- [x] Kit primitives (kit.tsx): card radius aligned to 10px system
- [x] Extend /design-review: applied/before views, component-state overview, design decisions, open questions
- [x] Verify: front desk journey (check-in 7→6), patient pop-up open/Escape, scheduling + patients render, sidebar persists, phone 390px no overflow, no page errors
- [x] Run existing tests (15/15 pass); build OK; only presentation files changed (styles.css, __root, AppShell, index, kit, calendar, ListDetail, design-review)
- [x] Update AGENTS.md architecture note
