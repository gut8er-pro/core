# Manuelni QA checklist — talas 1 (demo feedback)

Za ručno testiranje na app.gut8erpro.de (ili localhost:3000). Svaka stavka: uradi → očekuj.
Status kolone popunjava tester. Referentni tiketi u zagradama žive u `issues/`.

## Galerija

| # | Uradi | Očekuj | OK? |
|---|-------|--------|-----|
| G1 | Kreiraj HS report, ubaci 2 slike, pa PREVUCI još slika sa desktopa na galeriju (01) | Slike se upload-uju; ekran NE beži nigde | |
| G2 | Prevuci fajl bilo gde van galerije (npr. na header) (01) | Ništa se ne dešava — tab ne navigira na fajl | |
| G3 | Selektuj 10+ fajlova odjednom, među njima jedan ne-slika (36) | Poruka "X von Y hochgeladen — N fehlgeschlagen" sa imenima preskočenih | |
| G4 | Ubaci slike dok ih je već 18 (36) | Višak imenovan kao preskočen, ne nestaje ćutke | |
| G5 | Otvori sliku → dugme rotacije (pored kantice) (08) | 90° po kliku, ostaje posle reload-a; uz postojeća markiranja traži potvrdu | |
| G6 | Uploaduj sliku slikanu telefonom naopako (08) | Prikaže se ispravno orijentisana odmah | |
| G7 | Prevuci sličicu preko druge (09) | Redosled se menja i OSTAJE posle reload-a | |
| G8 | "Empfohlene Fotos" panel na nemačkom (11) | Naslov "Fahrzeug-Diagonalansichten" uredno u kartici, ništa ne štrči | |

## Anotacije (paleta na slici)

| # | Uradi | Očekuj | OK? |
|---|-------|--------|-----|
| A1 | Nacrtaj pravougaonik prevlačenjem (04) | Raste iz ugla prvog klika, ne iz centra | |
| A2 | Klikni postojeći marking (04) | Selekcija sa ručkama; može pomeranje i resize | |
| A3 | Selektuj marking → crvena kantica iznad selekcije ili Delete taster (04) | Briše SAMO taj marking | |
| A4 | Kantica u toolbaru (04) | "Alles löschen" + dijalog potvrde pre brisanja svega | |
| A5 | Nacrtaj → Save → izađi → ponovo otvori → ODMAH Save (03) | Markiranja i dalje tu (ovo je ranije sve brisalo!) | |
| A6 | Isključi internet pa Save (03) | Vidljiva greška — NE izgleda kao uspeh | |
| A7 | Save dugme tokom čuvanja (03) | "Saving…" pa potvrda; modal se zatvara tek na uspeh | |

## Unfallübersicht

| # | Uradi | Očekuj | OK? |
|---|-------|--------|-----|
| U1 | Kucaj IBAN malim slovima bez razmaka (07) | Grupiše se sam: DE89 3704 0044…; pogrešna kontrolna cifra → greška na blur | |
| U2 | Kucaj tablicu malim slovima (12) | Input i vizuelna tablica velikim; i u bazi velikim (reload) | |
| U3 | Odčekiraj "Is the vehicle owner" (06) | Pojavljuje se Fahrzeughalter blok; popuni, reload → sve tu | |
| U4 | Čekiraj "Represented by a lawyer" (05) | Polja: kancelarija, adresa, email, telefon (ne samo ime) | |
| U5 | U Visits izaberi "Claimant Residence" (13) | Adresa claimanta se sama upiše; ručno uneto se NE gazi | |
| U6 | Sve iz U1–U5 posle reload-a | Sve vrednosti preživele | |

## Vozilo

| # | Uradi | Očekuj | OK? |
|---|-------|--------|-----|
| V1 | Redovi vrata/sedišta (16) | Kreću od 1 — nema nule | |
| V2 | Previous Owners na svežem reportu (16) | Ništa selektovano; klik na aktivnu pilulu poništava; neizabrano se NE pojavljuje u PDF-u | |
| V3 | "+" na bilo kom redu (16) | Otvara mali unos — npr. 6 osovina radi; Enter potvrdi, Esc otkaže | |
| V4 | Source of technical data (15) | Padajuće sa 2 predloga + slobodno kucanje; kucano preživi reload | |

## Condition

| # | Uradi | Očekuj | OK? |
|---|-------|--------|-----|
| C1 | Bilo koji padajući (paint, general…) (17) | Predlozi + slobodan unos; slobodno uneto preživi reload | |
| C2 | Kucaj kilometražu 125450 (18) | Prikaz 125.450 dok kucaš; bez strelica za +1 | |
| C3 | Schadstoffplakette (19) | Okrugle nalepnice klikabilne; ponovni klik poništava; preživi reload; labela "Schadstoffplakette" | |
| C4 | Gume: popuni VL pa "Achsen ausrichten" (20) | VR dobije iste vrednosti; "Satz abgleichen" → sve četiri | |
| C5 | Svež report → otvori Tires karticu (20) | Polja odmah vidljiva (set 1 sa 4 pozicije), bez čekanja | |
| C6 | Prior damage → Damage description tab (40) | Kucani tekst preživi promenu taba i reload | |

## Kalkulacija

| # | Uradi | Očekuj | OK? |
|---|-------|--------|-----|
| K1 | Replacement/Residual value (21) | € prefiks u polju; tax-rate select nije presečen | |
| K2 | Popuni Loss of Use pa ODMAH klikni drugi tab i vrati se (22) | Vrednosti tu — ništa ne nestaje | |
| K3 | Correction: Manual kartica (23) | Unos dva iznosa; čuvaju se i čitaju posle reload-a; kartice rezultata računaju uživo | |
| K4 | Correction: AI kartica (23) | Bez slika → poruka; sa slikama → spinner pa rezultat | |
| K5 | Correction: DAT bez povezanog naloga (23) | Jasna poruka "poveži DAT", ne tiho ništa | |

## AI Generate

| # | Uradi | Očekuj | OK? |
|---|-------|--------|-----|
| AI1 | Upiši ručno tablicu i VIN, PA pusti Generate (audit 18) | Tvoje vrednosti OSTAJU — AI ne prepisuje | |
| AI2 | Slikaj saobraćajnu (Teil I) i Generate (14) | kW iz P.2, ccm iz P.1, EZ iz B — ne pogrešna polja | |
| AI3 | Oštra slika zadnje tablice sa HU nalepnicom (14) | Next MOT popunjen sa nalepnice | |
| AI4 | Karavan (Kombi) vozilo (14) | Vehicle type = Wagon, ne Sedan | |

## Lock

| # | Uradi | Očekuj | OK? |
|---|-------|--------|-----|
| L1 | Pošalji report → probaj da kucaš u SVAKOM tabu (02) | Sva polja siva/neaktivna; upload/rotacija/brisanje slika nedostupni; anotacije read-only | |
| L2 | Otključaj na Export & Send (02) | Sve ponovo radi | |

## Poznato otvoreno (NE prijavljivati kao bug — talas 2 u toku)

- Invoice polje na munjevit tab-switch ume da se izgubi (tiket 22/26 — invoice agent)
- Invoice preview, default redovi, količine — talas 2 (24–26)
- Export toglovi/PDF preview/recipient dugmad — talas 2 (29–32, 05B)
- Dashboard payments/statistika — talas 2 (28, 33, 34)
- Date picker izgled — talas 2 (10)
- OT Vehicle Grading tab — talas 2 (38)
