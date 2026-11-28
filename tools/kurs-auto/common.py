# Gemeinsame Hilfsfunktionen und Quellen für die Fahrzeugtechnik-Kurse (diag, eu7, net, sec, ad).
# Nur öffentlich dokumentiertes Wissen; keine hersteller- oder kundeninternen Angaben.
def S(n, u=None): return {"n": n, "u": u} if u else {"n": n}
S_14229 = S("ISO 14229-1: Unified Diagnostic Services (UDS), Normtext kostenpflichtig", "https://www.iso.org/standard/72439.html")
S_15765 = S("ISO 15765-2: Transportprotokoll auf CAN (ISO-TP), Normtext kostenpflichtig", "https://www.iso.org/standard/66574.html")
S_13400 = S("ISO 13400: Diagnostic communication over Internet Protocol (DoIP)", "https://www.iso.org/standard/74785.html")
S_J1979 = S("SAE J1979: E/E Diagnostic Test Modes (OBD-Dienste)", "https://www.sae.org/standards/content/j1979_202104/")
S_J2012 = S("SAE J2012: Diagnostic Trouble Code Definitions")
S_J1962 = S("SAE J1962: Diagnostic Connector (OBD-Buchse)")
S_REIF = S("Konrad Reif (Hrsg.): Ottomotor-Management und Dieselmotor-Management, Bosch Fachinformation Automobil (Springer Vieweg)")
S_ASAM = S("ASAM: Standards für Diagnose (ODX, OTX, SOVD) und Messen/Kalibrieren", "https://www.asam.net/standards/")
S_AUTOSAR = S("AUTOSAR Classic Platform: Spezifikationen (Dem, Dcm, SecOC, IdsM u. a.)", "https://www.autosar.org/standards/classic-platform")
S_EU7 = S("Verordnung (EU) 2024/1257 (Euro 7), Amtsblatt der EU", "https://eur-lex.europa.eu/eli/reg/2024/1257/oj")
S_1151 = S("Verordnung (EU) 2017/1151 (WLTP, RDE, OBD-Anforderungen für Pkw, Anhang XI)", "https://eur-lex.europa.eu/eli/reg/2017/1151/oj")
S_CARB = S("CARB: OBD-II-Vorschriften (California Code of Regulations, Title 13, Section 1968.2)")
S_R155 = S("UNECE: UN-Regelung Nr. 155 (Cyber Security und CSMS)", "https://unece.org/transport/vehicle-regulations-wp29/standards/addenda-1958-agreement-regulations-141-160")
S_R156 = S("UNECE: UN-Regelung Nr. 156 (Software Update und SUMS)", "https://unece.org/transport/vehicle-regulations-wp29/standards/addenda-1958-agreement-regulations-141-160")
S_21434 = S("ISO/SAE 21434: Road vehicles, Cybersecurity engineering", "https://www.iso.org/standard/70918.html")
S_J3016 = S("SAE J3016: Taxonomy and Definitions for Terms Related to Driving Automation Systems", "https://www.sae.org/standards/content/j3016_202104/")
S_R157 = S("UNECE: UN-Regelung Nr. 157 (Automated Lane Keeping Systems)", "https://unece.org/transport/vehicle-regulations-wp29/standards/addenda-1958-agreement-regulations-141-160")
S_21448 = S("ISO 21448: Safety of the intended functionality (SOTIF)", "https://www.iso.org/standard/77490.html")
S_26262 = S("ISO 26262: Funktionale Sicherheit von Straßenfahrzeugen", "https://www.iso.org/standard/68383.html")
S_STVG = S("Straßenverkehrsgesetz (StVG) §§ 1d–1l: Kraftfahrzeuge mit autonomer Fahrfunktion", "https://www.gesetze-im-internet.de/stvg/")
S_BUS = S("Normen: ISO 11898 (CAN, CAN FD, CAN XL), ISO 17987 (LIN), ISO 17458 (FlexRay), IEEE 802.3 (Automotive Ethernet)")
S_CIA = S("CAN in Automation (CiA): Grundlagen zu CAN, CAN FD und CAN XL", "https://www.can-cia.org/can-knowledge/")
S_SOMEIP = S("SOME/IP: Spezifikation (AUTOSAR) und Projektseite", "https://some-ip.com/")
S_ETSI = S("ETSI: Intelligent Transport Systems (ITS, u. a. ITS-G5 und C-ITS-Nachrichten)", "https://www.etsi.org/")
S_ECALL = S("Verordnung (EU) 2015/758: eCall-Pflicht für neue Fahrzeugtypen", "https://eur-lex.europa.eu/eli/reg/2015/758/oj")
S_GSR = S("Verordnung (EU) 2019/2144 (General Safety Regulation): Fahrerassistenz- und Sicherheitssysteme", "https://eur-lex.europa.eu/eli/reg/2019/2144/oj")

_cnt = {}
def _id(lid, kind):
    k = (lid, kind); _cnt[k] = _cnt.get(k, 0) + 1
    return f"{lid}.{kind}{_cnt[k]}"
def card(f, b): return {"f": f, "b": b}
def mc(q, o, e, a=0): return {"t": "mc", "q": q, "o": o, "a": a, "e": e}
def multi(q, o, a, e): return {"t": "multi", "q": q, "o": o, "a": a, "e": e}
def order(q, o, e): return {"t": "order", "q": q, "o": o, "e": e}
def num(q, a, unit, tol, e): return {"t": "num", "q": q, "a": a, "unit": unit, "tol": tol, "e": e}
def L(lid, title, mins, body, key, src, cards, qs, figs=None, vol=False):
    l = {"id": lid, "title": title, "min": mins, "body": body, "key": key, "src": src,
         "cards": [dict(c, id=_id(lid, "k")) for c in cards], "qs": [dict(q, id=_id(lid, "q")) for q in qs]}
    if figs: l["figs"] = [dict(f, after=min(f["after"], len(body) - 1)) for f in figs]  # nie hinter den letzten Absatz
    if vol: l["vol"] = True
    return l
def M(mid, level, title, desc, lessons): return {"id": mid, "level": level, "title": title, "desc": desc, "lessons": lessons}
