# Leitfaden: Neue Fragen für Wissensfundament

Diesen Text kannst du einem Claude-Chat (am besten mit Websuche) als Anweisung geben.
Das Ergebnis speicherst du als `.json`-Datei und spielst es mit `node tools/merge.mjs datei.json` ein.

---

## Auftrag an den Agenten

Erstelle Quizfragen zum Allgemeinwissen auf Deutsch für die App „Wissensfundament“.
Gib **ausschließlich eine JSON-Liste** aus, ohne Text davor oder danach, ohne Markdown-Codeblock.
Prüfe jede Tatsache mit einer verlässlichen Quelle und trage sie in `src` ein.

## Format pro Frage

```json
{
  "c": "Geschichte",
  "s": "20. Jahrhundert & Gegenwart",
  "q": "In welchem Jahr fiel die Berliner Mauer?",
  "a": [
    "1989",
    "1987",
    "1990",
    "1991"
  ],
  "w": [
    "",
    "1987 hielt Reagan seine Rede „Tear down this wall“, die Mauer stand noch.",
    "1990 war das Jahr der Wiedervereinigung, nicht des Mauerfalls.",
    "1991 zerfiel die Sowjetunion."
  ],
  "e": "Am Abend des 9. November 1989 öffneten sich die Grenzübergänge nach einer missverständlichen Pressekonferenz.",
  "h": "Es war im selben Jahr wie die Montagsdemonstrationen in Leipzig.",
  "d": 1,
  "src": "Bundeszentrale für politische Bildung: bpb.de (Mauerfall)"
}
```

| Feld | Pflicht | Inhalt |
|---|---|---|
| `c` | ja | Thema, exakt wie in der Liste unten |
| `s` | ja | Unterbereich, exakt wie in der Liste unten |
| `q` | ja | Frage, ein Satz, endet mit „?“ |
| `a` | ja | genau 4 Antworten, **die richtige zuerst** (die App mischt) |
| `w` | ja | 4 Einträge: erster leer `""`, dann je ein Satz, **warum** die falsche Antwort falsch ist |
| `e` | ja | Erklärung zur richtigen Antwort, 1–2 Sätze, mit einer Zusatzinformation |
| `h` | ja | Hinweis, der hilft, ohne die Antwort zu verraten |
| `d` | ja | Schwierigkeit: 1 leicht, 2 mittel, 3 schwer |
| `src` | dringend | Quelle: Herausgeber und Adresse, z. B. „Destatis: destatis.de/…“ |

Keine `id` angeben, die vergibt das Skript.

## Qualitätsregeln

1. **Fakten prüfen.** Nur Aussagen, die eine verlässliche Quelle stützt (Behörden, Fachgesellschaften, Lexika, große Medien).
2. **Falsche Antworten sind plausibel**, gehören zur selben Kategorie wie die richtige (Jahr ↔ Jahre, Stadt ↔ Städte) und sind eindeutig falsch.
3. **Keine Längen-Hinweise:** Die richtige Antwort darf nicht auffällig länger oder genauer sein als die falschen. Alle vier ähnlich lang und ähnlich konkret formulieren.
4. **Keine Ratehilfen** durch Wortwiederholung aus der Frage, durch „immer/nie“ nur in falschen Antworten oder durch Grammatik, die nur zu einer Antwort passt.
5. **Zeitabhängiges kennzeichnen:** Rekorde, Ämter, Zahlen, Gesetze immer mit „(Stand JJJJ)“ in der Frage, oder zeitlos formulieren.
6. **Eindeutig:** Genau eine Antwort ist richtig, auch für Fachleute. Keine „Alle oben genannten“-Antworten.
7. **Keine Fragen, die schon im Kern existieren** (Klassiker wie Hauptstädte, Planeten, „Wer schrieb Faust?“ sind meist schon da).
8. **Sprache:** neue deutsche Rechtschreibung, typografische Anführungszeichen „…“, Zahlen mit Punkt als Tausendertrenner (1.000).
9. **Gesundheit und Recht:** nur nach aktuellen Leitlinien bzw. Gesetzen, mit Quelle; keine Behandlungsanweisungen über Erste Hilfe hinaus.
10. **Mischung der Schwierigkeit:** etwa 30 % leicht, 45 % mittel, 25 % schwer.

## Themen und Unterbereiche (exakt so schreiben)

- **Mathematik**: Kopfrechnen · Prozent & Zinsen · Algebra & Brüche · Geometrie · Wahrscheinlichkeit & Statistik · Logik & Zahlen
- **Geographie**: Europa · Asien · Afrika · Nord- & Mittelamerika · Südamerika · Ozeanien · Deutschland · Welt & Natur
- **Geschichte**: Antike & Mittelalter · Neuzeit (1450–1914) · 20. Jahrhundert & Gegenwart
- **Naturwissenschaft & Technik**: Physik & Astronomie · Chemie & Biologie · Erde & Klima · Technik & IT
- **Gesundheit**: Erste Hilfe · Körper & Medizin · Ernährung & Lebensstil
- **Wirtschaft & Geld**: Sparen & Anlegen · Wirtschaft verstehen · Steuern, Verträge & Versicherungen
- **Politik & Recht**: Staat & Wahlen · Recht im Alltag · EU & Welt
- **Denken & Psychologie**: Denkfehler · Entscheiden & Argumentieren
- **Kultur & Sprache**: Philosophie & Ideen · Literatur, Kunst & Musik · Sprache & Rechtschreibung
- **Sport**: Fußball · Olympia & mehr
- **Film & Musik**: Film · Musik
- **Religion**: Weltreligionen · Bibel & Feste
- **Sprachen**: Sprachen der Welt · Wörter & Herkunft
- **Natur & Tiere**: Tiere · Pflanzen & Ökologie

## Beispiel-Auftrag

„Erstelle 25 neue Fragen zu Geschichte, Unterbereich ‚Neuzeit (1450–1914)‘, nach dem Leitfaden. Nur JSON.“

## Einspielen

```
node tools/merge.mjs neue-fragen.json --probe   # erst nur prüfen
node tools/merge.mjs neue-fragen.json           # dann einspielen
node tools/check.mjs                            # Gesamtprüfung
```

- Gleiche Fragen werden übersprungen, ähnliche landen zur Prüfung in `neue-fragen.pruefen.json`, fehlerhafte in `neue-fragen.fehler.json`.
- Danach `node tools/version.mjs` ausführen (Version +1) und die App hochladen.
- Ohne Node.js auf dem Rechner: die JSON-Datei in einer Claude-Code-Sitzung mit diesem Projekt hochladen und einspielen lassen.
