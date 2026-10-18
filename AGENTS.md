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
