import json, sys
SRC = {
 "atb": {"n": "NREL, Annual Technology Baseline: Utility-Scale Battery Storage (2024)", "u": "https://atb.nrel.gov/electricity/2024/utility-scale_battery_storage"},
 "atb20": {"n": "NREL, Annual Technology Baseline 2020: Speicher (Annahme 85 % Wirkungsgrad, nach Cole & Frazier 2020)", "u": "https://atb-archive.nrel.gov/electricity/2020/index.php?t=st"},
 "eia": {"n": "U.S. EIA, Today in Energy: Wirkungsgrad von US-Großspeichern 2019 (82 %)", "u": "https://www.eia.gov/todayinenergy/detail.php?id=46756"},
 "bu402": {"n": "Battery University, BU-402: What Is C-rate?", "u": "https://batteryuniversity.com/article/what-is-the-c-rate"},
 "bu205": {"n": "Battery University, BU-205: Types of Lithium-ion", "u": "https://batteryuniversity.com/article/types-of-lithium-ion"},
 "bu808": {"n": "Battery University, BU-808: How to Prolong Lithium-based Batteries", "u": "https://batteryuniversity.com/index.php/learn/article/how_to_prolong_lithium_based_batteries"},
 "bdnom": {"n": "Battery Design: Nominal Voltage", "u": "https://www.batterydesign.net/electrical/nominal/nominal-voltage/"},
 "nrel17": {"n": "Smith u. a. (NREL), Life Prediction Model for Grid-Connected Li-ion Battery Energy Storage System, 2017", "u": "https://www.osti.gov/biblio/1378083"},
 "ul": {"n": "UL Solutions: UL 9540A Test Method", "u": "https://www.ul.com/services/ul-9540a-test-method"},
 "ansi": {"n": "ANSI/UL 9540A-2025 (Normtext, kostenpflichtig)", "u": "https://webstore.ansi.org/standards/ul/ansiul9540a2025"},
 "tesla": {"n": "Tesla Energy Library: Zusammenfassung UL 9540A (vier Prüfebenen)", "u": "https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/General/Compliance/SafetyStandardsLithiumIonElectrochemical/en-us/GUID-2927B686-2691-4A8F-9643-D57B21F9AB61.html"},
 "iec62619": {"n": "IEC 62619: Sicherheitsanforderungen an Lithium-Zellen und -Batterien für industrielle Anwendungen (Normtext, kostenpflichtig)", "u": ""},
}
def L(id, title, minutes, body, key, src, cards, qs):
    out_q = []
    for i, q in enumerate(qs):
        q = dict(q); q["id"] = id + ".q" + str(i + 1); out_q.append(q)
    out_c = []
    for i, (f, b) in enumerate(cards):
        out_c.append({"id": id + ".k" + str(i + 1), "f": f, "b": b})
    return {"id": id, "title": title, "min": minutes, "body": body, "key": key, "src": [SRC[s] for s in src], "cards": out_c, "qs": out_q}
def mc(q, o, a, e): return {"t": "mc", "q": q, "o": o, "a": a, "e": e}
def multi(q, o, a, e): return {"t": "multi", "q": q, "o": o, "a": a, "e": e}
def order(q, o, e): return {"t": "order", "q": q, "o": o, "e": e}
def num(q, a, unit, e, tol=0): return {"t": "num", "q": q, "a": a, "unit": unit, "tol": tol, "e": e}

