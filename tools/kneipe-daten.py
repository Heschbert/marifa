# Erzeugt data/kneipe.json: Pub-Quiz-Fragen (richtige Antwort zuerst), Karten für „Ich hab noch nie & Co.“ und Regeln für „König“.
# Aufruf: python3 tools/kneipe-daten.py
import json, os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "kneipe.json")

QUIZ = {
 "Irland & Pubs": [
  ("Wie heißt die Hauptstadt der Republik Irland?", ["Dublin", "Cork", "Galway", "Belfast"]),
  ("Welcher Heilige wird am 17. März gefeiert?", ["St. Patrick", "St. Andrew", "St. George", "St. David"]),
  ("Welches Instrument ist das Wappensymbol Irlands?", ["Harfe", "Dudelsack", "Geige", "Flöte"]),
  ("In welcher Stadt wird Guinness seit 1759 gebraut?", ["Dublin", "Belfast", "Limerick", "Cork"]),
  ("Wie heißt die irische Sprache auf Irisch?", ["Gaeilge", "Gàidhlig", "Cymraeg", "Brezhoneg"]),
  ("Welcher Fluss fließt durch Dublin?", ["Liffey", "Shannon", "Boyne", "Lee"]),
  ("Mit welcher Währung bezahlt man in der Republik Irland?", ["Euro", "Irisches Pfund", "Britisches Pfund", "Schilling"]),
  ("Wie viele Blätter hat das klassische irische Kleeblatt (Shamrock)?", ["Drei", "Vier", "Fünf", "Zwei"]),
  ("Wer schrieb den Roman „Ulysses“?", ["James Joyce", "Oscar Wilde", "Samuel Beckett", "W. B. Yeats"]),
  ("In wie viele Grafschaften ist die Insel Irland traditionell eingeteilt?", ["32", "26", "30", "36"]),
 ],
 "Bier & Getränke": [
  ("Welche vier Zutaten erlaubt das deutsche Reinheitsgebot heute für untergäriges Bier?", ["Wasser, Malz, Hopfen, Hefe", "Wasser, Weizen, Zucker, Hefe", "Wasser, Malz, Zucker, Hopfen", "Wasser, Gerste, Honig, Hefe"]),
  ("In welchem Jahr wurde das bayerische Reinheitsgebot erlassen?", ["1516", "1616", "1416", "1871"]),
  ("Was ist ein Stout?", ["Dunkles Bier mit Röstmalz", "Helles Weizenbier", "Starker Apfelwein", "Süßes Kräuterbier"]),
  ("Aus welchem Obst wird klassischer Cider gemacht?", ["Äpfel", "Birnen", "Trauben", "Kirschen"]),
  ("Welche Spirituose gehört in einen Irish Coffee?", ["Irischer Whiskey", "Brauner Rum", "Weinbrand", "Wodka"]),
  ("Wie viele Milliliter hat ein britisches Pint ungefähr?", ["568", "500", "473", "600"]),
  ("In welcher Stadt findet das Oktoberfest statt?", ["München", "Stuttgart", "Nürnberg", "Köln"]),
  ("Aus welchem Getreide wird schottischer Single Malt Whisky gebrannt?", ["Gerste", "Mais", "Roggen", "Weizen"]),
  ("Aus welchem Land stammt Tequila?", ["Mexiko", "Spanien", "Kuba", "Peru"]),
  ("Welches Bier trinkt man traditionell in Köln?", ["Kölsch", "Alt", "Pils", "Bock"]),
 ],
 "Musik": [
  ("Welche irische Band sang „With or Without You“?", ["U2", "The Cranberries", "The Corrs", "Thin Lizzy"]),
  ("Wer veröffentlichte 1994 den Song „Zombie“?", ["The Cranberries", "U2", "Sinéad O'Connor", "The Pogues"]),
  ("Aus welcher Stadt stammten die Beatles?", ["Liverpool", "London", "Manchester", "Birmingham"]),
  ("Wie hieß der Leadsänger von Queen?", ["Freddie Mercury", "Brian May", "Roger Taylor", "John Deacon"]),
  ("Welches Instrument spielte Jimi Hendrix vor allem?", ["E-Gitarre", "Schlagzeug", "Bass", "Klavier"]),
  ("Welcher Song von The Pogues ist ein Weihnachtsklassiker?", ["Fairytale of New York", "Dirty Old Town", "Whiskey in the Jar", "Sally MacLennane"]),
  ("Wie viele Saiten hat eine Standard-Gitarre?", ["Sechs", "Vier", "Sieben", "Zwölf"]),
  ("Wer veröffentlichte das Album „Thriller“?", ["Michael Jackson", "Prince", "Madonna", "Stevie Wonder"]),
  ("Welche Band sang „Bohemian Rhapsody“?", ["Queen", "Led Zeppelin", "The Who", "Pink Floyd"]),
  ("Aus welchem Land kommt ABBA?", ["Schweden", "Norwegen", "Dänemark", "Finnland"]),
 ],
 "Film & Fernsehen": [
  ("Wie heißt die Stammkneipe in „How I Met Your Mother“?", ["MacLaren's", "Moe's", "Paddy's Pub", "Central Perk"]),
  ("Wie heißt die Kneipe in „Die Simpsons“?", ["Moe's Taverne", "Joe's Bar", "Duff Garden", "Krusty's Inn"]),
  ("Wer spielte James Bond in „Casino Royale“ (2006)?", ["Daniel Craig", "Pierce Brosnan", "Sean Connery", "Roger Moore"]),
  ("Wie viele Filme umfasst die „Herr der Ringe“-Trilogie?", ["Drei", "Vier", "Zwei", "Sechs"]),
  ("Welchen Drink bestellt James Bond klassisch „geschüttelt, nicht gerührt“?", ["Wodka-Martini", "Gin Tonic", "Whisky Sour", "Mojito"]),
  ("In welcher Stadt spielt die Serie „Friends“?", ["New York", "Chicago", "Boston", "Los Angeles"]),
  ("Wer führte Regie bei „Titanic“ (1997)?", ["James Cameron", "Steven Spielberg", "Ridley Scott", "Peter Jackson"]),
  ("Wie heißt der Drache in „Der Hobbit“?", ["Smaug", "Drogon", "Fuchur", "Glaurung"]),
  ("In welcher Stadt spielt die Kneipen-Serie „Cheers“?", ["Boston", "New York", "Chicago", "Seattle"]),
  ("Welcher Film gewann 2020 als erster nicht englischsprachiger Film den Oscar als bester Film?", ["Parasite", "Roma", "Amélie", "Das Leben der Anderen"]),
 ],
 "Sport": [
  ("Welcher irische Mannschaftssport wird mit einem Schläger namens Hurley gespielt?", ["Hurling", "Cricket", "Rugby League", "Polo"]),
  ("Wie viele Punkte sind mit drei Darts maximal möglich?", ["180", "150", "200", "171"]),
  ("Wie viele Punkte zählt das innere Bull's Eye beim Darts?", ["50", "25", "60", "100"]),
  ("Wie viele Spieler hat ein Rugby-Union-Team auf dem Feld?", ["15", "11", "13", "7"]),
  ("Wie viele Kugeln liegen beim Snooker zu Beginn auf dem Tisch, die weiße mitgezählt?", ["22", "16", "21", "15"]),
  ("Welches Land wurde 2014 Fußball-Weltmeister?", ["Deutschland", "Argentinien", "Spanien", "Brasilien"]),
  ("Wie lang ist ein Marathon, gerundet?", ["42,2 km", "40,0 km", "44,5 km", "38,6 km"]),
  ("In welcher Sportart gibt es das „Six Nations“-Turnier?", ["Rugby", "Cricket", "Hockey", "Darts"]),
  ("Wie oft war Deutschland bis 2024 Gastgeber einer Fußball-EM der Männer?", ["Zweimal", "Einmal", "Dreimal", "Viermal"]),
  ("Welche Farbe hat beim Snooker die Kugel mit dem höchsten Wert?", ["Schwarz", "Pink", "Blau", "Grün"]),
 ],
 "Kneipenwissen": [
  ("Was bedeutet „Sláinte“ auf Irisch?", ["Prost", "Danke", "Hallo", "Tschüss"]),
  ("Wie viele Augen hat ein normaler Würfel insgesamt?", ["21", "18", "24", "20"]),
  ("Wie viele Karten hat ein Pokerblatt ohne Joker?", ["52", "32", "54", "48"]),
  ("Welches Symbol trägt das Guinness-Logo?", ["Eine Harfe", "Ein Kleeblatt", "Eine Krone", "Einen Hirsch"]),
  ("Wofür ist „Pub“ die Kurzform?", ["Public House", "Public Bar", "Publican Hall", "Pub Union"]),
  ("Was ruft der Wirt im britischen Pub kurz vor Schluss?", ["Last Orders", "Final Call", "Closing Shot", "End Round"]),
  ("Wie viele Felder hat ein Schachbrett?", ["64", "48", "81", "100"]),
  ("Was mischt man für einen „Black Velvet“?", ["Stout und Sekt", "Rum und Cola", "Bier und Limonade", "Gin und Tonic"]),
  ("Wie viele Stück sind ein „baker's dozen“?", ["13", "12", "11", "14"]),
  ("Wie heißt der irische Nationalfeiertag am 17. März?", ["Patrick's Day", "Bloomsday", "Bastille Day", "Burns Night"]),
 ],
}

