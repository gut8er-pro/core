# AI troškovi — pregled za stakeholdere

**Datum:** 06.05.2026
**Tema:** Koliko nas trenutno košta AI obrada gutachtenа i kako planiramo da to smanjimo bez gubitka kvaliteta.

---

## 1. Šta AI radi za nas

Pri svakom kreiranju gutachtenа (klik na "Gutachten generieren") sistem:

1. **Klasifikuje** svaku fotografiju (šteta? VIN pločica? dokument? unutrašnjost? guma?...)
2. **Iz fotografija dokumenta čita** podatke (Zulassungsbescheinigung — VIN, vlasnik, adresa, datum prve registracije, snaga, KBA broj, itd.)
3. **Iz fotografije VIN pločice** čita VIN broj
4. **Iz fotografije tablice** čita registarsku oznaku
5. **Analizira štete** (lokacija, težina, predlog popravke, procena sati rada)
6. **Analizira spoljašnjost** (boja, tip karoserije, opšte stanje)
7. **Analizira unutrašnjost** (kilometraža sa instrument table, oprema, stanje)
8. **Analizira gume** (proizvođač, dimenzije, dubina šare, DOT kod)
9. **Računa procenu popravke** (klasa štete, metoda, rizici, dani popravke)

Sve to ide kroz **Claude AI** (Anthropic) — koristimo dva modela:
- **Haiku 4.5** (jeftiniji, brži) — za jednostavne zadatke poput klasifikacije
- **Sonnet 4.5** (skuplji, precizniji) — za štete i čitanje dokumenata

---

## 2. Koliko nas to košta DANAS

Reprezentativni primer: **realni Audi A6 sa 12 fotografija** koji sam testirao prošle nedelje (5 fotki štete, 2 dokumenta, 1 VIN, 2 tablice, 1 instrument tabla, 1 spoljašnjost):

| | Vrednost |
|---|---:|
| AI poziva po gutachtenu | **26–27** |
| Cena po gutachtenu | **~$0,12–0,15** (≈ €0,11–0,14) |
| Vreme generisanja | ~45 sekundi |

**Šta to znači u praksi:**

| Korišćenje | Mesečno gutachtenа | Mesečni AI trošak |
|---|---:|---:|
| Lagan korisnik | 30 | **~$3,60–$4,50** (≈ €3,30–€4,15) |
| Prosečan korisnik | 100 | **~$12–$15** (≈ €11–€14) |
| Težak korisnik | 200 | **~$24–$30** (≈ €22–€28) |
| Veoma težak korisnik | 500 | **~$60–$75** (≈ €55–€69) |

**Plan koji prodajemo je €69/mesec** — znači AI trošak je trenutno između **5–43% pretplate** zavisno od korišćenja. Većina troška ide na detaljnu analizu štete (Sonnet model) i na finalni izračun popravke — ta dva koraka uzimaju ~70% AI računa.

---

## 3. Trenutni problemi koji koštaju novac

1. **Sve fotografije idu kroz AI u istoj veličini (1568 px).** Klasifikacija ("šta je ovo, šteta ili dokument?") ne treba veliku rezoluciju — može sa 10× manjom slikom za istu tačnost.

2. **Nemamo trajni keš.** AI keš se briše svaki put kad se aplikacija restartuje. Ako korisnik klikne "Generiši" dva puta za isti gutachten u različitim danima, plaćamo dva puta.

3. **Iste fotografije se obrađuju više puta.** Ako korisnik nahodom uploaduje istu fotku u dva gutachtenа, ili istu sliku po grešci dva puta — AI je analizira svaki put.

4. **Anthropic ima ugrađeni keš sa 90% popusta** — koristimo ga 0%.

5. **Korak "izračun popravke" duplira posao** koji već radi analizator štete (šalje istih 5 fotki opet).

---

## 4. Šta planiramo i koliko ćemo uštedeti

Tri talasa optimizacije (ranjirano po sigurnosti — prvi je 100% siguran, treći ima minimalan rizik):

