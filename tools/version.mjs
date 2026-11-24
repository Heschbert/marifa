#!/usr/bin/env node
/* Neue App-Version setzen: node tools/version.mjs 1.15
   Ändert WF.VERSION und WF.BUILD (heutiges Datum) in js/core.js und den Cache-Namen in sw.js.
   Ohne Angabe wird die letzte Stelle um 1 erhöht (1.14 → 1.15). */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const coreP = join(ROOT, "js", "core.js"), swP = join(ROOT, "sw.js");
let core = readFileSync(coreP, "utf8"), sw = readFileSync(swP, "utf8");
const cur = (core.match(/WF\.VERSION = "([^"]+)"/) || [])[1];
if (!cur) { console.log("WF.VERSION nicht gefunden in js/core.js"); process.exit(1); }
let next = process.argv[2];
if (!next) { const p = cur.split("."); p[p.length - 1] = String(+p[p.length - 1] + 1); next = p.join("."); }
if (!/^\d+(\.\d+)*$/.test(next)) { console.log("Version bitte als Zahl wie 1.15 angeben."); process.exit(1); }
const today = new Date().toISOString().slice(0, 10);
core = core.replace(/WF\.VERSION = "[^"]+"/, 'WF.VERSION = "' + next + '"').replace(/WF\.BUILD = "[^"]+"/, 'WF.BUILD = "' + today + '"');
sw = sw.replace(/const VERSION = "[^"]+"/, 'const VERSION = "wf-' + next + '"');
writeFileSync(coreP, core); writeFileSync(swP, sw);
console.log("Version " + cur + " → " + next + " (Stand " + today + "). Jetzt die App hochladen.");
