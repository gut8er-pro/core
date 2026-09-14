# E2E Sweep — findings log

## Statistics (/statistics) — CONFIRMED IN SOURCE
FUNC-A mock data in prod: MOCK_INVOICES src/app/(app)/statistics/page.tsx:29-95. 9 fake invoices,
  fake clients, literal date 'Wed, 14.02.2026', all EUR268. Comment admits "replace with real API".
FUNC-B hardcoded KPI deltas: page.tsx:147(12.5) 153(8.2) 159(-3.1) 169(5.4). Shows "+12.5%" next to "0 EUR".
FUNC-C dead controls (file has only 1 onClick total, = chart toggle styling):
  - "Letzte 6 Monate" selector (page.tsx:~133) no onClick, has chevron implying dropdown
  - Filter/SlidersHorizontal button no onClick
  - "Bericht herunterladen" button no onClick
  - per-row Download icon x9 no onClick
FUNC-D chart period toggle inert: chartView used ONLY at line 191 for styling; AreaChart always
  gets monthlyRevenue (12mo) + maxValue=10000 regardless of weekly/monthly/yearly.
FUNC-E chart axis wrong: Y_LABELS=[10000,5000,2000,1000,0] rendered evenly spaced (justify-between)
  but AreaChart plots linear maxValue=10000 -> label positions do not match plotted values.
FUNC-F "Gesamtgutachten"=2 but dashboard "Recent Reports"=3. totalReports is computed from
  payment counts (completed+pending+delayed), not report count. Mislabeled metric.
UI-1 date not localized: "Wed, 14.02.2026" English weekday in German UI (also dashboard Mon/Sat/Wed).
UI-2 currency inconsistent: KPI cards "0 €" (de) vs table "€268" / "-€268" (en). German = "268 €".

## Dashboard (/) — CONFIRMED IN SOURCE
FUNC-C2 chartPeriod used only at page.tsx:176 for styling -> Jaehrlich/Monatlich/Woechentlich inert.
FUNC-C3 year selector "2026 v" page.tsx:183-190 no onClick (dead).
FUNC-C4 filter button page.tsx:262 no onClick, aria-label filterReports (dead).

## Settings > Profil — CONFIRMED
UI-3 social inputs 265px vs 409px for others; placeholder clipped: facebook by 19px, linkedin by 6px.
FUNC-G "Anrede" field is free-text <input name=title> showing RAW ENUM "mr" instead of "Herr".
  Translations exist (report.accidentInfo.salutationOptions.mr='Herr') but unused here.
  Placeholder is "Kfz-Sachverstaendiger" = a qualification, not a salutation. Label/placeholder/value
  all disagree. settings/[[...tab]]/page.tsx:~179-181
FUNC-H hardcoded, untranslated placeholders in settings/[[...tab]]/page.tsx:165,171,180,191,195
  ("Ketn","Torres","Kfz-Sachverstaendiger","ketn.torres@example.com","+49 151 23456789").
  Violates CLAUDE.md "do NOT hardcode". "Ketn" is a typo of "Kent". No *Placeholder keys in de.json.
FUNC-I **visit-section.tsx:169 renders hardcoded "Expert Ketn Torres"** in OT report Visits>Present.
  Untranslated + dummy identity shown to end user instead of logged-in expert name.
  Also checkboxes present-expert/present-client have no checked/onChange binding - verify live.
OK (not a bug): email input correctly disabled w/ real value; dashboard plate badge sits inside cell.

## Settings > Integrationen
FUNC-J only DAT listed. de.json:159 has "comingSoon" and 1096 promises Audatex+GT Motive;
  signup integrations-step.tsx:14 has Provider='dat'|'audatex'|'gt_motive'. Settings shows 1 of 3.
UI-4 two competing button pairs: inline form Abbrechen/Speichern AND page-level Abbrechen/Aktualisieren.
  Page-level pair does nothing on this tab (no form fields at tab level).
UI-5 "Verbinden" button stays labelled Verbinden while its own form is expanded below.
NOTE: DAT credentials not entered (password field) -> DAT-backed Calculation untestable this run.

