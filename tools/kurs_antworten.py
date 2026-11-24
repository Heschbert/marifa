# Wendet tools/kurs-antworten.txt auf einen Kurs an: ersetzt die Optionen von mc-Fragen (richtige Antwort zuerst, a = 0).
import os
def anwenden(course):
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "kurs-antworten.txt")
    patch, kurz = {}, {}
    for line in open(p, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"): continue
        parts = line.split("|")
        if parts[0].startswith("~"): kurz[parts[0][1:]] = (parts[1], parts[2])
        else: patch[parts[0]] = parts[1:]
    n = 0
    for m in course["modules"]:
        for l in m["lessons"]:
            for q in l["qs"]:
                if q["id"] in patch:
                    assert q["t"] == "mc" and len(patch[q["id"]]) == 4, q["id"]
                    q["o"] = list(patch[q["id"]]); q["a"] = 0; n += 1
                if q["id"] in kurz:
                    alt, neu = kurz[q["id"]]
                    assert alt in q["o"], (q["id"], alt)
                    q["o"][q["o"].index(alt)] = neu
    return n

# Kursbilder (erzeugt mit tools/kurs-bilder.py): Lektions-ID → [(Bild, Bildunterschrift, nach Absatz-Index)]
BILDER = {
 "bess.m1.l1": [("bess-aufbau", "Die Bausteine eines Batteriespeichers.", 2), ("bess-leistung-energie", "Leistung (Höhe) mal Dauer (Breite) ergibt die Energie (Fläche).", 4), ("bess-btm-ftm", "Links beim Verbraucher, rechts als eigenständige Anlage am Netz.", 6)],
 "bess.m1.l3": [("bess-crate", "Je kleiner die C-Rate, desto länger dauert die Entladung.", 1)],
 "bess.m3.l1": [("bess-arbitrage", "Vereinfachter Tagesverlauf: laden bei niedrigen, entladen bei hohen Preisen.", 5)],
 "bess.m3.l2": [("bess-regelleistung", "Die drei Regelleistungsarten nach Aktivierungszeit (schematisch).", 6)],
 "bess.m6.l1": [("bess-phasen", "Typische Reihenfolge, in der Praxis überlappen die Phasen.", 2)],
 "ki.m1.l1": [("ki-begriffe", "Die Begriffe sind ineinander geschachtelt.", 2)],
 "ki.m1.l4": [("ki-overfitting", "Steigt der Validierungsfehler wieder, beginnt Overfitting.", 5)],
 "ki.m2.l3": [("ki-gradient", "Jeder Schritt geht bergab, bis das Tal erreicht ist.", 3)],
 "ki.m3.l1": [("ki-neuron", "Eingaben werden gewichtet, summiert und durch die Aktivierung geschickt.", 0)],
 "ki.m4.l2": [("ki-attention", "Schematisch: „sie“ achtet vor allem auf „Katze“.", 2)],
 "ki.m4.l3": [("ki-training", "Die Trainingsphasen eines Chat-Assistenten.", 0)],
 "ki.m5.l2": [("ki-rag", "Ablauf von Retrieval-Augmented Generation.", 2)],
}
def bilder(course):
    n = 0
    for m in course["modules"]:
        for l in m["lessons"]:
            if l["id"] in BILDER:
                l["figs"] = [{"src": "img/kurs/" + f + ".svg", "cap": c, "after": a} for f, c, a in BILDER[l["id"]]]; n += len(l["figs"])
    return n
