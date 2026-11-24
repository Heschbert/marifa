/* Geographie-Baustein: erzeugt aus den Tabellen in data/geo.json Fragen zu Ländern, Hauptstädten und Städten,
   samt Hinweisen, Stufen und Erklärungen zu jeder falschen Antwort. */
(function () {
  "use strict";
  var WF = window.WF;

  function set(s) { var o = {}; s.split(";").forEach(function (n) { o[n] = 1; }); return o; }
  var EASY = set("Deutschland;Frankreich;Italien;Spanien;Österreich;Schweiz;Vereinigtes Königreich;Niederlande;Belgien;Polen;Griechenland;Russland;Schweden;Norwegen;Dänemark;Portugal;Irland;Türkei;China;Japan;Indien;Südkorea;Thailand;Ägypten;Marokko;Kenia;Nigeria;Südafrika;USA;Kanada;Mexiko;Kuba;Brasilien;Argentinien;Chile;Peru;Kolumbien;Australien;Neuseeland;Bayern;Baden-Württemberg;Nordrhein-Westfalen;Sachsen;Hessen");
  var HARD = set("Palau;Tuvalu;Nauru;Kiribati;Marshallinseln;Mikronesien;Komoren;São Tomé und Príncipe;Guinea-Bissau;Äquatorialguinea;Eswatini;Lesotho;Burkina Faso;Niger;Tschad;Zentralafrikanische Republik;Südsudan;Turkmenistan;Tadschikistan;Kirgisistan;Brunei;Bhutan;Osttimor;Malediven;Moldau;Nordmazedonien;Montenegro;Liechtenstein;Andorra;Antigua und Barbuda;St. Kitts und Nevis;St. Vincent und die Grenadinen;Dominica;Belize;Suriname;Guyana;Vanuatu;Salomonen;Tonga;Samoa;Seychellen;Mauritius;Kap Verde;Gambia;Eritrea;Laos;Kambodscha;Mongolei;Jemen;Aserbaidschan;Armenien;Georgien;Burundi;Dschibuti;Togo;Sierra Leone;Liberia;Malawi;Mali;Mauretanien;Gabun;Paraguay;Uruguay;Ecuador;Trinidad und Tobago;Barbados;Grenada;St. Lucia;Fidschi;Papua-Neuguinea;Mecklenburg-Vorpommern;Sachsen-Anhalt;Saarland");
  /* Regionen: bei höherer Stufe stammen Falschantworten aus der Nachbarschaft der richtigen Antwort. */
  var REG = ("Frankreich,Belgien,Niederlande,Luxemburg,Vereinigtes Königreich,Irland,Deutschland,Schweiz,Österreich,Liechtenstein,Monaco;Dänemark,Norwegen,Schweden,Finnland,Island,Estland,Lettland,Litauen;Spanien,Portugal,Andorra,Italien,Malta,San Marino,Vatikanstadt,Frankreich;Italien,Griechenland,Zypern,Malta,Albanien;Albanien,Bosnien und Herzegowina,Bulgarien,Kroatien,Montenegro,Nordmazedonien,Rumänien,Serbien,Slowenien,Moldau,Griechenland,Ungarn;Polen,Tschechien,Slowakei,Ungarn,Ukraine,Belarus,Russland,Litauen,Deutschland,Österreich;" +
    "Saudi-Arabien,Jemen,Oman,Katar,Bahrain,Kuwait,Vereinigte Arabische Emirate,Irak,Jordanien,Syrien,Libanon,Israel,Iran,Türkei;Armenien,Aserbaidschan,Georgien,Türkei,Iran,Russland;Kasachstan,Usbekistan,Turkmenistan,Tadschikistan,Kirgisistan,Afghanistan,Mongolei;Indien,Pakistan,Bangladesch,Nepal,Bhutan,Sri Lanka,Malediven,Afghanistan,Iran,Myanmar;Thailand,Vietnam,Laos,Kambodscha,Myanmar,Malaysia,Singapur,Brunei,Indonesien,Philippinen,Osttimor;China,Japan,Nordkorea,Südkorea,Mongolei;" +
    "Ägypten,Libyen,Tunesien,Algerien,Marokko,Mauretanien,Sudan;Senegal,Gambia,Guinea-Bissau,Guinea,Sierra Leone,Liberia,Elfenbeinküste,Ghana,Togo,Benin,Nigeria,Burkina Faso,Mali,Niger,Kap Verde,Mauretanien;Kamerun,Tschad,Zentralafrikanische Republik,Gabun,Republik Kongo,Demokratische Republik Kongo,Äquatorialguinea,São Tomé und Príncipe,Nigeria;Äthiopien,Eritrea,Dschibuti,Somalia,Kenia,Uganda,Tansania,Ruanda,Burundi,Südsudan,Sudan;Angola,Sambia,Simbabwe,Botsuana,Namibia,Südafrika,Lesotho,Eswatini,Mosambik,Malawi,Tansania,Demokratische Republik Kongo;Madagaskar,Komoren,Mauritius,Seychellen,Mosambik;" +
    "USA,Kanada,Mexiko;Mexiko,Guatemala,Belize,Honduras,El Salvador,Nicaragua,Costa Rica,Panama;Kuba,Jamaika,Haiti,Dominikanische Republik,Bahamas,Barbados,Dominica,Grenada,St. Lucia,St. Kitts und Nevis,St. Vincent und die Grenadinen,Antigua und Barbuda,Trinidad und Tobago;" +
    "Venezuela,Guyana,Suriname,Kolumbien,Brasilien;Kolumbien,Ecuador,Peru,Bolivien,Chile;Argentinien,Chile,Uruguay,Paraguay,Brasilien,Bolivien;Panama,Kolumbien;" +
    "Papua-Neuguinea,Salomonen,Vanuatu,Fidschi,Australien;Palau,Mikronesien,Marshallinseln,Kiribati,Nauru;Samoa,Tonga,Tuvalu,Fidschi,Kiribati,Neuseeland").split(";").map(function (g) { return g.split(","); });
  function nb(c) {
    var o = {};
    REG.forEach(function (g) { if (g.indexOf(c) >= 0) g.forEach(function (n) { if (n !== c) o[n] = 1; }); });
    return Object.keys(o);
  }
  function dOf(n) { return EASY[n] ? 1 : HARD[n] ? 3 : 2; }

  function rows(s) { return s.split(";").map(function (r) { var p = r.split("|"); return { a: p[0], b: p[1], n: p[2] || "" }; }); }
  function fill(t, r) { return t.split("%a").join(r.a).split("%b").join(r.b); }
  function hint(ans) {
    var letters = ans.replace(/[^A-Za-zÄÖÜäöüßÀ-ÿ]/g, "").length;
    return "Beginnt mit „" + ans.charAt(0) + "“ und hat " + letters + " Buchstaben.";
  }

  WF.builders.geo = function (G) {
    var out = [], capOf = {}, ofCap = {}, citiesOf = {};
    Object.keys(G).forEach(function (sub) {
      var g = G[sub];
      rows(g.caps).forEach(function (r) { capOf[r.a] = r.b; ofCap[r.b] = r.a; });
      rows(g.cities).forEach(function (r) { (citiesOf[r.b] = citiesOf[r.b] || []).push(r.a); });
    });
    Object.keys(G).forEach(function (sub) {
      var g = G[sub], rs = rows(g.caps), cs = rows(g.cities);
      var w = g.w || { cap: "%a: Wie heißt die Hauptstadt?", rev: "Von welchem Land ist %b die Hauptstadt?", city: "In welchem Land liegt %a?", ecap: "%b ist die Hauptstadt von %a.", wcap: "%b ist die Hauptstadt von %a.", wrev: "Die Hauptstadt von %a ist %b." };
      var capPool = rs.map(function (r) { return r.b; }).concat(g.extraCaps || []);
      var namePool = rs.map(function (r) { return r.a; }).concat(g.extra || []);
      var whyCap = function (t) { return ofCap[t] ? fill(w.wcap, { a: ofCap[t], b: t }) : ""; };
      var whyRev = function (t) { return capOf[t] ? fill(w.wrev, { a: t, b: capOf[t] }) : ""; };
      var whyCity = function (t) {
        var c = citiesOf[t];
        if (c && c.length) return "Bekannte Städte in " + t + ": " + c.slice(0, 2).join(", ") + ".";
        return capOf[t] ? "Die Hauptstadt von " + t + " ist " + capOf[t] + "." : "";
      };
      rs.forEach(function (r) {
        var e = fill(w.ecap, r) + (r.n ? " " + r.n : "");
        out.push({ key: "geo|cap|" + r.a, c: "Geographie", s: sub, q: fill(w.cap, r), ans: r.b, pool: capPool, near: nb(r.a).map(function (c) { return capOf[c]; }).filter(Boolean), why: whyCap, e: e, h: hint(r.b), d: dOf(r.a) });
        out.push({ key: "geo|rev|" + r.a, c: "Geographie", s: sub, q: fill(w.rev, r), ans: r.a, pool: namePool, near: nb(r.a), why: whyRev, e: e, h: hint(r.a), d: Math.min(3, dOf(r.a) + 1) });
      });
      cs.forEach(function (r) {
        out.push({ key: "geo|city|" + r.a + "|" + r.b, c: "Geographie", s: sub, q: fill(w.city, r), ans: r.b, pool: namePool, near: nb(r.b), why: whyCity, e: r.a + " liegt in " + r.b + ".", h: hint(r.b), d: 2 });
      });
    });
    return out;
  };
})();
