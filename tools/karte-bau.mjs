// Erzeugt data/karte.json: Ländergrenzen als SVG-Pfade (Projektion Natural Earth, Breite 1000) für die Kartenfragen.
// Quelle: world-atlas (ISC-Lizenz), abgeleitet aus Natural Earth (gemeinfrei). Nur bei Bedarf neu erzeugen:
//   npm install world-atlas@2.0.2 topojson-client@3.1.0 d3-geo@3.1.1 i18n-iso-countries@7.14.0   (in einem leeren Ordner)
//   NODE_PATH=<ordner>/node_modules node tools/karte-bau.mjs <ordner>/node_modules
import { readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";
const nm = process.argv[2];
const req = createRequire(nm + "/");
const topo = req("topojson-client"), d3 = req("d3-geo"), iso = req("i18n-iso-countries");
const world = JSON.parse(readFileSync(nm + "/world-atlas/countries-110m.json", "utf8"));
const fc = topo.feature(world, world.objects.countries);
const W = 1000, proj = d3.geoNaturalEarth1().fitWidth(W, { type: "Sphere" });
const path = d3.geoPath(proj).digits(1);
const H = Math.ceil(d3.geoPath(proj).bounds({ type: "Sphere" })[1][1]);
const out = { w: W, h: H, src: "Natural Earth über world-atlas (ISC)", c: {} };
for (const f of fc.features) {
  const a2 = iso.numericToAlpha2(f.id);
  if (!a2) continue;
  const d = path(f); if (!d) continue;
  const b = path.bounds(f);
  out.c[a2] = { d, b: b.flat().map(v => Math.round(v * 10) / 10) };
}
writeFileSync(new URL("../data/karte.json", import.meta.url), JSON.stringify(out));
console.log(Object.keys(out.c).length, "Länder, Höhe", H, "Größe", (JSON.stringify(out).length / 1024).toFixed(0), "KB");
