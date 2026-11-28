# Hilfsfunktionen und Quellen für den Kurs „Motorsteuergerät verstehen“ (erzeugt data/courses/ecu.json mit main.py).
# Nur öffentlich dokumentiertes Wissen; keine hersteller- oder kundeninternen Angaben.
S_REIF = {"n": "Konrad Reif (Hrsg.): Ottomotor-Management, Bosch Fachinformation Automobil (Springer Vieweg)"}
S_KTB = {"n": "Bosch: Kraftfahrtechnisches Taschenbuch (Springer Vieweg, Nachschlagewerk)"}
S_AUTOSAR = {"n": "AUTOSAR Classic Platform: Spezifikationen (u. a. ECU State Manager, BSW Mode Manager, Network Management)", "u": "https://www.autosar.org/standards/classic-platform"}
S_AURIX = {"n": "Infineon: AURIX 32-bit TriCore Mikrocontroller (Produktübersicht und Dokumentation)", "u": "https://www.infineon.com/cms/en/product/microcontroller/32-bit-tricore-microcontroller/"}
S_XCP = {"n": "ASAM MCD-1 XCP: Mess- und Kalibrierprotokoll", "u": "https://www.asam.net/standards/detail/mcd-1-xcp/"}
S_A2L = {"n": "ASAM MCD-2 MC: Beschreibungsdatei für Mess- und Kalibrierdaten (A2L)", "u": "https://www.asam.net/standards/detail/mcd-2-mc/"}
S_UDS = {"n": "ISO 14229-1: Unified Diagnostic Services (UDS), Normtext kostenpflichtig", "u": "https://www.iso.org/standard/72439.html"}
S_26262 = {"n": "ISO 26262: Funktionale Sicherheit von Straßenfahrzeugen, Normtext kostenpflichtig", "u": "https://www.iso.org/standard/68383.html"}
S_EGAS = {"n": "Arbeitskreis EGAS: Standardisiertes E-Gas-Überwachungskonzept für Benzin- und Diesel-Motorsteuerungen (öffentliches Konzeptpapier)"}
S_CIA = {"n": "CAN in Automation (CiA): Grundlagen zu Classical CAN und CAN FD", "u": "https://www.can-cia.org/can-knowledge/"}
S_BUS = {"n": "Normen: ISO 11898 (CAN, CAN FD), ISO 17458 (FlexRay), ISO 17987 (LIN), IEEE 802.3bw/bp (100/1000BASE-T1)"}
S_GTM = {"n": "Bosch Generic Timer Module (GTM): öffentliche Produktbeschreibung; in AURIX-Controllern u. a. für winkelbasierte Motorfunktionen eingesetzt"}

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
