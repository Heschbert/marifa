#!/usr/bin/env node
/* Prüfskript für die Fragen in data/. Ändert nichts, außer mit --fix-ids.
   Aufruf:  node tools/check.mjs            prüfen
            node tools/check.mjs --fix-ids  fehlende IDs ergänzen (aus dem Fragetext, wie die App es früher tat)
   Mit "lenOk": true lässt sich bei einer Frage die Längen-Warnung abschalten, wenn die Länge unvermeidlich ist (Eigennamen, Titel).
   Fehler (Exit-Code 1) brechen die App oder verfälschen den Lernstand. Warnungen sind Hinweise zur Qualität. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const FIX = process.argv.includes("--fix-ids");
const errors = [], warns = [];
const err = (f, m) => errors.push(f + ": " + m), warn = (f, m) => warns.push(f + ": " + m);

/* Muss identisch zu WF.util.hash in js/core.js sein. */
function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
function load(f) { try { return JSON.parse(readFileSync(join(DATA, f), "utf8")); } catch (e) { err(f, "kein gültiges JSON (" + e.message + ")"); return null; } }

const idx = load("index.json");
if (!idx) { report(); process.exit(1); }
const subsOf = {}, ids = {}, texts = {}, keys = {};
let total = 0, longest = 0, mcCount = 0;

for (const t of idx.topics || []) {
  if (!t.c || !t.file || !Array.isArray(t.subs)) { err("index.json", "Thema unvollständig: " + JSON.stringify(t).slice(0, 80)); continue; }
  subsOf[t.c] = t.subs;
  if (!existsSync(join(DATA, t.file))) { err("index.json", "Datei fehlt: " + t.file); continue; }
  const list = load(t.file);
  if (!Array.isArray(list)) { if (list) err(t.file, "muss eine Liste sein"); continue; }
  let changed = false;
  list.forEach((q, i) => {
    const at = t.file + " #" + (i + 1), short = String(q.q || "").slice(0, 60);
    total++; mcCount++;
    if (!q.q || typeof q.q !== "string") err(at, "Fragetext fehlt");
    if (!t.subs.includes(q.s)) err(at, "Unterbereich „" + q.s + "“ steht nicht in index.json (" + short + ")");
    if (!Array.isArray(q.a) || q.a.length !== 4) err(at, "braucht genau 4 Antworten (" + short + ")");
    else {
      if (q.a.some(a => !a || typeof a !== "string")) err(at, "leere Antwort (" + short + ")");
      if (new Set(q.a.map(a => String(a).trim())).size !== 4) err(at, "doppelte Antwort (" + short + ")");
      /* Rate-Hinweis: Ist die richtige Antwort deutlich die längste, wählt man sie auch ohne Wissen. */
      const lr = String(q.a[0]).length, lw = Math.max(...q.a.slice(1).map(a => String(a).length));
      if (lr > lw) longest++;
      if (lr >= lw * 1.5 && lr - lw >= 10 && !q.lenOk) warn(at, "richtige Antwort deutlich länger als alle falschen (" + lr + " zu " + lw + " Zeichen): " + short);
    }
    if (q.w) {
      if (!Array.isArray(q.w) || q.w.length !== (q.a || []).length) err(at, "w muss so viele Einträge wie a haben (" + short + ")");
      else {
        if (q.w[0]) warn(at, "w[0] gehört zur richtigen Antwort und sollte leer sein (" + short + ")");
        q.w.slice(1).forEach((w, k) => { if (!w) warn(at, "Begründung fehlt für „" + q.a[k + 1] + "“"); });
      }
    } else warn(at, "keine Begründungen (w) (" + short + ")");
    if (!q.e) warn(at, "keine Erklärung (e) (" + short + ")");
    if (!q.h) warn(at, "kein Hinweis (h) (" + short + ")");
    if (q.d !== undefined && ![1, 2, 3].includes(q.d)) err(at, "d muss 1, 2 oder 3 sein (" + short + ")");
    if (!q.id) {
      if (FIX && q.q) { list[i] = Object.assign({ id: hash(q.q) }, q); changed = true; }
      else err(at, "keine id – mit --fix-ids ergänzen (" + short + ")");
    }
    const id = list[i].id;
    if (id) { if (ids[id]) err(at, "id „" + id + "“ doppelt, auch in " + ids[id]); else ids[id] = at; }
    const k = String(q.q || "").trim().toLowerCase();
    if (k) { if (texts[k]) warn(at, "gleicher Fragetext wie " + texts[k]); else texts[k] = at; }
  });
  if (changed) { writeFileSync(join(DATA, t.file), "[\n" + list.map(q => JSON.stringify(q)).join(",\n") + "\n]\n"); console.log("IDs ergänzt: " + t.file); }
}

