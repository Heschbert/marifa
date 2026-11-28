# Nachbesserungen: Antwortlängen ausgleichen (richtige Antwort soll nicht auffällig die längste sein)
# und zusätzliche Übungsfragen, damit jede Lektion mindestens 4 Fragen hat.
from common import mc, num, multi, order

OPTS = {
 "wkeit.m1.l1.q3": ["Eine Wahrscheinlichkeit kann 1,2 sein", "0,5 entspricht genau 50 Prozent", "1 bedeutet: Das Ereignis tritt sicher ein", "0 bedeutet: Das Ereignis tritt nie ein"],
 "wkeit.m1.l1.q4": ["Die Ausgänge sind nicht gleich wahrscheinlich", "Weil es deutlich mehr als zwei mögliche Ausgänge gibt", "Weil Wetter gar nicht zufällig ist", "Weil 1/2 keine gültige Wahrscheinlichkeit ist"],
 "wkeit.m1.l2.q3": ["Der Anteil nähert sich p", "Nach einer Pechsträhne kommt zwingend wieder Glück", "Seltene Ereignisse passieren nie", "Ab 100 Würfen ist alles exakt"],
 "wkeit.m1.l2.q4": ["Kleine Stichproben schwanken stark", "Weil die Münze sich erst einspielen muss", "Weil Kopf schwerer ist", "Weil 70 % fast 50 % sind"],
 "wkeit.m1.l3.q3": ["Mehrfach-Sechsen zählen doppelt", "Weil Würfel kein Gedächtnis haben", "Weil 1/6 falsch ist", "Weil man durch 4 teilen muss"],
 "wkeit.m2.l1.q3": ["100-mal so viele", "Doppelt so viele Möglichkeiten", "50 % mehr", "20-mal so viele"],
 "wkeit.m2.l3.q2": ["Ohne Reihenfolge", "Wenn Zurücklegen ausdrücklich erlaubt ist", "Wenn n kleiner als k ist", "Wenn alle Dinge gleich sind"],
 "wkeit.m3.l4.q2": ["Beide gleich wahrscheinlich", "Die gemischte, unregelmäßige Folge", "Die Folge mit nur Kopf", "Das hängt vom Wetter ab"],
 "wkeit.m4.l1.q2": ["Nicht, dass es dort gefährlicher ist", "Dass Fahren in der Nähe des Wohnorts besonders gefährlich ist", "Dass man weit weg fahren sollte", "Dass Ortskundige schlechter fahren"],
 "wkeit.m4.l2.q3": ["Es gibt viel mehr Gesunde", "Weil die Tests absichtlich ungenau gebaut sind", "Weil Kranke den Test oft verweigern", "Weil die Sensitivität zu hoch ist"],
 "wkeit.m4.l2.q4": ["Mit anderem Test bestätigen", "Sofort mit der Behandlung beginnen", "Den Test einfach ignorieren", "Den gleichen Test sehr oft wiederholen"],
 "wkeit.m4.l3.q2": ["Wie viele mit dem Merkmal scheiterten?", "Was haben alle Erfolgreichen gemeinsam?", "Wer ist am erfolgreichsten?", "Wie lange gibt es die Firmen schon am Markt?"],
 "wkeit.m4.l4.q2": ["Beides je 1/2", "Dann ist Wechseln noch besser", "Dann ist Bleiben besser", "Nichts ändert sich, immer 2/3"],
 "wkeit.m5.l2.q3": ["Im Schnitt 5 Cent Verlust pro Spiel", "Jedes einzelne Spiel kostet genau 5 Cent", "Man gewinnt 5 % der Spiele", "Das Spiel ist fair"],
 "wkeit.m5.l3.q2": ["B streut stärker", "Beide haben dasselbe Risiko", "A hat die größere Streuung", "B hat den höheren Erwartungswert"],
 "wkeit.m5.l3.q3": ["Damit sich ± nicht aufheben", "Damit die Zahl am Ende kleiner wird", "Weil Quadrieren schneller ist", "Damit das Ergebnis Prozent ist"],
 "wkeit.m5.l4.q1": ["Bei existenzbedrohendem Schaden", "Wenn der mögliche Schaden sehr klein ist", "Wenn man nie Pech hat", "Wenn sie besonders günstig wirkt"],
 "wkeit.m6.l1.q3": ["p steigt mit jedem Versuch", "Die Versuche sind voneinander unabhängig", "Es gibt nur Treffer oder Niete", "Die Anzahl der Versuche steht fest"],
 "wkeit.m6.l4.q2": ["Mittelwerte werden annähernd normal", "Alle einzelnen Daten sind am Ende normalverteilt", "Große Stichproben haben keine Streuung", "Zufall verschwindet bei vielen Daten"],
 "wkeit.m7.l1.q3": ["Selbstselektion", "Zu viele Fragen auf einmal", "Zu kleine Schrift", "Online-Umfragen sind verboten"],
 "wkeit.m7.l2.q1": ["Unter H₀ wären solche Daten selten (≈ 3 %)", "H₀ ist mit 3 % Wahrscheinlichkeit wahr", "Der Effekt ist genau 3 % groß", "Das Ergebnis ist zu 97 % richtig und sicher"],
 "wkeit.m7.l2.q3": ["Echt, aber kaum relevant", "Der Effekt ist groß", "Das Medikament wirkt bei allen Patienten gleich", "Die Studie ist falsch"],
 "wkeit.m7.l3.q2": ["Mehr Daten", "Ein kleineres Signifikanzniveau α", "Ein größeres α", "Weniger Daten"],
 "wkeit.m7.l4.q3": ["Mehr schwere Fälle", "Weil sie mehr Personal beschäftigt", "Weil sie weniger Patienten hat", "Das ist mathematisch unmöglich"],
 "wkeit.m8.l1.q2": ["Die Einschätzung vorher", "Das Ergebnis nach der Rechnung mit den Daten", "Die Fehlalarmrate", "Die Größe der Stichprobe"],
 "wkeit.m8.l4.q2": ["20 vs. 10 von 1.000", "Das Risiko sinkt um 50 Prozent", "Die Maßnahme ist hochwirksam", "Signifikante Reduktion"],
}

