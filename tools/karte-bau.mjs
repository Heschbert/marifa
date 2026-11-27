// Erzeugt data/karte.json für das Kartenquiz: Länder (Flächen), Hauptstädte (Punkte), Flüsse (Linien), Gebirge (Flächen).
// Projektion Natural Earth, Breite 1000. Quellen (gemeinfrei bzw. ISC):
//   Länder: world-atlas 2.0.2 (countries-110m, aus Natural Earth)
//   Hauptstädte, Flüsse, Gebirge: Natural Earth (ne_50m_populated_places_simple, ne_50m_rivers_lake_centerlines,
//   ne_10m_geography_regions_polys) von github.com/nvkelso/natural-earth-vector
// Deutsche Namen von Flüssen und Gebirgen stehen unten fest in RIVERS/MOUNTAINS (Natural Earth hat keine bzw. teils falsche).
// Aufruf:  node tools/karte-bau.mjs <node_modules-Ordner> <Ordner mit den Natural-Earth-GeoJSON-Dateien>
import { readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";
const [nm, neDir] = process.argv.slice(2);
const req = createRequire(nm + "/");
const topo = req("topojson-client"), d3 = req("d3-geo"), iso = req("i18n-iso-countries");
const base = new URL("..", import.meta.url).pathname;
const ne = f => JSON.parse(readFileSync(neDir + "/" + f + ".geojson", "utf8"));

const W = 1000, proj = d3.geoNaturalEarth1().fitWidth(W, { type: "Sphere" });
const H = Math.ceil(d3.geoPath(proj).bounds({ type: "Sphere" })[1][1]);
const r1 = v => Math.round(v * 10) / 10;

/* Geometrie projizieren und vereinfachen: Punkte, die näher als tol Pixel am letzten liegen, fallen weg */
function pathOf(geom, tol, closed) {
  const lines = geom.type === "LineString" ? [geom.coordinates] : geom.type === "MultiLineString" ? geom.coordinates
    : geom.type === "Polygon" ? geom.coordinates : geom.type === "MultiPolygon" ? geom.coordinates.flat() : [];
  let d = "", b = [1e9, 1e9, -1e9, -1e9];
  for (const line of lines) {
    let last = null, part = [];
    for (const c of line) {
      const p = proj(c); if (!p) continue;
      if (last && Math.hypot(p[0] - last[0], p[1] - last[1]) < tol) continue;
      /* Sprünge über die Datumsgrenze: Linie neu beginnen */
      if (last && Math.abs(p[0] - last[0]) > W / 2) { if (part.length > 1) d += seg(part, closed); part = []; }
      part.push(p); last = p;
      b = [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])];
    }
    if (part.length > 1) d += seg(part, closed);
  }
  return { d, b: b.map(r1) };
}
function seg(pts, closed) { return "M" + pts.map(p => r1(p[0]) + "," + r1(p[1])).join("L") + (closed ? "Z" : ""); }

/* Länder */
const world = JSON.parse(readFileSync(nm + "/world-atlas/countries-110m.json", "utf8"));
const fc = topo.feature(world, world.objects.countries);
const path = d3.geoPath(proj).digits(1);
const out = { w: W, h: H, src: "Natural Earth (gemeinfrei), Länder über world-atlas (ISC)", c: {}, caps: [], rv: [], mt: [] };
const featByA2 = {};
for (const f of fc.features) {
  const a2 = iso.numericToAlpha2(f.id); if (!a2) continue;
  const d = path(f); if (!d) continue;
  out.c[a2] = { d, b: path.bounds(f).flat().map(r1) }; featByA2[a2] = f;
}

