# Schreibt die Wichtigkeit p (1 Kernwissen, 2 nützlich, 3 Wissenswertes) aus tools/wichtigkeit.txt in data/*.json.
# Fragen ohne Eintrag behalten ein vorhandenes p (z. B. aus +Zeilen), sonst gilt 2. Zeilen „datei|sub:Bereich|stufe“ setzen einen ganzen Bereich.
import json, os, collections
base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
rules = collections.defaultdict(lambda: {"ids": {}, "subs": {}})
for line in open(os.path.join(base, "tools", "wichtigkeit.txt"), encoding="utf-8"):
    line = line.strip()
    if not line or line.startswith("#"): continue
    f, a, b = line.split("|")
    if a.startswith("sub:"): rules[f]["subs"][a[4:]] = int(b)
    else:
        for i in b.split(): rules[f]["ids"][i] = int(a)
for f, r in rules.items():
    p = os.path.join(base, "data", f + ".json"); qs = json.load(open(p, encoding="utf-8")); c = collections.Counter()
    for q in qs:
        v = r["ids"].get(q["id"], r["subs"].get(q["s"], q.get("p", 2)))
        if v == 2: q.pop("p", None)
        else: q["p"] = v
        c[v] += 1
    json.dump(qs, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{f:28} Kern {c[1]:3} · nützlich {c[2]:3} · Wissenswertes {c[3]:3}")