MORE = {
 "wkeit.m1.l4": [num("Wie viel Prozent sind 3 von 40?", 7.5, "%", 0.1, "3 ÷ 40 = 0,075.")],
 "wkeit.m2.l1": [num("Ein Fahrradschloss hat 3 Ringe mit je 10 Ziffern. Wie viele Kombinationen gibt es?", 1000, "", 0, "10 · 10 · 10 = 1.000.")],
 "wkeit.m2.l2": [num("Wie viele verschiedene „Wörter“ lassen sich aus den Buchstaben A, B, C, D bilden, wenn jeder genau einmal vorkommt?", 24, "", 0, "4! = 24.")],
 "wkeit.m2.l3": [num("Wie viele Möglichkeiten gibt es, 2 von 10 Bewerbern einzuladen?", 45, "", 0, "10 · 9 ÷ 2 = 45.")],
 "wkeit.m2.l4": [mc("Ab wie vielen Personen ist ein gemeinsamer Geburtstag wahrscheinlicher als nicht?", ["23", "183", "365", "57"], 0, "Bei 23 Personen liegt die Wahrscheinlichkeit bei etwa 50,7 %.")],
 "wkeit.m3.l2": [mc("Bei welcher Situation darf man näherungsweise mit Zurücklegen rechnen?", ["Umfrage unter Millionen Wahlberechtigten", "Zwei Karten aus einem Skatblatt", "Lottozahlen ziehen", "Zwei Socken aus einer Schublade mit vier Socken"], 0, "Bei sehr großer Grundgesamtheit verändert ein Zug die Anteile kaum.")],
 "wkeit.m3.l3": [num("Zwei unabhängige Ereignisse: P(A) = 0,3, P(B) = 0,5. Wie groß ist P(A und B) in Prozent?", 15, "%", 0.2, "0,3 · 0,5 = 0,15.")],
 "wkeit.m3.l4": [num("Wie groß ist die Wahrscheinlichkeit für fünfmal hintereinander Schwarz beim europäischen Roulette (in Prozent, gerundet)?", 2.7, "%", 0.1, "(18/37)⁵ ≈ 0,027, also etwa 2,7 %."),
                 mc("Warum wirken echte Zufallsfolgen oft „nicht zufällig“?", ["Sie enthalten mehr Serien als erwartet", "Weil Computer schlecht würfeln", "Weil Zufall immer abwechselt", "Weil Serien verboten sind"], 0, "Lange Serien sind normal; Menschen erwarten zu viel Abwechslung.")],
 "wkeit.m4.l1": [num("Von 1.000 Personen sind 300 Raucher. Wie groß ist P(Raucher) in Prozent?", 30, "%", 0.1, "300 ÷ 1.000 = 0,3.")],
 "wkeit.m4.l3": [mc("Ein DNA-Merkmal passt zufällig bei 1 von 1 Million. Was folgt allein daraus?", ["Wenig ohne weitere Hinweise", "Der Verdächtige ist sicher schuldig", "Der Verdächtige ist sicher unschuldig", "Die Probe ist ungültig"], 0, "In einer großen Bevölkerung passen auch andere Personen; der Treffer allein reicht nicht."),
                 mc("Welche Frage hilft gegen Fehlschlüsse mit Bedingungen?", ["Unter welcher Bedingung wurde gezählt?", "Wie hoch ist die Zahl insgesamt?", "Wer hat die Studie bezahlt?", "Wie alt sind die Daten?"], 0, "Erst die Bedingung klärt, welche Richtung P(A | B) gemeint ist.")],
 "wkeit.m4.l4": [mc("Was ist der Schlüssel zum Verständnis des Ziegenproblems?", ["Der Moderator weiß, wo das Auto ist", "Die Türen sind unterschiedlich groß", "Ziegen sind schwer zu verstecken", "Man darf nur einmal wählen"], 0, "Weil der Moderator nie die Autotür öffnet, steckt in seiner Wahl Information.")],
 "wkeit.m5.l1": [mc("Was ergibt die Summe aller Wahrscheinlichkeiten einer Verteilung?", ["Immer 1", "Immer 0", "Den Erwartungswert", "Die Anzahl der Werte"], 0, "Irgendein Wert tritt sicher ein.")],
 "wkeit.m5.l2": [num("Bei einem Spiel gewinnt man mit 1/4 Wahrscheinlichkeit 8 €, sonst 0 €. Wie hoch muss der Einsatz sein, damit es fair ist (in Euro)?", 2, "€", 0.01, "Erwarteter Gewinn 8 € · 1/4 = 2 €.")],
 "wkeit.m5.l3": [num("Ein Würfel hat die Varianz 35/12. Wie groß ist die Standardabweichung (gerundet auf zwei Stellen)?", 1.71, "", 0.01, "√(35/12) ≈ 1,71.")],
 "wkeit.m5.l4": [mc("Was beschreibt Verlustaversion?", ["Verluste wiegen schwerer als Gewinne", "Man meidet jedes Risiko völlig", "Gewinne zählen doppelt", "Verluste werden vergessen"], 0, "Ein Verlust von 100 € fühlt sich stärker an als ein Gewinn von 100 €."),
                 mc("Welche Versicherung ist für die meisten Haushalte am wichtigsten?", ["Private Haftpflicht", "Handyversicherung", "Brillenversicherung", "Reisegepäckversicherung"], 0, "Haftpflichtschäden können existenzbedrohend sein; die anderen betreffen kleine, tragbare Schäden.")],
 "wkeit.m6.l1": [num("Wie groß ist die Standardabweichung der Anzahl „Kopf“ bei 100 Münzwürfen?", 5, "", 0, "√(100 · 0,5 · 0,5) = √25 = 5.")],
 "wkeit.m6.l2": [num("Wie viel Prozent der Werte liegen bei einer Normalverteilung ungefähr innerhalb von μ ± 2σ?", 95, "%", 1, "68-95-99,7-Regel.")],
 "wkeit.m6.l3": [num("Mittlere Rate 3 Fehler pro Seite. Wie viele Fehler erwartet man auf 10 Seiten?", 30, "", 0, "λ addiert sich: 10 · 3 = 30."),
                 mc("Welche Situation passt am besten zur Poisson-Verteilung?", ["Anrufe pro Minute bei einer Hotline", "Körpergröße von Erwachsenen", "Augensumme zweier Würfel", "Ergebnis eines Münzwurfs"], 0, "Zählungen seltener, unabhängiger Ereignisse in einem Zeitraum.")],
 "wkeit.m6.l4": [num("Standardabweichung einer Messung 12. Wie groß ist der Standardfehler des Mittelwerts aus 36 Messungen?", 2, "", 0, "12 ÷ √36 = 12 ÷ 6 = 2."),
                 mc("Warum ähnelt die Summe von zehn Würfeln einer Glockenkurve?", ["Zentraler Grenzwertsatz", "Weil Würfel normalverteilt sind", "Weil zehn eine runde Zahl ist", "Gesetz der kleinen Zahlen"], 0, "Summen vieler unabhängiger Größen werden annähernd normal.")],
 "wkeit.m7.l1": [mc("Was bedeutet ein 95-%-Konfidenzintervall richtig?", ["Das Verfahren trifft in 95 % der Fälle", "95 % der Befragten liegen darin", "Der Wert ist zu 95 % richtig", "95 % haben geantwortet"], 0, "Die 95 % beziehen sich auf das Verfahren bei vielen Wiederholungen.")],
 "wkeit.m7.l2": [mc("Was ist p-Hacking?", ["So lange testen, bis p < 0,05", "Einen Test einmal sauber rechnen", "Die Stichprobe vorher festlegen", "Ergebnisse vollständig berichten"], 0, "Vielfaches Ausprobieren erzeugt zufällige „Signifikanzen“.")],
 "wkeit.m7.l3": [mc("Ein Corona-Schnelltest zeigt negativ, obwohl die Person infiziert ist. Welcher Fehler ist das (H₀: nicht infiziert)?", ["Fehler 2. Art", "Fehler 1. Art", "Kein Fehler", "Ein Rundungsfehler"], 0, "H₀ ist falsch, wird aber beibehalten: übersehener Effekt."),
                 mc("Was ist die Teststärke (Power)?", ["Chance, einen echten Effekt zu finden", "Größe der Stichprobe", "Höhe des p-Werts", "Anzahl der Hypothesen"], 0, "Power = 1 − Wahrscheinlichkeit des Fehlers 2. Art.")],
 "wkeit.m7.l4": [mc("Eisverkauf und Badeunfälle hängen zusammen. Was ist die wahrscheinlichste Erklärung?", ["Beides hängt vom Wetter ab", "Eis verursacht Badeunfälle", "Badeunfälle machen hungrig", "Reiner Messfehler"], 0, "Eine Störvariable (Temperatur) beeinflusst beide.")],
 "wkeit.m8.l1": [num("Prior 1 : 1 (50 %), Likelihood-Quotient 3. Posterior in Prozent?", 75, "%", 0.5, "Odds 3 : 1 → 3/4 = 75 %."),
                 mc("Was passiert mit den Chancen bei zwei unabhängigen Hinweisen mit Quotient 4 und 5?", ["Sie werden mit 20 multipliziert", "Sie werden mit 9 multipliziert", "Sie bleiben gleich", "Sie werden halbiert"], 0, "Quotienten unabhängiger Hinweise multiplizieren sich: 4 · 5 = 20.")],
 "wkeit.m8.l2": [num("Im Wetterbeispiel (Sonne→Sonne 0,8; Regen→Sonne 0,4): Wie groß ist der langfristige Anteil Regentage (in Prozent, gerundet)?", 33, "%", 1, "1 − 2/3 ≈ 33 %."),
                 mc("Wo kommen Markow-Ketten zum Einsatz?", ["Bewertung von Webseiten (PageRank)", "Beim Würfeln mit einem Würfel", "Beim Berechnen von Fakultäten", "Beim Ziehen ohne Zurücklegen"], 0, "PageRank modelliert einen Zufallssurfer als Markow-Kette.")],
 "wkeit.m8.l3": [mc("Woher hat die Monte-Carlo-Methode ihren Namen?", ["Vom Casino in Monte Carlo", "Von einem Mathematiker namens Monte", "Von einer Automarke", "Von einem Rennen"], 0, "Der Name spielt auf das Glücksspiel an, also auf Zufall."),
                 num("Ein Würfelspiel wird 10.000-mal simuliert, 1.670-mal fällt eine Sechs. Welcher Schätzwert für P(6) ergibt sich (in Prozent)?", 16.7, "%", 0.1, "1.670 ÷ 10.000 = 0,167.")],
 "wkeit.m8.l4": [num("Ein Risiko sinkt von 10 auf 8 von 1.000. Wie groß ist die NNT?", 500, "", 0, "Absolute Reduktion 2/1.000 = 0,002; 1 ÷ 0,002 = 500.")],
}

