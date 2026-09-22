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
