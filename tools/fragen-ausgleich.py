# Feinausgleich der Antwortlängen in data/<datei>.json, damit die richtige Antwort etwa so oft die längste,
# zweitlängste, … ist wie bei Zufall (je ca. 25 %). Kürzt dazu bei passenden Fragen Klammerzusätze („… (…)“)
# in der längsten falschen Antwort. Schreibt die Änderungen als ~-Zeilen ans Ende von tools/fragen/<datei>.txt.
# Aufruf: python3 tools/fragen-ausgleich.py <datei>
import json, sys, os, re
base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
name = sys.argv[1]
src = os.path.join(base, "data", name + ".json")
qs = json.load(open(src, encoding="utf-8"))
def rank(a): L = [len(x) for x in a]; return sum(1 for x in L[1:] if x < L[0])
n = len(qs); target = round(n * 0.25)
longest = sum(1 for q in qs if len(q["a"]) == 4 and rank(q["a"]) == 3)
lines = []
# 1) Wo die Überarbeitung falsche Antworten verlängert hat: ursprüngliche, kürzere Fassung zurückholen
import subprocess
try: orig = {q["id"]: q for q in json.loads(subprocess.run(["git", "show", "HEAD~" + (sys.argv[2] if len(sys.argv) > 2 else "0") + ":data/" + name + ".json"], cwd=base, capture_output=True, text=True).stdout)}
except Exception: orig = {}
for q in qs:
    if longest >= target: break
    o = orig.get(q["id"]); a = q["a"]
    if not o or len(a) != 4 or rank(a) == 3 or len(o["a"]) != 4: continue
    b = a[:1] + [o["a"][i] if len(o["a"][i]) < len(a[i]) else a[i] for i in range(1, 4)]
    if rank(b) == 3 and b != a and len(set(b)) == 4:
        q["a"] = b; longest += 1; lines.append("~" + q["id"] + "|" + "|".join(b))
# 2) sonst Klammerzusätze kürzen
for q in qs:
    if longest >= target: break
    a = q["a"]
    if len(a) != 4 or rank(a) != 2: continue
    j = max(range(1, 4), key=lambda i: len(a[i]))
    short = re.sub(r"\s*\([^)]*\)\s*$", "", a[j])
    if short != a[j] and len(short) < len(a[0]) and short not in a:
        a[j] = short; longest += 1
        lines.append("~" + q["id"] + "|" + "|".join(a))
json.dump(qs, open(src, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
if lines:
    with open(os.path.join(base, "tools", "fragen", name + ".txt"), "a", encoding="utf-8") as f:
        f.write("# Feinausgleich (automatisch)\n" + "\n".join(lines) + "\n")
r = [0, 0, 0, 0]
for q in qs:
    if len(q["a"]) == 4: r[rank(q["a"])] += 1
print(f"{name}: {len(lines)} ausgeglichen · Rang der richtigen Antwort kürzeste→längste:", [f"{x * 100 // n} %" for x in r])