# Zweite Runde: Fälle, in denen die richtige Antwort nun auffällig die kürzeste war
OPTS.update({
 "wkeit.m1.l2.q3": ["Der Anteil nähert sich der Wahrscheinlichkeit", "Nach einer Pechsträhne kommt zwingend wieder Glück", "Seltene Ereignisse passieren nie", "Ab 100 Würfen ist alles exakt"],
 "wkeit.m2.l3.q2": ["Wenn die Reihenfolge egal ist", "Wenn Zurücklegen ausdrücklich erlaubt ist", "Wenn n kleiner als k ist", "Wenn alle Dinge gleich sind"],
 "wkeit.m4.l2.q3": ["Weil es viel mehr Gesunde als Kranke gibt", "Weil die Tests absichtlich ungenau gebaut sind", "Weil Kranke den Test oft verweigern", "Weil die Sensitivität zu hoch ist"],
 "wkeit.m4.l2.q4": ["Mit einem anderen Test bestätigen", "Sofort mit der Behandlung beginnen", "Den Test einfach ignorieren", "Den gleichen Test sehr oft wiederholen"],
 "wkeit.m4.l4.q2": ["Bleiben und Wechseln je 1/2", "Dann ist Wechseln noch besser", "Dann ist Bleiben besser", "Nichts ändert sich, immer 2/3"],
 "wkeit.m5.l1.q4": ["Immer genau 1", "Immer 0", "Den Erwartungswert", "Die Anzahl der Werte"],
 "wkeit.m5.l3.q2": ["B hat die größere Streuung", "Beide haben dasselbe Risiko", "A hat die größere Streuung", "B hat den höheren Erwartungswert"],
 "wkeit.m5.l3.q3": ["Damit sich ± Werte nicht aufheben", "Damit die Zahl am Ende kleiner wird", "Weil Quadrieren schneller ist", "Damit das Ergebnis Prozent ist"],
 "wkeit.m6.l1.q3": ["Die Trefferwahrscheinlichkeit steigt", "Die Versuche sind voneinander unabhängig", "Es gibt nur Treffer oder Niete", "Die Anzahl der Versuche steht fest"],
 "wkeit.m6.l4.q2": ["Mittelwerte werden annähernd normalverteilt", "Alle einzelnen Daten sind am Ende normalverteilt", "Große Stichproben haben keine Streuung", "Zufall verschwindet bei vielen Daten"],
 "wkeit.m7.l1.q3": ["Selbstselektion der Leute", "Zu viele Fragen auf einmal", "Zu kleine Schrift", "Online-Umfragen sind verboten"],
 "wkeit.m7.l3.q2": ["Mehr Daten sammeln", "Ein kleineres Signifikanzniveau α", "Ein größeres α", "Weniger Daten"],
 "wkeit.m7.l4.q3": ["Sie behandelt mehr schwere Fälle", "Weil sie mehr Personal beschäftigt", "Weil sie weniger Patienten hat", "Das ist mathematisch unmöglich"],
 "wkeit.m8.l4.q2": ["Ohne: 20 von 1.000, mit: 10", "Das Risiko sinkt um 50 Prozent", "Die Maßnahme ist hochwirksam", "Signifikante Reduktion"],
})
# p-Hacking-Frage (in MORE angelegt) ausgeglichener formulieren
MORE["wkeit.m7.l2"] = [mc("Was ist p-Hacking?", ["Testen, bis p < 0,05 herauskommt", "Einen Test einmal sauber rechnen", "Die Stichprobe vorher festlegen", "Ergebnisse vollständig berichten"], 0, "Vielfaches Ausprobieren erzeugt zufällige „Signifikanzen“.")]
MORE["wkeit.m6.l4"][1] = mc("Warum ähnelt die Summe von zehn Würfeln einer Glockenkurve?", ["Der zentrale Grenzwertsatz", "Weil Würfel normalverteilt sind", "Weil zehn eine runde Zahl ist", "Gesetz der kleinen Zahlen"], 0, "Summen vieler unabhängiger Größen werden annähernd normal.")