l1 = L("bess.m1.l1", "Was ist ein Batteriespeicher?", 4, [
 "Ein Batteriespeichersystem (BESS, Battery Energy Storage System) speichert elektrische Energie chemisch in Batteriezellen und gibt sie bei Bedarf wieder ab.",
 "## Mehr als nur Zellen",
 "Zu einem BESS gehören neben den Zellen: das Batteriemanagementsystem (BMS), das die Zellen überwacht und schützt; der Umrichter (PCS, Power Conversion System), der zwischen dem Gleichstrom der Batterie und dem Wechselstrom des Netzes wandelt; das Energiemanagementsystem (EMS), das entscheidet, wann geladen und entladen wird; Thermomanagement (Kühlung, Heizung), Brandschutz und bei größeren Anlagen ein Transformator für den Netzanschluss.",
 "## Leistung und Energie",
 "Jeder Speicher hat zwei Kerngrößen: die Leistung in kW bzw. MW (wie schnell er laden oder entladen kann) und die Energie bzw. Kapazität in kWh bzw. MWh (wie viel er speichert). Energie geteilt durch Leistung ergibt die Speicherdauer: 10 MW mit 20 MWh sind ein 2-Stunden-Speicher.",
 "## Behind-the-Meter und Front-of-the-Meter",
 "Behind-the-Meter (BTM) heißt: Der Speicher steht hinter dem Netzanschluss bzw. Zähler eines Verbrauchers, etwa eines Industriebetriebs. Typische Ziele sind Lastspitzen kappen (Peak Shaving), mehr eigenen Solarstrom nutzen und Notstrom. Front-of-the-Meter (FTM) heißt: Der Speicher ist eine eigenständige Anlage direkt am Netz und verdient sein Geld am Strommarkt und mit Systemdienstleistungen."
], ["Leistung (MW) und Energie (MWh) sind verschiedene Größen.", "Speicherdauer = Energie ÷ Leistung.", "BMS schützt die Zellen, PCS wandelt DC/AC, EMS steuert den Betrieb.", "BTM = hinter dem Zähler eines Verbrauchers, FTM = eigenständig am Netz."],
 ["atb"],
 [("BESS", "Battery Energy Storage System: Batteriespeichersystem aus Zellen, BMS, Umrichter, EMS, Thermomanagement und Brandschutz."),
  ("PCS", "Power Conversion System: Umrichter, wandelt zwischen Gleichstrom (Batterie) und Wechselstrom (Netz)."),
  ("EMS", "Energiemanagementsystem: entscheidet, wann geladen und entladen wird (z. B. nach Preisen oder Lastgang)."),
  ("Speicherdauer", "Energie ÷ Leistung. Beispiel: 20 MWh ÷ 10 MW = 2 Stunden."),
  ("Behind-the-Meter (BTM)", "Speicher hinter dem Netzanschluss/Zähler eines Verbrauchers, z. B. für Peak Shaving und Eigenverbrauch."),
  ("Front-of-the-Meter (FTM)", "Eigenständiger Speicher direkt am Netz, Erlöse aus Strommarkt und Systemdienstleistungen."),
  ("Peak Shaving", "Lastspitzen eines Verbrauchers mit dem Speicher kappen, um Leistungspreise beim Netzentgelt zu senken.")],
 [mc("Ein Speicher hat 5 MW Leistung und 10 MWh Energie. Wie lange kann er mit voller Leistung entladen?", ["2 Stunden", "0,5 Stunden", "5 Stunden", "10 Stunden"], 0, "Speicherdauer = Energie ÷ Leistung = 10 MWh ÷ 5 MW = 2 h."),
  mc("Welche Einheit beschreibt die gespeicherte Energiemenge?", ["MWh", "MW", "kV", "Hz"], 0, "MW ist Leistung (wie schnell), MWh ist Energie (wie viel)."),
  mc("Was bedeutet „Behind-the-Meter“?", ["Der Speicher steht hinter dem Netzanschluss bzw. Zähler eines Verbrauchers", "Der Speicher steht direkt am Übertragungsnetz", "Der Speicher bietet ausschließlich Regelenergie an", "Der Speicher gehört dem Netzbetreiber"], 0, "BTM-Speicher stehen beim Verbraucher, z. B. in einem Industriebetrieb, hinter dessen Zähler."),
  multi("Welche Komponenten gehören typischerweise zu einem BESS? (mehrere richtig)", ["Batteriemanagementsystem (BMS)", "Umrichter (PCS)", "Thermomanagement", "Elektrolyseur", "Dampfturbine"], [0, 1, 2], "BMS, Umrichter und Thermomanagement sind Teil jedes größeren Batteriespeichers. Elektrolyseur und Dampfturbine gehören zu anderen Technologien."),
  mc("Wofür setzt ein Industriebetrieb einen Behind-the-Meter-Speicher typischerweise ein?", ["Lastspitzen kappen (Peak Shaving)", "Spannungshaltung im Übertragungsnetz", "Schwarzstart eines Großkraftwerks", "Wasserstoff erzeugen"], 0, "Mit Peak Shaving sinkt die gemessene Höchstlast und damit der leistungsabhängige Teil der Netzentgelte."),
  mc("Welche Aufgabe hat der Umrichter (PCS)?", ["Er wandelt zwischen Gleichstrom der Batterie und Wechselstrom des Netzes", "Er überwacht jede einzelne Zellspannung", "Er plant den Fahrplan nach Strompreisen", "Er kühlt die Batteriemodule"], 0, "Zellspannungen überwacht das BMS, den Fahrplan macht das EMS, die Kühlung das Thermomanagement."),
  num("Ein 2-Stunden-Speicher hat 50 MW Leistung. Wie viel Energie in MWh kann er speichern?", 100, "MWh", "Energie = Leistung × Dauer = 50 MW × 2 h = 100 MWh."),
  mc("Welches System entscheidet, wann der Speicher lädt und entlädt, z. B. nach Strompreisen?", ["Energiemanagementsystem (EMS)", "Batteriemanagementsystem (BMS)", "Transformator", "Brandmeldeanlage"], 0, "Das EMS steuert den Betrieb. Das BMS schützt die Zellen und kann das EMS dabei begrenzen.")])