## Settings > Geschaeftsdaten
UI-6 "Logo hochladen" button opacity:0.45, disabled=false, pointerEvents=auto. Reads as disabled
  but is live. Effective contrast ~3.4:1 vs white -> fails WCAG AA (4.5:1).
UI-7 logo empty-state literally reads "Leer" (span.text-grey-50) inside the dropzone.

## Settings > Abrechnung — HIGH SEVERITY
FUNC-K **STRIPE IS IN TEST MODE IN PRODUCTION**. /api/stripe/billing returns invoices whose
  invoicePdf/hostedInvoiceUrl are all https://pay.stripe.com/invoice/acct_1U0s6ZPX9t4iIbv4/**test_**...
  Card on file = visa 4242 (Stripe's canonical test card). No real money can be collected.
FUNC-L subscription state contradiction: API returns plan:"PRO", subscription:null, yet 3 paid
  invoices + card on file. UI (page.tsx:741 hasSubscription=!!billing?.subscription) renders
  "Kein aktives Abonnement" next to a paid payment history.
FUNC-M trialEndsAt=2026-08-12 (past, today 2026-09-14) + subscription null, yet full app access
  granted. Access is not gated on subscription state.
UI-8 "Zahlung einrichten" button 130x50px wraps to 2 lines (white-space:normal). Needs nowrap/width.
UI-9 invoice descriptions English in German UI ("1 x Gut8erPRO Pro (at EUR69.00 / month)",
  "Free trial for..."). Sourced from Stripe product config.
UI-10 currency "EUR69.00" (en) vs "0 EUR" (de) elsewhere. German = "69,00 EUR".

## Settings > Vorlagen — NON-FUNCTIONAL (proven live)
FUNC-N templates are pure client state. MOCK_TEMPLATES at settings/[[...tab]]/page.tsx:968-971 held in
  useState(:977). /api/settings returns NO template keys (verified: filter(/templ/i) -> []).
  No /api/templates route exists.
  PROOF: created "E2E-TEST Vorlage Persistenz" -> after reload list is back to the 4 mock rows.
FUNC-O drawer adds the list row on OPEN, before any input or confirm ("Neue Vorlage" appeared
  immediately on clicking Vorlage hinzufuegen).
FUNC-P "Betreff" field does not map to the list title - typed subject, row still read "Neue Vorlage".
FUNC-Q templates have no edit/open action, only "Entfernen".
UI-11 mock titles are English "Random Title for This Template" in German UI.
UI-12 date format "05/07/2026" and "14/09/2026" - slash format, ambiguous; German = "14.09.2026".
UI-13 "Vorlage hinzufuegen" button wraps to 2 lines (same class of bug as "Zahlung einrichten").

## Notifications (/notifications)
FUNC-R notification title+body are hardcoded ENGLISH and persisted to DB:
  api/reports/[id]/invoice/route.ts:123-124 title:'Invoice Generated',
  description:`Invoice ${n} has been generated.` The notifications i18n namespace has only chrome
  strings (title/markAllAsRead/...), no message templates -> bodies are permanently English.
FUNC-S relative time always English: notifications/page.tsx:99 formatDistanceToNow(...) called with
  NO locale option; no `date-fns/locale` import exists anywhere in src/. -> "about 1 month ago".
UI-14 page container inconsistent: main is 80..1360 (1280px) but notifications content sits
  384..1009 (~672px); Dashboard/Settings use ~104..1336 (1232px). Narrower + different gutters.
NOT A BUG (checked): unread badge rgb(59,130,246) = #3B82F6 = --color-info-blue, a real token
  (globals.css:36). Retracted an earlier suspicion of a hardcoded colour.

## Report creation menu (dashboard)
UI-15 "Neues Gutachten" dropdown opens downward with NO collision flip. At 1440x900 the 4th item
  "Oldtimer-Bewertung" renders at y=892..949 vs viewport 900 -> menu overflows by 49px and the
  4th report type is below the fold.
UI-16 dashboard row shows English "Untitled Report" (new reports render "Unbenanntes Gutachten").

## Gallery / photo upload (HS report 1a65cb53-...)
FUNC-T **SILENT UPLOAD FAILURE**. Uploaded 6 photos -> server stored 5. The 6th got
  520 from supabase storage (.../photos/07ed8401-.../original.jpg). NO toast, NO broken-image
  placeholder, NO retry. User has no way to know a photo is missing. (Transient: a later batch of
  15 all succeeded - so the defect is the silent swallow, not the 520 itself.)
FUNC-U **SILENT LIMIT REJECTION**. At exactly 20 photos the "+" button stays enabled; adding a 21st
  returns 400 from /api/reports/[id]/photos. Limit correctly enforced server-side but the UI shows
  nothing at all (toasts: []). Should disable "+" at 20 and/or explain the rejection.
UI-17 dropzone says "PDF PNG oder JPG" but the guidance panel says "JPG oder PNG Format" AND the
  input is accept="image/jpeg,image/png". PDF is advertised but actually rejected. Also missing
  comma: "PDF PNG oder JPG".
UI-18 "add more photos" (+) only exists in the filmstrip (single-photo view, filmstrip.tsx:66).
  From the grid view after the first upload there is no add affordance - poor discoverability.

### CORRECTION to FUNC-T / FUNC-U (I checked the wrong selector the first time)
An upload-error surface DOES exist: a styled banner
  div.rounded-lg.border.border-error.bg-error-light rendering "IMG_0407.JPG: Maximum 20 photos per report".
My earlier "toasts: []" probe only looked for [role=status]/[role=alert]/[data-sonner-toast], which this
banner does not match. So the 21st-photo rejection is NOT silent - it is REPORTED BUT IN ENGLISH.
I cannot now confirm whether the 6th photo's 520 failure also produced a banner (I did not check the
right selector at that moment) - FUNC-T is therefore downgraded to "unconfirmed whether surfaced".
The confirmed, generalizable defect is:
FUNC-V **API error strings are hardcoded English and rendered verbatim to the user.**
  api/reports/[id]/photos/route.ts:56 -> `Maximum ${MAX_PHOTOS_PER_REPORT} photos per report`.
  Client renders the raw server string, so every API error bypasses i18n entirely.