# Dritte Runde: zu oft die zweitlängste. Einige werden längste (Ablenker gekürzt), einige kürzeste (Lösung gekürzt).
OPTS.update({
 "wkeit.m1.l2.q3": ["Der Anteil nähert sich der Wahrscheinlichkeit", "Nach Pech kommt zwingend Glück", "Seltene Ereignisse passieren nie", "Ab 100 Würfen ist alles exakt"],
 "wkeit.m1.l3.q3": ["Mehrfach-Sechsen zählen doppelt", "Würfel haben kein Gedächtnis", "Weil 1/6 falsch ist", "Weil man durch 4 teilen muss"],
 "wkeit.m2.l4.q2": ["Wir denken an uns statt an alle Paare", "Sommer-Geburtstage sind häufiger", "Weil das Jahr 366 Tage hat", "Weil Zwillinge mitzählen"],
 "wkeit.m3.l3.q2": ["Zwei Fälle in einer Familie sind nicht unabhängig", "Weil man hätte addieren müssen", "Weil die Zahl zu klein war", "Vor Gericht zählen Zahlen nicht"],
 "wkeit.m4.l2.q3": ["Weil es viel mehr Gesunde als Kranke gibt", "Tests sind absichtlich ungenau", "Weil Kranke den Test oft verweigern", "Weil die Sensitivität zu hoch ist"],
 "wkeit.m5.l3.q3": ["Damit sich ± Werte nicht aufheben", "Damit die Zahl kleiner wird", "Weil Quadrieren schneller ist", "Damit das Ergebnis Prozent ist"],
 "wkeit.m7.l2.q1": ["Unter H₀ wären solche Daten selten (≈ 3 %)", "H₀ ist mit 3 % Wahrscheinlichkeit wahr", "Der Effekt ist genau 3 % groß", "Das Ergebnis ist zu 97 % sicher"],
 "wkeit.m2.l3.q2": ["Reihenfolge egal", "Wenn Zurücklegen ausdrücklich erlaubt ist", "Wenn n kleiner als k ist", "Wenn alle Dinge gleich sind"],
 "wkeit.m4.l1.q2": ["Nicht unbedingt mehr Gefahr", "Dass Fahren in der Nähe des Wohnorts besonders gefährlich ist", "Dass man weit weg fahren sollte", "Dass Ortskundige schlechter fahren"],
 "wkeit.m6.l1.q3": ["p wird größer", "Die Versuche sind voneinander unabhängig", "Es gibt nur Treffer oder Niete", "Die Anzahl der Versuche steht fest"],
 "wkeit.m3.l4.q2": ["Beide gleich", "Die gemischte, unregelmäßige Folge", "Die Folge mit nur Kopf", "Das hängt vom Wetter ab"],
})
MORE["wkeit.m8.l3"][0] = mc("Woher hat die Monte-Carlo-Methode ihren Namen?", ["Vom Casino", "Von einem Mathematiker namens Monte", "Von einer Automarke", "Von einem Rennen"], 0, "Der Name spielt auf das Casino in Monte Carlo an, also auf Zufall.")
