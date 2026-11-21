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
- Features, je eine Datei: `duel`, `cards`, `browse` (Suche), `stats` (Verlauf), `reports` (gemeldete Fragen), `share` (Tagesrätsel teilen), `fx` (Vibration/Ton), `badges`, `entries` (Menüeinträge der eingebauten Modi).

## Neues Feature hinzufügen
1. Datei `js/meinfeature.js` anlegen (Muster: `js/share.js`).
2. Darin nach Bedarf:
   - `WF.registerEntry({ where, order, render(ctx) })` – Eintrag an einer Stelle der Oberfläche.
     `where`: `home`, `areas`, `scope`, `result`, `profile`, `settings`. `render` gibt HTML oder `""` zurück.
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
- Vor dem Hochladen prüfen (Node.js nötig):
  - `node tools/check.mjs` – findet Fehler (fehlende/doppelte IDs, falsche Unterbereiche, nicht genau 4 Antworten …).
  - `node tools/check.mjs --fix-ids` – ergänzt fehlende IDs bei neuen Fragen.

## Testen
Wegen `fetch` und ES-Modulen geht es nicht per Doppelklick auf `index.html`, sondern nur über einen Webserver,
z. B. `python3 -m http.server` im Ordner, dann http://localhost:8000 öffnen.
