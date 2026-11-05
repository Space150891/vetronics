# Roadmap — Develop Concept B (Connected Care) across the portal

Presentation-only pass. No functional/data file changes (fixtures, store, schedule, visits, staff-chat stay untouched).

- [ ] Extract Concept B tokens from design-review.css into the global theme (src/styles.css), light + dark
- [ ] Load Source Sans 3 via <link> in __root.tsx head; set font tokens
- [ ] Restyle shared frame (AppShell): node-dot active nav, pale blue sidebar, header, mobile nav
- [ ] Restyle Front Desk: connected-node stage headers, calmer cards, scanning improvements
- [ ] Restyle Patient Scheduling + shared calendar components (calendar.tsx): alignment, hierarchy, closures/breaks/booked distinguishable
- [ ] Restyle Patients & Visit Notes: selected-row treatment, table↔panel relationship, note editor styling
- [ ] Kit primitives (kit.tsx): buttons, fields, badges, dialogs, drawers, tabs, empty states — Concept B tokens
- [ ] Extend /design-review: before/after, component-state overview, design decisions, open questions
- [ ] Verify: front desk journey, calendar nav/filter, patient select + note save/resume, sidebar persistence, desktop/tablet/phone, keyboard, contrast
- [ ] Run existing tests; confirm no functional/data files changed (diff check)
- [ ] Update AGENTS.md architecture note if structure changed
