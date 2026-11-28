# Hilfsfunktionen und Quellen für den Kurs Wahrscheinlichkeit & Statistik (erzeugt data/courses/wkeit.json mit main.py)
S_SEE = {"n": "Seeing Theory: visuelle Einführung in Wahrscheinlichkeit und Statistik (Brown University)", "u": "https://seeing-theory.brown.edu/"}
S_OS = {"n": "OpenStax: Introductory Statistics 2e (frei verfügbares Lehrbuch)", "u": "https://openstax.org/details/books/introductory-statistics-2e"}
S_KHAN = {"n": "Khan Academy: Statistics and Probability", "u": "https://www.khanacademy.org/math/statistics-probability"}
S_HENZE = {"n": "Norbert Henze: Stochastik für Einsteiger (Springer Spektrum, Lehrbuch)"}
S_HARD = {"n": "Harding-Zentrum für Risikokompetenz (Universität Potsdam)", "u": "https://www.hardingcenter.de/"}
S_GIG = {"n": "Gerd Gigerenzer: Das Einmaleins der Skepsis. Über den richtigen Umgang mit Zahlen und Risiken (Berlin Verlag)"}
S_ASA = {"n": "Wasserstein & Lazar (2016): The ASA Statement on p-Values, The American Statistician", "u": "https://doi.org/10.1080/00031305.2016.1154108"}

_cnt = {}
def _id(lid, kind):
    k = (lid, kind); _cnt[k] = _cnt.get(k, 0) + 1
    return f"{lid}.{kind}{_cnt[k]}"

def card(f, b): return {"f": f, "b": b}
def mc(q, o, a, e): return {"t": "mc", "q": q, "o": o, "a": a, "e": e}
def multi(q, o, a, e): return {"t": "multi", "q": q, "o": o, "a": a, "e": e}
def order(q, o, e): return {"t": "order", "q": q, "o": o, "e": e}
def num(q, a, unit, tol, e): return {"t": "num", "q": q, "a": a, "unit": unit, "tol": tol, "e": e}

def L(lid, title, mins, body, key, src, cards, qs, figs=None):
    l = {"id": lid, "title": title, "min": mins, "body": body, "key": key, "src": src,
         "cards": [dict(c, id=_id(lid, "k")) for c in cards], "qs": [dict(q, id=_id(lid, "q")) for q in qs]}
    if figs: l["figs"] = figs
    return l
