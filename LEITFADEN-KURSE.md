# Leitfaden: Kurse anlegen

Kurse vermitteln gezieltes Fachwissen. Jedes Thema (Batteriespeicher, KI, agile Softwareentwicklung,
Verbrennungsmotor, Vokabeln …) folgt derselben Struktur. Es ist kein Code nötig, nur eine JSON-Datei.

## Aufbau

```
Kurs
 └ Stufen        1 Grundlagen · 2 Fortgeschritten · 3 Experte
   └ Module      je Modul ein Thema, endet mit Modultest (ab 80 %), schaltet das nächste Modul frei
     └ Lektionen 3–5 Minuten: Lerntext → „Das Wichtigste“ → Quellen → Karteikarten → Übung
 └ Abschlussprüfung (20 Fragen aus allen Modulen, ab 80 %) → Zertifikat im Profil
```

Module ohne Lektionen erscheinen als „In Vorbereitung“. So ist der ganze Lehrplan von Anfang an sichtbar.

## Neuen Kurs anlegen

1. Datei `data/courses/<id>.json` anlegen (Vorlage: `bess.json`).
2. In `data/courses/index.json` eintragen: `{ "id": "<id>", "file": "<id>.json", "fac": "<Fakultät>" }`.
   Fakultäten stehen unter `faculties` (id, t, ico, sub). Geplante Kurse ohne Inhalt unter `planned` erscheinen als „In Vorbereitung“.
3. `node tools/check-courses.mjs` muss 0 Fehler melden.
4. `node tools/version.mjs` und hochladen.

## Felder

- Kurs: `id`, `title`, `sub`, `audience`, `stand` (z. B. "11/2026"), `review` (wer hat fachlich geprüft), `levels`, `modules`.
- Modul: `id`, `level`, `title`, `desc`, `lessons`.
- Lektion: `vol` (optional, true = Regeln/Marktdaten, App zeigt Prüfalter), `id`, `title`, `min`, `body` (Absätze; "## " am Anfang = Zwischenüberschrift), `key` (Kernaussagen),
  `src` (Quellen: `{ "n": Name, "u": Link }`), `cards` (`{ id, f: Vorderseite, b: Rückseite }`), `qs` (Fragen).
- Fragen (`e` = Erklärung ist Pflicht):
  - `mc`: `o` Optionen, `a` Index der richtigen
  - `multi`: `o` Optionen, `a` Liste der richtigen Indizes (mindestens 2)
  - `order`: `o` in RICHTIGER Reihenfolge (die App mischt)
  - `num`: `a` Zahl, `unit` Einheit, `tol` erlaubte Abweichung

## Bilder und Animationen

`figs` in einer Lektion: `{ "after": <Absatz-Index>, "src": "img/…", "cap": "…" }` für ein Bild oder
`{ "after": …, "w": "<name>", "cap": "…" }` für eine interaktive Animation aus `js/kurswidgets.js`
(vorhanden: coin, birthday, tree2, dice, bayes, monty, galton, normal, pi).

## IDs

`<kurs>.m<n>.l<n>.q<n>` bzw. `.k<n>`. Der Lernstand hängt an den IDs: Fragen nur hinten anhängen,
bestehende IDs nicht umnummerieren.

## Qualitätsregeln

- Jede Lektion nennt Quellen mit Link, bevorzugt Primärquellen (Gesetz, Behörde, Norm, Studie, Datenblatt).
- Vorschriften, Marktdaten und Forschungsstand mit Stand-Datum; regelmäßig neu prüfen.
- Keine Zahl ohne Quelle. Unsicheres als „gilt als“ / „Stand …“ kennzeichnen.
- `review` ehrlich ausfüllen: Erst nach Prüfung durch eine Fachperson „fachlich geprüft“ schreiben.

## Vokabeln und andere Themen

Vokabeln: Lektion = Wortfeld, `body` kurz (Grammatik-Hinweis), `cards` = Wort ↔ Übersetzung,
`qs` = Übersetzung wählen (`mc`) oder Satzglieder ordnen (`order`). Alles andere bleibt gleich.

Die Quelldateien des Batteriespeicher-Kurses liegen als Python-Skripte in `tools/kurs-bess-quelle.py` (Modul 1) und `tools/kurs-bess-m2-8.py`
(erzeugt `bess.json`). Der Kurs Wahrscheinlichkeit & Statistik entsteht aus `tools/kurs-wkeit/` (`python3 tools/kurs-wkeit/main.py`), der Kurs Motorsteuergerät verstehen aus `tools/kurs-ecu/` (`python3 tools/kurs-ecu/main.py`), die übrigen Fahrzeugtechnik-Kurse (diag, eu7, net, sec, ad) aus `tools/kurs-auto/` (`python3 tools/kurs-auto/main.py`; Längenausgleich in `fix.py`).
Neue Kurse können direkt als JSON geschrieben werden.
