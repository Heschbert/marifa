# Wissensfundament – Aufbau und Erweiterung

Kein Build-Schritt: Der Browser lädt die Dateien direkt. Geänderte Dateien werden einfach neu hochgeladen.
Vor jedem Hochladen die Version erhöhen: `node tools/version.mjs` (zählt hoch, z. B. 1.14 → 1.15) oder `node tools/version.mjs 2.0`. Das setzt `WF.VERSION` in `js/core.js` und den Cache-Namen in `sw.js`. Die Version steht unten im Profil; nach einem Update meldet die App „Neue Version … geladen“.

## Wo was steht
- `js/main.js` – **einzige Liste aller Bausteine** (import-Zeilen). Feature an- oder abschalten = Zeile ein- oder auskommentieren.
- `js/core.js` – Namensraum `WF`, Hilfsfunktionen, Ereignisse (`WF.on`/`WF.emit`), `WF.registerMode`, `WF.registerEntry`.
- `js/store.js` – Speicher (localStorage), Export/Import, Umzug von IDs.
- `js/data.js` + `gen.js`, `geo.js`, `pairs.js` – Fragen laden bzw. erzeugen.
- `js/engine.js` – Spiellogik ohne Oberfläche. `js/modes.js` – Spielmodi.
- `js/ui.js` – Bildschirme Spielen, Lernen, Profil, Quiz, Ergebnis.
- Features, je eine Datei: `duel`, `cards`, `browse` (Suche), `stats` (Verlauf), `reports` (gemeldete Fragen), `share` (Tagesrätsel teilen), `fx` (Vibration/Ton), `game` (Sterne, Rekordmeldung), `quests` (Tagesaufgaben, Truhe), `ladder` (Wissensleiter), `conf` (Wie sicher bist du?), `timeline` (Zeitstrahl), `estimate` (Schätzfragen + Modus Schätzen), `duellink` (Duell per Link), `typein` (freie Eingabe), `badges`, `entries` (Menüeinträge der eingebauten Modi).
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

## Seit 1.16
- Fragenauswahl: `st.seen` merkt je Frage den Tag der letzten Anzeige. Heute/gestern Gesehenes wird stark zurückgestellt (engine.js `recency`), neue Fragen bevorzugt, „auto“-Schwierigkeit startet auf mittel.
- `js/safe.js`: Speicher dauerhaft anmelden, Erinnerung „Fortschritt sichern“ (alle 7 Tage ab 30 Antworten), Hinweis „Sicherungscode laden“ bei leerem Spielstand.
- Startseite: `WF.slot(where, ctx, von, bis)` filtert nach order. Home: < 10 Karten, 10–39 Kacheln „Allein spielen“, ab 40 „Mit Freunden“.
- iPhone-Icon zusätzlich als `apple-touch-icon.png` im Hauptordner.
- 1.18: Mauer (`wall.js`) entfernt. Fortschritt = Wissensstand (`E.levelPct`: Stufe 1 = ⅓, 2 = ⅔, ab 3 = ganz), steigt schon mit der ersten richtigen Antwort. Ergebnis zeigt „+n neu gewusst“ je Thema (game.js).

## Seit 2.0 (Marifa)
- App heißt **Marifa**. Speicher-Schlüssel bleibt `wissensfundament-v2`, damit kein Fortschritt verloren geht.
- `js/courses.js`: Kursbereich (Tab „Kurse“). Daten in `data/courses/`, Format in `LEITFADEN-KURSE.md`, Prüfung mit `node tools/check-courses.mjs`.
- Fortschritt je Kurs in `st.course[id]`. Kursantworten zählen für XP, Tagesziel, Serie und Tagesaufgaben, nicht für die Allgemeinwissen-Statistik.
- Weitere Ansichten: `ui.views[name]` wird von `ui.go(name)` und den Tabs gefunden. `ui.show(html, tab, "course")` setzt die Kursfarbe.
- 2.2: Ergebniskopf mit Sternen (Slot `resulthead`, Schwellen 40/60/90 %), erledigtes Tagesrätsel als schmale Zeile, Tagesaufgaben mit Ringen (Blitz-Ziel 7), `js/levels.js`: Levelübersicht (30 Level, `E.MAXLVL`).
