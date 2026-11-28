# Handleliste (shoplist-app)

🇳🇴 Norsk · [🇬🇧 English](README.en.md)

Handleliste som offline-PWA for iPhone, med strekkodeskanner. Ren HTML/CSS/JS uten byggesteg.
Grensesnittet finnes på norsk (standard) og engelsk.

**▶ Åpne appen: [runesor.github.io/shoplist-app](https://runesor.github.io/shoplist-app/)**

<table>
  <tr>
    <td><img src="screenshots/list-no-light.png" width="200" alt="Lys modus"></td>
    <td><img src="screenshots/list-no-dark.png" width="200" alt="Mørk modus"></td>
    <td><img src="screenshots/list-en-light.png" width="200" alt="Engelsk"></td>
    <td><img src="screenshots/unknown-item-no-dark.png" width="200" alt="Ukjent strekkode"></td>
    <td><img src="screenshots/search-no-light.png" width="200" alt="Søk i tidligere varer"></td>
  </tr>
  <tr>
    <td align="center">Lys modus</td>
    <td align="center">Mørk modus</td>
    <td align="center">Engelsk</td>
    <td align="center">Ukjent strekkode</td>
    <td align="center">Søk i tidligere varer</td>
  </tr>
</table>

## Funksjoner
- Legg til varer ved å skrive dem inn eller skanne strekkoden med bakkameraet. På Android (Chrome)
  brukes nettleserens innebygde `BarcodeDetector`, ellers ZXing (iPhone). På Android velges hovedkameraet
  automatisk med kontinuerlig fokus, og knappen ⟳ i skanneren bytter kamera hvis automatikken bommer.
- Skannede varer slås opp i [Open Food Facts](https://world.openfoodfacts.org). Navnet hentes på valgt
  språk når det finnes, og merket legges foran.
- Språkknapp med flagg (🇳🇴/🇬🇧) øverst til høyre bytter språk. Valget styrer både teksten i
  grensesnittet og hvilket produktnavn som hentes fra Open Food Facts (norsk: `nb → no → standard → en`,
  engelsk: `en → standard → nb → no`).
- Skannede varer får et lite produktbilde fra Open Food Facts når det finnes. Bildene caches av service
  workeren (maks 300), så de vises også offline i butikken. Trykk på navnet for å se bildet i stor størrelse
  i dialogen for å endre navn.
- Skannede varer får en kategori (f.eks. «Meieri», «Kjøtt», «Frukt og bær») ut fra `categories_tags` i
  Open Food Facts. Den vises før strekkoden under navnet og følger språkvalget. Uten bilde vises et ikon for
  kategorien (🥛 🥩 🍞 …), og 🛒 for varer uten kategori. Oppslag lagret før kategoriene fantes, oppdateres i
  bakgrunnen ved oppstart.
- Når du skriver i feltet, vises opptil 6 tidligere skannede varer som passer (fra 2 tegn, begge språk,
  også merket). Treff der navnet starter med teksten kommer først. Varer som allerede er på listen skjules.
  Trykk på et treff for å legge det til med strekkode, bilde og kategori. Enter legger til det du har skrevet.
  Historikken er strekkodene i `barcodes_v1` og `lookups_v1`, så søket virker offline. Varer som er skrevet
  inn uten strekkode er ikke med.
- Ukjente strekkoder får et navn du skriver inn. Strekkoden og navnet huskes til neste gang.
- Samme vare to ganger gir høyere antall. En skrevet «Melk» og en skannet «Melk» slås sammen, men
  to ulike strekkoder gjør aldri det.
- Avkryssede varer flyttes til «I handlekurven» og kan fjernes samlet.
- Lys og mørk modus følger systemet. Appen virker offline (bortsett fra produktoppslag).

## Filer
| Fil | Innhold |
|---|---|
| `index.html` | Hele appen: CSS, markup og JS |
| `sw.js` | Service worker. Siden hentes fra nettet først, alt annet fra cachen først. Produktbilder ligger i en egen cache (`handleliste-images-v1`) som beholdes ved oppdatering. Produktoppslag går forbi cachen. |
| `manifest.webmanifest` | PWA-manifest (standalone, portrett) |
| `icons/` | 192, 512 (også maskable) og apple-touch-icon |
| `screenshots/` | Skjermbilder til README (caches ikke av service workeren) |
| `tools/screenshots.mjs` | Lager skjermbildene på nytt (Playwright, se under) |
| `.nojekyll` | Hindrer Jekyll på GitHub Pages |

Alle stier er relative, så appen kan ligge i en undermappe (f.eks. GitHub Pages).

## Lagring (localStorage)
| Nøkkel | Innhold |
|---|---|
| `handleliste.items_v1` | Listen: `{ id, name, barcode, qty, done }[]` |
| `handleliste.barcodes_v1` | Strekkode → navn brukeren har skrevet inn eller endret (vinner over oppslag) |
| `handleliste.lookups_v1` | Strekkode → `{ no, en, image, imageFull, category }` fra Open Food Facts (navn, bilde 200/400 px, kategorinøkkel), så språkbytte ikke krever nytt oppslag |
| `handleliste.lang_v1` | Valgt språk: `no` eller `en` |
| `handleliste.camera_v1` | Kamera valgt med ⟳ (`deviceId`). Mangler = automatisk valg |

Data under de gamle nøklene uten versjon (`handleliste.items`, `handleliste.barcodes`) flyttes
automatisk ved oppstart.

## Avhengigheter
- `@zxing/browser@0.1.5` fra unpkg (låst versjon, caches av service workeren).
- Open Food Facts API v2 (ingen nøkkel).

## Viktig ved oppdatering
Øk `CACHE`-versjonen øverst i `sw.js` (f.eks. fra `handleliste-v4` til `handleliste-v5`) ved hver endring. Ellers kan iOS
fortsette å vise gammel versjon. Bildecachen (`IMAGE_CACHE`) skal ikke økes, bare ved inkompatible endringer.
Lukk og åpne appen (noen ganger to ganger) for å få ny versjon. Nummeret nederst i appen («Versjon 10») er tallet i
`CACHE`, lest fra cachen service workeren har lastet ned, så det viser om telefonen har fått den nye versjonen.

## Test
- Lokalt: `python3 -m http.server 8000` og åpne http://localhost:8000. Kameraet virker på `localhost`.
- iPhone: kameraet krever HTTPS. Appen ligger på GitHub Pages (<https://runesor.github.io/shoplist-app/>), publisert fra `main` / rot.
  Endringer er ute et par minutter etter push til `main`.
  Legg den til på hjemskjermen via Safari → Del → «Legg til på Hjem-skjerm».
- Android uten å publisere: koble telefonen til Macen med USB, åpne `chrome://inspect` → *Port forwarding*
  (`8000` → `localhost:8000`) og åpne `http://localhost:8000` i Chrome på telefonen. `localhost` regnes som
  sikkert, så kameraet virker.
- Linjen nederst i skanneren viser hvilken leser og hvilket kamera som brukes (f.eks.
  `BarcodeDetector · camera2 0, facing back`).
- Ingen automatiske tester. Test manuelt i nettleser, på iPhone og på Android.

## Skjermbilder
Bildene i `screenshots/` lages med `tools/screenshots.mjs` (iPhone 13, lys/mørk modus, norsk/engelsk,
eksempeldata i localStorage). Playwright installeres utenfor repoet, siden appen ikke har avhengigheter.
Skriptet bruker Chrome som allerede er installert.

```sh
mkdir -p /tmp/pw && (cd /tmp/pw && npm i playwright@1)
python3 -m http.server 8000                       # i en annen terminal
PLAYWRIGHT_DIR=/tmp/pw node tools/screenshots.mjs
```

Lag bildene på nytt når utseendet endres.

## Språk
All tekst ligger i `I18N` i `index.html`. Flagg og navn ligger i `LANGS`. Teksten i HTML-en er norsk
(standardspråket), så siden ikke blinker ved lasting. `applyLanguage()` setter tekst på elementer med
`data-i18n`, `data-i18n-placeholder` og `data-i18n-aria`.

Nytt språk: legg til en oppføring i `LANGS` og en i `I18N` med de samme nøklene som `no`, og legg til
navnefeltene i rekkefølgen i `lookupProduct()`. Knappen går gjennom språkene i rekkefølge.

Kategorinavnene ligger under `cat` i `I18N`, og ikonene i `CATEGORY_ICONS`. Reglene som sorterer tagger fra
Open Food Facts inn i kategorier, er `CATEGORY_RULES`. Mest spesifikke tagg sjekkes først.

Varer som allerede står på listen beholder navnet de fikk da de ble lagt til.
Manifestet (navn under ikonet på hjemskjermen) er statisk og på norsk.
