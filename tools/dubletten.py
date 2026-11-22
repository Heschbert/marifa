# Findet mögliche doppelte Fragen über alle Themen: gleiche richtige Antwort und ähnliche Fragewörter.
import json, glob, re, itertools
STOP = set("der die das den dem des ein eine einer eines einem wer was wie wo welche welcher welches wann warum ist sind hat haben man in im an auf zu von mit für und oder nicht als bei nach aus um es sich heißt nennt laut etwa meist".split())
def words(s): return {w for w in re.findall(r"[a-zäöüß0-9]+", s.lower()) if w not in STOP and len(w) > 2}
Q = []
for f in sorted(glob.glob("data/*.json")):
    d = json.load(open(f))
    if isinstance(d, list) and d and isinstance(d[0].get("a"), list):
        for q in d: Q.append((f[5:-5], q["id"], q["q"], q["a"][0], words(q["q"])))
by = {}
for x in Q: by.setdefault(x[3].lower().strip(" ."), []).append(x)
for k, L in by.items():
    for a, b in itertools.combinations(L, 2):
        u = a[4] | b[4]; j = len(a[4] & b[4]) / max(1, len(u))
        if j >= 0.25: print(f"{a[0]}:{a[1]} | {b[0]}:{b[1]} | {k} | {a[2][:50]} || {b[2][:50]}")