NIE = ["Ich hab noch nie einen Flug verpasst.", "Ich hab noch nie auf einer Hochzeit getanzt.", "Ich hab noch nie in einem Zelt geschlafen.", "Ich hab noch nie einen Strafzettel bekommen.",
 "Ich hab noch nie im Kino geweint.", "Ich hab noch nie einen Kaktus umgebracht.", "Ich hab noch nie Karaoke gesungen.", "Ich hab noch nie eine Nachricht an die falsche Person geschickt.",
 "Ich hab noch nie den Geburtstag eines guten Freundes vergessen.", "Ich hab noch nie ein Buch nicht zu Ende gelesen.", "Ich hab noch nie bei einem Brettspiel geschummelt.", "Ich hab noch nie einen ganzen Tag im Bett verbracht.",
 "Ich hab noch nie ein Pub-Quiz gewonnen.", "Ich hab noch nie Sushi gegessen.", "Ich hab noch nie ein Instrument gelernt.", "Ich hab noch nie eine Serie an einem Wochenende durchgeschaut.",
 "Ich hab noch nie einen Marathon gelaufen.", "Ich hab noch nie in einem anderen Land gearbeitet.", "Ich hab noch nie einen Prominenten getroffen.", "Ich hab noch nie beim Lachen Getränk durch die Nase bekommen.",
 "Ich hab noch nie mein Handy in die Toilette fallen lassen.", "Ich hab noch nie einen Liebesbrief geschrieben.", "Ich hab noch nie im Meer nachts gebadet.", "Ich hab noch nie eine Wette verloren und musste etwas Peinliches tun.",
 "Ich hab noch nie eine ganze Pizza allein gegessen.", "Ich hab noch nie ein Tattoo bereut.", "Ich hab noch nie den Wecker überhört und war deshalb zu spät.", "Ich hab noch nie in der Öffentlichkeit gesungen.",
 "Ich hab noch nie einen Sonnenaufgang auf einem Berg gesehen.", "Ich hab noch nie vergessen, wo ich geparkt habe.", "Ich hab noch nie Fallschirm oder Bungee gesprungen.", "Ich hab noch nie eine Pflanze gerettet, die alle aufgegeben hatten.",
 "Ich hab noch nie in einem Escape Room festgesteckt.", "Ich hab noch nie eine Sprache nur aus Filmen gelernt.", "Ich hab noch nie meinen Namen falsch geschrieben bekommen und nichts gesagt.", "Ich hab noch nie den Schlüssel von innen stecken lassen."]
