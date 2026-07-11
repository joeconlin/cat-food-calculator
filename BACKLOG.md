# Feature Backlog

Ideas for future versions, roughly ranked by value-per-risk. The hard constraints for
all work: (1) the vet-validated calculation logic must not change, (2) the mobile
exam-room experience must not regress, (3) print formatting must not regress.

## High priority

- **Offline support (service worker).** Exam rooms have unreliable Wi-Fi. A service
  worker makes the app load instantly with no connection and makes the existing
  `manifest.webmanifest` a genuinely installable PWA for clinic tablets.
- **QR code on the printout.** State already serializes to the share-link URL; render
  it as a QR code on the printed plan so the owner scans it at home and gets the same
  plan interactive on their phone. Bridges exam room → home, drives site traffic.
- **Visual BCS selector.** Replace the 1–9 dropdown with an illustrated silhouette
  picker (like exam-room wall charts). Biggest UX win for lay users; existing Kara
  cartoon assets fit here.
- **Treat budget line.** Show the standard "treats ≤ 10% of daily calories" number in
  the plan and on the printout. Cheap, high perceived value, no new logic risk.
- **Methodology / E-E-A-T page.** "Built on RER × AAHA/AAFP life-stage factors,
  reviewed by Dr. Kara Caldwell, DVM — last reviewed [date]." Biggest trust and SEO
  asset; currently invisible.

## Medium priority

- **Printout as a proper medical handout.** Target weight + safe-loss timeline,
  recheck date line, blank space for handwritten vet notes, calculator version stamp
  for traceability.
- **True multi-cat flow.** Meta description promises multi-cat households; add
  "add another cat" repeat flow with combined printout.
- **Kcal-density label helper.** Illustrated "where to find kcal/can on the label"
  guide, or a handful of Dr. Caldwell–curated common-food presets. (Deliberately NOT
  a full food database — maintenance burden and liability.)
- **Guardrails on high-risk cases.** Kitten, pregnant, BCS 1–3, or extreme weights
  trigger a clear "this plan needs direct vet supervision" callout.
- **Embed the YouTube video on-page** instead of only linking out; consider an
  embeddable iframe version of the calculator for other cat sites/clinics (backlinks).
- **Consolidate analytics.** GA4 + Matomo + Matomo Tag Manager is three trackers doing
  one job; pick one, define the funnel (step completion, print/share rate), and check
  EU consent obligations.

## Lower priority / operational

- **Uptime monitoring** with alerting — a vet opening a dead page mid-appointment is
  the worst failure mode.
- **Accessibility pass.** Larger touch targets, contrast, black-and-white-friendly
  printout (many clinics print mono).
- **Design/UX v2** (bigger redesign) — only after golden-master + screenshot tests
  are established; keep the site static/no-build.

## Done

- Golden-master regression tests for calculation logic (Playwright).
- Screenshot regression for mobile layout and print output (Playwright).
- Phase 1 invisible wins: image compression, remove dead assets, remove stray
  `back_to_spaceship.js`, `_headers` hardening.
