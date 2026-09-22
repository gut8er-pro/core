# 11 — "Empfohlene Fotos" panel text layout broken

Status: ready-for-agent
Type: bug
Severity: low

Client note "after generating report — text not in place", with a screenshot of the Empfohlene
Fotos popover: the first card's title renders as a detached "Fahrzeug-" above
"Diagonalansichten" overlapping the card boundary — the heading wraps/positions wrong while the
other cards look fine.

## Direction

- Suspect the German compound word + hyphen wrap in a fixed-height row: the title
  ("Fahrzeug-Diagonalansichten") breaks onto a line the layout doesn't reserve space for, so it
  overflows upward out of its card.
- Find the suggested-photos component in `src/components/report/gallery/` (renders category
  cards with thumbnail, title, description, "N photos" count), let the title wrap inside the
  card (remove fixed heights / add `break-words` and let the row grow), and check the panel at
  both locales since EN titles are shorter and hid this.
- Screenshot-verify all category cards after the fix, DE and EN.

## Resolution (2026-09-22)

Status: ready-for-human

**Cause, as suspected in the ticket.** The category card in
`src/components/report/gallery/instruction-sidebar.tsx` was a fixed-height `h-22` row. The German
title "Fahrzeug-Diagonalansichten" wraps at the hyphen onto a second line, but the row reserved no
space for it, so the text overflowed its card and rendered as a detached "Fahrzeug-" above the
boundary. The EN titles are one short line each, which is why only German showed it.

**Fix.** `h-22` → `min-h-22` so the row grows with its content, and `break-words` on both the title
and the description. `hyphens-none` on the title keeps the browser from adding a second break point
on top of the compound's own hyphen.

Also replaced the hardcoded English `{count} photo{s}` string on the same card with a proper
`gallery.photoCount` ICU plural in both locales — it violated the no-hardcoded-strings rule and
would have rendered English inside the German panel.

**Screenshot-verified in both locales** (all three cards, per the ticket):
`testing/screenshots/suggested-de.png` and `testing/screenshots/suggested-en.png`. The German title
now wraps onto two lines inside its card and the card grew to fit; Damage Overview and Document
Shot are unchanged, and the English panel is unaffected.
