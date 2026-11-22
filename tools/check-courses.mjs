// Prüft die Kursdateien in data/courses: Aufbau, eindeutige IDs, gültige Antworten, Quellen und Erklärungen.
// Aufruf: node tools/check-courses.mjs
import { readFileSync } from "node:fs";
const dir = new URL("../data/courses/", import.meta.url);
const idx = JSON.parse(readFileSync(new URL("index.json", dir)));
let err = 0, warn = 0;
const bad = (m) => { console.log("FEHLER: " + m); err++; }, note = (m) => { console.log("Warnung: " + m); warn++; };
for (const f of idx.courses) {
  const c = JSON.parse(readFileSync(new URL(f.file, dir)));
  const ids = new Set(); let nq = 0, nk = 0;
  for (const k of ["id", "title", "sub", "stand", "levels", "modules", "review"]) if (c[k] === undefined) bad(`${f.file}: Feld ${k} fehlt`);
  const uniq = (id, where) => { if (!id) bad(`${where}: id fehlt`); else if (ids.has(id)) bad(`${where}: id ${id} doppelt`); else ids.add(id); };
  for (const m of c.modules) {
    uniq(m.id, "Modul"); if (!c.levels.some((l) => l.id === m.level)) bad(`${m.id}: Stufe ${m.level} unbekannt`);
    for (const l of m.lessons || []) {
      uniq(l.id, "Lektion");
      if (!l.body || !l.body.length) bad(`${l.id}: kein Lerntext`);
      if (!l.src || !l.src.length) bad(`${l.id}: keine Quellen`);
      for (const s of l.src || []) if (!s.u) note(`${l.id}: Quelle ohne Link: ${s.n}`);
      if ((l.qs || []).length < 5) note(`${l.id}: nur ${(l.qs || []).length} Fragen`);
      for (const k of l.cards || []) { uniq(k.id, "Karte"); nk++; if (!k.f || !k.b) bad(`${k.id}: Vorder- oder Rückseite fehlt`); }
      for (const q of l.qs || []) {
        uniq(q.id, "Frage"); nq++;
        if (!q.q) bad(`${q.id}: Fragetext fehlt`);
        if (!q.e) bad(`${q.id}: Erklärung fehlt`);
        if (q.t === "mc") { if (!Array.isArray(q.o) || q.o.length < 3) bad(`${q.id}: zu wenige Optionen`); if (!(q.a >= 0 && q.a < q.o.length)) bad(`${q.id}: Antwortindex ungültig`); if (new Set(q.o).size !== q.o.length) bad(`${q.id}: doppelte Option`); }
        else if (q.t === "multi") { if (!Array.isArray(q.a) || q.a.length < 2 || q.a.some((a) => !(a >= 0 && a < q.o.length))) bad(`${q.id}: Antworten ungültig`); }
        else if (q.t === "order") { if (!Array.isArray(q.o) || q.o.length < 3) bad(`${q.id}: Reihenfolge braucht mindestens 3 Elemente`); }
        else if (q.t === "num") { if (typeof q.a !== "number") bad(`${q.id}: Zahl fehlt`); }
        else bad(`${q.id}: unbekannter Typ ${q.t}`);
      }
    }
  }
  console.log(`${c.title}: ${c.modules.length} Module (${c.modules.filter((m) => (m.lessons || []).length).length} mit Inhalt), ${nq} Fragen, ${nk} Karten`);
}
console.log(`\n${err} Fehler, ${warn} Warnungen.`);
process.exit(err ? 1 : 0);
