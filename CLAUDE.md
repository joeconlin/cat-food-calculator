# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, dependency-free cat feeding calculator, live at https://calc.catrepairwoman.com. It is used by a real veterinarian **during exam visits** — the mobile flow and the printable output are the product. The calculation logic (RER/MER, meal balancing) is **vet-validated**: its outputs must be preserved exactly unless a change is explicitly vet-approved.

**Hard constraints for all work:**
1. Calculation outputs must not change (guarded by the golden-master tests).
2. The mobile experience must not regress (guarded by screenshot tests).
3. Print formatting must not regress (guarded by print screenshot tests).

Never commit directly to `main` — it auto-deploys to production via Cloudflare Pages. Work on a branch, merge via PR, and check the preview deployment on a phone before merging.

## Commands

```bash
npm test                 # full suite (golden master + screenshots)
npm run test:golden      # 111-case calc-logic regression only
npm run test:visual      # mobile/tablet/desktop + print screenshots only
npm run golden:update    # regenerate golden file — ONLY for vet-approved logic changes
npm run visual:update    # regenerate screenshot baselines — eyeball new images before committing
npx playwright test visual -g "print"   # run a single test by name
```

Tests serve the repo root with `python3 -m http.server` (configured in `playwright.config.js`) and run against the real `index.html`. There is no build step, linter, or bundler — the site deploys as-is.

## Golden-master workflow (the important rule)

`tests/golden/calc-golden.json` freezes every calculation-derived output for 111 input combinations. It is the vet-validated behavior in file form.

- A failing golden test after a refactor means the refactor is wrong. **Never regenerate the golden file to make a failing change pass.**
- Only regenerate (`npm run golden:update`) when the logic change itself is intentional and vet-approved, and say so in the commit message.
- The tests drive the app through its own share-link mechanism (`fromQuery`/`setState`), so they exercise the real production code path with no test hooks in the app.

## Architecture

Everything is in two files; there is deliberately no framework:

- **`index.html` (~2,400 lines)** — markup, critical CSS, and all application JS in one IIFE (starts around line 900). Key mechanics:
  - Core math: `RER = 70 × kg^0.75`, `MER = RER × factor`, where the factor comes from life stage × activity × body condition score (BCS 1–9).
  - A 6-step progressive wizard (`#step1`–`#step6`) whose sections toggle `display`; "vet mode" shows all steps at once.
  - **State serializes to URL query params** (`getState`/`setState`/`toQuery`/`fromQuery`) — this powers share links AND the test harness. If you add an input that affects results, add it to `getState`/`setState` and to the golden-master case matrix.
  - No localStorage, no logins, no backend.
  - Print styling and a "calorie-only summary" mode (`summaryMode=calorie-only`) are part of the output surface.
- **`extra.css`** — non-critical styles, loaded async.

Analytics: GA4 + self-hosted Matomo + Matomo Tag Manager are all wired in `<head>`; custom events push to `_mtm` (see the small script at the bottom of `index.html`). Tests block all of these domains (`tests/helpers.js`).

## Conventions and gotchas

- Images: illustrations display at 120–140px max (hidden on mobile), so keep assets near 2× display size. Optimize any new PNG with `sharp` before committing (see git history of "Phase 1 remediations" for the pattern). `calculator.png` must stay 775×775 — it is the OG image and manifest icon.
- `_headers` is Cloudflare Pages config (security headers + caching); `manifest.webmanifest` exists but there is no service worker yet.
- Screenshot tests freeze the page clock (the summary prints today's date); keep that in mind if adding date-dependent features.
- `BACKLOG.md` holds the ranked v2 feature list — add new feature ideas there rather than inventing scope.
- Branding tie-ins to catrepairwoman.com and the YouTube channel are intentional; don't remove them in cleanups.