l2 = L("bess.m1.l2", "Zellchemie: LFP, NMC und Natrium-Ionen", 5, [
 "Bei Lithium-Ionen-Zellen gibt das Material der Kathode (Pluspol) der Zelle ihren Namen. Die Anode besteht meist aus Graphit.",
 "## LFP: Lithium-Eisenphosphat",
 "LFP (LiFePO₄) hat eine Nennspannung von etwa 3,2 V je Zelle. Es speichert pro Kilogramm weniger Energie als NMC, ist aber thermisch stabiler, kommt ohne Nickel und Kobalt aus, hält meist mehr Zyklen aus und ist günstiger. Deshalb ist LFP heute die vorherrschende Chemie in stationären Speichern.",
 "Eine Besonderheit: Die Spannung von LFP ist über weite Teile des Ladezustands sehr flach. Das macht es schwerer, den Ladezustand allein aus der Spannung zu bestimmen; das BMS braucht dafür bessere Schätzverfahren.",
 "## NMC: Nickel-Mangan-Kobalt",
 "NMC hat eine Nennspannung von etwa 3,6 bis 3,7 V und eine höhere Energiedichte. Im Auto zählen Gewicht und Platz, darum ist NMC dort verbreitet. Im stationären Speicher sind Gewicht und Volumen meist weniger kritisch, dort zählen Kosten, Sicherheit und Lebensdauer mehr.",
 "## Natrium-Ionen",
 "Natrium-Ionen-Zellen verwenden Natrium statt Lithium. Der Rohstoff ist reichlich und günstig verfügbar. Die Energiedichte liegt unter der von LFP. Die Technik ist noch jung und hat (Stand 2026) einen kleinen Marktanteil.",
 "## Bauformen",
 "Zellen gibt es prismatisch (rechteckiges Hartgehäuse), zylindrisch und als Pouch (Folienbeutel). In Großspeichern sind großformatige prismatische LFP-Zellen verbreitet."
], ["LFP: ca. 3,2 V, sicherer, langlebiger, günstiger, ohne Nickel/Kobalt.", "NMC: ca. 3,6–3,7 V, höhere Energiedichte, verbreitet im Auto.", "Im stationären Speicher dominiert LFP.", "Flache LFP-Spannungskurve erschwert die Ladezustandsbestimmung."],
 ["bu205", "bdnom"],
 [("LFP", "Lithium-Eisenphosphat (LiFePO₄). Nennspannung ca. 3,2 V. Thermisch stabil, langlebig, ohne Nickel/Kobalt."),
  ("NMC", "Lithium-Nickel-Mangan-Kobalt-Oxid. Nennspannung ca. 3,6–3,7 V. Höhere Energiedichte, verbreitet im Auto."),
  ("Warum LFP im stationären Speicher?", "Gewicht und Platz sind weniger kritisch; Kosten, Sicherheit und Zyklenfestigkeit zählen mehr."),
  ("Flache Spannungskurve", "Typisch für LFP: Die Spannung ändert sich über weite SoC-Bereiche kaum, der Ladezustand ist schwer aus der Spannung abzulesen."),
  ("Natrium-Ionen", "Natrium statt Lithium: günstiger, reichlich verfügbarer Rohstoff, geringere Energiedichte, noch kleiner Marktanteil."),
  ("Kathode / Anode", "Die Kathode gibt der Zelle den Namen (LFP, NMC). Die Anode ist meist Graphit.")],
 [mc("Wofür steht LFP?", ["Lithium-Eisenphosphat", "Lithium-Fluor-Polymer", "Lithium-Ferrit-Pouch", "Lithium-Festkörper-Platte"], 0, "LFP = LiFePO₄, Lithium-Eisenphosphat. Fe ist das chemische Zeichen für Eisen."),
  mc("Welche Nennspannung hat eine LFP-Zelle typischerweise?", ["Etwa 3,2 V", "Etwa 1,2 V", "Etwa 3,7 V", "Etwa 4,2 V"], 0, "LFP liegt bei etwa 3,2 V. Rund 3,6–3,7 V sind typisch für NMC, 4,2 V ist eine übliche Ladeschlussspannung von NMC, 1,2 V hat eine NiMH-Zelle."),
  mc("Welche Zellchemie dominiert heute bei stationären Großspeichern?", ["LFP", "NMC", "Blei-Säure", "Nickel-Cadmium"], 0, "LFP hat sich wegen Kosten, Sicherheit und Lebensdauer im stationären Bereich durchgesetzt."),
  multi("Welche Aussagen beschreiben Vorteile von LFP gegenüber NMC? (mehrere richtig)", ["Thermisch stabiler", "Kommt ohne Nickel und Kobalt aus", "Meist höhere Zyklenfestigkeit", "Höhere Energiedichte", "Höhere Zellspannung"], [0, 1, 2], "Energiedichte und Zellspannung sind bei NMC höher. Das sind die Gründe, warum NMC im Auto verbreitet ist."),
  mc("Warum ist die höhere Energiedichte von NMC im stationären Speicher weniger wichtig?", ["Gewicht und Platz sind dort meist weniger kritisch als im Fahrzeug", "NMC ist für stationäre Speicher verboten", "Die Energiedichte beeinflusst nur die Ladezeit", "Stationäre Speicher werden nie voll geladen"], 0, "Ein Container auf einer Freifläche darf schwerer und größer sein als eine Batterie im Auto."),
  mc("Welche Eigenschaft erschwert bei LFP die Bestimmung des Ladezustands?", ["Die sehr flache Spannungskurve", "Eine hohe Selbstentladung", "Der Memory-Effekt", "Eine zu hohe Zellspannung"], 0, "Weil sich die Spannung kaum ändert, verrät sie wenig über den Ladezustand. Das BMS rechnet deshalb zusätzlich mit Strommessung und Modellen."),
  mc("Was ist der wichtigste Vorteil von Natrium-Ionen-Zellen?", ["Der Rohstoff Natrium ist reichlich und günstig verfügbar", "Sie haben die höchste Energiedichte aller Zellen", "Sie brauchen keinerlei Batteriemanagement", "Sie haben die doppelte Zellspannung von LFP"], 0, "Die Energiedichte liegt unter LFP. Der Vorteil liegt bei Rohstoff und Kosten."),
  mc("Welche Elektrode gibt Zellchemien wie LFP und NMC ihren Namen?", ["Die Kathode", "Die Anode", "Der Separator", "Der Stromableiter"], 0, "Die Kathode (Pluspol beim Entladen) bestimmt die Bezeichnung. Die Anode ist meist Graphit.")])

