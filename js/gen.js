/* Generatoren: Aufgaben, die bei jedem Aufruf neu erzeugt werden. Richtig ist jedes Ergebnis durch Berechnung.
   Jeder Typ liefert typische Fehlerantworten mit Begründung, damit auch falsche Antworten etwas lehren.
   Neue Typen: einfach einen Eintrag in GENS ergänzen (s = Unterbereich, d = Stufe). */
(function () {
  "use strict";
  var WF = window.WF, U = WF.util, ri = U.ri, counter = 0;

  function de(n) { var s = String(Math.round(n * 100) / 100).split("."); s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, "."); return s.join(","); }
  function eur(n) { return (n % 1 ? de(n).replace(/,(\d)$/, ",$10") : de(n)) + " €"; }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function fr(a, b) { var g = gcd(a, b); a /= g; b /= g; return b === 1 ? String(a) : a + "/" + b; }
  function sup(n) { var m = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" }; return String(n).split("").map(function (c) { return m[c]; }).join(""); }
  function range(n) { var step = Math.pow(10, Math.max(1, String(n).length - 1)), lo = Math.floor(n / step) * step; return "Das Ergebnis liegt zwischen " + lo + " und " + (lo + step) + "."; }
  function pick(a) { return a[ri(0, a.length - 1)]; }
  function num(n, fmt, wrong, e, h, q) { return { q: q, n: n, fmt: fmt || String, wrong: wrong || [], e: e, h: h }; }

  var GENS = [
    /* Kopfrechnen */
    { s: "Kopfrechnen", d: 1, make: function () { var a = ri(23, 98), b = ri(14, 89), n = a + b; return num(n, 0, [[a + b + 10, "Beim Zehnerübertrag ist etwas verrutscht."], [a + b - 10, "Die Zehner wurden zu knapp gezählt."]], a + " + " + b + " = " + n + ". Tipp: erst die Zehner, dann die Einer.", "Rechne erst die Zehner, dann die Einer. " + range(n), "Rechne: " + a + " + " + b + " = ?"); } },
    { s: "Kopfrechnen", d: 1, make: function () { var a = ri(60, 190), b = ri(17, a - 12), n = a - b; return num(n, 0, [[a - b + 10, "Beim Auffüllen zur Zehnerzahl wurde zu viel dazugerechnet."], [a - b - 10, "Eine Zehn zu viel abgezogen."]], a + " − " + b + " = " + n + ". Tipp: erst auf die nächste Zehnerzahl auffüllen.", "Fülle erst bis zur nächsten Zehnerzahl auf. " + range(n), "Rechne: " + a + " − " + b + " = ?"); } },
    { s: "Kopfrechnen", d: 2, make: function () { var a = ri(12, 49), b = ri(3, 9), n = a * b, t = Math.floor(a / 10) * 10, o = a % 10; return num(n, 0, [[t * b + o, "Die Einer wurden nicht mit " + b + " multipliziert."], [n + b, "Ein Rest wurde doppelt gezählt."]], a + " × " + b + " = " + t + " × " + b + " + " + o + " × " + b + " = " + (t * b) + " + " + (o * b) + " = " + n + ".", "Zerlege " + a + " in Zehner und Einer. " + range(n), "Rechne: " + a + " × " + b + " = ?"); } },
    { s: "Kopfrechnen", d: 3, make: function () { var a = ri(11, 19), b = ri(11, 19), n = a * b; return num(n, 0, [[a * 10 + b * 10, "Das ist " + a + " × 10 + " + b + " × 10, nicht das Produkt."], [n + a, "Ein Teilprodukt wurde doppelt gezählt."]], a + " × " + b + " = " + a + " × 10 + " + a + " × " + (b - 10) + " = " + (a * 10) + " + " + (a * (b - 10)) + " = " + n + ".", "Rechne " + a + " × 10 und dann " + a + " × " + (b - 10) + ". " + range(n), "Rechne: " + a + " × " + b + " = ?"); } },
    { s: "Kopfrechnen", d: 2, make: function () { var a = ri(11, 30), n = a * a; return num(n, 0, [[a * 2, "Quadrieren heißt malnehmen, nicht verdoppeln."], [n + a, a + "² ist " + a + " × " + a + ", nicht " + a + " × " + (a + 1) + "."]], a + "² = " + a + " × " + a + " = " + n + ".", "Quadrat heißt: die Zahl mit sich selbst malnehmen. " + range(n), "Rechne: " + a + "² = ?"); } },
    { s: "Kopfrechnen", d: 2, make: function () { var b = ri(3, 12), k = ri(6, 15), a = k * b; return num(k, 0, [[k + 1, "Probe: " + (k + 1) + " × " + b + " = " + ((k + 1) * b) + ", nicht " + a + "."], [k - 1, "Probe: " + (k - 1) + " × " + b + " = " + ((k - 1) * b) + ", nicht " + a + "."]], a + " ÷ " + b + " = " + k + ", denn " + k + " × " + b + " = " + a + ".", "Frage dich: Welche Zahl mal " + b + " ergibt " + a + "? " + range(k), "Rechne: " + a + " ÷ " + b + " = ?"); } },
    /* Prozent & Zinsen */
    { s: "Prozent & Zinsen", d: 2, make: function () { var p = pick([5, 10, 15, 20, 25, 30, 40, 50, 75]), base = ri(2, 20) * 20, n = base / 100 * p; return num(n, 0, [[base - n, "Das ist der Rest nach Abzug, nicht der Anteil."], [base / 10 * (p / 10), "Hier wurde durch 10 statt durch 100 geteilt."]], p + " % von " + base + " = " + base + " ÷ 100 × " + p + " = " + n + ".", "Berechne zuerst 1 %: " + base + " ÷ 100 = " + (base / 100) + ". " + range(n), "Rechne: " + p + " % von " + base + " = ?"); } },
    { s: "Prozent & Zinsen", d: 2, make: function () { var pr = pick([10, 20, 25, 30, 40, 50]), pre = ri(2, 20) * 10, n = pre * (100 - pr) / 100;
        return num(n, eur, [[pre - pr, "Hier wurden " + pr + " Euro statt " + pr + " Prozent abgezogen."], [pre * pr / 100, "Das ist der Rabatt selbst, nicht der neue Preis."], [pre * (100 + pr) / 100, "Das wäre ein Aufschlag, kein Rabatt."]], "Rabatt: " + pre + " € × " + pr + " % = " + eur(pre * pr / 100) + ". Neuer Preis: " + eur(pre) + " − " + eur(pre * pr / 100) + " = " + eur(n) + ".", "Berechne zuerst den Rabatt in Euro und ziehe ihn ab.", "Ein Artikel kostet " + pre + " €. Du bekommst " + pr + " % Rabatt. Neuer Preis?"); } },
    { s: "Prozent & Zinsen", d: 2, make: function () { var net = ri(1, 10) * 100, n = net * 1.19;
        return num(n, eur, [[net + 19, "Hier wurden 19 Euro statt 19 Prozent aufgeschlagen."], [net * 1.16, "16 % galt nur 2020/21 vorübergehend."], [net * 1.07, "7 % ist der ermäßigte Satz, etwa für Lebensmittel."]], net + " € × 1,19 = " + eur(n) + ". Die Mehrwertsteuer beträgt " + eur(n - net) + ".", "Multipliziere mit 1,19. " + range(Math.round(n)), "Nettopreis " + net + " €, Mehrwertsteuer 19 %. Wie hoch ist der Bruttopreis?"); } },
    { s: "Prozent & Zinsen", d: 2, make: function () { var K = ri(1, 20) * 500, p = ri(1, 6), n = K * p / 100;
        return num(n, eur, [[K * p / 10, "Hier wurde durch 10 statt durch 100 geteilt."], [K + n, "Das ist das Endkapital, nicht die Zinsen."], [K * p / 1000, "Hier wurde durch 1000 statt durch 100 geteilt."]], K + " € × " + p + " % = " + eur(n) + " Zinsen pro Jahr.", "1 % von " + K + " € sind " + (K / 100) + " €.", "Du legst " + K + " € ein Jahr lang zu " + p + " % an. Wie hoch sind die Zinsen?"); } },
    { s: "Prozent & Zinsen", d: 3, make: function () { var pr = pick([5, 10, 20, 25, 40, 50, 75]), b = ri(2, 10) * 20, a = b * pr / 100;
        return num(pr, function (v) { return v + " %"; }, [[100 - pr, "Das ist der Rest bis zum Ganzen."], [pr * 2, "Verdoppelt: " + a + " sind nicht " + (pr * 2) + " % von " + b + "."], [pr + 10, "Probe: " + (pr + 10) + " % von " + b + " = " + (b * (pr + 10) / 100) + "."]], a + " ÷ " + b + " = " + (a / b) + " = " + pr + " %.", "Teile " + a + " durch " + b + " und rechne in Prozent um.", a + " sind wie viel Prozent von " + b + "?"); } },
    /* Algebra & Brüche */
    { s: "Algebra & Brüche", d: 2, make: function () { var x = ri(2, 15), a = ri(2, 9), b = ri(1, 20), c = a * x + b;
        return num(x, 0, [[c - b, "Hier wurde nicht durch " + a + " geteilt."], [x + 1, "Probe: " + a + "·" + (x + 1) + " + " + b + " = " + (a * (x + 1) + b) + ", nicht " + c + "."], [x - 1, "Probe: " + a + "·" + (x - 1) + " + " + b + " = " + (a * (x - 1) + b) + ", nicht " + c + "."]], a + "x + " + b + " = " + c + " → " + a + "x = " + (c - b) + " → x = " + x + ".", "Bringe erst " + b + " auf die andere Seite, teile dann durch " + a + ".", "Löse nach x: " + a + "x + " + b + " = " + c); } },
    { s: "Algebra & Brüche", d: 2, make: function () { var b = pick([2, 3, 4, 5, 6]), d = pick([2, 3, 4, 5, 6]); while (d === b) d = pick([2, 3, 4, 5, 6]);
        var a = ri(1, b - 1), c = ri(1, d - 1), num_ = a * d + c * b, den = b * d, right = fr(num_, den);
        return { q: "Rechne: " + a + "/" + b + " + " + c + "/" + d + " = ?", right: right, wrong: [[fr(a + c, b + d), "Zähler und Nenner dürfen nicht einzeln addiert werden."], [fr(a + c, b * d), "Erst gleichnamig machen, dann addieren."], [fr(num_ + 1, den), "Beim Erweitern hat sich ein Fehler eingeschlichen."], [fr(num_ - 1, den), "Beim Erweitern hat sich ein Fehler eingeschlichen."], [fr(a * c, b * d), "Das wäre die Multiplikation."]], e: a + "/" + b + " + " + c + "/" + d + " = " + (a * d) + "/" + den + " + " + (c * b) + "/" + den + " = " + num_ + "/" + den + (right !== num_ + "/" + den ? " = " + right : "") + ".", h: "Mache beide Brüche gleichnamig: Hauptnenner " + den + ".", d: 3 }; } },
    { s: "Algebra & Brüche", d: 1, make: function () { var pp = ri(1, 5), n = ri(2, 6), m = ri(n + 1, 12), tot = m * pp;
        return num(tot, eur, [[tot + pp, "Ein Stück kostet " + pp + " €, bei " + m + " Stück ist das ein Stück zu viel."], [tot - pp, "Ein Stück kostet " + pp + " €, bei " + m + " Stück ist das ein Stück zu wenig."], [n * pp + m, "Hier wurde addiert statt multipliziert."]], n + " Stück kosten " + eur(n * pp) + ", also kostet eines " + eur(pp) + ". " + m + " Stück: " + eur(tot) + ".", "Berechne erst den Preis für ein Stück.", n + " Äpfel kosten " + eur(n * pp) + ". Was kosten " + m + " Äpfel?"); } },
    /* Geometrie */
    { s: "Geometrie", d: 1, make: function () { var a = ri(3, 15), b = ri(2, 12); while (b === a) b = ri(2, 12);
        return num(a * b, function (v) { return v + " m²"; }, [[2 * (a + b), "Das ist der Umfang, nicht die Fläche."], [a + b, "Hier wurde addiert statt multipliziert."], [a * b * 2, "Doppelt gerechnet."]], "Fläche = Länge × Breite = " + a + " × " + b + " = " + (a * b) + " m².", "Fläche heißt: Länge mal Breite.", "Ein Rechteck ist " + a + " m lang und " + b + " m breit. Wie groß ist die Fläche?"); } },
    { s: "Geometrie", d: 1, make: function () { var a = ri(3, 15), b = ri(2, 12); while (b === a) b = ri(2, 12);
        return num(2 * (a + b), function (v) { return v + " m"; }, [[a * b, "Das ist die Fläche, nicht der Umfang."], [a + b, "Das ist nur die halbe Strecke rund herum."], [2 * a + b, "Eine Seite wurde vergessen."]], "Umfang = 2 × (" + a + " + " + b + ") = " + (2 * (a + b)) + " m.", "Der Umfang ist der Weg einmal rundherum.", "Ein Rechteck ist " + a + " m lang und " + b + " m breit. Wie lang ist der Umfang?"); } },
    { s: "Geometrie", d: 3, make: function () { var t = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [9, 12, 15], [7, 24, 25]]);
        return num(t[2], function (v) { return v + " cm"; }, [[t[0] + t[1], "Hier wurden die Katheten einfach addiert."], [t[0] * t[0] + t[1] * t[1], "Die Wurzel fehlt: a² + b² = c², dann √ ziehen."]], "c² = " + t[0] + "² + " + t[1] + "² = " + (t[0] * t[0] + t[1] * t[1]) + ", also c = " + t[2] + " cm.", "Satz des Pythagoras: a² + b² = c².", "Die Katheten eines rechtwinkligen Dreiecks sind " + t[0] + " cm und " + t[1] + " cm lang. Wie lang ist die Hypotenuse?"); } },
    { s: "Geometrie", d: 2, make: function () { var g = ri(3, 14) * 2, h = ri(3, 12);
        return num(g * h / 2, function (v) { return v + " cm²"; }, [[g * h, "Das ist die Fläche des Rechtecks, das Dreieck ist halb so groß."], [g + h, "Hier wurde addiert statt multipliziert."], [g * h / 4, "Doppelt halbiert."]], "Fläche = Grundseite × Höhe ÷ 2 = " + g + " × " + h + " ÷ 2 = " + (g * h / 2) + " cm².", "Ein Dreieck ist halb so groß wie das passende Rechteck.", "Ein Dreieck hat die Grundseite " + g + " cm und die Höhe " + h + " cm. Wie groß ist die Fläche?"); } },
    /* Wahrscheinlichkeit & Statistik */
    { s: "Wahrscheinlichkeit & Statistik", d: 2, make: function () { var m = ri(10, 50), v = [], i, s = 0; for (i = 0; i < 4; i++) { v.push(ri(Math.max(1, m - 9), m + 9)); s += v[i]; } v.push(5 * m - s);
        var srt = v.slice().sort(function (x, y) { return x - y; }), med = srt[2];
        return num(m, 0, [[med, "Das ist der Median, die mittlere Zahl, nicht der Durchschnitt."], [Math.round(s / 4), "Es wurde nur durch 4 geteilt, es sind aber 5 Werte."], [srt[4] - srt[0], "Das ist die Spannweite."], [m + 2, "Probe: Die Summe ist " + (5 * m) + ", geteilt durch 5 ergibt " + m + "."]], "Summe = " + (5 * m) + ", geteilt durch 5 = " + m + ".", "Addiere alle Zahlen und teile durch die Anzahl.", "Wie groß ist der Mittelwert von " + v.join(", ") + "?"); } },
    { s: "Wahrscheinlichkeit & Statistik", d: 2, make: function () { var k = ri(1, 4), right = fr(6 - k, 6);
        return { q: "Wie wahrscheinlich ist es, mit einem Würfel eine Zahl größer als " + k + " zu würfeln?", right: right, wrong: [[fr(k, 6), "Das ist die Wahrscheinlichkeit für höchstens " + k + "."], [fr(7 - k, 6), "Hier wurde die " + k + " mitgezählt."], [fr(5 - k, 6) === "0" ? "1/6" : fr(5 - k, 6), "Es wurde eine mögliche Zahl vergessen."], ["1/2", "Nur bei " + k + " = 3 stimmt das."]], e: "Günstig sind " + (6 - k) + " von 6 Zahlen: " + (6 - k) + "/6" + (right !== (6 - k) + "/6" ? " = " + right : "") + ".", h: "Zähle, welche der Zahlen 1 bis 6 größer als " + k + " sind.", d: 2 }; } },
    { s: "Wahrscheinlichkeit & Statistik", d: 3, make: function () { var v = []; for (var i = 0; i < 5; i++) v.push(ri(2, 60)); var srt = v.slice().sort(function (x, y) { return x - y; }), med = srt[2], mean = Math.round(v.reduce(function (a, b) { return a + b; }, 0) / 5);
        return num(med, 0, [[v[2], "Man muss erst sortieren: " + srt.join(", ") + "."], [mean, "Das ist (gerundet) der Durchschnitt, nicht der Median."], [srt[4], "Das ist der größte Wert."]], "Sortiert: " + srt.join(", ") + ". Der Median ist die mittlere Zahl: " + med + ".", "Sortiere die Zahlen der Größe nach.", "Wie groß ist der Median von " + v.join(", ") + "?"); } },
    /* Logik & Zahlen */
    { s: "Logik & Zahlen", d: 2, make: function () { var b = pick([2, 3, 5, 10]), e = ri(2, 6); if (b === 10) e = ri(2, 5); var n = Math.pow(b, e);
        return num(n, 0, [[b * e, "Potenz heißt wiederholtes Malnehmen, nicht " + b + " × " + e + "."], [Math.pow(b, e - 1), "Ein Faktor zu wenig."], [Math.pow(b, e + 1), "Ein Faktor zu viel."]], b + sup(e) + " = " + Array(e).fill(b).join(" × ") + " = " + n + ".", "Multipliziere " + b + " genau " + e + " Mal mit sich selbst.", "Berechne: " + b + sup(e)); } },
    { s: "Logik & Zahlen", d: 2, make: function () { var k = ri(4, 25), n = k * k;
        return num(k, 0, [[k + 1, "Probe: " + (k + 1) + "² = " + ((k + 1) * (k + 1)) + "."], [k - 1, "Probe: " + (k - 1) + "² = " + ((k - 1) * (k - 1)) + "."], [Math.round(n / 2), "Wurzel ist nicht „halbieren“."]], "√" + n + " = " + k + ", denn " + k + "² = " + n + ".", "Welche Zahl mit sich selbst malgenommen ergibt " + n + "?", "Berechne: √" + n); } },
    { s: "Logik & Zahlen", d: 3, make: function () {
        var P = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97], C = [51, 57, 91, 87, 77, 119, 121, 133, 143, 169, 117, 93, 111, 133, 161, 187];
        var p = pick(P), cs = U.shuffle(C.slice()).slice(0, 3);
        function why(c) { for (var f = 2; f < c; f++) if (c % f === 0) return c + " = " + f + " × " + (c / f) + ", also keine Primzahl."; return ""; }
        return { q: "Welche dieser Zahlen ist eine Primzahl?", right: String(p), wrong: cs.map(function (c) { return [String(c), why(c)]; }), e: p + " ist nur durch 1 und sich selbst teilbar.", h: "Eine Primzahl hat genau zwei Teiler. Prüfe die Teilbarkeit durch 3, 7 und 11.", d: 3 }; } }
  ];

  function dedupe(right, cands, fill, pos) {
    var out = [], seen = {}; seen[right] = 1;
    cands.concat(fill).forEach(function (c) {
      if (out.length >= 3 || seen[c[0]]) return;
      if (pos && !(c[2] > 0)) return;
      seen[c[0]] = 1; out.push(c);
    });
    return out;
  }

  WF.gen = {
    /* Platzhalter für den Fragenpool: je Typ drei, damit sie im Mix nicht untergehen. */
    entries: function () {
      var out = [];
      GENS.forEach(function (g, gi) { for (var k = 0; k < 3; k++) out.push({ c: "Mathematik", s: g.s, gen: 1, gi: gi, d: g.d, id: "gen" + gi + "-" + k }); });
      return out;
    },
    make: function (x) {
      var r = GENS[x.gi].make(), right, wrong;
      if (r.n !== undefined) {
        right = r.fmt(r.n);
        var cand = r.wrong.map(function (w) { return [r.fmt(w[0]), w[1], w[0]]; });
        var fill = [1, -1, 2, -2, 10, -10, 3, -3, 5].map(function (dd) { return [r.fmt(r.n + dd), "", r.n + dd]; });
        wrong = dedupe(right, cand, fill, true);
      } else {
        right = r.right;
        wrong = dedupe(right, r.wrong, [["1/2", ""], ["1/3", ""], ["2/3", ""], ["3/4", ""], ["5/6", ""]], false);
      }
      var opts = [{ t: right, ok: true, why: "" }].concat(wrong.map(function (w) { return { t: w[0], ok: false, why: w[1] || "" }; }));
      return { id: "g" + (++counter), c: x.c, s: x.s, q: r.q, e: r.e, h: r.h, d: r.d || x.d, opts: U.shuffle(opts), gen: 1, helped: false, hidden: [], hintShown: false };
    }
  };
})();
