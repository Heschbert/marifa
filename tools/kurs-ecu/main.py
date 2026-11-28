# Erzeugt data/courses/ecu.json (Kurs Motorsteuergerät verstehen). Aufruf: python3 tools/kurs-ecu/main.py
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from m1234 import M1, M2, M3, M4
from m5678 import M5, M6, M7, M8
course = {
  "id": "ecu", "title": "Motorsteuergerät verstehen",
  "sub": "Hardware, Betriebszustände, Kurbelwellenposition (EPM), Bussysteme, Software, Sicherheit und Diagnose einer Motor-ECU",
  "audience": "Entwicklerinnen und Entwickler im Steuergeräte-Umfeld und alle, die wissen wollen, wie eine Motor-ECU funktioniert",
  "stand": "11/2026", "version": 1,
  "review": "Allgemeines, öffentlich dokumentiertes Wissen (Quellen je Lektion); keine hersteller- oder projektspezifischen Details. Noch nicht durch eine Fachperson geprüft.",
  "levels": [{"id": 1, "title": "Grundlagen"}, {"id": 2, "title": "Fortgeschritten"}, {"id": 3, "title": "Experte"}],
  "modules": [M1, M2, M3, M4, M5, M6, M7, M8]
}
from extra import OPTS, MORE, ANS
for m in course["modules"]:
    for l in m["lessons"]:
        for q in l["qs"]:
            if q["id"] in OPTS: q["o"] = OPTS[q["id"]]
        for q in MORE.get(l["id"], []):
            l["qs"].append(dict(q, id=l["id"] + ".q" + str(len(l["qs"]) + 1)))
        for q in l["qs"]:
            if q["id"] in ANS: q["o"] = [ANS[q["id"]]] + q["o"][1:]
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "courses", "ecu.json")
json.dump(course, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
n = sum(len(m["lessons"]) for m in course["modules"]); q = sum(len(l["qs"]) for m in course["modules"] for l in m["lessons"]); k = sum(len(l["cards"]) for m in course["modules"] for l in m["lessons"])
print(f"ecu.json: {len(course['modules'])} Module, {n} Lektionen, {q} Fragen, {k} Karten")
