# Schreibt die Eselsbrücken aus tools/eselsbruecken.txt als Feld "m" in data/<datei>.json.
import json, os, collections
base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
by = collections.defaultdict(dict)
for line in open(os.path.join(base, "tools", "eselsbruecken.txt"), encoding="utf-8"):
    line = line.strip()
    if line and not line.startswith("#"):
        f, i, t = line.split("|", 2); by[f][i] = t
for f, m in by.items():
    p = os.path.join(base, "data", f + ".json"); qs = json.load(open(p, encoding="utf-8")); n = 0
    for q in qs:
        if q["id"] in m: q["m"] = m[q["id"]]; n += 1
    json.dump(qs, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    miss = set(m) - {q["id"] for q in qs}
    print(f, n, "gesetzt", ("· fehlen: " + ", ".join(miss)) if miss else "")