l3 = L("bess.m1.l3", "Kennzahlen: C-Rate, SoC, SoH und Wirkungsgrad", 5, [
 "## C-Rate",
 "Die C-Rate gibt den Lade- oder Entladestrom im Verhältnis zur Kapazität an. 1C heißt: in einer Stunde voll entladen. 0,5C heißt zwei Stunden, 2C eine halbe Stunde. Bei Speichersystemen rechnet man oft mit Leistung zu Energie: Ein 2-Stunden-Speicher wird mit etwa 0,5C betrieben.",
 "## Ladezustand, Entladetiefe, Gesundheitszustand",
 "SoC (State of Charge) ist der Ladezustand in Prozent. DoD (Depth of Discharge) ist die Entladetiefe: Wer von 100 % auf 20 % entlädt, hat eine Entladetiefe von 80 %. SoH (State of Health) setzt die heutige Kapazität ins Verhältnis zur Anfangskapazität. Als Lebensende wird häufig ein SoH von etwa 80 % angesetzt; der genaue Wert steht meist im Vertrag oder in der Garantie.",
 "## Nennenergie und nutzbare Energie",
 "Hersteller nutzen oft nicht den ganzen Ladezustand, sondern ein Fenster, etwa 5 bis 95 %. Dazu kommen Verluste. Für die Projektplanung zählt deshalb die nutzbare Energie am Netzanschlusspunkt, nicht die Nennenergie der Zellen.",
 "## Wirkungsgrad",
 "Der Round-Trip-Wirkungsgrad (RTE) ist die entnommene Energie geteilt durch die eingespeicherte Energie über einen vollen Zyklus. Verluste entstehen in den Zellen, im Umrichter und im Transformator; dazu kommt der Eigenverbrauch für Kühlung und Steuerung. Das US-Forschungsinstitut NREL hat in seiner Technologie-Datenbank 2020 für Großspeicher 85 % angenommen. Die US-Energiebehörde EIA hat für 2019 im Mittel 82 % gemessen. Wichtig beim Vergleich von Angeboten: Wo wird gemessen (DC oder AC, mit oder ohne Hilfsenergie)?"
], ["1C = 1 Stunde, 0,5C = 2 Stunden, 2C = 30 Minuten.", "DoD = wie tief entladen wird, SoH = Kapazität heute ÷ Kapazität neu.", "Für die Planung zählt die nutzbare Energie am Netzanschlusspunkt.", "Wirkungsgrad Großspeicher: rund 82–85 % (NREL-Annahme bzw. EIA-Messung); Messpunkt beachten."],
 ["bu402", "atb20", "eia"],
 [("C-Rate", "Lade-/Entladestrom im Verhältnis zur Kapazität. 1C = 1 h, 0,5C = 2 h, 2C = 30 min."),
  ("SoC", "State of Charge: Ladezustand in Prozent."),
  ("DoD", "Depth of Discharge: Entladetiefe. Von 100 % auf 20 % SoC = 80 % DoD."),
  ("SoH", "State of Health: heutige Kapazität ÷ Anfangskapazität. Lebensende oft bei etwa 80 %."),
  ("Round-Trip-Wirkungsgrad (RTE)", "Entnommene ÷ eingespeicherte Energie über einen vollen Zyklus. Großspeicher: rund 82–85 %."),
  ("Nutzbare Energie", "Energie, die am Netzanschlusspunkt tatsächlich geliefert werden kann: nach SoC-Grenzen und Verlusten."),
  ("Hilfsenergie", "Eigenverbrauch für Kühlung, Klimatisierung und Steuerung. Senkt den Wirkungsgrad auf Systemebene.")],
 [mc("Eine volle Batterie wird mit 0,5C entladen. Wie lange dauert es, bis sie leer ist?", ["2 Stunden", "30 Minuten", "1 Stunde", "5 Stunden"], 0, "0,5C heißt: halber Strom im Vergleich zu 1C, also doppelte Zeit: 2 Stunden."),
  num("Eine Batterie mit 100 MWh wird mit 0,25C entladen. Mit wie viel MW Leistung?", 25, "MW", "Leistung = 0,25 × 100 MWh pro Stunde = 25 MW. Die Entladung dauert dann 4 Stunden."),
  mc("Was beschreibt der SoH (State of Health)?", ["Die heutige Kapazität im Verhältnis zur Anfangskapazität", "Den aktuellen Ladezustand", "Die Entladetiefe eines Zyklus", "Die Temperatur der Zellen"], 0, "Den Ladezustand beschreibt der SoC, die Entladetiefe der DoD."),
  mc("Eine Batterie wird von 100 % auf 20 % Ladezustand entladen. Wie groß ist die Entladetiefe (DoD)?", ["80 %", "20 %", "100 %", "120 %"], 0, "DoD = 100 % − 20 % = 80 %."),
  num("In einen Speicher werden 10 MWh geladen, später werden 8,5 MWh entnommen. Wie hoch ist der Round-Trip-Wirkungsgrad in Prozent?", 85, "%", "8,5 ÷ 10 = 0,85, also 85 %."),
  multi("Was senkt den Wirkungsgrad auf Systemebene? (mehrere richtig)", ["Verluste im Umrichter", "Verluste im Transformator", "Energie für Kühlung und Klimatisierung", "Die Angabe in MWh statt kWh", "Eine höhere Nennspannung der Zellen"], [0, 1, 2], "Die Einheit ändert nichts an den Verlusten. Umrichter, Transformator und Hilfsenergie sind die typischen Verlustquellen."),
  mc("Welchen mittleren Wirkungsgrad hat die US-Energiebehörde EIA für US-Großspeicher im Jahr 2019 ermittelt?", ["Etwa 82 %", "Etwa 52 %", "Etwa 67 %", "Etwa 98 %"], 0, "Laut EIA lag der durchschnittliche monatliche Round-Trip-Wirkungsgrad 2019 bei 82 %."),
  mc("Warum ist bei Angeboten die nutzbare Energie am Netzanschlusspunkt wichtiger als die Nennenergie der Zellen?", ["Weil SoC-Grenzen und Verluste die lieferbare Energie verringern", "Weil die Nennenergie in MW angegeben wird", "Weil Zellen nie entladen werden", "Weil Netzbetreiber nur Nennwerte akzeptieren"], 0, "Erlöse entstehen mit der Energie, die tatsächlich ins Netz geht."),
  order("Ordne nach der Entladedauer, die kürzeste zuerst.", ["2C", "1C", "0,5C", "0,25C"], "2C = 30 min, 1C = 1 h, 0,5C = 2 h, 0,25C = 4 h.")])

