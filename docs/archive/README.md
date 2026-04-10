# Documentation Archive

Historical audit reports, point-in-time reviews, and one-off implementation logs
that are preserved for provenance but are **no longer part of the evergreen
documentation set**. Current docs live one level up in `docs/`.

These files should not be linked from the main README or other evergreen docs.
They exist to answer questions like *"what did the design audit in 2024 find?"*
or *"what was the state of our CI/CD pipeline before we rebuilt it?"* — not to
describe how the app works today.

## Contents

| File | Type | Covers |
|---|---|---|
| `CICD_AUDIT_REPORT.md` | Audit snapshot | Point-in-time review of GitHub Actions workflows, caching, and release pipeline. |
| `PRODUCT_READINESS_REVIEW.md` | Audit snapshot | Gate review of the app against a pre-launch readiness checklist. |
| `FINAL_IMPROVEMENTS_REPORT.md` | Implementation log | Summary of the improvements shipped in a specific release push. |
| `IMPROVEMENTS_SUMMARY.md` | Implementation log | Companion roll-up of UI + UX changes delivered in the same window. |
| `DESIGN_AUDIT_360.md` | Audit snapshot | 360° design audit covering IA, typography, colour, spacing, motion. |
| `DESIGN_AUDIT_IMPLEMENTATION.md` | Implementation log | Execution notes tying design-audit findings to code changes. |
| `CONSOLE_OUTPUT_FIXES.md` | Implementation log | Cleanup of noisy `console.*` output identified during a previous review. |
| `SPATIAL_AUDIT_REPORT.md` | Audit snapshot | Layout and spacing audit across breakpoints. |
| `UX_UI_AUDIT_REPORT.md` | Audit snapshot | Broad UX/UI review surfacing interaction and clarity issues. |
| `XSS_AUDIT_REPORT.md` | Audit snapshot | Point-in-time XSS / injection surface review of the client. |
| `ZOOM_FIX_100_PERCENT.md` | Implementation log | Root-cause and fix notes for a zoom-level regression. |
| `STICKY_FOOTER_FIX.md` | Implementation log | Layout fix notes for the sticky footer behaviour. |
| `UI_IMPROVEMENT_PLAN.md` | Plan snapshot | Historical UI improvement plan, superseded by `docs/ROADMAP.md`. |

## Why keep these?

Audit snapshots and one-off reports have real value as a historical record of
what the project looked like at a given moment and which problems were chosen
to be solved — but they're lossy as *living documentation* because they drift
the moment the codebase changes. Archiving them keeps the evergreen docs set
small and trustworthy while leaving the audit trail intact.

If you need current information, start from `docs/README.md` instead.
