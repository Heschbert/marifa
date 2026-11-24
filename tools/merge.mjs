#!/usr/bin/env node
/* Neue Fragen einspielen.
   Aufruf:  node tools/merge.mjs neue-fragen.json          prüfen und einspielen
            node tools/merge.mjs neue-fragen.json --probe  nur prüfen, nichts ändern
            node tools/merge.mjs neue-fragen.json --auch-aehnliche   ähnliche Fragen trotzdem übernehmen

   Eingabe: JSON-Liste im Format aus LEITFADEN-FRAGEN.md.
   Ablauf je Frage:
     1. Prüfen (Pflichtfelder, Thema/Unterbereich, 4 verschiedene Antworten, Begründungen, Stufe).
        Fehlerhafte Fragen werden übersprungen und in <datei>.fehler.json gesammelt.
     2. Doppelt? Gleicher Fragetext (ohne Groß/Klein, Satzzeichen, Akzente) wie eine vorhandene oder
        eine frühere Frage derselben Datei: übersprungen.
     3. Ähnlich? Viele gleiche Wörter (≥ 80 %): nicht übernommen, sondern in <datei>.pruefen.json abgelegt.
        Grenze: Dieselbe Frage mit ganz anderen Worten erkennt das Skript nicht.
     4. Neu: ID vergeben und an die Themendatei in data/ anhängen.
   Danach: node tools/check.mjs, VERSION in sw.js erhöhen, App hochladen. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const args = process.argv.slice(2), inFile = args.find(a => !a.startsWith("--"));
const PROBE = args.includes("--probe"), SIMILAR_OK = args.includes("--auch-aehnliche");
if (!inFile) { console.log("Aufruf: node tools/merge.mjs neue-fragen.json [--probe] [--auch-aehnliche]"); process.exit(1); }

function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); } // wie js/core.js
const norm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const STOP = new Set("der die das den dem des ein eine einen einem einer und oder in im an am auf zu zum zur von vom mit fur ist sind war wird welche welcher welches was wer wie wo wann warum wieviel viele hat haben man es sich nicht welchem welchen welcher jahr jahre".split(" "));
const words = t => new Set(norm(t).split(" ").filter(w => w.length > 2 && !STOP.has(w)));
function similar(a, b) {
  if (!a.size || !b.size) return 0;
  let n = 0; a.forEach(w => { if (b.has(w)) n++; });
  const small = Math.min(a.size, b.size);
  /* kurze Einträge (z. B. „Fall der Berliner Mauer 1989“): alle Wörter des kürzeren kommen im längeren vor */
  if (small >= 2 && small <= 4 && n === small) return 1;
  /* gleiche Jahreszahl und bis auf ein Wort gleiche Begriffe: wahrscheinlich dieselbe Frage */
  const year = [...a].some(w => /^\d{3,4}$/.test(w) && b.has(w));
  if (year && small <= 4 && n >= small - 1 && n >= 2) return 1;
  return n / Math.max(a.size, b.size);
}

let input;
try { input = JSON.parse(readFileSync(inFile, "utf8").replace(/^﻿/, "")); }
catch (e) { console.log("Die Datei ist kein gültiges JSON: " + e.message); process.exit(1); }
if (!Array.isArray(input)) input = input.fragen || input.questions || [];
if (!Array.isArray(input) || !input.length) { console.log("Keine Fragen gefunden. Erwartet wird eine JSON-Liste."); process.exit(1); }

const idx = JSON.parse(readFileSync(join(DATA, "index.json"), "utf8"));
const topics = {}; idx.topics.forEach(t => { topics[t.c] = t; });
const files = {}, texts = new Map(), ids = new Set(), bags = [];
idx.topics.forEach(t => {
  const list = JSON.parse(readFileSync(join(DATA, t.file), "utf8")); files[t.file] = list;
  list.forEach(q => { const k = norm(q.q); texts.set(k, t.c + " · " + q.q); ids.add(q.id); bags.push({ w: words(q.q + " " + q.a[0]), label: t.c + " · " + q.q }); });
});

