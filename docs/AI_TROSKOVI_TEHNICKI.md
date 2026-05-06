# AI troškovi — tehnički dokument za developere

**Datum:** 06.05.2026
**Cilj:** Smanjiti trošak po Generate-Report pozivu za 60–70% bez gubitka kvaliteta. Dokument za interni razvoj — sadrži sve brojke, fajl-paths, prompt-version logiku i konkretan plan implementacije.

Pratidoc za biznis stranu: [`AI_TROSKOVI_BIZNIS.md`](AI_TROSKOVI_BIZNIS.md).

---

## 1. Kako Anthropic naplaćuje vision

Izvori: [Vision docs](https://platform.claude.com/docs/en/build-with-claude/vision), [Pricing docs](https://platform.claude.com/docs/en/about-claude/pricing).

- **Formula tokenа za sliku:** `tokens ≈ (širina × visina) / 750`. Auto-padding na multiplu od 28 px.
- **Native max long-edge:** 1568 px na Sonnet/Haiku 4.5 (Opus 4.7 = 2576 px). Iznad toga API sam smanjuje — nema benefita kvalitetu, samo veći payload.
- **Tip slike (JPEG/PNG/WebP) ne utiče na tokene** — samo dimenzije. JPEG je preporuka jer ima manji payload.
- **Multi-image poruke ne štede tokene za slike** — štede samo prompt tokene (jer ne ponavljaš tekst).

### Cenovnik (USD po 1M tokenа, maj 2026)

| Model | Input | Output | Cache write 5m | Cache write 1h | Cache HIT |
|---|---:|---:|---:|---:|---:|
| Haiku 4.5 | $1,00 | $5,00 | $1,25 | $2,00 | **$0,10** |
| Sonnet 4.5 | $3,00 | $15,00 | $3,75 | $6,00 | **$0,30** |
| Batch API | 50% off na sve | | | | |

Cache hit = **90% popusta na input** kada se isti image+prompt prefix ponovo šalje unutar TTL-a. Min cache size: 1024 tokena.

### Dimenzije slike → tokeni

| Pikseli | Tokeni | Sonnet input | Haiku input |
|---|---:|---:|---:|
| 200 × 150 (thumb) | 40 | $0,00012 | $0,00004 |
| 512 × 384 | 262 | $0,00079 | $0,00026 |
| 768 × 576 | 590 | $0,00177 | $0,00059 |
| 1024 × 768 | 1.049 | $0,00315 | $0,00105 |
| **1568 × 1176 (trenutni `ai`)** | **2.459** | **$0,00738** | **$0,00246** |
| 2576 × 1932 (Opus max) | 6.634 | n/a | n/a |

> **Napomena za 1568 cap:** docs spominju "max 1568 image tokens" za non-Opus. U praksi formula radi do tog plafona; slika 1568 × 1176 i dalje plaća ~2459 jer obe ose učestvuju. Verifikovati sa [token-counting endpoint-om](https://platform.claude.com/docs/en/build-with-claude/token-counting) pre fine podešavanja, ali trend (manja slika → manje tokenа) je pouzdan.

---

## 2. Trenutno stanje — gde ide novac

Tipičan gutachten od 12 fotografija (Audi A6 test set) napravi **26–27 API poziva**:

| Korak | Model | Pozivi | Tokeni za sliku | Output cap |
|---|---|---:|---:|---:|
| Classify | Haiku | 12 | 2.459 | 256 |
| Damage analyzer | Sonnet | 5 | 2.459 | 2.048 |
| Overview analyzer | Haiku | 1–2 | 2.459 | 512 |
| Interior analyzer | Haiku | 1 | 2.459 | 512 |
| Tire analyzer | Haiku | 0–4 | 2.459 | 512 |
| VIN detect | Haiku | 0–1 | 2.459 | 256 |
| Plate detect (+retry) | Haiku | 1–2 | 2.459 | 256 |
| OCR document | Sonnet | 0–2 | 2.459 | 1.024 |
| Calculation extractor | Sonnet | 1 | 5 × 2.459 = 12.295 | 512 |
| VIN AI fallback | Haiku | 0–1 | 0 (text only) | 512 |

**Procena trenutnog troška po gutachtenu:** ≈ **$0,12–0,15**. Dominantno: damage Sonnet (5 × ~$0,011 = $0,055) i calculation extractor ($0,04) — ta dva čine ~70% računa.

**In-memory keš** (`src/lib/ai/cache.ts`) ima 1h TTL — pomaže pri uzastopnim Generate klikovima u istom server lifetime, ali se briše pri svakom restart-u/deploy-u. Praktično nije faktor za produkcijski trošak.

---

## 3. Detaljnost po zadatku

Svaki analizator dobija isti veliki variant (1568 px). To je preterano za većinu zadataka:

| Zadatak | Potreban detalj | Razumna veličina | Razlog |
|---|---|---|---|
| **Classify** | Nizak — samo "šta je ovo?" | 384–512 px | Wallet-size thumb je dovoljan da razlikuje šteta od dokument od interior. |
| **Plate OCR** | Visok — sitan tekst | 1568 px | Karakteri tablice mogu biti 30 px visoki u širem kadru. |
| **VIN OCR** | Visok — utisnut tekst | 1568 px | Često glare/nizak kontrast; treba pune piksele. |
| **Document OCR (Zulassungsbescheinigung)** | Visok — mnogo malih polja | 1568 px | Halter ime, PLZ, KBA. |
| **Damage analyzer** | Srednje-visok — detalji površine | 1024–1568 px | Pukotine/udubljenja traže rezoluciju; 1024 drži po Anthropic vision primerima. |
| **Overview analyzer** | Nizak — boja + tip karoserije | 768 px | Boja, sedan/SUV — nije suptilno. |
| **Interior analyzer** | Srednji — pročitati cifre kilometraže | 1024 px | Mileage extraction je limitirajući faktor. |
| **Tire analyzer** | Visok — sidewall code, DOT | 1568 px | Sitne utisnute cifre. |
| **Calculation (multi-image)** | Isto kao damage | 1024 px svaka | Pokriveno u damage; reuse. |

**Brza računica** — samo prebacivanje **classify** na 384px variant: 12 fotki × (2.459 → 197) tokenа × $1/MTok = ušteda ~$0,027 po gutachtenu na klasifikaciji, sa **nula gubitka kvaliteta** (samo routing).

---

## 4. Optimizacioni nivoi

Rangirano po impact-per-quality-cost. Tier 1 = čista pobeda. Tier 3 = mali rizik.

### TIER 1 — čiste pobede (nula rizika za kvalitet)

#### 1.1 Classify na thumbnail variantu
Koristiti `previewUrl` (ili novi `classifyUrl` na 512 px) za klasifikator umesto `aiUrl`. Klasifikator samo bira jedan od 8 buckets — ne čita tekst, ne meri štetu. **Ušteda ~$0,025/gutachten. Bez kvalitativnog rizika.**

#### 1.2 Trajni AI keš po **content hash-u**
Zameniti in-memory 1h keš sa Postgres tabelom keyed by `(sha256(image_bytes), operation, locale, prompt_version)`. Preživljava restart; deduplikuje preko gutachtenа (ista fotka uploadovana dva puta → analizirana jednom). U kombinaciji sa postojećim `Photo.aiProcessedHash`, ovo čini repeat-runs besplatnim.

Implementacija: dodati `AiResult` tabelu:
```
AiResult {
  imageHash      String   // sha256 of image bytes
  operation      String   // 'classify' | 'damage-analysis' | ...
  locale         String   // 'en' | 'de'
  promptVersion  Int      // bump kad se prompt menja → invalidates
  result         Json
  createdAt      DateTime @default(now())
  @@id([imageHash, operation, locale, promptVersion])
}
```

Trenutni Java-hashCode-of-URL pristup je collision-prone i besmislen — ista fotka sa drugačijim signed URL-om broji se kao različita. **Ušteda 90%+ na repeat-Generate klikovima. Ušteda na duplikatima preko gutachtenа. Bez kvalitativnog rizika.**

#### 1.3 Right-size variants po zadatku
Stari `previewUrl` (već postoji 800×600) i `aiUrl` (1568×1176 — ostaje za OCR/plate/VIN/tire/damage), plus mapping:

| Zadatak | Variant sad | Variant posle |
|---|---|---|
| classify | aiUrl 1568 | **previewUrl 800** (ili novi 512px) |
| overview | aiUrl 1568 | **previewUrl 800** |
| interior | aiUrl 1568 | aiUrl (treba detalj kilometraže) |
| damage | aiUrl 1568 | aiUrl |
| plate / vin / document / tire | aiUrl 1568 | aiUrl |
| calculation | aiUrl 1568 svaka | **previewUrl 800** svaka (5 slika) |

Calculation extractor je trenutno najveća stavka ($0,04/gutachten). 5 × 800px umesto 5 × 1568×1176 spušta na ~$0,012 — **ušteda ~$0,028/gutachten**.

Ukupno Tier 1 ušteda: **~$0,05–0,07 po gutachtenu**, bez rizika za kvalitet.

#### 1.4 Image content dedup pri uploadu
Hash-ovati incoming bytes; ako isti hash već postoji za bilo koju fotku ovog korisnika, link na postojeći Photo record. Sprečava da korisnik re-uploaduje istu fotku i naduvava storage + AI trošak.

---

### TIER 2 — Anthropic prompt caching (mali implementacioni trošak, veliki payoff za re-runs)

Anthropic podržava `cache_control` na image blokovima. Ista slika poslata na više operacija unutar istog modela može da se kešira.

**Eligible:**
- Damage fotka ide na: classify (Haiku) + damage-analyzer (Sonnet) + calculation (Sonnet). Unutar Sonnet-a, slika može da se kešira između damage-analyzer i calculation poziva — ušteda ~70% druge image-token naplate.
- Za repeat Generate u istom satu, svaki analyzer-ov keširani prompt+slika hit-uje 90%-off rate.

**Pre-uslovi:**
- ≥1024 tokena (mi smo ~2.459 po slici, uvek eligible).
- Isti model. Cache write ≠ shared između Haiku i Sonnet.
- Identičan prompt prefix + slika. Dodavanje `cache_control` zahteva samo marker na poslednjem cacheable bloku.

Dodati `cache_control: { type: 'ephemeral', ttl: '1h' }` na system message + image block u svakom analizatoru.

Očekivana ušteda na pojedinačnom Generate: **~$0,02 (samo calc-extractor + repeat damage path benefit).** Veći payoff je na hot re-runs (korisnik re-klikne Generate u istom satu) — pada na blizu nule.

---

### TIER 3 — kvalitativno-trade-off optimizacije (oprezno)

#### 3.1 Spojiti damage-analyzer + calculation-extractor
Trenutno se preklapaju: damage-analyzer vraća severity / repair approach / hours; calc-extractor šalje istih 5 fotki opet da izvuče damage class / repair method / risks / wheel-alignment / body-paint / plastic-repair / days. Jedan Sonnet poziv po damage fotki može da vrati oba bloka.

Ušteda: 1 ceo Sonnet image-token charge × 5 fotki = ~$0,04/gutachten.

Rizik: veći output token budget po fotki (~2,5k vs 2k). Schema je kompleksnija; teže za debug. Pažljivo testirati pre shippovanja.

**Preporuka:** Odložiti dok Tier 1+2 ne padnu. Re-evaluirati kad imamo data o real-world cost gutachtenа.

#### 3.2 Two-stage damage analysis
Pokrenuti jeftin Haiku triage na damage fotke: "da li je ovo jasna manja ogrebotina ili nešto više?" Ako manja, preskoči Sonnet damage poziv i koristi Haiku output. Ako bilo šta drugo, eskaliraj na Sonnet.

Rizik: pogrešna klasifikacija "manje" štete koja je zapravo strukturalna. Insurance reports zahtevaju tačnost. **Ne preporučuje se za ovaj proizvod.**

#### 3.3 Preskoči AI VIN fallback kad je WMI nedvosmislen
Ako `wmiManufacturer(vin)` vraća non-null mapping I NHTSA vraća **bilo koji** model/year/displacement (čak i pri niskoj confidence), veruj merge umesto poziva Haiku VIN-decode. Štedi 1 Haiku text poziv (~$0,0003 — malo) ali smanjuje varijaciju u manufacturer polju. Već delimično urađeno u WMI override prošle nedelje.

---

## 5. Cost projekcije

Po gutachtenu od 12 fotki. "Heavy month" = 200 gutachtenа/mesec za jednog korisnika.

| Scenario | Po gutachtenu | Heavy month (200 runs) |
|---|---:|---:|
| **Status quo (danas)** | $0,12–0,15 | $24–30 |
| **+ Tier 1.1 (classify na previewUrl)** | $0,10–0,12 | $20–24 |
| **+ Tier 1.3 (right-sized variants za overview/calc)** | $0,06–0,09 | $12–18 |
| **+ Tier 1.2 (trajni content-hash keš)** | $0,05–0,07 *prvi run; subsequent re-Generate praktično $0* | $8–12 |
| **+ Tier 2 (Anthropic prompt cache)** | $0,04–0,06 | $6–10 |
| **Svi tiers + Tier 3.1 merge** | $0,03–0,05 | $4–8 |

(Sve u USD; rasponi zbog mix-a fotki po gutachtenu.)

Za Audi A6 test specifično (12 fotki, 5 damage):
- **Danas:** ~$0,13
- **Tier 1 only:** ~$0,06
- **Tier 1+2:** ~$0,045
- **Svi tiers:** ~$0,035

---

## 6. Plan implementacije

### Faza A — Tier 1 (očigledne pobede) — ~½ dan
1. **Dodati `classify` variant** (ili reuse `previewUrl`). Update `process` rute da generiše; update svakog analizatora da fetch-uje pravi variant.
   - `src/app/api/reports/[id]/photos/process/route.ts`
   - `src/lib/ai/classifier.ts` → koristi `previewUrl || aiUrl || url`
   - `src/lib/ai/overview-analyzer.ts` → koristi `previewUrl || aiUrl || url`
   - `src/lib/ai/calculation-extractor.ts` → koristi `previewUrl || aiUrl || url` za svaki input
   - Zadržati `aiUrl` za damage-analyzer, interior-analyzer, tire-analyzer, ocrDocument, detectVin, detectPlate
2. **Zameniti URL hashCode sa SHA-256 image bytes-a**.
   - Novi helper `sha256OfBytes(buffer)` u `src/lib/ai/fetch-image.ts`.
   - Tokom `/photos/process`, izračunati i sačuvati `Photo.contentHash` (nova schema kolona).
3. **Dodati `AiResult` tabelu** keyed by `(contentHash, operation, locale, promptVersion)`.
   - Prisma migracija.
   - Wrapper u `src/lib/ai/cache.ts` koji prvo proverava DB, fallback na in-memory.
   - Svaki analyzer ima svoj `promptVersion` constant; bump-uje se kad se prompt menja.
4. **Dedupe upload-a po content hash-u**.
   - U photo upload ruti: ako `contentHash` matches postojeću Photo na ovom gutachtenu, vrati postojeći record bez re-store.

Verifikacija:
- Re-run Audi A6 test set na fresh deploy. Pratiti dev console za "cache hit" log-ove.
- Proveriti Prisma DB posle run-a — `AiResult` tabela popunjena sa 26 redova.
- Klik Generate ponovo na isti gutachten — očekuj 0 novih API poziva.

### Faza B — Tier 2 (Anthropic prompt caching) — ~½ dan
5. Dodati `cache_control: { type: 'ephemeral', ttl: '1h' }` na image+system blokove u svakom analyzer pozivu. Verifikovati da je `cache_creation_input_tokens > 0` na prvom pozivu i `cache_read_input_tokens > 0` na narednim.

Verifikacija:
- Anthropic dashboard ili `usage` polje na response — cache hit metrike kao `summary.cacheHitTokens`.

### Faza C — Tier 3.1 (merge damage + calc) — ~1 dan, samo ako budget targets traže
6. Proširiti `damage-analyzer` schema sa calc poljima. Aggregate na pipeline nivou umesto odvojenog Sonnet poziva.

### Out of scope (ne preporučuje se)
- Two-stage Haiku→Sonnet damage triage (Tier 3.2).
- Switching na Batch API (synchronous user flow, ne fit).

---

## 7. Quality safeguards

Da bi dokazao "no quality loss" claims:
- **Snapshot test**: zaključati postojeći 12-photo Audi A6 rezultat kao gold standard. Posle svake faze, re-run i diff vehicle/condition/markers polja. Bilo koji regress na netrivijalnom polju blokira change.
- **Manual review**: spot-check nemački PDF posle Faze A i Faze B. Bilo koja vidljiva degradacija = roll back.
- **Token-counter sanity check**: koristiti Anthropic [token-counting endpoint](https://platform.claude.com/docs/en/build-with-claude/token-counting) jednom pre Faze A da se formula assumptions verifikuju za ovaj account.

---

## 8. Šta NE raditi

- Ne smanjivati damage / plate / VIN / document / tire variants ispod 1568 px. OCR-style zadaci traže tu rezoluciju; "ušteda" 0,5¢ po pozivu vraća se kao netačnost koja košta korisnika realnu procenu.
- Ne kolapsirati 1h cache TTL. Reports često se re-Generate-uju u istom satu dok korisnik puni ostatak forme.
- Ne migrirati sve na Haiku radi uštede. Sonnet na damage analizi je defining quality moat — Haiku promaši suptilne pukotine i gubi se u kompleksnim repair preporukama.
- Ne kompresovati JPEG ispod ~80% kvaliteta. Vidljivi artefakti čine AI procene noisy čak i kad token cost je identičan.

---

## 9. Otvorena pitanja za verifikaciju

1. **Potvrditi token cost na 1568 px granici.** Anthropic docs spominju "max 1568 image tokens" za non-Opus modele. Treba jedan poziv na token-count endpoint sa 1568×1176 JPEG-om da se potvrdi da li je actual billing formula 2.459 ili capped na 1568. Utiče na exact numbers iznad za faktor 1,5×.
2. **Cache_control TTL u prod.** Potvrditi da je `1h` TTL trenutno dozvoljen za naš account/tier (neki account types dozvoljavaju samo 5m).
3. **Batch API**: i dalje van stola za live Generate, ali korisno znati za eventualni budući "bulk re-process all reports" admin tool.

---

## 10. Preporučen redosled izvršavanja

Ako user odobri: **Faza A → meri → Faza B → meri**. Tier 3 samo ako post-A+B brojke ne pogode target.

Ukupno engineering vreme: **~1 dan za Faze A+B**, ~1 dan više za Fazu C.
Očekivana cost reduction: **65–75%** uz isti kvalitet.

Pending odobrenje za start sa Fazom A.
