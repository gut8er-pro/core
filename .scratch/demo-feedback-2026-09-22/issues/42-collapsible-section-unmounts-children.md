# 42 — CollapsibleSection unmounts collapsed children, so their effects never run

Status: ready-for-agent
Type: bug (latent, systemic)
Severity: medium

Found while fixing ticket 20: `CollapsibleSection` renders children inside a Radix
`AccordionContent` without `forceMount`, so a collapsed-by-default section's children are
UNMOUNTED — any effect that creates data, registers fields or seeds defaults simply never runs
until a human expands the card. The Tires auto-create was the first victim (fixed with a
client-side placeholder); the hazard is general.

Direction: audit the other collapsed-by-default sections (prior damage, opponent, visits,
expert opinion, signatures) for effects/registrations that assume they mount, and either give
`CollapsibleSection` an opt-in `forceMount` (render hidden, keep mounted) for those, or move
the data-seeding effects up to the page level where they always run.
