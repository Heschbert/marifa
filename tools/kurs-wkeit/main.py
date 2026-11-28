# Erzeugt data/courses/wkeit.json (Kurs Wahrscheinlichkeit & Statistik). Aufruf: python3 tools/kurs-wkeit/main.py
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from m12 import M1, M2
from m34 import M3, M4
from m56 import M5, M6
from m78 import M7, M8
course = {
  "id": "wkeit", "title": "Wahrscheinlichkeit & Statistik",
  "sub": "Vom Bauchgefühl zum sicheren Rechnen: Zufall, Kombinatorik, Bayes, Verteilungen, Tests und Risiken verstehen",
  "audience": "Alle, die Wahrscheinlichkeiten verstehen und sicher berechnen wollen, ohne Vorkenntnisse",
  "stand": "11/2026", "version": 1,
  "review": "Inhalt nach Lehrbuchstandard erstellt (Quellen je Lektion); noch nicht durch eine Fachperson geprüft.",
  "levels": [{"id": 1, "title": "Grundlagen"}, {"id": 2, "title": "Fortgeschritten"}, {"id": 3, "title": "Experte"}],
  "modules": [M1, M2, M3, M4, M5, M6, M7, M8]
}
from extra import OPTS, MORE
for m in course["modules"]:
    for l in m["lessons"]:
        for q in l["qs"]:
            if q["id"] in OPTS: q["o"] = OPTS[q["id"]]
        for q in MORE.get(l["id"], []):
            l["qs"].append(dict(q, id=l["id"] + ".q" + str(len(l["qs"]) + 1)))
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "courses", "wkeit.json")
json.dump(course, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
n = sum(len(m["lessons"]) for m in course["modules"]); q = sum(len(l["qs"]) for m in course["modules"] for l in m["lessons"]); k = sum(len(l["cards"]) for m in course["modules"] for l in m["lessons"])
print(f"wkeit.json: {len(course['modules'])} Module, {n} Lektionen, {q} Fragen, {k} Karten")