l4 = L("bess.m1.l4", "Alterung und Zyklen", 5, [
 "Batterien verlieren mit der Zeit Kapazität. Man unterscheidet zwei Arten der Alterung.",
 "## Kalendarisch und zyklisch",
 "Kalendarische Alterung findet auch ohne Nutzung statt. Sie hängt vor allem von der Zeit, der Temperatur und dem Ladezustand ab: Lange Standzeiten bei hohem Ladezustand und Wärme beschleunigen sie. Zyklische Alterung entsteht durch Laden und Entladen; Entladetiefe, C-Rate und Temperatur spielen hier mit.",
 "Laden bei Kälte oder mit hohem Strom kann Lithium-Plating auslösen: Metallisches Lithium lagert sich an der Anode ab. Das kostet Kapazität und kann die Sicherheit beeinträchtigen.",
 "## Vollzyklus-Äquivalente",
 "Um die Nutzung vergleichbar zu machen, rechnet man in äquivalenten Vollzyklen: entladene Energie geteilt durch nutzbare Kapazität. Zwei Entladungen um je die halbe Kapazität ergeben einen Vollzyklus.",
 "## Verlauf und Gegenmaßnahmen",
 "Der Kapazitätsverlust verläuft nicht immer gleichmäßig. Gegen Ende der Lebensdauer kann er sich nach einem Knickpunkt deutlich beschleunigen. Herstellergarantien begrenzen deshalb meist die Zyklen bzw. den Energiedurchsatz pro Jahr und legen Betriebsbedingungen fest. Um die vertraglich zugesagte Kapazität zu halten, baut man entweder anfangs mehr Kapazität ein (Überdimensionierung) oder ergänzt später Module (Augmentation)."
], ["Kalendarische Alterung: Zeit, Temperatur, hoher Ladezustand.", "Zyklische Alterung: Laden/Entladen, Entladetiefe, C-Rate, Temperatur.", "Vollzyklus-Äquivalent = entladene Energie ÷ nutzbare Kapazität.", "Gegen Kapazitätsverlust: Überdimensionierung oder Augmentation."],
 ["bu808", "nrel17"],
 [("Kalendarische Alterung", "Kapazitätsverlust über die Zeit, auch ohne Nutzung. Treiber: Temperatur, hoher Ladezustand."),
  ("Zyklische Alterung", "Kapazitätsverlust durch Laden und Entladen. Treiber: Entladetiefe, C-Rate, Temperatur."),
  ("Äquivalenter Vollzyklus", "Entladene Energie ÷ nutzbare Kapazität. Zwei halbe Entladungen = ein Vollzyklus."),
  ("Lithium-Plating", "Ablagerung von metallischem Lithium an der Anode, v. a. beim Laden in Kälte oder mit hohem Strom."),
  ("Augmentation", "Nachträgliches Ergänzen von Batteriemodulen, um den Kapazitätsverlust auszugleichen."),
  ("Knickpunkt", "Punkt, ab dem sich der Kapazitätsverlust gegen Lebensende deutlich beschleunigt.")],
 [mc("Was ist kalendarische Alterung?", ["Kapazitätsverlust über die Zeit, auch ohne Nutzung", "Kapazitätsverlust nur durch Laden und Entladen", "Ein Fehler in der Zeitsteuerung des EMS", "Alterung, die nur im Winter auftritt"], 0, "Auch ein ungenutzter Speicher altert, vor allem bei Wärme und hohem Ladezustand."),
  multi("Was beschleunigt die Alterung von Lithium-Ionen-Zellen? (mehrere richtig)", ["Hohe Temperaturen", "Lange Standzeiten bei hohem Ladezustand", "Hohe C-Raten", "Kühle Lagerung bei mittlerem Ladezustand", "Ein moderates Ladezustandsfenster"], [0, 1, 2], "Kühl und bei mittlerem Ladezustand altern Zellen am langsamsten."),
  num("Ein Speicher hat 20 MWh nutzbare Kapazität und entlädt im Jahr insgesamt 7.300 MWh. Wie viele äquivalente Vollzyklen sind das?", 365, "Zyklen", "7.300 MWh ÷ 20 MWh = 365, also im Schnitt ein Vollzyklus pro Tag."),
  mc("Was ist Lithium-Plating?", ["Ablagerung von metallischem Lithium an der Anode", "Eine Schutzbeschichtung des Gehäuses", "Ein Recyclingverfahren", "Das Verschweißen von Zellen zu Modulen"], 0, "Es tritt vor allem beim Laden in Kälte oder mit hohem Strom auf."),
  mc("Was bedeutet Augmentation bei Batteriespeichern?", ["Nachträglich Module ergänzen, um Kapazitätsverlust auszugleichen", "Die Netzanschlussleistung erhöhen", "Ein Software-Update für das BMS", "Den Transformator austauschen"], 0, "Die Alternative ist, gleich zu Beginn mehr Kapazität einzubauen (Überdimensionierung)."),
  mc("Wie kann sich der Kapazitätsverlust gegen Lebensende verhalten?", ["Er kann sich nach einem Knickpunkt beschleunigen", "Er hört vollständig auf", "Die Kapazität steigt wieder an", "Er verläuft immer exakt linear"], 0, "Deshalb sind Lebensdauerprognosen mit Unsicherheit behaftet und Garantiebedingungen wichtig."),
  mc("Was begrenzen Herstellergarantien für Batteriespeicher typischerweise?", ["Zyklen bzw. Energiedurchsatz pro Jahr und Betriebsbedingungen", "Den Strompreis am Markt", "Die Zahl der Netzbetreiber", "Die Höhe der Netzentgelte"], 0, "Wer mehr zyklisiert als vereinbart oder außerhalb der Temperaturgrenzen betreibt, riskiert die Garantie."),
  mc("Zwei Entladungen um je die Hälfte der nutzbaren Kapazität entsprechen …", ["einem äquivalenten Vollzyklus", "zwei Vollzyklen", "einem halben Vollzyklus", "vier Vollzyklen"], 0, "Gezählt wird die entladene Energie: 2 × 50 % = 100 % = ein Vollzyklus.")])

