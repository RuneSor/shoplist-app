# Handleliste

Handleliste som offline-PWA for iPhone, med strekkodeskanner. Ren HTML/CSS/JS uten byggesteg.

## Funksjoner
- Legg til varer ved å skrive dem inn eller skanne strekkoden (bakkamera, ZXing).
- Skannede varer slås opp i [Open Food Facts](https://world.openfoodfacts.org). Norsk navn brukes
  før andre navn, og merket legges foran.
- Ukjente strekkoder får et navn du skriver inn. Strekkoden og navnet huskes til neste gang.
- Samme vare to ganger gir høyere antall. En skrevet «Melk» og en skannet «Melk» slås sammen, men
  to ulike strekkoder gjør aldri det.
- Avkryssede varer flyttes til «I handlekurven» og kan fjernes samlet.
- Lys og mørk modus følger systemet. Appen virker offline (bortsett fra produktoppslag).

## Filer
| Fil | Innhold |
|---|---|
| `index.html` | Hele appen: CSS, markup og JS |
| `sw.js` | Service worker. Siden hentes fra nettet først, alt annet fra cachen først. Open Food Facts går forbi cachen. |
| `manifest.webmanifest` | PWA-manifest (standalone, portrett) |
| `icons/` | 192, 512 (også maskable) og apple-touch-icon |
| `.nojekyll` | Hindrer Jekyll på GitHub Pages |

Alle stier er relative, så appen kan ligge i en undermappe (f.eks. GitHub Pages).

## Lagring (localStorage)
| Nøkkel | Innhold |
|---|---|
| `handleliste.items_v1` | Listen: `{ id, name, barcode, qty, done }[]` |
| `handleliste.barcodes_v1` | Strekkode → navn for varer som er skannet før |

Data under de gamle nøklene uten versjon (`handleliste.items`, `handleliste.barcodes`) flyttes
automatisk ved oppstart.

## Avhengigheter
- `@zxing/browser@0.1.5` fra unpkg (låst versjon, caches av service workeren).
- Open Food Facts API v2 (ingen nøkkel).

## Viktig ved oppdatering
Øk `CACHE`-versjonen øverst i `sw.js` (f.eks. `handleliste-v3`) ved hver endring. Ellers kan iOS
fortsette å vise gammel versjon. Lukk og åpne appen (noen ganger to ganger) for å få ny versjon.

## Test
- Lokalt: `python3 -m http.server 8000` og åpne http://localhost:8000. Kameraet virker på `localhost`.
- iPhone: kameraet krever HTTPS, så legg appen på GitHub Pages eller Netlify Drop.
  Legg den til på hjemskjermen via Safari → Del → «Legg til på Hjem-skjerm».
- Ingen automatiske tester. Test manuelt i nettleser og på iPhone.
