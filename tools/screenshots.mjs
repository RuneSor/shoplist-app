// Generates the README screenshots in screenshots/ (iPhone 13 viewport, light/dark, no/en).
//
// The app has no package.json on purpose, so Playwright is installed outside the repo:
//
//   mkdir -p /tmp/pw && (cd /tmp/pw && npm i playwright@1)
//   python3 -m http.server 8000          # from the repo root, in another terminal
//   PLAYWRIGHT_DIR=/tmp/pw node tools/screenshots.mjs [baseUrl]
//
// Uses the installed Google Chrome (channel "chrome"), so `npx playwright install` is not needed.
// The service worker is blocked so the shots never come from an old cache.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const pwDir = process.env.PLAYWRIGHT_DIR;
const require = createRequire(pwDir ? path.resolve(pwDir) + "/" : import.meta.url);
let chromium, devices;
try {
  ({ chromium, devices } = require("playwright"));
} catch {
  console.error("Could not load Playwright. Install it outside the repo and set PLAYWRIGHT_DIR (see the top of this file).");
  process.exit(1);
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(repoRoot, "screenshots");
const base = process.argv[2] || "http://localhost:8000/";

try {
  const res = await fetch(base);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
} catch (e) {
  console.error(`The app is not reachable at ${base} (${e.message}). Start: python3 -m http.server 8000`);
  process.exit(1);
}

// Example data (barcodes are just sample numbers)
const item = (id, name, qty = 1, done = false, barcode = null) => ({ id, name, barcode, qty, done });
const LISTS = {
  no: [
    item("a", "Tine Lettmelk 1 l", 2, false, "7038010009457"),
    item("b", "Grove rundstykker", 1),
    item("c", "Bananer", 6),
    item("d", "Gilde Kokt skinke", 1, false, "7037203626563"),
    item("e", "Kaffe", 1),
    item("f", "Egg 12 stk", 1, true),
    item("g", "Smør", 1, true),
  ],
  en: [
    // Keep names short enough for one line, or "Clear checked items" ends up under the scan button
    item("a", "Milk 1 l", 2, false, "7038010009457"),
    item("b", "Wholegrain rolls", 1),
    item("c", "Bananas", 6),
    item("d", "Cooked ham", 1, false, "7037203626563"),
    item("e", "Coffee", 1),
    item("f", "Eggs, 12 pack", 1, true),
    item("g", "Butter", 1, true),
  ],
};

// Previously scanned products for the search shot (handleliste.lookups_v1)
const LOOKUPS = {
  "7038010009457": { no: "Tine Lettmelk 1 l", en: "Tine Semi-skimmed milk 1 l", category: "dairy" },
  "7038010000737": { no: "Tine Helmelk 1 l", en: "Tine Whole milk 1 l", category: "dairy" },
  "7038010055690": { no: "Tine Melkesjokolade-yoghurt", en: "Tine Chocolate yogurt", category: "dairy" },
  "7020655830015": { no: "Møllerens Hvetemel 1 kg", en: "Møllerens Wheat flour 1 kg", category: "pantry" },
  "7040110569908": { no: "Freia Melkesjokolade 200 g", en: "Freia Milk chocolate 200 g", category: "snacks" },
};

const SHOTS = [
  { file: "list-no-light.png", lang: "no", scheme: "light" },
  { file: "list-no-dark.png", lang: "no", scheme: "dark" },
  { file: "list-en-light.png", lang: "en", scheme: "light" },
  { file: "unknown-item-no-dark.png", lang: "no", scheme: "dark", dialog: "Jarlsberg 700 g", code: "7038010013966" },
  { file: "search-no-light.png", lang: "no", scheme: "light", search: "mel" },
];

const browser = await chromium.launch({ channel: "chrome" });
try {
  for (const s of SHOTS) {
    const ctx = await browser.newContext({ ...devices["iPhone 13"], colorScheme: s.scheme, serviceWorkers: "block" });
    await ctx.addInitScript(({ items, lang, lookups }) => {
      localStorage.setItem("handleliste.items_v1", JSON.stringify(items));
      localStorage.setItem("handleliste.lang_v1", lang);
      localStorage.setItem("handleliste.lookups_v1", JSON.stringify(lookups));
    }, { items: LISTS[s.lang], lang: s.lang, lookups: LOOKUPS });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: "load" });
    if (s.dialog) {
      // Same dialog the scanner shows for a barcode Open Food Facts doesn't know
      // (the camera can't run headless). askName/t are globals in the page's classic script.
      await page.evaluate((code) => { askName({ title: t("unknownTitle"), sub: t("unknownSub", code) }); }, s.code);
      await page.waitForTimeout(200);   // askName focuses + selects the field after 50 ms
      // keyboard.type instead of fill(): fill() scrolls the page behind the dialog
      await page.keyboard.type(s.dialog);
      await page.evaluate(() => window.scrollTo(0, 0));
    }
    if (s.search) {
      // Lettmelk is on the list, so it is hidden from the suggestions
      await page.click("#addInput");
      await page.keyboard.type(s.search);
    }
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, s.file) });
    console.log("saved", path.join("screenshots", s.file));
    await ctx.close();
  }
} finally {
  await browser.close();
}