l5 = L("bess.m1.l5", "Sicherheit: Thermisches Durchgehen, BMS und Normen", 5, [
 "## Thermisches Durchgehen",
 "Beim thermischen Durchgehen (Thermal Runaway) erwärmt sich eine Zelle selbstverstärkend. Dabei zersetzen sich Bestandteile, es werden brennbare und giftige Gase frei, ein Brand oder eine Explosion ist möglich. Auslöser sind zum Beispiel Überladung, Kurzschluss (innen oder außen), mechanische Beschädigung oder Überhitzung. Das Hauptrisiko im Großspeicher ist die Ausbreitung auf Nachbarzellen und -module.",
 "LFP gilt als thermisch stabiler als NMC, ist aber nicht unbrennbar. Weil beim Durchgehen brennbare Gase entstehen, brauchen Batteriecontainer Gasdetektion und Entlüftung bzw. Druckentlastung.",
 "## Das Batteriemanagementsystem (BMS)",
 "Das BMS überwacht Zellspannungen, Ströme und Temperaturen. Es schützt vor Überladung, Tiefentladung, Überstrom und Übertemperatur, gleicht die Ladezustände der Zellen an (Balancing) und schätzt Ladezustand und Gesundheitszustand.",
 "## Normen",
 "UL 9540A ist eine Prüfmethode dafür, wie sich ein thermisches Durchgehen in einem Speichersystem ausbreitet. Geprüft wird in vier Ebenen: Zelle, Modul, Einheit, Installation. Die Ergebnisse dienen dazu, den nötigen Brand- und Explosionsschutz für die Aufstellung festzulegen. IEC 62619 legt Sicherheitsanforderungen an Lithium-Zellen und -Batterien für industrielle Anwendungen fest, dazu zählen auch stationäre Speicher."
], ["Thermisches Durchgehen: selbstverstärkende Erwärmung, Gase, Brand.", "Hauptrisiko: Ausbreitung auf Nachbarzellen.", "BMS: überwachen, schützen, Balancing, SoC/SoH schätzen.", "UL 9540A: 4 Ebenen Zelle → Modul → Einheit → Installation."],
 ["ul", "ansi", "tesla", "iec62619"],
 [("Thermisches Durchgehen", "Selbstverstärkende Erwärmung einer Zelle mit Gasfreisetzung, Brand- oder Explosionsgefahr."),
  ("Propagation", "Ausbreitung des thermischen Durchgehens auf Nachbarzellen und -module, das Hauptrisiko im Großspeicher."),
  ("Aufgaben des BMS", "Überwachen (Spannung, Strom, Temperatur), Schützen, Balancing, SoC/SoH schätzen."),
  ("Balancing", "Angleichen der Ladezustände der einzelnen Zellen durch das BMS."),
  ("UL 9540A", "Prüfmethode zur Brandausbreitung bei thermischem Durchgehen. Ebenen: Zelle, Modul, Einheit, Installation."),
  ("IEC 62619", "Sicherheitsanforderungen an Lithium-Zellen und -Batterien für industrielle Anwendungen.")],
 [mc("Was ist thermisches Durchgehen (Thermal Runaway)?", ["Eine selbstverstärkende Erwärmung einer Zelle bis zu Gasfreisetzung und Brand", "Die Überhitzung des Transformators", "Das Abschalten des Wechselrichters bei Hitze", "Eine zu stark eingestellte Kühlung"], 0, "Die Zelle erzeugt dabei selbst mehr Wärme, als abgeführt werden kann."),
  multi("Was kann ein thermisches Durchgehen auslösen? (mehrere richtig)", ["Überladung", "Mechanische Beschädigung", "Ein interner Kurzschluss", "Betrieb im zulässigen Temperaturbereich", "Balancing durch das BMS"], [0, 1, 2], "Betrieb innerhalb der Grenzen und Balancing gehören zum sicheren Normalbetrieb."),
  mc("Wozu dient UL 9540A?", ["Zu prüfen, wie sich ein thermisches Durchgehen in einem Speichersystem ausbreitet", "Den Netzanschluss eines Speichers zu genehmigen", "Das Recycling von Zellen zu zertifizieren", "Den Wirkungsgrad zu messen"], 0, "Die Ergebnisse fließen in den Brand- und Explosionsschutz der Aufstellung ein."),
  order("Bringe die Prüfebenen von UL 9540A in die richtige Reihenfolge.", ["Zelle", "Modul", "Einheit", "Installation"], "Geprüft wird vom Kleinen zum Großen: Zelle, Modul, Einheit, Installation."),
  mc("Was bedeutet Balancing im BMS?", ["Die Ladezustände der einzelnen Zellen angleichen", "Netzfrequenz und Speicher abgleichen", "Das Gewicht im Container verteilen", "Strompreise ausgleichen"], 0, "Ohne Balancing würde die schwächste Zelle die nutzbare Kapazität des ganzen Strangs begrenzen."),
  mc("Welche Aussage zu LFP und Sicherheit stimmt?", ["LFP ist thermisch stabiler als NMC, aber nicht unbrennbar", "LFP kann grundsätzlich nicht brennen", "LFP brennt leichter als NMC", "LFP-Speicher brauchen kein BMS"], 0, "Auch LFP-Anlagen brauchen BMS, Brandschutz und Gasmanagement."),
  mc("Warum brauchen Batteriecontainer Gasdetektion und Druckentlastung?", ["Beim thermischen Durchgehen können brennbare Gase entstehen", "Um die Luftfeuchte für die Garantie zu messen", "Aus Gründen des Lärmschutzes", "Weil die Zellen im Normalbetrieb Gas verbrauchen"], 0, "Sammeln sich brennbare Gase, droht eine Explosion. Detektion und Entlastung senken dieses Risiko."),
  mc("Was regelt IEC 62619?", ["Sicherheitsanforderungen an Lithium-Zellen und -Batterien für industrielle Anwendungen", "Die Regeln des europäischen Strommarkts", "Baugenehmigungen für Speicher", "Die Höhe der Netzentgelte"], 0, "Die Norm gilt für industrielle Anwendungen, dazu zählen auch stationäre Speicher.")])

