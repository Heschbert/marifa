# Wendet Überarbeitungen aus tools/fragen/<datei>.txt auf data/<datei>.json an.
# Zeilenformat:
#   -ID                                   Frage entfernen (überspitzt, unpassend, doppelt)
#   ~ID|richtig|falsch|falsch|falsch      Antworttexte ersetzen (Reihenfolge wie bisher, die Erklärungen w bleiben gültig)
#   ?ID|neuer Hinweis                      Hinweis ersetzen
#   +{"s": …, "q": …, "a": [richtig, …], "w": [...], "e": …, "h": …, "d": 1-3}   neue Frage (ID wird aus dem Text erzeugt)
# Aufruf: python3 tools/fragen-anwenden.py <datei ohne .json>   (z. B. denken-psychologie)
import json, sys, os, hashlib
base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
name = sys.argv[1]
src = os.path.join(base, "data", name + ".json")
qs = json.load(open(src, encoding="utf-8"))
byid = {q["id"]: q for q in qs}
rem = add = rep = 0
for line in open(os.path.join(base, "tools", "fragen", name + ".txt"), encoding="utf-8"):
    line = line.rstrip("\n")
    if not line.strip() or line.startswith("#"): continue
    if line[0] == "-":
        i = line[1:].strip()
        if i in byid: qs.remove(byid.pop(i)); rem += 1
        else: print("unbekannt:", i)
    elif line[0] == "~":
        p = line[1:].split("|"); q = byid.get(p[0])
        if not q: print("unbekannt:", p[0]); continue
        assert len(p) - 1 == len(q["a"]), p[0]
        q["a"] = p[1:]; rep += 1
    elif line[0] == "?":
        p = line[1:].split("|", 1); q = byid.get(p[0])
        if q: q["h"] = p[1]
    elif line[0] == "+":
        q = json.loads(line[1:])
        q["id"] = "n" + hashlib.md5(q["q"].encode()).hexdigest()[:7]
        if q["id"] in byid: continue
        q.setdefault("w", [""] * len(q["a"])); q.setdefault("d", 2)
        qs.append(q); byid[q["id"]] = q; add += 1
json.dump(qs, open(src, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
n = len(qs); lg = sum(1 for q in qs if len(q["a"][0]) > max(len(x) for x in q["a"][1:]))
print(f"{name}: {rem} entfernt, {rep} Antworten angeglichen, {add} neu · jetzt {n} Fragen · richtige am längsten: {lg * 100 // n} %")