/* Auch die erzeugten Fragen (Jahreszahlen, Paare, Geographie) zählen beim Ähnlichkeitsvergleich mit. */
(idx.extras || []).forEach(x => {
  let j; try { j = JSON.parse(readFileSync(join(DATA, x.file), "utf8")); } catch (e) { return; }
  if (x.builder === "pairs") (j.sets || []).forEach(S => (S.rows || []).forEach(r => { const p = r.split("|"); bags.push({ w: words(p[0] + " " + p[1]), label: S.c + " · " + p[0] + " (" + p[1] + ")" }); }));
  if (x.builder === "geo") Object.keys(j).forEach(sub => ["caps", "cities"].forEach(k => String(j[sub][k] || "").split(";").forEach(r => { const p = r.split("|"); if (p[1]) bags.push({ w: words(p[0] + " " + p[1]), label: "Geographie · " + p[0] + " – " + p[1] }); })));
});
const errors = [], review = [], added = [], dupes = [], warns = [];
input.forEach((raw, i) => {
  const q = Object.assign({}, raw), at = "#" + (i + 1) + " " + String(q.q || "").slice(0, 60), prob = [];
  if (q.thema && !q.c) q.c = q.thema;
  const t = topics[q.c];
  if (!t) prob.push("Thema „" + q.c + "“ unbekannt (erlaubt: " + Object.keys(topics).join(", ") + ")");
  else if (!t.subs.includes(q.s)) prob.push("Unterbereich „" + q.s + "“ gibt es bei " + q.c + " nicht (erlaubt: " + t.subs.join(", ") + ")");
  if (!q.q || typeof q.q !== "string") prob.push("Fragetext fehlt");
  if (!Array.isArray(q.a) || q.a.length !== 4 || q.a.some(a => !a || typeof a !== "string")) prob.push("a braucht genau 4 Antworten als Text, die richtige zuerst");
  else if (new Set(q.a.map(a => a.trim())).size !== 4) prob.push("doppelte Antworten");
  if (!Array.isArray(q.w) || q.w.length !== 4) prob.push("w braucht 4 Einträge (der erste leer)");
  else { if (q.w[0]) q.w[0] = ""; if (q.w.slice(1).some(x => !x)) prob.push("Begründung für eine falsche Antwort fehlt"); }
  if (!q.e) prob.push("Erklärung e fehlt");
  if (!q.h) prob.push("Hinweis h fehlt");
  if (![1, 2, 3].includes(q.d)) prob.push("d muss 1, 2 oder 3 sein");
  if (prob.length) { errors.push({ frage: raw, probleme: prob }); console.log("✗ " + at + "\n    " + prob.join("\n    ")); return; }

  const k = norm(q.q);
  if (texts.has(k)) { dupes.push(at); console.log("= " + at + "  (schon vorhanden: " + texts.get(k).slice(0, 70) + ")"); return; }
  if (q.id && ids.has(q.id)) { dupes.push(at); console.log("= " + at + "  (ID schon vorhanden)"); return; }
  const w = words(q.q + " " + q.a[0]);
  const hit = bags.find(b => similar(w, b.w) >= 0.8);
  if (hit && !SIMILAR_OK) { review.push({ frage: raw, aehnlich_zu: hit.label }); console.log("? " + at + "\n    ähnlich zu: " + hit.label.slice(0, 90)); return; }

  if (!q.src) warns.push(at + ": keine Quelle (src)");
  const lr = q.a[0].length, lw = Math.max(...q.a.slice(1).map(a => a.length));
  if (lr >= lw * 1.5 && lr - lw >= 10) warns.push(at + ": richtige Antwort deutlich länger als die falschen (Rate-Hinweis)");
  let id = q.id || hash(q.q); while (ids.has(id)) id = id + "x";
  const out = { id: id, s: q.s, q: q.q, a: q.a, w: q.w, e: q.e, h: q.h, d: q.d };
  if (q.src) out.src = q.src;
  files[t.file].push(out); ids.add(id); texts.set(k, q.c + " · " + q.q); bags.push({ w: w, label: q.c + " · " + q.q });
  added.push({ file: t.file, at: at });
  console.log("+ " + at + "  → " + t.file);
});

if (warns.length) { console.log("\nHinweise (Fragen wurden trotzdem übernommen):"); warns.forEach(w => console.log("  " + w)); }
const base = inFile.replace(/\.json$/i, "");
if (errors.length) writeFileSync(base + ".fehler.json", JSON.stringify(errors, null, 1));
if (review.length) writeFileSync(base + ".pruefen.json", JSON.stringify(review, null, 1));
if (!PROBE) {
  const touched = new Set(added.map(a => a.file));
  touched.forEach(f => writeFileSync(join(DATA, f), "[\n" + files[f].map(q => JSON.stringify(q)).join(",\n") + "\n]\n"));
}
console.log("\n" + (PROBE ? "PROBELAUF, nichts geändert. " : "") +
  "Neu: " + added.length + " · doppelt übersprungen: " + dupes.length + " · ähnlich, zur Prüfung: " + review.length + " · fehlerhaft: " + errors.length);
if (errors.length) console.log("Fehlerhafte Fragen: " + base + ".fehler.json");
if (review.length) console.log("Ähnliche Fragen: " + base + ".pruefen.json (ansehen; mit --auch-aehnliche trotzdem übernehmen)");
if (added.length && !PROBE) console.log("Als Nächstes: node tools/check.mjs, dann node tools/version.mjs und die App hochladen.");