import os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "kurs-bess-m2-8.py"), encoding="utf-8").read())

course = {
 "id": "bess", "title": "Batteriespeicher", "sub": "Von der Zelle bis zur Vermarktung: Technik, Regulatorik und Geschäftsmodelle stationärer Speicher",
 "audience": "Projektentwicklung, Industrie, Energiewirtschaft (Deutschland/EU)",
 "stand": "11/2026", "version": 1,
 "review": "Inhalte mit Quellen erstellt (Recherche-Stand 11/2026). Regulatorik und Marktzahlen ändern sich häufig und stammen teils aus Fachpresse und Kanzleibeiträgen. Eine fachliche Prüfung durch eine externe Fachperson steht noch aus.",
 "levels": [{"id": 1, "title": "Grundlagen"}, {"id": 2, "title": "Fortgeschritten"}, {"id": 3, "title": "Experte"}],
 "modules": [
  {"id": "bess.m1", "level": 1, "title": "Technik & Kennzahlen", "desc": "Aufbau, Zellchemie, Kennzahlen, Alterung und Sicherheit.", "lessons": [l1, l2, l3, l4, l5]},
  {"id": "bess.m2", "level": 1, "title": "Anwendungen: Behind- und Front-of-the-Meter", "desc": "Peak Shaving, Eigenverbrauch, Großspeicher am Netz, Kombination mit PV und Wind.", "lessons": M2},
  {"id": "bess.m3", "level": 2, "title": "Vermarktung & Betriebsmodelle", "desc": "Day-Ahead, Intraday, Regelleistung (FCR, aFRR), Arbitrage, Tolling, Flexibilität.", "lessons": M3},
  {"id": "bess.m4", "level": 2, "title": "Netzanschluss & Genehmigung", "desc": "Netzanschlussverfahren, Baukostenzuschuss, Baugenehmigung, Brandschutzkonzept.", "lessons": M4},
  {"id": "bess.m5", "level": 2, "title": "Steuern, Abgaben & Hauptzollamt", "desc": "Stromsteuer, Netzentgelte, Befreiungen für Speicher und ihre Voraussetzungen.", "lessons": M5},
  {"id": "bess.m6", "level": 3, "title": "Projektplanung & Wirtschaftlichkeit", "desc": "Dimensionierung, Business Case, Verträge, Garantien, Ausschreibung.", "lessons": M6},
  {"id": "bess.m7", "level": 3, "title": "Markt & Hersteller", "desc": "Lieferketten EU und China, Integratoren, Preisentwicklung, Herausforderungen.", "lessons": M7},
  {"id": "bess.m8", "level": 3, "title": "Forschung & neue Konzepte", "desc": "Virtuelle Speicher, neue Zellchemien, aktuelle Studienlage.", "lessons": M8}
 ]
}
json.dump(course, open(sys.argv[1], "w"), ensure_ascii=False, indent=1)
json.dump({"courses": [{"id": "bess", "file": "bess.json"}]}, open(sys.argv[2], "w"), ensure_ascii=False, indent=1)
al=[l for m in course["modules"] for l in m["lessons"]]
print(len(al), "Lektionen", sum(len(l["qs"]) for l in al), "Fragen", sum(len(l["cards"]) for l in al), "Karten")