/* Kontinente der App (data/geo.json) und ISO-Codes (js/flags.js) */
const geo = JSON.parse(readFileSync(base + "data/geo.json", "utf8"));
const ISO = Object.fromEntries([...readFileSync(base + "js/flags.js", "utf8").split("var LOOKALIKE")[0].matchAll(/"([^"]+)": "([A-Z]{2})"/g)].map(m => [m[1], m[2]]));
const regionOfA2 = {}, capOf = {};
for (const [reg, v] of Object.entries(geo)) {
  if (reg === "Deutschland" || !v.caps) continue;
  for (const row of v.caps.split(";")) { const [land, cap] = row.split("|"); if (ISO[land]) { regionOfA2[ISO[land]] = reg; capOf[ISO[land]] = { land, cap }; } }
}
function regionsAt(points) {
  const s = new Set();
  for (const p of points) for (const [a2, f] of Object.entries(featByA2)) if (regionOfA2[a2] && d3.geoContains(f, p)) { s.add(regionOfA2[a2]); break; }
  return [...s];
}
/* Russland zählt in geo.json zu Europa; Flüsse und Gebirge östlich von 60° Länge gehören aber zu Asien */
function fixRegions(r, geom) { const c = d3.geoCentroid({ type: "Feature", geometry: geom }); return r.map(x => x === "Europa" && c[0] > 60 ? "Asien" : x).filter((x, i, a) => a.indexOf(x) === i); }
function samplePoints(geom, n) {
  const all = (geom.type === "LineString" ? [geom.coordinates] : geom.type === "MultiLineString" ? geom.coordinates
    : geom.type === "Polygon" ? geom.coordinates : geom.coordinates.flat()).flat();
  const step = Math.max(1, Math.floor(all.length / n)); return all.filter((_, i) => i % step === 0);
}

/* Hauptstädte: deutsche Namen aus geo.json, Lage aus Natural Earth */
const EN = { "Kopenhagen": "København", "Kiew": "Kyiv", "Astana": "Nur-Sultan" };
const NOT = { TZ: 1, PW: 1 };   /* Natural Earth nennt hier eine andere Stadt als die heutige Hauptstadt */
const skipped = [];
const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
const places = ne("ne_50m_populated_places_simple").features.map(f => f.properties).filter(p => p.adm0cap === 1 || p.featurecla === "Admin-0 capital");
for (const [a2, { land, cap }] of Object.entries(capOf)) {
  const a3 = iso.alpha2ToAlpha3(a2);
  const cand = places.filter(p => p.iso_a2 === a2 || p.adm0_a3 === a3 || p.sov_a3 === a3);
  if (!cand.length) continue;
  /* Nur übernehmen, wenn die Stadt eindeutig passt: gleicher Name, Teilname, englischer Name (EN) oder es gibt nur eine Hauptstadt im Land.
     Sonst lieber weglassen als eine falsche Stadt zeigen (z. B. Tansania: Natural Earth 50m kennt Dodoma nicht als Hauptstadt). */
  const en = EN[cap] ? norm(EN[cap]) : null;
  let best = cand.find(p => norm(p.name) === norm(cap) || (en && norm(p.name) === en)) || cand.find(p => norm(cap).includes(norm(p.name)) || norm(p.name).includes(norm(cap)));
  if (!best && cand.length === 1 && !NOT[a2]) best = cand[0];
  if (!best) { skipped.push(land + " (" + cap + ")"); continue; }
  const xy = proj([best.longitude, best.latitude]);
  out.caps.push({ n: cap, l: land, a: a2, r: regionOfA2[a2], x: r1(xy[0]), y: r1(xy[1]), ne: best.name });
}

/* Flüsse: Natural-Earth-Name(n) → deutscher Name */
const RIVERS = { "Danube": "Donau", "Donau": "Donau", "Rhine": "Rhein", "Rhein": "Rhein", "Elbe": "Elbe", "Oder": "Oder", "Seine": "Seine", "Loire": "Loire", "Rhône": "Rhône",
  "Thames": "Themse", "Po": "Po", "Vistula": "Weichsel", "Dnipro": "Dnepr", "Don": "Don", "Volga": "Wolga", "Ural": "Ural", "Ebro": "Ebro", "Tajo": "Tajo", "Tejo": "Tajo",
  "Dniester": "Dnister", "Garonne": "Garonne", "Duero": "Duero", "Pechora": "Petschora",
  "Nile": "Nil", "Congo": "Kongo", "Niger": "Niger", "Zambezi": "Sambesi", "Orange": "Oranje", "Limpopo": "Limpopo", "Okavango": "Okavango",
  "Amazonas": "Amazonas", "Paraná": "Paraná", "Orinoco": "Orinoco", "Mississippi": "Mississippi", "Missouri": "Missouri", "Yukon": "Yukon", "Mackenzie": "Mackenzie",
  "St. Lawrence": "Sankt-Lorenz-Strom", "Columbia": "Columbia", "Colorado": "Colorado", "Rio Grande": "Rio Grande",
  "Ganges": "Ganges", "Indus": "Indus", "Brahmaputra": "Brahmaputra", "Mekong": "Mekong", "Chang Jiang": "Jangtsekiang", "Yangtze": "Jangtsekiang", "Huang": "Gelber Fluss",
  "Amur": "Amur", "Lena": "Lena", "Ob": "Ob", "Yenisey": "Jenissei", "Irtysh": "Irtysch", "Euphrates": "Euphrat", "Tigris": "Tigris", "Kolyma": "Kolyma", "Syr Darya": "Syrdarja",
  "Jordan": "Jordan", "Murray": "Murray", "Darling": "Darling" };
const rv = {};
/* Gleichnamige Flüsse anderswo ausschließen (z. B. Río Colorado in Argentinien): erlaubter Längengradbereich */
const LON = { "Colorado": [-125, -100], "Don": [30, 50], "Jordan": [34, 37], "Orange": [10, 30] };
for (const f of ne("ne_50m_rivers_lake_centerlines").features) {
  const de = RIVERS[f.properties.name]; if (!de || !f.geometry) continue;
  const lr = LON[f.properties.name]; if (lr) { const c = d3.geoCentroid(f); if (c[0] < lr[0] || c[0] > lr[1]) continue; }
  (rv[de] = rv[de] || []).push(f.geometry);
}
for (const [n, geoms] of Object.entries(rv)) {
  const g = { type: "MultiLineString", coordinates: geoms.flatMap(x => x.type === "LineString" ? [x.coordinates] : x.coordinates) };
  const p = pathOf(g, 0.6, false);
  out.rv.push({ n, d: p.d, b: p.b, r: fixRegions(regionsAt(samplePoints(g, 30)), g) });
}

/* Gebirge: Natural-Earth-NAME → deutscher Name */
const MOUNTAINS = { "ALPS": "Alpen", "ANDES": "Anden", "CAUCASUS MTS.": "Kaukasus", "GREAT DIVIDING RANGE": "Great Dividing Range", "HIMALAYAS": "Himalaya",
  "ROCKY MOUNTAINS": "Rocky Mountains", "TIAN SHAN": "Tian Shan", "URAL MOUNTAINS": "Ural", "APPALACHIAN MTS.": "Appalachen", "ATLAS MOUNTAINS": "Atlas",
  "ALTAY MOUNTAINS": "Altai", "HINDU KUSH": "Hindukusch", "KARAKORAM RA.": "Karakorum", "PAMIRS": "Pamir", "ZAGROS MOUNTAINS": "Zagros", "CARPATHIAN MOUNTAINS": "Karpaten",
  "PYRENEES": "Pyrenäen", "KJØLEN MOUNTAINS": "Skandinavisches Gebirge", "DRAKENSBERG": "Drakensberge", "SIERRA MADRE OCCIDENTAL": "Sierra Madre Occidental",
  "SIERRA MADRE ORIENTAL": "Sierra Madre Oriental", "SOUTHERN ALPS": "Neuseeländische Alpen", "ETHIOPIAN HIGHLANDS": "Äthiopisches Hochland", "KUNLUN MOUNTAINS": "Kunlun",
  "AHAGGAR MTS.": "Ahaggar", "TIBESTI MTS.": "Tibesti", "ELBURZ MTS.": "Elburs", "APPENNINI": "Apennin", "CASCADE RANGE": "Kaskadenkette", "ALASKA RANGE": "Alaskakette",
  "Balkan Mts.": "Balkangebirge", "Dinaric Alps": "Dinarisches Gebirge", "Cord. Cantábrica": "Kantabrisches Gebirge", "PONTIC MOUNTAINS": "Pontisches Gebirge",
  "Erzgebirge": "Erzgebirge", "Harz": "Harz", "Jura": "Jura", "Ardennes": "Ardennen", "Böhmerwald": "Böhmerwald", "Pindus Mts.": "Pindos", "Grampian Mts.": "Grampian Mountains",
  "EASTERN GHATS": "Ostghats", "Lebanon Mts.": "Libanongebirge", "GUIANA HIGHLANDS": "Bergland von Guayana", "SIERRA NEVADA": "Sierra Nevada (USA)",
  "S. Nevada": "Sierra Nevada (Spanien)", "Sierra Morena": "Sierra Morena", "Australian Alps": "Australische Alpen", "Er Rif": "Rif" };
const mt = {};
for (const f of ne("ne_10m_geography_regions_polys").features) {
  const p = f.properties; if (p.FEATURECLA !== "Range/mtn") continue;
  let de = MOUNTAINS[p.NAME]; if (!de || !f.geometry) continue;
  /* „S. Nevada“ / „SIERRA NEVADA“: nach Lage zuordnen (Spanien liegt östlich von -20°) */
  if (/Sierra Nevada/.test(de)) { const c = d3.geoCentroid(f); de = c[0] > -20 ? "Sierra Nevada (Spanien)" : "Sierra Nevada (USA)"; }
  (mt[de] = mt[de] || []).push(f.geometry);
}
for (const [n, geoms] of Object.entries(mt)) {
  const g = { type: "MultiPolygon", coordinates: geoms.flatMap(x => x.type === "Polygon" ? [x.coordinates] : x.coordinates) };
  const p = pathOf(g, 0.8, true);
  out.mt.push({ n, d: p.d, b: p.b, r: fixRegions(regionsAt(samplePoints(g, 30)), g) });
}

writeFileSync(base + "data/karte.json", JSON.stringify(out));
const miss = Object.values(RIVERS).filter((v, i, a) => a.indexOf(v) === i && !rv[v]), missM = Object.values(MOUNTAINS).filter((v, i, a) => a.indexOf(v) === i && !mt[v] && !/Sierra Nevada/.test(v));
console.log(Object.keys(out.c).length, "Länder,", out.caps.length, "Hauptstädte,", out.rv.length, "Flüsse,", out.mt.length, "Gebirge ·", (JSON.stringify(out).length / 1024).toFixed(0), "KB");
if (miss.length) console.log("Flüsse ohne Daten:", miss.join(", "));
if (missM.length) console.log("Gebirge ohne Daten:", missM.join(", "));
console.log("Hauptstädte ausgelassen:", skipped.join(", "));
console.log("Ohne Kontinent:", [...out.rv, ...out.mt].filter(x => !x.r.length).map(x => x.n).join(", "));
