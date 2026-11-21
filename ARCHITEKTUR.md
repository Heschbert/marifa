# Wissensfundament – Aufbau und Erweiterung

Kein Build-Schritt: Der Browser lädt die Dateien direkt. Geänderte Dateien werden einfach neu hochgeladen.
Nach einem Update `VERSION` in `sw.js` erhöhen, damit Geräte mit der installierten App den alten Cache verwerfen.

## Wo was steht
- `js/main.js` – **einzige Liste aller Bausteine** (import-Zeilen). Feature an- oder abschalten = Zeile ein- oder auskommentieren.
- `js/core.js` – Namensraum `WF`, Hilfsfunktionen, Ereignisse (`WF.on`/`WF.emit`), `WF.registerMode`, `WF.registerEntry`.
- `js/store.js` – Speicher (localStorage), Export/Import, Umzug von IDs.
- `js/data.js` + `gen.js`, `geo.js`, `pairs.js` – Fragen laden bzw. erzeugen.
- `js/engine.js` – Spiellogik ohne Oberfläche. `js/modes.js` – Spielmodi.
- `js/ui.js` – Bildschirme Spielen, Lernen, Profil, Quiz, Ergebnis.
- Features, je eine Datei: `duel`, `cards`, `browse` (Suche), `stats` (Verlauf), `reports` (gemeldete Fragen), `share` (Tagesrätsel teilen), `fx` (Vibration/Ton), `conf` (Wie sicher bist du?), `timeline` (Zeitstrahl), `estimate` (Schätzfragen + Modus Schätzen), `duellink` (Duell per Link), `typein` (freie Eingabe), `wall` (Mauer im Profil), `badges`, `entries` (Menüeinträge der eingebauten Modi).
- `icon.svg` – Vorlage des App-Symbols; die PNGs (180, 192, 512, maskable) sind daraus gerendert.
- `fonts/` – Schrift Inter, lokal (keine Verbindung zu Google).

## Neues Feature hinzufügen
1. Datei `js/meinfeature.js` anlegen (Muster: `js/share.js`).
2. Darin nach Bedarf:
   - `WF.registerEntry({ where, order, render(ctx) })` – Eintrag an einer Stelle der Oberfläche.
     `where`: `home`, `areas`, `scope`, `result`, `profiletop`, `profile`, `settings`. `render` gibt HTML oder `""` zurück.
   - `WF.ui.H.meineAktion = function (data, element) {…}` – reagiert auf Buttons mit `data-act="meineAktion"`.
     Eingabefelder mit `data-input="name"` rufen `H.name(feld)` bei jeder Eingabe auf.
   - `WF.on("answered" | "roundEnd" | "toast", fn)` – auf Ereignisse reagieren.
   - `WF.registerMode({...})` – neuer Spielmodus (siehe `js/modes.js`).
3. In `js/main.js` eine `import`-Zeile ergänzen.

Neue Felder im Speicher: in `fresh()` in `js/store.js` eintragen, dann bekommen auch alte Spielstände den Standardwert.

## Fragen
- Neues Thema: Eintrag in `data/index.json` und eine JSON-Datei.
- Jede Frage hat eine feste `id`. Der Text darf geändert werden, der Lernstand bleibt erhalten. **Die `id` nie ändern.**
- Bei Paar-Tabellen (`pairs.json`) hängt die ID an Thema + Unterbereich + erstem Feld der Zeile, bei `geo.json` am Land bzw. an Stadt + Land.
- Verrät ein Hinweis die Lösung (Lösungswort im Hinweis), warnt das Prüfskript; harmlose Treffer mit `"hintOk": true` markieren. Hinweise erzeugter Fragen entstehen erst beim Mischen und verraten nie die Lösung.
- Ist die richtige Antwort deutlich länger als alle falschen, warnt das Prüfskript (Rate-Hinweis). Ist die Länge unvermeidlich (Eigennamen, Titel), `"lenOk": true` setzen.
- Vor dem Hochladen prüfen (Node.js nötig):
  - `node tools/check.mjs` – findet Fehler (fehlende/doppelte IDs, falsche Unterbereiche, nicht genau 4 Antworten …).
  - `node tools/check.mjs --fix-ids` – ergänzt fehlende IDs bei neuen Fragen.

## Schätzfragen
`data/schaetzen.json`: Liste aus `{ "id", "c" (Thema), "q", "a" (Zahl), "u" (Einheit), "e" (Erklärung), "kind": "year" (optional) }`.
Punkte: höchstens 2 % / 10 % / 25 % daneben = 3 / 2 / 1 Punkte; bei Jahreszahlen 1 / 5 / 20 Jahre.

## Neue Fragen hinzufügen
- `LEITFADEN-FRAGEN.md`: Format und Qualitätsregeln, zum Weitergeben an einen Fragen-Agenten (z. B. Claude mit Websuche).
- `node tools/merge.mjs neue-fragen.json --probe` prüft, `node tools/merge.mjs neue-fragen.json` spielt ein.
  Gleiche Fragen werden übersprungen, ähnliche zur Prüfung abgelegt, fehlerhafte gesammelt.

## Testen
Wegen `fetch` und ES-Modulen geht es nicht per Doppelklick auf `index.html`, sondern nur über einen Webserver,
z. B. `python3 -m http.server` im Ordner, dann http://localhost:8000 öffnen.
