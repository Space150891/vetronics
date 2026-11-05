# Roadmap — Develop Concept B (Connected Care) across the portal

Presentation-only pass. No functional/data file changes (fixtures, store, schedule, visits, staff-chat stay untouched).

- [x] Extract Concept B tokens from design-review.css into the global theme (src/styles.css), light + dark
- [x] Load Source Sans 3 via <link> in __root.tsx head; set font tokens
- [x] Restyle shared frame (AppShell): node-dot active nav, pale blue sidebar, header, mobile nav
- [x] Restyle Front Desk: connected-node stage headers, calmer cards, scanning improvements
- [x] Restyle Patient Scheduling + shared calendar components (calendar.tsx): tokens, radii, selected-day ring
- [x] Restyle Patients & Visit Notes: selected-row treatment (stronger accent + inset bar)
- [x] Kit primitives (kit.tsx): card radius aligned to 10px system
- [x] Extend /design-review: applied/before views, component-state overview, design decisions, open questions
- [ ] Verify: front desk journey, calendar nav/filter, patient select + note save/resume, sidebar persistence, desktop/tablet/phone, keyboard, contrast
- [ ] Run existing tests; confirm no functional/data files changed (diff check)
- [ ] Update AGENTS.md architecture note if structure changed
