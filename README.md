# Marifa

Spielerisch das wichtigste Wissen lernen. Quiz-App mit Lernmodus, Kursen und Partyspielen.
Läuft im Browser und lässt sich als App auf den Home-Bildschirm legen (PWA, auch offline).

**Live:** https://heschbert.github.io/marifa/

## Was drin ist
- **Spielen:** Tagesrätsel, Test, Blitz, Überleben, Wissensleiter, Zeitstrahl, Schätzen, Duell per Link.
- **Lernen:** Endlos-Lernmodus mit Wiederholung falscher Antworten; Kernwissen kommt häufiger dran.
- **Kurse:** Mehrteilige Kurse mit Lektionen, Übungen und Karteikarten (z. B. Batteriespeicher, KI).
- **Kneipe:** Pub-Quiz und Partyspiele.
- Rund 2.300 handgeschriebene Fragen in 14 Themen plus erzeugte Fragen (Hauptstädte, Flaggen, Schätzfragen).

## Datenschutz und Sicherheit
- Keine Konten, keine Werbung, kein Tracking, keine Verbindungen zu fremden Servern.
- Der Fortschritt liegt nur im Browser-Speicher des Geräts. Umzug auf ein anderes Gerät per Code im Profil.
- Eine Content-Security-Policy erlaubt nur Dateien von der eigenen Adresse.

## Lokal starten
Kein Build-Schritt nötig. Im Projektordner:

```bash
python3 -m http.server 8000
```

Dann http://localhost:8000 öffnen.

## Mitarbeiten
- Aufbau des Codes und neue Funktionen: [ARCHITEKTUR.md](ARCHITEKTUR.md)
- Regeln für gute Fragen: [LEITFADEN-FRAGEN.md](LEITFADEN-FRAGEN.md)
- Kurse schreiben: [LEITFADEN-KURSE.md](LEITFADEN-KURSE.md)
- Vor dem Veröffentlichen prüfen: `node tools/check.mjs` (Fragen) und `node tools/check-courses.mjs` (Kurse), Version erhöhen mit `node tools/version.mjs`.

## Fremde Bestandteile
- Schrift [Inter](https://rsms.me/inter/), SIL Open Font License 1.1 – `fonts/OFL-Inter.txt`
- Flaggen von [flag-icons](https://github.com/lipis/flag-icons), MIT-Lizenz – `img/flags/LICENSE-flag-icons.txt`

## Lizenz
MIT, siehe [LICENSE](LICENSE). Schrift und Flaggen stehen unter ihren eigenen Lizenzen (siehe oben).
