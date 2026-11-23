# shoplist-app (Handleliste)

Se README.md for funksjoner, filer og lagringsnøkler. README.en.md er den engelske versjonen:
hold de to i takt – en endring i den ene skal med i den andre.

## Konvensjoner
Følger `~/projects/knowledge-wiki/wiki/web/convention-single-file-html-app.md`:
- Én `index.html`, ingen rammeverk og ingen byggesteg. Tilstanden ligger i `state`, og endringer kaller `save()` + `render()`.
- localStorage bare via `storageGet`/`storageSet`/`storageRemove` (try/catch). Nøklene har versjon (`_v1`).
  Ved inkompatible endringer: ny versjon + migrering i `migrateStorage()` ved oppstart.
- Brukertekst settes med `textContent`, aldri `innerHTML`.
- Identifikatorer og kodekommentarer på engelsk. Dokumentasjon (README, CLAUDE.md) på norsk.
- UI-tekst aldri hardkodet: legg den i `I18N` for alle språk og bruk `t("key")` eller `data-i18n*`. Norsk er standard.

## Ved hver endring
- Øk `CACHE` i `sw.js` (`handleliste-vN`).
- Ny fil som skal virke offline legges i `APP_SHELL` i `sw.js`.
- Endret utseende: lag skjermbildene på nytt med `tools/screenshots.mjs` (se README).
  Endrede lagringsnøkler må også oppdateres i skriptet. Legg aldri `package.json` eller `node_modules` i repoet.

## Arbeidsflyt
Branch → brukeren tester lokalt og på iPhone → PR → brukeren merger. Aldri push direkte til main.