EHER = ["Wer würde eher beim Pub-Quiz alles googeln?", "Wer würde eher einen Flug verpassen?", "Wer würde eher spontan nach Irland auswandern?", "Wer würde eher als Erstes auf der Tanzfläche stehen?",
 "Wer würde eher eine Zombie-Apokalypse überleben?", "Wer würde eher eine Band gründen?", "Wer würde eher im Lotto gewinnen und es allen verheimlichen?", "Wer würde eher beim Karaoke das Mikro nicht mehr hergeben?",
 "Wer würde eher eine Wette um Mitternacht annehmen?", "Wer würde eher eine Katze statt eines Partners mit nach Hause bringen?", "Wer würde eher einen eigenen Pub eröffnen?", "Wer würde eher beim Film einschlafen?",
 "Wer würde eher sein Handy im Taxi liegen lassen?", "Wer würde eher eine Reality-Show gewinnen?", "Wer würde eher mit Fremden Freundschaft schließen?", "Wer würde eher einen Marathon ohne Training laufen?",
 "Wer würde eher bei einem Kochwettbewerb die Küche anzünden?", "Wer würde eher heimlich die letzte Pommes essen?", "Wer würde eher in einem Escape Room als Letztes rauskommen?", "Wer würde eher eine Rede halten, ohne gefragt zu werden?",
 "Wer würde eher sich in der eigenen Stadt verlaufen?", "Wer würde eher ein Instrument im Pub spontan mitspielen?", "Wer würde eher als Erstes nach Hause gehen?", "Wer würde eher den Taxifahrer zum Freund machen?"]
