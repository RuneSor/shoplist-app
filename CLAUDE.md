# shoplist-app (Handleliste)

Se README.md for funksjoner, filer og lagringsnøkler.

## Konvensjoner
Følger `~/projects/knowledge-wiki/wiki/web/convention-single-file-html-app.md`:
- Én `index.html`, ingen rammeverk og ingen byggesteg. Tilstanden ligger i `state`, og endringer kaller `save()` + `render()`.
- localStorage bare via `storageGet`/`storageSet`/`storageRemove` (try/catch). Nøklene har versjon (`_v1`).
  Ved inkompatible endringer: ny versjon + migrering i `migrateStorage()` ved oppstart.
- Brukertekst settes med `textContent`, aldri `innerHTML`.
- Identifikatorer og kodekommentarer på engelsk, UI på norsk (bokmål).

## Ved hver endring
- Øk `CACHE` i `sw.js` (`handleliste-vN`).
- Ny fil som skal virke offline legges i `APP_SHELL` i `sw.js`.

## Arbeidsflyt
Branch → brukeren tester lokalt og på iPhone → PR → brukeren merger. Aldri push direkte til main.