UI-19 "+" add-photos button stays enabled at the 20-photo cap instead of disabling.
OK (not a bug, verified): prev/next photo arrows - "Vorheriges Foto" correctly appears from photo 2 on.
OK (verified working): Fabric.js annotation - rectangle drew and saved; annotatedUrl persisted.

## HS Report Details > Unfalluebersicht — CRITICAL DATA BINDING BUG
FUNC-W **Claimant "IBAN" and "Erstes Kennzeichen" fields write to the WRONG DB COLUMNS.**
  src/components/report/accident-info/claimant-section.tsx:102-111
    label={t('accidentInfo.iban')}        placeholder="123/456/78901"  -> fieldProps('claimantVehicleMake')
    label={t('accidentInfo.firstNumber')} placeholder="DE123456780"    -> fieldProps('claimantPhone')
  Contrast opponent-section.tsx:96-98 which binds the same IBAN label correctly to 'opponentIban'.
  PROVEN LIVE on report 1a65cb53: typed DE89370400440532013000 into the IBAN-labelled field ->
  GET /api/reports/<id>/accident-info returns claimantInfo.vehicleMake = "DE89370400440532013000".
  Typed "B XY 4321" into the Kennzeichen-labelled field -> claimantInfo.phone = "B XY 4321".
  claimantInfo has NO iban column at all.
  Consequences: (1) banking data persisted into a vehicle field (privacy/GDPR),
  (2) claimant phone number has no input anywhere in the UI, (3) IBAN is unstorable,
  (4) vehicleMake is corrupted -> flows into PDF + invoice + email.
  Placeholders are ALSO wrong for both: "123/456/78901" is a Steuernummer format and
  "DE123456780" is a USt-IdNr format - neither matches its label.
