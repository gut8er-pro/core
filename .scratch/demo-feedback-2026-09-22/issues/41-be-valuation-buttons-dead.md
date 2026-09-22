# 41 — BE Valuation: Quick/Detail Valuation buttons have no onClick

Status: ready-for-agent
Type: bug
Severity: medium

Found while fixing ticket 23: the two green buttons in `ValuationSection` (BE reports only —
Quick Valuation / Detail Valuation) are plain `<button>` elements with no handler at all. Same
dead-control class as audit 06. They presumably belong to the DAT valuation flow, so wiring
them needs DAT-credential work; until then they must either do something honest (open the DAT
modal / show the "connect DAT first" hint like the correction card now does) or not render.
