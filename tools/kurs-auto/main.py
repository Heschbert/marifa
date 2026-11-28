# Erzeugt die Fahrzeugtechnik-Kurse (diag, eu7, net, sec, ad) in data/courses/. Aufruf: python3 tools/kurs-auto/main.py
import json, os, sys, importlib
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
try:
    from fix import A as ANS
except ImportError:
    ANS = {}
META = {"stand": "11/2026", "version": 1,
  "review": "Allgemeines, öffentlich dokumentiertes Wissen (Quellen je Lektion); keine hersteller- oder projektspezifischen Details. Noch nicht durch eine Fachperson geprüft. Vorschriften ändern sich: Für verbindliche Arbeit immer den aktuellen Rechtstext prüfen.",
  "levels": [{"id": 1, "title": "Grundlagen"}, {"id": 2, "title": "Fortgeschritten"}, {"id": 3, "title": "Experte"}]}
for name in sys.argv[1:] or ["diag", "eu7", "net", "sec", "ad"]:
    c = dict(importlib.import_module(name).COURSE, **META)
    c = {k: c[k] for k in ["id", "title", "sub", "audience", "stand", "version", "review", "levels", "modules"]}
    for m in c["modules"]:
        for l in m["lessons"]:
            for q in l["qs"]:
                if q["id"] in ANS: q["o"] = [ANS[q["id"]]] + q["o"][1:]
    json.dump(c, open(os.path.join(HERE, "..", "..", "data", "courses", name + ".json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    n = sum(len(m["lessons"]) for m in c["modules"]); q = sum(len(l["qs"]) for m in c["modules"] for l in m["lessons"])
    print(f"{name}.json: {len(c['modules'])} Module, {n} Lektionen, {q} Fragen")