UI-20 tab bar overflows: scrollWidth 968 vs clientWidth 906 (62px hidden), overflow-x:auto with no
  scroll affordance; "Rechnungsdetails 0/2" is visually clipped at 1440px wide.
UI-21 claimantPostcode placeholder "R0S312" is not a German PLZ (5 digits, e.g. 10115).
NOT A BUG (re-measured): the Kennzeichen live-preview badge is a flex SIBLING of the input with a
  16px gap - my first measurement used the wrong parent. No overlap.
OK: auto-save works - all claimant fields persisted after blur.
OK: AI auto-fill correctly extracted licence plate "N FS 1298" from the plate photo.
AI-QUALITY: aiDescription for a street photo says "in einer Ausstellungshalle" (showroom) - the car
  is parked on a snowy street. Hallucinated setting; worth spot-checking AI text before sending.

## HS > Fahrzeug tab
UI-22 row misalignment: label "Fahrzeug-Identifizierungsnummer (VIN)" wraps to 2 lines (48px) while
  siblings "DATSCode"/"Marktindex" are 1 line (24px) -> VIN input sits 24px BELOW its row siblings.
  Grid does not normalise label heights. German labels make this systemic.
UI-23 5 of 7 placeholders use English "e.g." not German "z.B.":
  "e.g. WVWZZZ3CZWE123456", "e.g. Volkswagen AG", "e.g. Golf VII", "e.g. Golf VII 2.0 TDI", "e.g. 0603 / BGH"
MINOR two different completion metrics side by side: tab "Fahrzeug 0/3" (sections) vs "17% Abgeschlossen"
  (fields). Both correct, but adjacent and unexplained.
OK: AI auto-fill correctly set Hersteller=Audi, Haupttyp=A4.

## HS > Zustand tab
FUNC-X **AI writes ENGLISH values into German report fields**: Fahrzeugfarbe="Light Green"
  (should be "Hellgrün"), Sonderausstattung="panoramic sunroof" (should be "Panoramadach").
  These land in the DB and flow into the PDF.
UI-24 English dropdown placeholder "Select" in German UI (Lack field).
UI-25 "Innenraumzustand" dropdown renders completely EMPTY - no value and no placeholder, unlike
  its siblings. Looks broken.
UI-26 "e.g. 125,450 km" - English "e.g." AND US thousands separator. German: "z.B. 125.450 km".

## HS > Wert- und Reparaturkalkulation tab
UI-27 **clipped input**: name="risks" holds AI prose "Multiple hail dents visible across hood and
  po..." needing 1185px MORE than its 379px single-line <input>. ~3/4 of the text is unreachable.
  Multi-sentence AI output belongs in a <textarea>.
UI-28 clipped placeholder: name="replacementValue" placeholder "Wert hinzufügen" is 8px too wide for
  the 182px input -> renders "Wert hinzufüg". Input squeezed by the EUR prefix + 19% dropdown.
UI-29 THIRD English dropdown placeholder variant: "Choose" (Ausfallgruppe, Mietwagenklasse) -
  app now uses "Select", "Choose" and German placeholders inconsistently.
FUNC-X2 more English AI values: Reparaturmethode="PDR (Paintless Dent Repair)", Risiken=English prose.
NOT AN OVERLAP (measured): "Wiederbeschaffungswert" / "Steuersatz wählen" labels have a 16px gap.
  They read as one run-on phrase but do not collide - a grouping/spacing issue, not an overlap.

## HS > Rechnungsdetails tab
UI-30 **BVSK fee table overflows badly**: div.overflow-x-auto scrollWidth 1156 vs clientWidth 816
  -> 340px hidden. Inner div.flex.flex-1 escapes its parent by 340px. 8 descendant elements lay out
  past the 1440px viewport (right edges 1467..1631), i.e. the 2.500/3.000/4.000 EUR damage brackets
  and their fees (797,00 / 917,00 EUR) are scrolled out of sight with NO scrollbar affordance.