### Talas A — sigurne pobede (~pola dana rada)

- Slati manje slike za jednostavne zadatke (klasifikacija, opšti pregled, finalni izračun)
- Trajni keš zasnovan na sadržaju fotografije (ne na URL-u) — jednom analizirana, uvek poznata
- Detekcija duplih fotografija pri uploadu

**Očekivana ušteda: 60–65%** (sa $0,13 na $0,05–0,07 po gutachtenu)
**Rizik za kvalitet:** nema. Sve OCR zadatke (VIN, tablica, dokument, guma) zadržavamo na maksimalnoj rezoluciji.

### Talas B — Anthropic ugrađeno keširanje (~pola dana rada)

- Aktiviramo Anthropic-ov "prompt cache" — ista fotka unutar istog modela se ponovo naplaćuje sa 90% popusta umesto pune cene

**Dodatna ušteda: 10–15%** (na $0,04–0,06 po gutachtenu)
**Rizik za kvalitet:** nema.

### Talas C — opciono, samo ako bude trebalo (~1 dan rada)

- Spojiti analizator štete + izračun popravke u jedan poziv (jer već dele iste fotografije)

**Dodatna ušteda: 10%** (na $0,03–0,05 po gutachtenu)
**Rizik za kvalitet:** mali — treba pažljivo testirati. Vraćamo se na njega samo ako prva dva talasa ne dostignu ciljeve.

---

## 5. Konačna projekcija (sa svim talasima A+B)

| | Pre | Posle | Ušteda |
|---|---:|---:|---:|
| Po gutachtenu | $0,12–0,15 | $0,04–0,06 | **~65%** |
| 100 gutachtenа/mesec | $12–15 | $4–6 | **~$9** |
| 500 gutachtenа/mesec | $60–75 | $20–30 | **~$45** |
| 5 korisnika × 200/mesec | $120–150 | $40–60 | **~$90** |

**Ako rastemo do 100 aktivnih korisnika koji prave po 100 gutachtenа mesečno:**
- Trenutno: ~$1.200–1.500/mesec na AI
- Posle optimizacije: ~$400–600/mesec
- **Ušteda: ~$800–900/mesec, ili ~$10.000/godišnje**

---

## 6. Šta stakeholderi treba da znaju

✅ **Trenutni AI trošak je pod kontrolom** — pri €69 pretplati, AI se isplati čak i pri intenzivnom korišćenju.

✅ **Imamo jasan plan kako da ga prepolovimo** — ~1 dan razvoja za 60–65% uštede.

✅ **Kvalitet ostaje isti.** Ne menjamo modele za štetu i OCR — tu nas Sonnet i puna rezolucija drže precizne. Optimizacija je čisto tehnička (manje slike za zadatke gde detalji nisu bitni, keširanje već analiziranih slika).

⚠ **Bitno za skaliranje:** ovo je trošak po gutachtenu — linearno raste sa brojem korisnika. Pre nego što odemo na 1000+ korisnika, optimizacija je obavezna inače pretplata €69 počinje da bude tanka pri intenzivnoj upotrebi.

⚠ **Ovo je samo Anthropic.** Postoje i drugi troškovi (Supabase storage za fotke, Stripe takse, hostovanje na Vercelu) — ali su mnogo manji i fiksniji. AI je daleko najveća varijabilna stavka.

⚠ **Cene Anthropic-a se menjaju.** Brojke iz ovog dokumenta važe za maj 2026. Anthropic je u prošloj godini smanjio cene Haiku modela 2×, ali smer može i da se okrene. Dobro je imati optimizaciju spremnu pre toga.

---

## 7. Šta sledi

Čekam odluku da li krećemo sa Talasom A. Posle pola dana rada imaćemo merljivo smanjenje od 60% na već postojećem realnom test gutachtenу (Audi A6 set fotografija).

Tehnički detalji implementacije: vidi [`AI_TROSKOVI_TEHNICKI.md`](AI_TROSKOVI_TEHNICKI.md).

---

*Pripremio: Ivan, 06.05.2026.*