WAHRHEIT = ["Was war dein peinlichster Moment in einer Kneipe?", "Welche Serie schaust du heimlich?", "Was ist die verrückteste Ausrede, die du je benutzt hast?", "Wen in dieser Runde kennst du am längsten?",
 "Was ist dein unnötigstes Talent?", "Welches Lied kannst du komplett auswendig, ohne es zuzugeben?", "Was war der schlimmste Haarschnitt deines Lebens?", "Welche Lüge hast du als Kind am längsten aufrechterhalten?",
 "Was würdest du mit einer Million Euro als Erstes machen?", "Was war dein bisher schlechtestes Date?", "Welche App öffnest du am häufigsten?", "Was ist das Seltsamste in deinem Kühlschrank gerade?",
 "Wovor hast du heimlich Angst?", "Wer in dieser Runde wäre der beste Präsident?", "Was ist deine liebste Kindheitserinnerung?", "Welche Frage beim Pub-Quiz würdest du sicher richtig haben?"]
PFLICHT = ["Sing den Refrain deines Lieblingslieds.", "Erzähl einen Witz. Wenn keiner lacht: einen Schluck.", "Sprich die nächsten zwei Runden mit irischem Akzent.", "Mach 10 Kniebeugen.",
 "Imitier eine Person aus der Runde, die anderen raten.", "Zeig das letzte Foto in deiner Galerie (oder trink zwei Schlucke).", "Erfinde einen Trinkspruch und bring ihn aus.", "Tausche für eine Runde den Platz mit der Person links.",
 "Rede eine Minute über ein Thema, das die Runde bestimmt.", "Bestell die nächste Runde Wasser für alle.", "Mach eine Luftgitarren-Performance zu einem Lied der Runde.", "Nenne in 10 Sekunden fünf irische Wörter oder Namen.",
 "Sprich die nächste Runde nur in Reimen.", "Lass die Runde deinen Status für eine Stunde schreiben (harmlos!).", "Balanciere einen Bierdeckel auf dem Kopf, bis du wieder dran bist.", "Erzähl die Geschichte, wie ihr euch kennengelernt habt, als Märchen."]

KOENIG = [["A", "Wasserfall", "Alle trinken gleichzeitig. Wer zieht, hört als Erster auf, dann die Person links usw."],
 ["2", "Du", "Bestimme jemanden, der zwei Schlucke trinkt."],
 ["3", "Ich", "Du trinkst drei Schlucke."],
 ["4", "Boden", "Alle berühren den Boden. Wer zuletzt dran ist, trinkt."],
 ["5", "Daumen", "Du bist Daumenmeister: Legst du den Daumen auf den Tisch, machen alle mit. Der Letzte trinkt."],
 ["6", "Frage", "Stell jemandem eine Frage. Wer antwortet statt mit einer Gegenfrage, trinkt."],
 ["7", "Himmel", "Alle zeigen nach oben. Wer zuletzt zeigt, trinkt."],
 ["8", "Partner", "Wähle einen Partner. Immer wenn du trinkst, trinkt er mit (bis zur nächsten 8)."],
 ["9", "Reim", "Sag ein Wort. Reihum wird gereimt, wer stockt, trinkt."],
 ["10", "Kategorie", "Nenne eine Kategorie (z. B. Biersorten). Reihum Begriffe nennen, wer stockt, trinkt."],
 ["B", "Regel", "Stell eine Regel auf, die bis zum Ende gilt. Wer sie bricht, trinkt."],
 ["D", "Fragenmeisterin", "Bis zur nächsten Dame: Wer auf deine Fragen antwortet, trinkt."],
 ["K", "König", "Gieß etwas in den Königsbecher in der Mitte. Wer den vierten König zieht, trinkt den Becher."]]

def check():
    import itertools
    n = long = 0
    for t, qs in QUIZ.items():
        for q, o in qs:
            assert len(o) == 4 and len(set(o)) == 4, q
            n += 1; L = [len(x) for x in o]
            if L[0] > max(L[1:]): long += 1
    print("Pub-Quiz:", n, "Fragen, richtige Antwort am längsten:", round(long / n * 100), "%")
check()
json.dump({"quiz": [{"t": t, "qs": [{"q": q, "o": o} for q, o in qs]} for t, qs in QUIZ.items()],
           "nie": NIE, "eher": EHER, "wahrheit": WAHRHEIT, "pflicht": PFLICHT, "koenig": KOENIG},
          open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
