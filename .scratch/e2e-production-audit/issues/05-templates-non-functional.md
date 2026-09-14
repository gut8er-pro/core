# 05 — Settings → Vorlagen is entirely non-functional

Status: ready-for-agent
Type: bug
Severity: high

The Templates tab looks like a working feature and is not one. Nothing a user does there survives
a page reload.

## Proven on the live app

1. Opened Settings → Vorlagen. Four rows, all titled "Random Title for This Template", all dated
   05/07/2026.
2. Clicked "Vorlage hinzufügen", filled Betreff = `E2E-TEST Vorlage Persistenz` and a body, clicked
   "Erstellen".
3. Reloaded the page.
4. The four mock rows are back. The created template is gone.

`GET /api/settings` contains **no template-related keys whatsoever** (filtered its key list for
`/templ/i` → `[]`), and there is no `/api/templates` route in the codebase.

## Cause

`src/app/(app)/settings/[[...tab]]/page.tsx:968-971` defines `MOCK_TEMPLATES`, and line 977 holds
it in component state:

```ts
const [templates, setTemplates] = useState<Template[]>(MOCK_TEMPLATES)
```

That is the whole feature. There is no persistence layer behind it.

## Further defects in the same tab

- **The row is created on drawer-open, not on confirm.** Clicking "Vorlage hinzufügen" immediately
  appends a "Neue Vorlage" row to the list before any input is given or "Erstellen" is pressed.
  Cancelling would leave an empty template behind (were anything persisted).
- **"Betreff" does not map to the row title.** I typed a subject; the list row still read
  "Neue Vorlage".
- **Templates cannot be opened or edited** — the only per-row action is "Entfernen".
- Mock titles are English in a German UI, and dates render as `05/07/2026` / `14/09/2026` — an
  ambiguous slash format rather than German `05.07.2026`.

## Fix

Either build the feature properly — schema, `/api/templates` CRUD, wire the drawer to it, create
on confirm rather than on open, map Betreff to the title, add an edit path — or hide the tab until
it exists. Shipping it in this state invites a client to write templates and lose them.
