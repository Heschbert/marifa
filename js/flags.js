/* Flaggen-Fragen: erzeugt aus den Ländern in data/geo.json zwei Fragetypen mit Flaggen-Emojis
   („Zu welchem Land gehört diese Flagge?“ und „Welche Flagge hat …?“). Die Flaggen sind flache SVG-Bilder in img/flags
   (aus flag-icons, MIT-Lizenz); im Fragetext steht dafür "flag:xx", WF.util.ot zeigt daraus das Bild.
   Unterbereich: Geographie · Flaggen. Ähnliche Flaggen kommen über die Nachbarschaft (near) als Falschantworten. */
(function () {
  "use strict";
  var WF = window.WF;
  var ISO = {
    "Albanien": "AL", "Andorra": "AD", "Belarus": "BY", "Belgien": "BE", "Bosnien und Herzegowina": "BA", "Bulgarien": "BG", "Dänemark": "DK", "Deutschland": "DE", "Estland": "EE", "Finnland": "FI", "Frankreich": "FR", "Griechenland": "GR", "Irland": "IE", "Island": "IS", "Italien": "IT", "Kroatien": "HR", "Lettland": "LV", "Liechtenstein": "LI", "Litauen": "LT", "Malta": "MT", "Moldau": "MD", "Montenegro": "ME", "Niederlande": "NL", "Nordmazedonien": "MK", "Norwegen": "NO", "Österreich": "AT", "Polen": "PL", "Portugal": "PT", "Rumänien": "RO", "Russland": "RU", "Schweden": "SE", "Schweiz": "CH", "Serbien": "RS", "Slowakei": "SK", "Slowenien": "SI", "Spanien": "ES", "Tschechien": "CZ", "Ukraine": "UA", "Ungarn": "HU", "Vereinigtes Königreich": "GB", "Zypern": "CY",
    "Afghanistan": "AF", "Armenien": "AM", "Aserbaidschan": "AZ", "Bahrain": "BH", "Bangladesch": "BD", "Bhutan": "BT", "Brunei": "BN", "China": "CN", "Georgien": "GE", "Indien": "IN", "Indonesien": "ID", "Irak": "IQ", "Iran": "IR", "Japan": "JP", "Jemen": "YE", "Jordanien": "JO", "Kambodscha": "KH", "Kasachstan": "KZ", "Katar": "QA", "Kirgisistan": "KG", "Kuwait": "KW", "Laos": "LA", "Libanon": "LB", "Malaysia": "MY", "Malediven": "MV", "Mongolei": "MN", "Myanmar": "MM", "Nepal": "NP", "Nordkorea": "KP", "Oman": "OM", "Osttimor": "TL", "Pakistan": "PK", "Philippinen": "PH", "Saudi-Arabien": "SA", "Südkorea": "KR", "Syrien": "SY", "Tadschikistan": "TJ", "Thailand": "TH", "Turkmenistan": "TM", "Türkei": "TR", "Usbekistan": "UZ", "Vereinigte Arabische Emirate": "AE", "Vietnam": "VN",
    "Ägypten": "EG", "Äthiopien": "ET", "Algerien": "DZ", "Angola": "AO", "Botsuana": "BW", "Burkina Faso": "BF", "Demokratische Republik Kongo": "CD", "Eritrea": "ER", "Gabun": "GA", "Gambia": "GM", "Ghana": "GH", "Guinea": "GN", "Guinea-Bissau": "GW", "Kamerun": "CM", "Kap Verde": "CV", "Kenia": "KE", "Komoren": "KM", "Lesotho": "LS", "Liberia": "LR", "Libyen": "LY", "Madagaskar": "MG", "Malawi": "MW", "Mali": "ML", "Marokko": "MA", "Mauretanien": "MR", "Mauritius": "MU", "Mosambik": "MZ", "Namibia": "NA", "Niger": "NE", "Nigeria": "NG", "Republik Kongo": "CG", "Ruanda": "RW", "Sambia": "ZM", "São Tomé und Príncipe": "ST", "Senegal": "SN", "Seychellen": "SC", "Sierra Leone": "SL", "Simbabwe": "ZW", "Somalia": "SO", "Sudan": "SD", "Südsudan": "SS", "Tansania": "TZ", "Togo": "TG", "Tschad": "TD", "Tunesien": "TN", "Uganda": "UG", "Zentralafrikanische Republik": "CF",
    "Antigua und Barbuda": "AG", "Bahamas": "BS", "Barbados": "BB", "Belize": "BZ", "Costa Rica": "CR", "Dominica": "DM", "Dominikanische Republik": "DO", "El Salvador": "SV", "Grenada": "GD", "Guatemala": "GT", "Haiti": "HT", "Honduras": "HN", "Jamaika": "JM", "Kanada": "CA", "Kuba": "CU", "Mexiko": "MX", "Nicaragua": "NI", "Panama": "PA", "St. Kitts und Nevis": "KN", "St. Lucia": "LC", "St. Vincent und die Grenadinen": "VC", "Trinidad und Tobago": "TT", "USA": "US",
    "Argentinien": "AR", "Brasilien": "BR", "Chile": "CL", "Ecuador": "EC", "Guyana": "GY", "Kolumbien": "CO", "Paraguay": "PY", "Peru": "PE", "Suriname": "SR", "Uruguay": "UY", "Venezuela": "VE",
    "Australien": "AU", "Fidschi": "FJ", "Kiribati": "KI", "Marshallinseln": "MH", "Mikronesien": "FM", "Neuseeland": "NZ", "Palau": "PW", "Papua-Neuguinea": "PG", "Salomonen": "SB", "Samoa": "WS", "Tonga": "TO", "Tuvalu": "TV", "Vanuatu": "VU"
  };
  /* Bekannt ähnliche Flaggen: werden bevorzugt als Falschantworten genutzt. */
  var LOOKALIKE = [["Indonesien", "Polen", "Singapur"], ["Rumänien", "Tschad", "Andorra", "Moldau"], ["Irland", "Italien", "Elfenbeinküste", "Mexiko"], ["Niederlande", "Luxemburg", "Russland", "Frankreich"],
    ["Australien", "Neuseeland", "Fidschi", "Tuvalu"], ["Norwegen", "Island", "Dänemark", "Finnland", "Schweden"], ["Ungarn", "Bulgarien", "Italien"], ["Österreich", "Lettland", "Libanon"],
    ["Kolumbien", "Ecuador", "Venezuela"], ["Senegal", "Mali", "Guinea", "Kamerun"], ["Belgien", "Deutschland", "Rumänien"], ["Slowenien", "Slowakei", "Russland", "Serbien"], ["Monaco", "Indonesien", "Polen"],
    ["Jemen", "Ägypten", "Syrien", "Irak", "Sudan"], ["Honduras", "Nicaragua", "El Salvador", "Guatemala"], ["Kuba", "Puerto Rico", "Chile", "Texas"], ["Ghana", "Bolivien", "Litauen"]];
  var EASY = { "Deutschland": 1, "Frankreich": 1, "Italien": 1, "Spanien": 1, "Österreich": 1, "Schweiz": 1, "Vereinigtes Königreich": 1, "Niederlande": 1, "Belgien": 1, "Polen": 1, "Griechenland": 1, "Schweden": 1, "Norwegen": 1, "Dänemark": 1, "Portugal": 1, "Türkei": 1, "China": 1, "Japan": 1, "USA": 1, "Kanada": 1, "Brasilien": 1, "Mexiko": 1, "Indien": 1, "Russland": 1, "Australien": 1, "Südkorea": 1, "Irland": 1, "Finnland": 1, "Ukraine": 1, "Argentinien": 1 };
  WF.countryISO = ISO;
  function flag(code) { return "flag:" + code.toLowerCase(); }

  WF.builders.flags = function (G) {
    var names = [], regionOf = {};
    Object.keys(G).forEach(function (sub) {
      if (sub === "Deutschland") return;
      G[sub].caps.split(";").forEach(function (r) { var n = r.split("|")[0]; if (ISO[n]) { names.push(n); regionOf[n] = sub; } });
    });
    var flagOf = {}, ofFlag = {};
    names.forEach(function (n) { flagOf[n] = flag(ISO[n]); ofFlag[flagOf[n]] = n; });
    function near(n) {
      var o = {};
      LOOKALIKE.forEach(function (g) { if (g.indexOf(n) >= 0) g.forEach(function (m) { if (m !== n && flagOf[m]) o[m] = 1; }); });
      names.forEach(function (m) { if (m !== n && regionOf[m] === regionOf[n] && Object.keys(o).length < 6) o[m] = 1; });
      return Object.keys(o);
    }
    var flagPool = names.map(function (n) { return flagOf[n]; }), out = [];
    names.forEach(function (n) {
      var d = EASY[n] ? 1 : regionOf[n] === "Europa" ? 2 : 3, nb = near(n);
      out.push({ key: "flag|which|" + n, c: "Geographie", s: "Flaggen", q: "Zu welchem Land gehört diese Flagge?", img: flagOf[n], imgAlt: "Flagge", ans: n, pool: names, near: nb,
        why: function (t) { return flagOf[t] ? "Das wäre eine andere Flagge." : ""; }, e: "Das ist die Flagge von " + n + " (" + regionOf[n] + ").", h: "Das Land liegt in " + regionOf[n] + ".", fixedHint: true, d: d });
      out.push({ key: "flag|pick|" + n, c: "Geographie", s: "Flaggen", q: "Welche Flagge gehört zu " + n + "?", ans: flagOf[n], pool: flagPool, near: nb.map(function (m) { return flagOf[m]; }), big: true,
        why: function (t) { return ofFlag[t] ? "Das ist die Flagge von " + ofFlag[t] + "." : ""; }, e: "So sieht die Flagge von " + n + " aus.", h: n + " liegt in " + regionOf[n] + ".", fixedHint: true, d: Math.min(3, d + 1) });
    });
    return out;
  };
})();