UI-31 the ACTIVE tab "Rechnungsdetails" is itself clipped by the overflowing tab bar.
FUNC-Y "Rechnungsbetrag 0,00 €" - no BVSK line items were auto-generated despite CLAUDE.md stating
  "Invoice auto-calculates based on BVSK standard rates". Positionen table is empty with no empty-state text.
NOTE E-Rechnung (ZUGFeRD) toggle defaults to ON.

## HS > Rechnungsdetails — line items
RETRACTED: I first concluded "invoice line items never persist" (would have been a release blocker).
  WRONG - my probe read `raw.invoice.lineItems`; the API returns `lineItems` at the TOP level
  alongside `invoice`. Line items DO persist. Banner correctly shows 1.059,10 EUR (890 x 1.19)
  and "Vor Steuer 890,00 EUR". Verified via PATCH request/response bodies + reload.
FUNC-Z **per-row "Betrag" column always renders 0,00 EUR** (CONFIRMED visually: Satz=890,
  banner=1.059,10 EUR, row Betrag=0,00 EUR).
  Cause: src/components/report/invoice/line-items-section.tsx:66-70
    const amountVal = parseFloat(document.querySelector(`[name="lineItems.${index}.amount"]`)?.value ?? '0') || 0
  but the numeric input is registered as `lineItems.${index}.rate` (line 120) - there is no
  `.amount` input in the DOM, so the query always misses and the column is hard-zero.
  Also: reads the DOM during render, which violates CLAUDE.md ("Form data read via getValues(),
  not DOM queries") and will not re-render when the value changes.
UI-32 clipped placeholder "Leistungsbeschreibung" short by 18px in the line-item description input.
UI-33 red warning triangle shown next to the "BVSK" fee-schedule selector with no explanation/tooltip.
FUNC-AA React warning in console: "Select is changing from uncontrolled to controlled." (Radix
  selects on the vehicle tab) - a state anti-pattern that can drop values.
FUNC-AB Nutzungsausfall group options render as ENGLISH "Group A".."Group L" in the German UI
  (should be "Gruppe A"..). German loss-of-use concept shown in English.
FUNC-AC motor type options mix languages: "Reihe","V-Motor","Boxer","Wankel","Other" <- "Other" is English.
NOT A BUG (re-checked): Türen/Sitze pill groups - my probe grabbed the first pill not the selected
  one. Türen=4 and Achsen=2 were correctly set by AI. Leistung(PS)=190 correctly derived from 140 kW.

## HS > Export & Versand — *** RELEASE BLOCKER ***
FUNC-BLOCKER-1 **EMAIL SENDING IS NON-FUNCTIONAL IN PRODUCTION.** Clicking "Gutachten senden"
  with recipient quadrition@gmail.com returns:
  "Failed to send email: You can only send testing emails to your own email address
   (ivanvukasino@gmail.com). To send emails to other recipients, please verify a domain at
   resend.com/domains, and change the `from` address to an email using this domain."
  => Resend has NO VERIFIED DOMAIN in production. Reports can only ever be mailed to
  ivanvukasino@gmail.com. Sending a Gutachten to an actual client is impossible today.
  This is the product's core deliverable. Pairs with FUNC-K (Stripe also in test mode).
FUNC-BLOCKER-1b the raw provider error is rendered VERBATIM to the end user, in English, and it
  LEAKS AN INTERNAL EMAIL ADDRESS (ivanvukasino@gmail.com) to whoever is using the app.
FUNC-AD after the send FAILED, report.status is "COMPLETED" and the error banner persists.
  Needs checking that a failed send does not mark a report as sent/complete.
  (Caveat: I have no pre-send baseline for `status`, so this is "verify", not "confirmed".)
OK (verified working end to end):
  - completeness gate: server-side 422 with structured missingInfo until genuinely complete
  - PDF generation: GET /export?format=pdf -> 200, 6.86 MB application/pdf, BOTH de and en
  - PDF i18n is properly implemented (src/lib/pdf/translations.ts has both en: and de: blocks;
    the 123-byte size delta between locales is compression noise, NOT evidence of missing translation)
  - autosave across all 5 tabs, signature capture, visits, opponent, invoice line items
UI-34 signature canvas resolution mismatch: canvas.width=500/height=200 but displayed ~463x187 CSS px
  with no coordinate compensation -> ink lands ~8% left/up of the cursor, up to ~37px off at the
  right edge. On a legally-binding signature pad this is a real defect.
UI-35 signature modal mixes languages in a LEGAL consent dialog: "Draw Signature", "Upload Signature",
  "Clear", and "By signing, you confirm the accuracy of the information provided." are ENGLISH,
  directly above a German legal sentence.
UI-36 "Standard View" (paint diagram) is English; should be "Standardansicht".
UI-37 nextMot placeholder is "MM/YY/YY" - a malformed/nonsense date format.
UI-38 visits placeholders English: "Street address or po box", "eg 006312" (also "eg" is malformed
  and 006312 is not a German PLZ).
UI-39 AI damage marker text embeds English labels in German prose:
  "Motorhaube - Hagelschaden | Severity: moderate | Repair: Ausbeularbeiten nach PDR-Verfahren..."
UI-40 the 12 paint-thickness (μm) inputs all have EMPTY name attributes.
RETRACTED: "tyre size inputs don't persist" - WRONG. They persist fine with real keyboard input;
  my synthetic value-setter simply wasn't registering with React Hook Form. Same root cause as the
  earlier invoice mis-read. Both retracted.

## Report type variants — structure verified against CLAUDE.md
BE (135dfda2): tabs Unfalluebersicht/Fahrzeug/Zustand/**Bewertung**/Rechnungsdetails. Sections:
  Geschaedigter, Besichtigungen, Stellungnahme, Unterschriften. NO Unfallgegner, NO Unfallinformationen. CORRECT.
KG (cfaad8cb): created OK.
OT (8c32689e): tab **Auftraggeberinformationen** (not Unfalluebersicht), section **Auftraggeber**,
  exactly 2 checkboxes (Vorsteuerabzugsberechtigt + Ist Fahrzeughalter), Bewertung 0/1, Zustand 0/5
  (one more section than HS). Valuation = Marktwert + Wiederbeschaffungswert + Restaurierungswert +
  Gesamtkosten. ALL CORRECT per spec.
FUNC-W-SCOPE **the IBAN/Kennzeichen mis-binding is present in EVERY report type** - re-verified on OT:
  label "IBAN" -> name claimantVehicleMake; label "Erstes Kennzeichen (Geschädigter)" -> claimantPhone.
  On OT it is doubly wrong: the label says "(Geschädigter)" (claimant) on a valuation that has no
  accident and no claimant - the party is the "Auftraggeber".
FUNC-AE BE tab reads "Bewertung" but the section heading below still reads
  "Wert- und Reparaturkalkulation" - heading is not switched per report type. (OT similarly:
  tab "Bewertung" vs heading "Fahrzeugwert".)
FUNC-AF **Besteuerung sublabels hardcoded ENGLISH**: valuation-section.tsx:18-20
  sublabel:'Natural' / 'Difference' / 'Standard rate' - never translated. These are German tax
  concepts (Regel-/Differenzbesteuerung) shown in English in a tax-relevant control.
UI-41 OT "Restaurierungswert" renders as a full-width PRIMARY BUTTON (818x40, bg #019447, white text)
  instead of a value input, sitting beside Marktwert/Wiederbeschaffungswert which ARE inputs.
UI-15 REFINED: the "Oldtimer-Bewertung" menu item is below the fold at 1440x900 (bottom 949 vs 900)
  BUT the page still scrolls with the menu open, so it IS reachable. Downgrade from "unreachable"
  to "cut off on open, no collision flip / no scroll affordance".
NOTE: tab bar does NOT overflow for BE/OT - the 1440px overflow is caused specifically by the long
  HS/KG label "Wert- und Reparaturkalkulation".
