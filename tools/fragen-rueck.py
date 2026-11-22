# Gegen Überkorrektur: Ist die richtige Antwort bei beschreibenden Fragen zu oft die zweitlängste (statt ~25 % je Rang),
# wird bei geänderten Fragen die ursprüngliche Antwortfassung (aus git <ref>) zurückgeholt, bis ~25 % „längste“ erreicht sind.
# Aufruf: python3 tools/fragen-rueck.py <datei> <git-ref>
import json, sys, os, subprocess
base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
name, ref = sys.argv[1], sys.argv[2]
src = os.path.join(base, "data", name + ".json")
qs = json.load(open(src, encoding="utf-8"))
orig = {q["id"]: q for q in json.loads(subprocess.run(["git", "show", ref + ":data/" + name + ".json"], cwd=base, capture_output=True, text=True).stdout)}
def rank(a): L = [len(x) for x in a]; return sum(1 for x in L[1:] if x < L[0])
D = [q for q in qs if len(q["a"]) == 4 and max(map(len, q["a"])) >= 20]
target = round(len(D) * 0.25); longest = sum(1 for q in D if rank(q["a"]) == 3)
lines = []
for q in D:
    if longest >= target: break
    o = orig.get(q["id"])
    if not o or rank(q["a"]) != 2 or o["a"] == q["a"] or len(o["a"]) != 4 or rank(o["a"]) != 3: continue
    q["a"] = o["a"]; longest += 1; lines.append("~" + q["id"] + "|" + "|".join(o["a"]))
json.dump(qs, open(src, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
if lines:
    with open(os.path.join(base, "tools", "fragen", name + ".txt"), "a", encoding="utf-8") as f:
        f.write("# Rückausgleich gegen Überkorrektur (automatisch)\n" + "\n".join(lines) + "\n")
r = [0] * 4
for q in D: r[rank(q["a"])] += 1
print(f"{name}: {len(lines)} zurückgeholt · beschreibende Fragen, Rang kürzeste→längste:", [f"{x * 100 // max(1, len(D))} %" for x in r])