for (const x of idx.extras || []) {
  if (!existsSync(join(DATA, x.file))) { err("index.json", "Datei fehlt: " + x.file); continue; }
  const j = load(x.file); if (!j) continue;
  if (x.builder === "pairs") {
    (j.sets || []).forEach((S, i) => {
      const at = x.file + " Set " + (i + 1);
      if (!subsOf[S.c] || !subsOf[S.c].includes(S.s)) err(at, "Thema/Unterbereich unbekannt: " + S.c + " / " + S.s);
      if (!S.q1) err(at, "q1 fehlt");
      const seen = {};
      (S.rows || []).forEach(r => {
        const p = r.split("|");
        if (p.length < 2 || !p[0] || !p[1]) err(at, "Zeile unvollständig: " + r);
        if (S.year && isNaN(+p[1])) err(at, "Jahr ist keine Zahl: " + r);
        const key = "pairs|" + S.c + "|" + S.s + "|" + p[0];
        if (seen[p[0]] || keys[key]) err(at, "doppelte Zeile (die ID hängt an Thema, Unterbereich und erstem Feld): " + p[0]); seen[p[0]] = keys[key] = 1;
        total += S.q2 ? 2 : 1;
      });
    });
  } else if (x.builder === "geo") {
    Object.keys(j).forEach(sub => {
      const at = x.file + " " + sub;
      if (!(subsOf.Geographie || []).includes(sub)) err(at, "Unterbereich fehlt in index.json bei Geographie");
      ["caps", "cities"].forEach(k => String(j[sub][k] || "").split(";").filter(Boolean).forEach(r => {
        const p = r.split("|"); if (p.length < 2 || !p[0] || !p[1]) { err(at, k + ": Zeile unvollständig: " + r); return; }
        total += k === "caps" ? 2 : 1;
        const key = k === "caps" ? "cap|" + p[0] : "city|" + p[0] + "|" + p[1];
        if (keys[key]) err(at, k + ": doppelt (gleiche ID): " + r); keys[key] = 1;
      }));
    });
  } else warn("index.json", "unbekannter Baustein „" + x.builder + "“ wird nicht geprüft");
}

report();
process.exit(errors.length ? 1 : 0);

function report() {
  const show = (title, l, max) => { if (!l.length) return; console.log("\n" + title + " (" + l.length + ")"); l.slice(0, max).forEach(m => console.log("  " + m)); if (l.length > max) console.log("  … und " + (l.length - max) + " weitere (--all zeigt alle)"); };
  const all = process.argv.includes("--all") ? 1e9 : 40;
  show("FEHLER", errors, all); show("Warnungen", warns, all);
  if (mcCount) console.log("\nInfo: Bei " + longest + " von " + mcCount + " Fragen (" + Math.round(100 * longest / mcCount) + " %) ist die richtige Antwort die längste. Bei Zufall wären es etwa 25 %.");
  console.log("\nGeprüft: etwa " + total + " Fragen. " + (errors.length ? errors.length + " Fehler." : "Keine Fehler.") + " " + warns.length + " Warnungen.");
}
