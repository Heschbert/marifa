/* Interaktive Elemente für Kurslektionen (Animationen und Simulationen).
   In einer Lektion: "figs": [{ "after": <Absatz>, "w": "<name>", "cap": "<Bildunterschrift>" }].
   Vorhanden: coin, birthday, tree2, dice, bayes, monty, galton, normal, pi, ecublock, ecustate, crank, dtc, uds, iumpr, sae, lambda, pipe, slo.
   Alles läuft lokal im Browser, ohne externe Bibliotheken. Bedienung über data-act / data-input (CSP-tauglich). */
(function () {
  "use strict";
  var WF = window.WF, ui = WF.ui, H = ui.H, U = WF.util, esc = U.esc;
  var KW = WF.kw = {}, ST = {};
  var css = getComputedStyle(document.documentElement);
  function col(n, f) { return (css.getPropertyValue(n) || f).trim() || f; }
  function fmt(x, d) { return (Math.round(x * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toLocaleString("de-DE"); }
  function pct(x, d) { return fmt(x * 100, d === undefined ? 1 : d) + " %"; }
  function el(id) { return document.getElementById(id); }
  function b(act, label, id, primary) { return '<button class="btn kwb' + (primary ? " primary" : "") + '" data-act="' + act + '" data-id="' + id + '">' + label + "</button>"; }
  function range(id, inp, min, max, step, val, label) {
    return '<label class="kwr"><span>' + label + ' <b id="' + id + "-" + inp + 'v"></b></span><input type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" data-input="' + inp + '" data-id="' + id + '"></label>';
  }
  var n = 0;
  /* HTML-Platzhalter in der Lektion */
  KW.html = function (f) { var id = "kw" + (++n); return '<figure class="fig kwfig"><div class="kw" id="' + id + '" data-w="' + esc(f.w) + '"></div>' + (f.cap ? "<figcaption>" + esc(f.cap) + "</figcaption>" : "") + "</figure>"; };
  /* Nach dem Anzeigen: alle Platzhalter füllen */
  KW.mount = function () {
    [].forEach.call(document.querySelectorAll(".kw[data-w]"), function (e) { if (W[e.dataset.w]) W[e.dataset.w](e.id); });
    /* Safari gibt SVGs mit height:auto sonst teils keine Höhe: Seitenverhältnis aus der viewBox fest setzen */
    [].forEach.call(document.querySelectorAll(".kw svg.kwsvg[viewBox]"), function (g) { var v = g.getAttribute("viewBox").split(/\s+/); g.style.aspectRatio = v[2] + " / " + v[3]; });
  };
  var W = {};

  /* ---------- Münzwurf: Gesetz der großen Zahlen ---------- */
  W.coin = function (id) {
    ST[id] = { n: 0, k: 0, hist: [] };
    el(id).innerHTML = '<div class="kwstat" id="' + id + '-s"></div><svg class="kwsvg" id="' + id + '-g" viewBox="0 0 300 140"></svg>' +
      '<div class="kwrow">' + b("kwcoin", "+10", id) + b("kwcoin100", "+100", id) + b("kwcoin1k", "+1.000", id, true) + b("kwcoinr", "Neu", id) + "</div>";
    drawCoin(id);
  };
  function flip(id, m) { var s = ST[id]; for (var i = 0; i < m; i++) { s.n++; if (Math.random() < 0.5) s.k++; if (s.n <= 50 || s.n % Math.ceil(s.n / 200) === 0) s.hist.push([s.n, s.k / s.n]); } drawCoin(id); }
  function drawCoin(id) {
    var s = ST[id], g = el(id + "-g"); if (!g) return;
    el(id + "-s").innerHTML = s.n ? "<b>" + fmt(s.n) + "</b> Würfe · Kopf <b>" + fmt(s.k) + "</b> · Anteil <b>" + pct(s.k / s.n) + "</b>" : "Noch keine Würfe. Starte unten.";
    var maxN = Math.max(10, s.n), lx = function (x) { return 10 + Math.log(x) / Math.log(maxN) * 285; }, ly = function (y) { return 130 - y * 120; };
    var h = '<line x1="10" x2="295" y1="' + ly(0.5) + '" y2="' + ly(0.5) + '" class="kwref"/><text x="296" y="' + (ly(0.5) - 3) + '" class="kwt" text-anchor="end">50 %</text>';
    if (s.hist.length > 1) h += '<polyline class="kwline" points="' + s.hist.map(function (p) { return lx(p[0]).toFixed(1) + "," + ly(p[1]).toFixed(1); }).join(" ") + '"/>';
    h += '<text x="10" y="138" class="kwt">1</text><text x="295" y="138" class="kwt" text-anchor="end">' + fmt(maxN) + " Würfe (log)</text>";
    g.innerHTML = h;
  }
  H.kwcoin = function (d) { flip(d.id, 10); };
  H.kwcoin100 = function (d) { flip(d.id, 100); };
  H.kwcoin1k = function (d) { flip(d.id, 1000); };
  H.kwcoinr = function (d) { ST[d.id] = { n: 0, k: 0, hist: [] }; drawCoin(d.id); };

  /* ---------- Geburtstagsparadoxon ---------- */
  function bday(k) { var p = 1; for (var i = 0; i < k; i++) p *= (365 - i) / 365; return 1 - p; }
  W.birthday = function (id) {
    el(id).innerHTML = '<div class="kwbig" id="' + id + '-p"></div>' + range(id, "kwbday", 2, 80, 1, 23, "Personen:") + '<svg class="kwsvg" id="' + id + '-g" viewBox="0 0 300 120"></svg>';
    H.kwbday(el(id).querySelector("input"));
  };
  H.kwbday = function (inp) {
    var id = inp.dataset.id, k = +inp.value, p = bday(k);
    el(id + "-kwbdayv").textContent = k;
    el(id + "-p").innerHTML = pct(p) + '<span class="small mute"> Wahrscheinlichkeit für mindestens einen gemeinsamen Geburtstag</span>';
    var pts = []; for (var i = 2; i <= 80; i++) pts.push((10 + (i - 2) / 78 * 280).toFixed(1) + "," + (110 - bday(i) * 100).toFixed(1));
    var x = 10 + (k - 2) / 78 * 280, y = 110 - p * 100;
    el(id + "-g").innerHTML = '<line x1="10" x2="290" y1="60" y2="60" class="kwref"/><text x="290" y="56" class="kwt" text-anchor="end">50 %</text><polyline class="kwline" points="' + pts.join(" ") + '"/>' +
      '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="5" class="kwdot"/><text x="10" y="119" class="kwt">2</text><text x="290" y="119" class="kwt" text-anchor="end">80 Personen</text>';
  };

  /* ---------- Baumdiagramm mit zwei Stufen ---------- */
  W.tree2 = function (id) { el(id).innerHTML = range(id, "kwtree", 5, 95, 5, 50, "Trefferwahrscheinlichkeit p =") + '<svg class="kwsvg" id="' + id + '-g" viewBox="0 0 300 170"></svg>'; H.kwtree(el(id).querySelector("input")); };
  H.kwtree = function (inp) {
    var id = inp.dataset.id, p = +inp.value / 100, q = 1 - p; el(id + "-kwtreev").textContent = fmt(p, 2);
    function br(x1, y1, x2, y2, t) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="kwbr"/><text x="' + ((x1 + x2) / 2) + '" y="' + ((y1 + y2) / 2 - 4) + '" class="kwt" text-anchor="middle">' + t + "</text>"; }
    var h = br(20, 85, 110, 40, fmt(p, 2)) + br(20, 85, 110, 130, fmt(q, 2)) + br(120, 40, 200, 18, fmt(p, 2)) + br(120, 40, 200, 62, fmt(q, 2)) + br(120, 130, 200, 108, fmt(p, 2)) + br(120, 130, 200, 152, fmt(q, 2));
    h += '<text x="114" y="44" class="kwn">T</text><text x="114" y="134" class="kwn">N</text>';
    [["TT", 18, p * p], ["TN", 62, p * q], ["NT", 108, q * p], ["NN", 152, q * q]].forEach(function (r) { h += '<text x="206" y="' + (r[1] + 4) + '" class="kwn">' + r[0] + ' = <tspan class="kwv">' + pct(r[2]) + "</tspan></text>"; });
    el(id + "-g").innerHTML = h;
  };

  /* ---------- Zwei Würfel ---------- */
  W.dice = function (id) {
    ST[id] = { c: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], n: 0 };
    el(id).innerHTML = '<div class="kwstat" id="' + id + '-s"></div><svg class="kwsvg" id="' + id + '-g" viewBox="0 0 300 150"></svg><div class="kwrow">' + b("kwdice", "+100 Würfe", id) + b("kwdice1k", "+1.000", id, true) + b("kwdicer", "Neu", id) + "</div>";
    drawDice(id);
  };
  function roll(id, m) { var s = ST[id]; for (var i = 0; i < m; i++) { s.c[Math.ceil(Math.random() * 6) + Math.ceil(Math.random() * 6)]++; s.n++; } drawDice(id); }
  function drawDice(id) {
    var s = ST[id], h = "", w = 22, theo = [0, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
    el(id + "-s").innerHTML = s.n ? fmt(s.n) + " Würfe · Balken: gewürfelt, Rahmen: Theorie" : "Würfle unten. Der Rahmen zeigt die theoretische Verteilung.";
    for (var k = 2; k <= 12; k++) {
      var x = 14 + (k - 2) * 25.5, th = theo[k] / 36 * 600, sh = s.n ? s.c[k] / s.n * 600 : 0;
      h += '<rect x="' + x + '" y="' + (130 - sh) + '" width="' + w + '" height="' + sh + '" class="kwbar"/><rect x="' + x + '" y="' + (130 - th) + '" width="' + w + '" height="' + th + '" class="kwth"/><text x="' + (x + w / 2) + '" y="144" class="kwt" text-anchor="middle">' + k + "</text>";
    }
    el(id + "-g").innerHTML = h;
  }
  H.kwdice = function (d) { roll(d.id, 100); }; H.kwdice1k = function (d) { roll(d.id, 1000); };
  H.kwdicer = function (d) { ST[d.id] = { c: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], n: 0 }; drawDice(d.id); };

  /* ---------- Bayes mit natürlichen Häufigkeiten ---------- */
  W.bayes = function (id) {
    ST[id] = { prev: 1, sens: 90, fp: 9 };
    el(id).innerHTML = range(id, "kwbprev", 0.5, 20, 0.5, 1, "Krank sind (%):") + range(id, "kwbsens", 50, 100, 1, 90, "Test erkennt Kranke (%):") + range(id, "kwbfp", 0, 20, 0.5, 9, "Fehlalarm bei Gesunden (%):") +
      '<div class="kwgrid" id="' + id + '-g"></div><div class="kwstat" id="' + id + '-s"></div><div class="kwleg"><span class="tp">krank, positiv</span><span class="fn">krank, negativ</span><span class="fp">gesund, positiv</span><span class="tn">gesund, negativ</span></div>';
    drawBayes(id);
  };
  function drawBayes(id) {
    var s = ST[id], sick = Math.round(1000 * s.prev / 100), tp = Math.round(sick * s.sens / 100), fn = sick - tp, fp = Math.round((1000 - sick) * s.fp / 100), tn = 1000 - sick - fp;
    ["prev", "sens", "fp"].forEach(function (k) { var v = el(id + "-kwb" + k + "v"); if (v) v.textContent = fmt(s[k], 1).replace(".", ","); });
    var cells = []; [[tp, "tp"], [fn, "fn"], [fp, "fp"], [tn, "tn"]].forEach(function (c) { for (var i = 0; i < c[0]; i++) cells.push(c[1]); });
    el(id + "-g").innerHTML = cells.map(function (c) { return '<i class="' + c + '"></i>'; }).join("");
    var pos = tp + fp;
    el(id + "-s").innerHTML = "Von 1.000 Personen sind <b>" + sick + "</b> krank. Positiv getestet: <b>" + pos + "</b>, davon wirklich krank: <b>" + tp + "</b>. Ein positiver Test bedeutet also <b>" + (pos ? pct(tp / pos) : "–") + "</b> Wahrscheinlichkeit, krank zu sein.";
  }
  H.kwbprev = function (i) { ST[i.dataset.id].prev = +i.value; drawBayes(i.dataset.id); };
  H.kwbsens = function (i) { ST[i.dataset.id].sens = +i.value; drawBayes(i.dataset.id); };
  H.kwbfp = function (i) { ST[i.dataset.id].fp = +i.value; drawBayes(i.dataset.id); };

  /* ---------- Ziegenproblem ---------- */
  W.monty = function (id) { ST[id] = { stay: [0, 0], sw: [0, 0] }; newMonty(id); };
  function newMonty(id) {
    var s = ST[id]; s.car = Math.floor(Math.random() * 3); s.pick = -1; s.open = -1; s.done = false; drawMonty(id, "Wähle eine Tür.");
  }
  function drawMonty(id, msg) {
    var s = ST[id], h = '<div class="kwdoors">';
    for (var i = 0; i < 3; i++) {
      var shown = s.done || i === s.open, txt = shown ? (i === s.car ? "🚗" : "🐐") : "🚪";
      h += '<button class="kwdoor' + (i === s.pick ? " pick" : "") + (shown ? " open" : "") + '" data-act="kwmpick" data-id="' + id + '" data-d="' + i + '"' + (s.pick >= 0 ? " disabled" : "") + "><span>" + txt + "</span><small>Tür " + (i + 1) + "</small></button>";
    }
    h += "</div><p class=\"kwstat\">" + msg + "</p>";
    if (s.pick >= 0 && !s.done) h += '<div class="kwrow">' + b("kwmstay", "Bleiben", id) + b("kwmswitch", "Wechseln", id, true) + "</div>";
    if (s.done) h += '<div class="kwrow">' + b("kwmnew", "Neue Runde", id, true) + "</div>";
    var r = function (a) { return a[1] ? pct(a[0] / a[1], 0) + " von " + a[1] : "–"; };
    h += '<div class="kwstat small">Deine Runden: Bleiben gewinnt ' + r(s.stay) + ", Wechseln gewinnt " + r(s.sw) + "</div>" + '<div class="kwrow">' + b("kwmsim", "1.000 Runden simulieren", id) + '</div><div class="kwstat small" id="' + id + '-sim"></div>';
    el(id).innerHTML = h;
  }
  H.kwmpick = function (d) {
    var s = ST[d.id]; if (s.pick >= 0) return; s.pick = +d.d;
    var opts = [0, 1, 2].filter(function (i) { return i !== s.pick && i !== s.car; }); s.open = opts[Math.floor(Math.random() * opts.length)];
    drawMonty(d.id, "Hinter Tür " + (s.open + 1) + " steht eine Ziege. Bleibst du bei Tür " + (s.pick + 1) + " oder wechselst du?");
  };
  function finishMonty(id, sw) {
    var s = ST[id], fin = sw ? [0, 1, 2].filter(function (i) { return i !== s.pick && i !== s.open; })[0] : s.pick, win = fin === s.car;
    (sw ? s.sw : s.stay)[1]++; if (win) (sw ? s.sw : s.stay)[0]++; s.pick = fin; s.done = true;
    drawMonty(id, (win ? "Gewonnen! 🚗" : "Leider eine Ziege.") + " Du hast " + (sw ? "gewechselt" : "behalten") + ".");
  }
  H.kwmstay = function (d) { finishMonty(d.id, false); }; H.kwmswitch = function (d) { finishMonty(d.id, true); }; H.kwmnew = function (d) { newMonty(d.id); };
  H.kwmsim = function (d) {
    var st = 0, sw = 0; for (var i = 0; i < 1000; i++) { var car = Math.floor(Math.random() * 3), pick = Math.floor(Math.random() * 3); if (pick === car) st++; else sw++; }
    el(d.id + "-sim").innerHTML = "Simulation mit 1.000 Runden: Bleiben gewinnt <b>" + st + "</b>-mal (" + pct(st / 1000, 0) + "), Wechseln gewinnt <b>" + sw + "</b>-mal (" + pct(sw / 1000, 0) + ").";
  };

  /* ---------- Galtonbrett (Animation) ---------- */
  var ROWS = 10;
  W.galton = function (id) {
    ST[id] = { bins: new Array(ROWS + 1).fill(0), balls: [], n: 0, raf: 0 };
    el(id).innerHTML = '<canvas class="kwcan" id="' + id + '-c" width="600" height="420"></canvas><div class="kwstat" id="' + id + '-s">Lass Kugeln fallen.</div><div class="kwrow">' + b("kwg10", "+10 Kugeln", id) + b("kwg100", "+100 Kugeln", id, true) + b("kwgr", "Neu", id) + "</div>";
    drawGalton(id);
  };
  function addBalls(id, m) {
    var s = ST[id]; for (var i = 0; i < m; i++) s.balls.push({ row: -1 - i * 0.6, x: 0, path: [] });
    if (!s.raf) s.raf = requestAnimationFrame(function step() { tickGalton(id); if (ST[id] && ST[id].balls.length && el(id + "-c")) ST[id].raf = requestAnimationFrame(step); else if (ST[id]) ST[id].raf = 0; });
  }
  function tickGalton(id) {
    var s = ST[id], fast = s.balls.length > 30 ? 0.35 : 0.12;
    s.balls.forEach(function (bl) {
      var before = Math.floor(bl.row); bl.row += fast;
      if (Math.floor(bl.row) > before && bl.row >= 0 && bl.row <= ROWS) bl.x += Math.random() < 0.5 ? 0 : 1;
    });
    s.balls = s.balls.filter(function (bl) { if (bl.row > ROWS + 0.5) { s.bins[bl.x]++; s.n++; return false; } return true; });
    drawGalton(id);
  }
  function drawGalton(id) {
    var s = ST[id], c = el(id + "-c"); if (!c) return; var g = c.getContext("2d"), W2 = c.width, H2 = c.height;
    g.clearRect(0, 0, W2, H2);
    var top = 30, gap = 22, cx = W2 / 2, binTop = top + ROWS * gap + 20;
    g.fillStyle = col("--mute", "#888");
    for (var r = 0; r < ROWS; r++) for (var k = 0; k <= r; k++) { g.beginPath(); g.arc(cx + (k - r / 2) * 40, top + r * gap, 3, 0, 7); g.fill(); }
    var max = Math.max.apply(null, s.bins.concat([1])), acc = col("--accent", "#2b8a3e");
    for (var i = 0; i <= ROWS; i++) {
      var x = cx + (i - ROWS / 2) * 40, hgt = s.bins[i] / max * (H2 - binTop - 20);
      g.fillStyle = acc; g.globalAlpha = 0.85; g.fillRect(x - 16, H2 - 18 - hgt, 32, hgt); g.globalAlpha = 1;
      g.fillStyle = col("--mute", "#888"); g.font = "16px sans-serif"; g.textAlign = "center"; g.fillText(String(s.bins[i]), x, H2 - 2);
    }
    g.fillStyle = col("--fg", "#222");
    s.balls.forEach(function (bl) { if (bl.row < 0) return; var r = Math.min(bl.row, ROWS); g.beginPath(); g.arc(cx + (bl.x - Math.floor(r) / 2) * 40 + (r % 1 - 0.5) * 8, top + r * gap - 10, 6, 0, 7); g.fill(); });
    var st = el(id + "-s"); if (st) st.textContent = s.n ? s.n + " Kugeln gefallen. Jede springt 10-mal zufällig links oder rechts: binomialverteilt mit n = 10, p = 0,5." : "Lass Kugeln fallen.";
  }
  H.kwg10 = function (d) { addBalls(d.id, 10); }; H.kwg100 = function (d) { addBalls(d.id, 100); };
  H.kwgr = function (d) { var s = ST[d.id]; s.bins = new Array(ROWS + 1).fill(0); s.balls = []; s.n = 0; drawGalton(d.id); };

  /* ---------- Normalverteilung ---------- */
  function erf(x) { var t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
  W.normal = function (id) { el(id).innerHTML = range(id, "kwnorm", 0.5, 3, 0.5, 1, "Bereich μ ± kσ, k =") + '<svg class="kwsvg" id="' + id + '-g" viewBox="0 0 300 140"></svg><div class="kwbig" id="' + id + '-p"></div>'; H.kwnorm(el(id).querySelector("input")); };
  H.kwnorm = function (inp) {
    var id = inp.dataset.id, k = +inp.value, share = erf(k / Math.SQRT2);
    el(id + "-kwnormv").textContent = fmt(k, 1);
    var X = function (z) { return 150 + z * 45; }, Y = function (z) { return 120 - Math.exp(-z * z / 2) * 100; }, pts = [], area = [];
    for (var z = -3.3; z <= 3.31; z += 0.1) pts.push(X(z).toFixed(1) + "," + Y(z).toFixed(1));
    for (var z2 = -k; z2 <= k + 0.001; z2 += 0.05) area.push(X(z2).toFixed(1) + "," + Y(z2).toFixed(1));
    var h = '<polygon class="kwarea" points="' + X(-k) + ",120 " + area.join(" ") + " " + X(k) + ',120"/><polyline class="kwline" points="' + pts.join(" ") + '"/><line x1="0" x2="300" y1="120" y2="120" class="kwref"/>';
    [-3, -2, -1, 0, 1, 2, 3].forEach(function (z) { h += '<text x="' + X(z) + '" y="134" class="kwt" text-anchor="middle">' + (z === 0 ? "μ" : (z > 0 ? "+" : "−") + Math.abs(z) + "σ") + "</text>"; });
    el(id + "-g").innerHTML = h;
    el(id + "-p").innerHTML = pct(share) + '<span class="small mute"> der Werte liegen innerhalb von μ ± ' + fmt(k, 1) + "σ</span>";
  };

  /* ---------- π mit Zufallspunkten ---------- */
  W.pi = function (id) {
    ST[id] = { n: 0, k: 0 };
    el(id).innerHTML = '<canvas class="kwcan sq" id="' + id + '-c" width="400" height="400"></canvas><div class="kwbig" id="' + id + '-p"></div><div class="kwrow">' + b("kwpi", "+100 Punkte", id) + b("kwpi1k", "+1.000", id, true) + b("kwpir", "Neu", id) + "</div>";
    resetPi(id);
  };
  function resetPi(id) {
    ST[id] = { n: 0, k: 0 }; var c = el(id + "-c"), g = c.getContext("2d"); g.clearRect(0, 0, 400, 400);
    g.strokeStyle = col("--mute", "#888"); g.lineWidth = 2; g.strokeRect(1, 1, 398, 398); g.beginPath(); g.arc(0, 400, 398, -Math.PI / 2, 0); g.stroke();
    el(id + "-p").innerHTML = '<span class="small mute">Punkte im Viertelkreis × 4 ÷ alle Punkte ≈ π</span>';
  }
  function dots(id, m) {
    var s = ST[id], g = el(id + "-c").getContext("2d");
    for (var i = 0; i < m; i++) { var x = Math.random(), y = Math.random(), inn = x * x + y * y <= 1; s.n++; if (inn) s.k++; g.fillStyle = inn ? col("--accent", "#2b8a3e") : col("--bad", "#c62828"); g.fillRect(x * 400 - 1.5, 400 - y * 400 - 1.5, 3, 3); }
    el(id + "-p").innerHTML = "π ≈ " + fmt(4 * s.k / s.n, 4) + '<span class="small mute"> aus ' + fmt(s.n) + " Punkten (wahr: 3,1416)</span>";
  }
  H.kwpi = function (d) { dots(d.id, 100); }; H.kwpi1k = function (d) { dots(d.id, 1000); }; H.kwpir = function (d) { resetPi(d.id); };
  /* ---------- Motorsteuergerät: Blockschaltbild zum Antippen ---------- */
  var BLK = {
    sens: ["Sensoren", "Kurbel- und Nockenwelle, Luftmasse oder Saugrohrdruck, Lambdasonden, Temperaturen, Klopfsensoren und das Fahrpedal mit zwei unabhängigen Kanälen."],
    inp: ["Eingangsschaltung", "Schutzbeschaltung, Filter und Spannungsteiler; die 5-V-Sensorversorgung. Spezielle Auswertebausteine gibt es z. B. für Klopf- oder Lambdasignale."],
    core: ["Rechenkerne", "Mehrere Kerne teilen sich zeitgesteuerte, winkelsynchrone und Kommunikations-Aufgaben. Lockstep-Kerne rechnen sicherheitsrelevante Teile doppelt."],
    mem: ["Flash und RAM", "Flash: Programm und Kalibrierdaten, ohne Strom erhalten. RAM: schnelle Variablen. Lernwerte und Fehlerspeicher liegen nichtflüchtig, oft als emuliertes EEPROM."],
    adc: ["ADC", "Analog-Digital-Wandler machen aus Sensorspannungen Zahlen für die Software."],
    gtm: ["Timer (z. B. GTM)", "Misst die Zahnflanken des Kurbelwellensignals, rechnet die Winkeluhr und erzeugt die Pulse für Einspritzung und Zündung."],
    hsm: ["Sicherheitsmodul (HSM)", "Verwaltet kryptografische Schlüssel: Secure Boot, geschütztes Flashen, abgesicherte Botschaften."],
    out: ["Endstufen", "Low-Side- und High-Side-Schalter, H-Brücken und spezielle Treiber für Injektoren und Zündung. Sie messen Strom und Spannung zur Diagnose."],
    act: ["Aktoren", "Einspritzventile, Zündspulen, Drosselklappe, Nockenwellenversteller, Pumpen, Ventile, Lüfter und Relais."],
    pwr: ["Spannungsversorgung", "KL30 Dauerplus, KL31 Masse, KL15 Zündung. Regler erzeugen 5 V, 3,3 V und Kernspannung; für Direkteinspritzung oft eine Hochspannung. Muss Spannungseinbrüche beim Start überstehen."],
    wd: ["Überwachung", "Ein separater Baustein prüft den Controller (Watchdog, Frage-Antwort im E-Gas-Konzept Ebene 3) und kann die Endstufen unabhängig abschalten."],
    can: ["CAN FD und Sub-CAN", "Hauptkommunikation mit anderen Steuergeräten; dazu oft ein eigener, abgetrennter Bus (Sub-CAN) zu direkten Partnern. Aufbau herstellerspezifisch."],
    fr: ["FlexRay", "Deterministischer Bus mit festem Zeitraster, bis 10 Mbit/s; in neueren Architekturen oft durch CAN FD und Ethernet ersetzt."],
    lin: ["LIN", "Einfacher Master-Slave-Bus für intelligente Sensoren und Aktoren, z. B. Generator- oder Batteriesensor."],
    eth: ["Ethernet", "Automotive Ethernet (100BASE-T1 und schneller) für hohe Datenraten, Diagnose und Flashen über DoIP."]
  };
  W.ecublock = function (id) {
    function bx(k, x, y, w, h, t, sub) {
      return '<g class="kwblk" data-act="kwblk" data-id="' + id + '" data-k="' + k + '" role="button" tabindex="0" aria-label="' + esc(BLK[k][0]) + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="7"/><text x="' + (x + w / 2) + '" y="' + (y + h / 2 + (sub ? -2 : 4)) + '" text-anchor="middle" class="kwn">' + t + "</text>" +
        (sub ? '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 10) + '" text-anchor="middle" class="kwt">' + sub + "</text>" : "") + "</g>";
    }
    function ar(x1, y1, x2, y2) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="kwbr"/><path d="M' + x2 + " " + y2 + " l-6 -4 v8 z" + '" class="kwah" transform="rotate(' + (Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI) + " " + x2 + " " + y2 + ')"/>'; }
    var h = '<svg class="kwsvg" viewBox="0 0 320 290">' +
      bx("pwr", 6, 4, 150, 36, "Versorgung", "KL30 · KL31 · KL15") + bx("wd", 164, 4, 150, 36, "Überwachung", "Watchdog") +
      '<rect x="112" y="52" width="96" height="164" rx="10" class="kwmcu"/><text x="160" y="66" text-anchor="middle" class="kwt">Mikrocontroller</text>' +
      bx("core", 118, 72, 84, 26, "Kerne") + bx("mem", 118, 102, 84, 26, "Flash · RAM") + bx("adc", 118, 132, 40, 26, "ADC") + bx("gtm", 162, 132, 40, 26, "GTM") + bx("hsm", 118, 162, 84, 26, "HSM") +
      bx("sens", 6, 72, 46, 116, "Sen-", "soren") + bx("inp", 60, 72, 44, 116, "Ein-", "gänge") + bx("out", 216, 72, 44, 116, "End-", "stufen") + bx("act", 268, 72, 46, 116, "Akto-", "ren") +
      ar(52, 130, 59, 130) + ar(104, 145, 117, 145) + ar(203, 130, 215, 130) + ar(260, 130, 267, 130) + ar(160, 40, 160, 51) + ar(239, 40, 239, 71) +
      '<line x1="160" y1="216" x2="160" y2="232" class="kwbr"/><line x1="40" y1="232" x2="280" y2="232" class="kwbr"/>' +
      [40, 120, 200, 280].map(function (x) { return '<line x1="' + x + '" y1="232" x2="' + x + '" y2="244" class="kwbr"/>'; }).join("") +
      bx("can", 6, 244, 70, 40, "CAN FD", "Sub-CAN") + bx("fr", 86, 244, 70, 40, "FlexRay") + bx("lin", 166, 244, 68, 40, "LIN") + bx("eth", 244, 244, 70, 40, "Ethernet") +
      "</svg>";
    el(id).innerHTML = '<div class="kwstat small mute">Tippe auf einen Baustein.</div>' + h + '<div class="kwinfo" id="' + id + '-i" aria-live="polite"><b>Signalfluss</b><br>Sensoren → Eingänge → Mikrocontroller → Endstufen → Aktoren. Darunter die Busse zu anderen Steuergeräten.</div>';
  };
  H.kwblk = function (d) {
    var r = el(d.id); if (!r) return;
    [].forEach.call(r.querySelectorAll(".kwblk"), function (g) { g.classList.toggle("on", g.dataset.k === d.k); });
    var b = BLK[d.k]; el(d.id + "-i").innerHTML = "<b>" + esc(b[0]) + "</b><br>" + esc(b[1]);
  };

  /* ---------- Motorsteuergerät: Zustandssimulator ---------- */
  var SN = { off: "Stromlos", sleep: "Schlaf", init: "Initialisierung", run: "Betrieb", limp: "Notlauf", post: "Nachlauf", prog: "Programmieren" };
  var SI = { off: "Kein Dauerplus (KL30): Das Steuergerät ist stromlos. RAM-Inhalte sind weg, nichtflüchtig gespeicherte Daten bleiben.", sleep: "Nur KL30 liegt an. Minimaler Ruhestrom; ein Weckgrund (KL15, Busbotschaft, Diagnose) startet das Gerät.",
    init: "Startup: Speicher prüfen, Lernwerte laden, Treiber und Kommunikation starten, Überwachungen testen.", run: "Alle Funktionen laufen. Solange KL15 an ist oder der Bus das Gerät braucht, bleibt es wach.",
    limp: "Ein schwerer Fehler: Ersatzwerte und Leistungsbegrenzung. Der Notlauf bleibt bis zum nächsten Fahrzyklus, auch wenn der Fehler verschwindet.", post: "Zündung aus: Lernwerte und Fehlerspeicher werden gesichert, Lüfter und Pumpen laufen nach. Dann schläft das Gerät ein.",
    prog: "Programmiersitzung: Der Bootloader übernimmt, Anwendung angehalten. Nach dem Ende folgt ein Reset (UDS 0x11) und eine neue Initialisierung." };
  var SIG = [["kl30", "KL30 Batterie"], ["kl15", "KL15 Zündung"], ["bus", "Buswecken"], ["prog", "Programmieren"], ["fault", "Schwerer Fehler"]];
  W.ecustate = function (id) {
    ST[id] = { s: "sleep", t: 0, kl30: true, kl15: false, bus: false, prog: false, fault: false, log: [] };
    el(id).innerHTML = '<div class="kwst" id="' + id + '-s"></div><div class="kwbig" id="' + id + '-n"></div><div class="kwinfo" id="' + id + '-i" aria-live="polite"></div>' +
      '<div class="kwtog" id="' + id + '-b"></div><div class="small mute" id="' + id + '-l"></div>';
    drawState(id);
    ST[id].iv = setInterval(function () { if (!el(id)) { clearInterval(ST[id].iv); return; } tickState(id); }, 300);
  };
  function go(id, s, why) { var S = ST[id]; if (S.s === s) return; S.s = s; S.t = { init: 6, post: 14 }[s] || 0; if (why) { S.log.unshift(why); S.log = S.log.slice(0, 3); } drawState(id); }
  function tickState(id) {
    var S = ST[id], wake = S.kl15 || S.bus || S.prog;
    if (!S.kl30) return go(id, "off", "KL30 getrennt → stromlos");
    switch (S.s) {
      case "off": return go(id, "sleep", "KL30 da → Schlaf");
      case "sleep": if (wake) go(id, "init", (S.kl15 ? "KL15" : S.bus ? "Busbotschaft" : "Diagnose") + " weckt → Initialisierung"); return;
      case "init": if (--S.t > 0) return drawState(id); return S.prog ? go(id, "prog", "Init fertig, Programmieranforderung → Bootloader") : S.fault ? go(id, "limp", "Init fertig, Fehler erkannt → Notlauf") : go(id, "run", "Init fertig → Betrieb");
      case "run": if (S.prog) return go(id, "prog", "Diagnose 0x10 02 → Programmiersitzung"); if (S.fault) return go(id, "limp", "Fehler bestätigt → Notlauf"); if (!S.kl15 && !S.bus) go(id, "post", "Kein Weckgrund mehr → Nachlauf"); return;
      case "limp": if (S.prog) return go(id, "prog", "Diagnose 0x10 02 → Programmiersitzung"); if (!S.kl15 && !S.bus) go(id, "post", "Kein Weckgrund mehr → Nachlauf"); return;
      case "prog": if (!S.prog) go(id, "init", "Programmieren beendet → Reset (0x11) → Initialisierung"); return;
      case "post": if (S.kl15 || S.prog) return go(id, "init", "Wieder geweckt im Nachlauf → neu starten");
        if (S.bus) return go(id, "run", "Bus braucht das Gerät → Betrieb");
        if (--S.t > 0) return drawState(id); S.fault = false; return go(id, "sleep", "Daten gesichert → Schlaf");
    }
  }
  function drawState(id) {
    var S = ST[id]; if (!el(id + "-s")) return;
    el(id + "-s").innerHTML = ["off", "sleep", "init", "run", "limp", "post", "prog"].map(function (k) { return '<span class="' + (S.s === k ? "on" : "") + '">' + SN[k] + "</span>"; }).join("");
    el(id + "-n").innerHTML = SN[S.s] + (S.s === "init" || S.s === "post" ? '<span class="small mute"> ' + "●".repeat(Math.max(0, S.t)) + "</span>" : "");
    el(id + "-i").textContent = SI[S.s];
    el(id + "-b").innerHTML = SIG.map(function (g) { return '<button class="btn kwb' + (S[g[0]] ? " primary" : "") + '" aria-pressed="' + !!S[g[0]] + '" data-act="kwsig" data-id="' + id + '" data-k="' + g[0] + '">' + (S[g[0]] ? "● " : "○ ") + g[1] + "</button>"; }).join("");
    el(id + "-l").innerHTML = S.log.length ? "Zuletzt: " + S.log.map(esc).join(" · ") : "Schalte Signale und beobachte den Zustand.";
  }
  H.kwsig = function (d) { var S = ST[d.id]; if (!S) return; S[d.k] = !S[d.k]; drawState(d.id); tickState(d.id); };

  /* ---------- Geberrad 60-2 mit Sensorsignal und Synchronisation ---------- */
  W.crank = function (id) {
    ST[id] = { a: 0, run: true, rpm: 1000, tr: [], sync: false, cnt: 0, last: null, norm: 6, prev: 0, glitch: false, msg: "Suche Lücke …", rev: 0, ok: 0 };
    el(id).innerHTML = '<canvas class="kwcan" id="' + id + '-c" width="600" height="470"></canvas><div class="kwstat" id="' + id + '-s"></div>' +
      range(id, "kwrpm", 200, 6000, 100, 1000, "Drehzahl (1/min):") +
      '<div class="kwrow">' + b("kwcrun", "Pause", id) + b("kwcglitch", "Störimpuls", id) + b("kwcnew", "Neu starten", id, true) + "</div>";
    H.kwrpm(el(id).querySelector("input"));
    var last = 0;
    (function step(ts) {
      var S = ST[id], c = el(id + "-c"); if (!S || !c) return;
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
      if (S.run) { S.acc = (S.acc || 0) + S.rpm * 0.05 * dt; while (S.acc >= 0.5) { sample(id, 0.5); S.acc -= 0.5; } }
      drawCrank(id); requestAnimationFrame(step);
    })(0);
  };
  function present(rel) { var k = Math.floor(rel / 6); return k < 58 && rel - k * 6 < 3; }
  function sample(id, d) {
    var S = ST[id], before = present(S.a % 360); S.a += d;
    var now = present(S.a % 360), edge = !before && now;
    if (S.glitch) { S.glitch = false; edge = true; S.tr.push(2); } else S.tr.push(now ? 1 : 0);
    if (S.tr.length > 360) S.tr.shift();
    if (!edge) return;
    var delta = S.last === null ? 0 : S.a - S.last; S.last = S.a;
    if (!delta) return;
    if (delta > 2 * S.norm) {
      if (!S.sync) { S.sync = true; S.msg = "Lücke erkannt → synchron"; S.ok++; }
      else if (S.cnt !== 57) { S.sync = false; S.msg = "Zahnzahl passt nicht (" + (S.cnt + 1) + " statt 58) → Synchronisation verloren, Einspritzung und Zündung kurz aus"; }
      else { S.msg = "Synchron ✓"; S.rev++; }
      S.cnt = 0;
    } else { if (delta > S.norm * 0.6) S.norm = delta; S.cnt++; }
  }
  function drawCrank(id) {
    var S = ST[id], c = el(id + "-c"), g = c.getContext("2d"), acc = col("--accent", "#2b8a3e"), mute = col("--mute", "#888"), fg = col("--fg", "#222"), bad = col("--bad", "#c62828");
    g.clearRect(0, 0, 600, 470);
    var cx = 300, cy = 175, R = 140;
    g.save(); g.translate(cx, cy); g.rotate(-S.a * Math.PI / 180);
    g.fillStyle = mute; g.beginPath(); g.arc(0, 0, R - 14, 0, 2 * Math.PI); g.fill();
    for (var k = 0; k < 58; k++) { var a0 = (k * 6 - 90) * Math.PI / 180, a1 = (k * 6 + 3 - 90) * Math.PI / 180; g.beginPath(); g.arc(0, 0, R, a0, a1); g.arc(0, 0, R - 15, a1, a0, true); g.closePath(); g.fillStyle = k === 0 ? acc : fg; g.fill(); }
    g.fillStyle = col("--card", "#fff"); g.beginPath(); g.arc(0, 0, 28, 0, 2 * Math.PI); g.fill();
    g.restore();
    g.fillStyle = bad; g.fillRect(cx - 9, cy - R - 34, 18, 26); g.font = "15px system-ui, sans-serif"; g.textAlign = "left"; g.fillStyle = fg; g.fillText("Sensor", cx + 16, cy - R - 16);
    g.fillStyle = mute; g.fillText("Lücke: 2 Zähne fehlen · farbig: erster Zahn nach der Lücke", 12, 340);
    var y0 = 440, hgt = 60; g.strokeStyle = mute; g.lineWidth = 1; g.beginPath(); g.moveTo(0, y0); g.lineTo(600, y0); g.stroke();
    g.strokeStyle = acc; g.lineWidth = 2.5; g.beginPath();
    S.tr.forEach(function (v, i) { var x = 600 - (S.tr.length - i) * (600 / 360), y = v === 2 ? y0 - hgt - 10 : y0 - v * hgt * 0.8; if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    g.stroke(); g.fillStyle = mute; g.fillText("Sensorsignal über Kurbelwinkel (letzte 180°)", 12, 466);
    var tz = 1000 / S.rpm;
    el(id + "-s").innerHTML = "Zahnzeit <b>" + fmt(tz, 3) + " ms</b> · Lücke ≈ <b>" + fmt(3 * tz, 3) + " ms</b><br>" + (S.sync ? '<span style="color:var(--ok)">' + esc(S.msg) + "</span> · Zahn <b>" + (S.cnt + 1) + "</b> · Kurbelwinkel ab Lücke <b>" + (S.cnt * 6) + "°</b>" : '<span style="color:var(--bad)">' + esc(S.msg) + "</span>");
  }
  H.kwrpm = function (inp) { var S = ST[inp.dataset.id]; S.rpm = +inp.value; el(inp.dataset.id + "-kwrpmv").textContent = fmt(S.rpm) + " (Animation verlangsamt)"; };
  H.kwcrun = function (d, t) { var S = ST[d.id]; S.run = !S.run; t.textContent = S.run ? "Pause" : "Weiter"; };
  H.kwcglitch = function (d) { ST[d.id].glitch = true; };
  H.kwcnew = function (d) { var S = ST[d.id]; S.sync = false; S.cnt = 0; S.last = null; S.msg = "Neu gestartet: Position unbekannt, suche Lücke …"; S.a += Math.random() * 360; S.tr = []; };
  /* ---------- Fehlercode-Entschlüssler (SAE J2012) ---------- */
  var DTCL = { P: "Powertrain: Motor und Getriebe", C: "Chassis: Fahrwerk, Bremsen, Lenkung", B: "Body: Karosserie und Innenraum", U: "Network: Kommunikation zwischen Steuergeräten" };
  var DTCP = { "0": "Luft-/Kraftstoffzumessung, Zusatzemissionen", "1": "Luft-/Kraftstoffzumessung", "2": "Luft-/Kraftstoffzumessung (Einspritzkreise)", "3": "Zündung und Aussetzer", "4": "Zusätzliche Abgasregelung (z. B. Katalysator, AGR)", "5": "Geschwindigkeit, Leerlauf, Hilfseingänge", "6": "Steuergerät und Ausgänge", "7": "Getriebe", "8": "Getriebe", "9": "Getriebe", A: "Hybrid/Elektroantrieb", B: "Hybrid/Elektroantrieb", C: "Hybrid/Elektroantrieb" };
  var DTCN = { P0301: "Aussetzer Zylinder 1 erkannt", P0300: "Zufällige/mehrere Aussetzer", P0420: "Katalysatorwirkungsgrad unter Schwelle (Bank 1)", P0171: "System zu mager (Bank 1)", P0442: "Kleines Leck Tankentlüftung", P0128: "Kühlmitteltemperatur unter Regelschwelle", U0100: "Kommunikation zum Motorsteuergerät verloren" };
  W.dtc = function (id) {
    el(id).innerHTML = '<label class="kwr"><span>Fehlercode:</span><input class="kwin" maxlength="5" value="P0301" autocomplete="off" autocapitalize="characters" spellcheck="false" data-input="kwdtc" data-id="' + id + '" aria-label="Fehlercode"></label>' +
      '<div class="kwrow">' + ["P0301", "P0420", "P0171", "U0100", "C0035", "B1234"].map(function (c) { return '<button class="btn kwb" data-act="kwdtcx" data-id="' + id + '" data-k="' + c + '">' + c + "</button>"; }).join("") + "</div>" +
      '<div class="kwdtc" id="' + id + '-d"></div><div class="kwinfo small" id="' + id + '-h"></div>';
    H.kwdtc(el(id).querySelector("input"));
  };
  H.kwdtcx = function (d) { var i = el(d.id).querySelector("input"); i.value = d.k; H.kwdtc(i); };
  H.kwdtc = function (inp) {
    var id = inp.dataset.id, s = inp.value.toUpperCase().replace(/[^PCBU0-9A-F]/g, ""), out = el(id + "-d"), hx = el(id + "-h");
    if (!/^[PCBU][0-3][0-9A-F]{3}$/.test(s)) { out.innerHTML = ""; hx.textContent = "Format: Buchstabe P, C, B oder U, dann eine Ziffer 0–3 und drei Zeichen 0–9 oder A–F (z. B. P0301)."; return; }
    var L = s[0], d1 = s[1], d2 = s[2], gen = d1 === "0" || (L === "P" && d1 === "2"), man = d1 === "1" || (L !== "P" && d1 === "2");
    var parts = [[L, DTCL[L]], [d1, gen ? "Genormter Code (gleich bei allen Herstellern)" : man ? "Herstellerspezifischer Code" : L === "P" ? "Gemischt: teils herstellerspezifisch, teils genormt" : "Reserviert"],
      [d2, L === "P" ? DTCP[d2] || "Teilsystem" : "Teilbereich innerhalb der Gruppe"], [s.slice(3), "Konkreter Fehler (laut Tabelle)" + (DTCN[s] ? ": " + DTCN[s] : "")]];
    out.innerHTML = parts.map(function (p) { return '<div class="kwdc"><b>' + esc(p[0]) + "</b><span>" + esc(p[1]) + "</span></div>"; }).join("");
    var v = ("PCBU".indexOf(L) << 14) | (+d1 << 12) | (parseInt(d2, 16) << 8) | parseInt(s.slice(3), 16);
    hx.innerHTML = "Im UDS-Fehlerspeicher als zwei Byte: <b>0x" + ("0000" + v.toString(16).toUpperCase()).slice(-4) + "</b>, dazu ein drittes Byte für die Fehlerart (FTB), z. B. 0x13 Unterbrechung." + (DTCN[s] ? "" : " Die genaue Bedeutung steht in SAE J2012 oder in den Herstellerdaten.");
  };

  /* ---------- UDS-Simulator (vereinfachtes Demo-Steuergerät) ---------- */
  var UREQ = [["1003", "10 03", "Extended Session"], ["1002", "10 02", "Programming Session"], ["22F190", "22 F1 90", "VIN lesen"], ["221234", "22 12 34", "Unbekannte DID"], ["2701", "27 01", "Seed anfordern"],
    ["2702ok", "27 02 + Key", "Richtiger Key"], ["2702bad", "27 02 + Key", "Falscher Key"], ["2EF190", "2E F1 90 …", "VIN schreiben"], ["190208", "19 02 08", "Bestätigte Fehler"], ["3101FF00", "31 01 FF 00", "Speicher löschen"], ["3E00", "3E 00", "TesterPresent"], ["1101", "11 01", "ECU-Reset"]];
  var NRC = { "7F": "serviceNotSupportedInActiveSession", "7E": "subFunctionNotSupportedInActiveSession", "31": "requestOutOfRange", "33": "securityAccessDenied", "35": "invalidKey", "36": "exceededNumberOfAttempts", "24": "requestSequenceError", "22": "conditionsNotCorrect" };
  function hex2(n) { return ("0" + n.toString(16).toUpperCase()).slice(-2); }
  W.uds = function (id) {
    ST[id] = { ses: 1, unl: false, seed: null, bad: 0, log: [] };
    el(id).innerHTML = '<div class="kwst" id="' + id + '-s"></div><div class="kwgridb">' + UREQ.map(function (r) { return '<button class="btn kwb" data-act="kwuds" data-id="' + id + '" data-k="' + r[0] + '"><b>' + r[1] + "</b><small>" + r[2] + "</small></button>"; }).join("") + "</div>" +
      '<div class="kwlog" id="' + id + '-l" aria-live="polite"></div><button class="link small" data-act="kwudsr" data-id="' + id + '">Zurücksetzen</button>';
    drawUds(id);
  };
  function udsAnswer(S, k) {
    var neg = function (sid, c, why) { return ["7F " + sid + " " + c, false, "Negative Antwort: " + NRC[c] + ". " + why]; };
    switch (k) {
      case "1003": S.ses = 3; S.unl = false; S.seed = null; return ["50 03 00 32 01 F4", true, "Extended Session aktiv. 00 32 = P2 50 ms, 01 F4 = P2* 5.000 ms (in 10-ms-Schritten)."];
      case "1002": if (S.ses === 1) return neg("10", "22", "Viele Steuergeräte erlauben die Programmiersitzung nur aus der Extended Session."); S.ses = 2; S.unl = false; S.seed = null; return ["50 02 00 32 01 F4", true, "Programming Session aktiv: Der Bootloader übernimmt."];
      case "22F190": var vin = "MARIFA00000000001"; return ["62 F1 90 " + vin.split("").map(function (c) { return hex2(c.charCodeAt(0)); }).join(" "), true, "Positive Antwort 0x62 mit der VIN als ASCII: " + vin + " (Demo-Wert)."];
      case "221234": return neg("22", "31", "Diese Kennung kennt das Steuergerät nicht.");
      case "2701": if (S.ses === 1) return neg("27", "7F", "SecurityAccess gibt es nicht in der Default Session."); if (S.bad >= 3) return neg("27", "36", "Zu viele Fehlversuche. Erst nach einer Wartezeit oder einem Reset geht es weiter.");
        S.seed = Math.floor(Math.random() * 0xFFFFFFFF) >>> 0; var sd = ("00000000" + S.seed.toString(16).toUpperCase()).slice(-8).match(/../g).join(" "); return ["67 01 " + sd, true, "Seed erhalten. Der Tester berechnet daraus den Key (hier ein einfacher Demo-Algorithmus: Seed XOR 5A5A5A5A)."];
      case "2702ok": case "2702bad": if (S.ses === 1) return neg("27", "7F", "Nicht in der Default Session."); if (S.seed === null) return neg("27", "24", "Erst den Seed anfordern (27 01).");
        S.seed = null; if (k === "2702bad") { S.bad++; return neg("27", S.bad >= 3 ? "36" : "35", S.bad >= 3 ? "Dritter Fehlversuch: gesperrt." : "Falscher Key (Versuch " + S.bad + " von 3)."); } S.unl = true; S.bad = 0; return ["67 02", true, "Entsperrt. Geschützte Dienste sind jetzt erlaubt."];
      case "2EF190": if (S.ses === 1) return neg("2E", "7F", "Schreiben ist in der Default Session nicht erlaubt."); if (!S.unl) return neg("2E", "33", "Erst mit SecurityAccess entsperren."); return ["6E F1 90", true, "Geschrieben. (Echte Steuergeräte schützen die VIN meist stärker.)"];
      case "190208": return ["59 02 FF 03 01 00 2F 04 20 00 08", true, "Zwei bestätigte Fehler: P0301 (Status 0x2F: aktuell, ausstehend, bestätigt) und P0420 (Status 0x08: bestätigt, gerade nicht aktiv)."];
      case "3101FF00": if (S.ses !== 2) return neg("31", "7F", "Speicher löschen geht nur in der Programming Session."); if (!S.unl) return neg("31", "33", "Erst entsperren."); return ["71 01 FF 00 00", true, "Routine gestartet: Speicher gelöscht. Jetzt könnte mit 34/36/37 neue Software übertragen werden."];
      case "3E00": return ["7E 00", true, "TesterPresent: Die aktuelle Sitzung bleibt offen."];
      case "1101": S.ses = 1; S.unl = false; S.seed = null; return ["51 01", true, "Reset: zurück in der Default Session, Sperre wieder aktiv."];
    }
  }
  H.kwuds = function (d) {
    var S = ST[d.id], r = UREQ.filter(function (x) { return x[0] === d.k; })[0], a = udsAnswer(S, d.k);
    var req = d.k === "2702ok" || d.k === "2702bad" ? "27 02 …" : d.k === "2EF190" ? "2E F1 90 …" : r[1];
    S.log.unshift({ q: req, a: a[0], ok: a[1], t: a[2] }); S.log = S.log.slice(0, 4); drawUds(d.id);
  };
  H.kwudsr = function (d) { W.uds(d.id); };
  function drawUds(id) {
    var S = ST[id]; el(id + "-s").innerHTML = ["Default", "Programming", "Extended"].map(function (n, i) { return '<span class="' + (S.ses === i + 1 ? "on" : "") + '">' + n + "</span>"; }).join("") + '<span class="' + (S.unl ? "on" : "") + '">' + (S.unl ? "🔓 entsperrt" : "🔒 gesperrt") + "</span>";
    el(id + "-l").innerHTML = S.log.length ? S.log.map(function (x, i) { return '<div class="kwmsg' + (x.ok ? " ok" : " bad") + (i ? " old" : "") + '"><code>→ ' + esc(x.q) + "</code><code>← " + esc(x.a) + "</code><span>" + esc(x.t) + "</span></div>"; }).join("") : '<p class="small mute">Tippe eine Anfrage an. Tipp: Erst 27 01 in der Default Session probieren, dann 10 03.</p>';
  }

  /* ---------- IUMPR-Rechner ---------- */
  var TRIP = { k: ["Kurzstrecke", false, 0.05], p: ["Pendeln", true, 0.45], a: ["Autobahn", true, 0.8] };
  W.iumpr = function (id) {
    ST[id] = { n: 0, d: 0, ign: 0 };
    el(id).innerHTML = range(id, "kwiu", 1, 5, 1, 2, "Freigabebedingungen (1 locker … 5 streng):") +
      '<div class="kwrow">' + b("kwiuk", "+ Kurzstrecke", id) + b("kwiup", "+ Pendeln", id) + b("kwiua", "+ Autobahn", id) + b("kwiu20", "+20 gemischt", id, true) + "</div>" +
      '<div class="kwbig" id="' + id + '-r"></div><svg class="kwsvg" id="' + id + '-g" viewBox="0 0 300 54"></svg><div class="kwstat small" id="' + id + '-s"></div><button class="link small" data-act="kwiur" data-id="' + id + '">Zurücksetzen</button>';
    H.kwiu(el(id).querySelector("input"));
  };
  function trip(id, t) {
    var S = ST[id], T = TRIP[t], strict = +el(id).querySelector("input").value, p = T[2] * (1.2 - 0.2 * strict);
    S.ign++; if (T[1]) S.d++; if (Math.random() < p) S.n++;
  }
  function drawIu(id) {
    var S = ST[id], r = S.d ? S.n / S.d : 0, X = function (v) { return 10 + Math.min(1, v) * 280; };
    el(id + "-r").innerHTML = (S.d ? fmt(r, 3) : "–") + '<span class="small mute"> IUMPR = ' + S.n + " ÷ " + S.d + "</span>";
    el(id + "-g").innerHTML = '<rect x="10" y="14" width="280" height="16" rx="8" class="kwtrack"/><rect x="10" y="14" width="' + (X(r) - 10).toFixed(1) + '" height="16" rx="8" class="' + (r >= 0.336 ? "kwgood" : r >= 0.1 ? "kwmid" : "kwlow") + '"/>' +
      [[0.1, "EU 0,1"], [0.336, "CARB 0,336"]].map(function (t) { return '<line x1="' + X(t[0]) + '" x2="' + X(t[0]) + '" y1="8" y2="36" class="kwref"/><text x="' + X(t[0]) + '" y="48" class="kwt" text-anchor="middle">' + t[1] + "</text>"; }).join("");
    el(id + "-s").innerHTML = "Zähler <b>" + S.n + "</b> · Nenner <b>" + S.d + "</b> · Zündzyklen <b>" + S.ign + "</b><br>" + (S.d < 5 ? "Fahre ein paar Runden." : r >= 0.336 ? "Schafft auch die strenge CARB-Quote." : r >= 0.1 ? "Schafft die EU-Mindestquote 0,1." : "Unter der Mindestquote: Freigabebedingungen lockern oder Monitor früher laufen lassen.") + " Kurzstrecken unter 10 Minuten zählen nicht für den Nenner.";
  }
  H.kwiu = function (inp) { el(inp.dataset.id + "-kwiuv").textContent = inp.value; drawIu(inp.dataset.id); };
  H.kwiuk = function (d) { trip(d.id, "k"); drawIu(d.id); }; H.kwiup = function (d) { trip(d.id, "p"); drawIu(d.id); }; H.kwiua = function (d) { trip(d.id, "a"); drawIu(d.id); };
  H.kwiu20 = function (d) { for (var i = 0; i < 20; i++) trip(d.id, ["k", "k", "p", "p", "a"][Math.floor(Math.random() * 5)]); drawIu(d.id); };
  H.kwiur = function (d) { ST[d.id] = { n: 0, d: 0, ign: 0 }; drawIu(d.id); };

  /* ---------- SAE-Stufen vergleichen ---------- */
  var SAE = [
    ["Keine Automatisierung", "Mensch", "Mensch", "Mensch", "–", "Warnsysteme, z. B. Spurverlassenswarnung"],
    ["Assistiert", "Mensch + System (längs oder quer)", "Mensch", "Mensch", "Begrenzt", "Abstandsregeltempomat"],
    ["Teilautomatisiert", "System (längs und quer)", "Mensch", "Mensch", "Begrenzt", "Spurführung mit Abstandsregelung"],
    ["Bedingt automatisiert", "System", "System", "Mensch nach Aufforderung", "Begrenzt (ODD)", "Stau- und Autobahnpilot nach UN R157"],
    ["Hochautomatisiert", "System", "System", "System", "Begrenzt (ODD)", "Robotaxi oder Shuttle in festem Gebiet"],
    ["Vollautomatisiert", "System", "System", "System", "Unbegrenzt", "Gibt es bisher nicht"]];
  W.sae = function (id) {
    el(id).innerHTML = '<div class="kwsae" role="group" aria-label="Stufe wählen">' + [0, 1, 2, 3, 4, 5].map(function (i) { return '<button class="btn kwb" data-act="kwsae" data-id="' + id + '" data-k="' + i + '">' + i + "</button>"; }).join("") + '</div><div id="' + id + '-t"></div>';
    H.kwsae({ id: id, k: "2" });
  };
  H.kwsae = function (d) {
    var i = +d.k, s = SAE[i], who = function (t) { return '<span class="' + (/System/.test(t) ? "sys" : /Mensch/.test(t) ? "hum" : "") + '">' + esc(t) + "</span>"; };
    [].forEach.call(el(d.id).querySelectorAll(".kwsae button"), function (x) { x.classList.toggle("primary", x.dataset.k === d.k); });
    el(d.id + "-t").innerHTML = '<div class="kwbig">Stufe ' + i + '<span class="small mute"> · ' + esc(s[0]) + "</span></div>" +
      '<div class="kwtab"><div>Lenken und Bremsen</div>' + who(s[1]) + "<div>Umgebung überwachen</div>" + who(s[2]) + "<div>Rückfallebene</div>" + who(s[3]) + "<div>Einsatzbereich</div><span>" + esc(s[4]) + "</span><div>Beispiel</div><span>" + esc(s[5]) + "</span></div>" +
      '<div class="kwinfo small">' + (i < 3 ? "Der Mensch fährt und muss ständig aufmerksam sein. Das ist Assistenz, keine Automatisierung." : i === 3 ? "Im Einsatzbereich darf sich der Mensch abwenden, muss aber nach Aufforderung rechtzeitig übernehmen." : "Kein Mensch muss eingreifen; das System erreicht bei Problemen selbst einen sicheren Zustand.") + "</div>";
  };
  /* ---------- Lambda: Sprungsonde, Breitbandsonde und Kat-Fenster (schematisch) ---------- */
  function jumpV(l) { return 0.45 - 0.4 * Math.tanh((l - 1) * 60); }
  function pumpRel(l) { return (l - 1) / l; }
  function convOx(l) { return 0.3 + 0.68 / (1 + Math.exp(-(l - 0.988) * 400)); }
  function convNox(l) { return 0.05 + 0.93 / (1 + Math.exp((l - 1.008) * 400)); }
  W.lambda = function (id) {
    el(id).innerHTML = range(id, "kwlam", 0.8, 1.2, 0.005, 1, "λ =") + '<svg class="kwsvg" id="' + id + '-g" viewBox="0 0 300 200"></svg>' +
      '<div class="kwlamv" id="' + id + '-v"></div><p class="small mute" style="margin:6px 0 0">Schematische Kurven zum Verständnis, keine Messdaten eines bestimmten Sensors.</p>';
    H.kwlam(el(id).querySelector("input"));
  };
  H.kwlam = function (inp) {
    var id = inp.dataset.id, l = +inp.value, X = function (v) { return 20 + (v - 0.8) / 0.4 * 270; };
    el(id + "-kwlamv").textContent = fmt(l, 3) + (l < 0.995 ? " (fett)" : l > 1.005 ? " (mager)" : " (stöchiometrisch)");
    function curve(f, y0, h) { var p = []; for (var v = 0.8; v <= 1.2001; v += 0.004) p.push(X(v).toFixed(1) + "," + (y0 - f(v) * h).toFixed(1)); return p.join(" "); }
    var g = '<rect x="' + X(0.993) + '" y="6" width="' + (X(1.007) - X(0.993)) + '" height="186" class="kwwin"/>' +
      '<text x="22" y="16" class="kwn">Sprungsonde (V)</text><polyline class="kwline" points="' + curve(function (v) { return jumpV(v) / 0.9; }, 70, 55) + '"/>' +
      '<text x="22" y="86" class="kwn">Breitband: Pumpstrom</text><line x1="20" x2="290" y1="118" y2="118" class="kwref"/><polyline class="kwline b2" points="' + curve(function (v) { return pumpRel(v) / 0.25; }, 118, 22) + '"/>' +
      '<text x="22" y="150" class="kwn">Kat-Umsatz</text><polyline class="kwline c1" points="' + curve(convOx, 192, 34) + '"/><polyline class="kwline c2" points="' + curve(convNox, 192, 34) + '"/>' +
      '<line x1="' + X(l) + '" x2="' + X(l) + '" y1="4" y2="196" class="kwcur"/>' +
      '<text x="20" y="200" class="kwt">0,8</text><text x="' + X(1) + '" y="200" class="kwt" text-anchor="middle">1,0</text><text x="290" y="200" class="kwt" text-anchor="end">1,2</text>';
    el(id + "-g").innerHTML = g;
    var ip = pumpRel(l);
    el(id + "-v").innerHTML = '<span><b>' + fmt(jumpV(l), 2) + " V</b>Sprungsonde</span><span><b>" + (Math.abs(ip) < 0.004 ? "≈ 0" : ip > 0 ? "+ positiv" : "− negativ") + "</b>Pumpstrom</span>" +
      '<span class="c1"><b>' + Math.round(convOx(l) * 100) + " %</b>CO/HC</span><span class=\"c2\"><b>" + Math.round(convNox(l) * 100) + " %</b>NOx</span>";
  };
  /* ---------- CI/CD-Pipeline-Simulator ---------- */
  var STG = { lint: ["Lint", 1], build: ["Build", 3], unit: ["Unit-Tests", 4], integ: ["Integration", 8], stage: ["Deploy Test", 3], e2e: ["End-to-End", 15], prod: ["Freigabe", 1] };
  var BUGS = [["", "Kein Fehler"], ["lint", "Tippfehler"], ["unit", "Logikfehler"], ["integ", "Schnittstellenfehler"], ["e2e", "Fehler in der Oberfläche"]];
  W.pipe = function (id) {
    ST[id] = { bug: "unit", fast: true, run: 0, res: null };
    el(id).innerHTML = '<div class="kwst" id="' + id + '-b"></div><div class="kwrow">' + b("kwpord", "Reihenfolge wechseln", id) + b("kwpgo", "▶ Commit pushen", id, true) + "</div>" +
      '<div class="kwpipe" id="' + id + '-p"></div><div class="kwinfo small" id="' + id + '-i" aria-live="polite"></div>';
    drawPipe(id);
  };
  function pipeOrder(S) { return S.fast ? ["lint", "build", "unit", "integ", "stage", "e2e", "prod"] : ["build", "stage", "e2e", "integ", "unit", "lint", "prod"]; }
  function drawPipe(id, upto, failAt) {
    var S = ST[id]; if (!el(id + "-b")) return;
    el(id + "-b").innerHTML = BUGS.map(function (x) { return '<span class="' + (S.bug === x[0] ? "on" : "") + '" data-act="kwpbug" data-id="' + id + '" data-k="' + x[0] + '" role="button" tabindex="0">' + x[1] + "</span>"; }).join("");
    var t = 0;
    el(id + "-p").innerHTML = pipeOrder(S).map(function (k, i) {
      t += STG[k][1]; var cls = upto === undefined || i > upto ? "" : k === failAt ? "bad" : "ok";
      return '<div class="kwps ' + cls + '"><b>' + STG[k][0] + "</b><small>" + STG[k][1] + " min · Σ " + t + "</small></div>";
    }).join('<span class="kwpa">›</span>');
  }
  H.kwpbug = function (d) { ST[d.id].bug = d.k; drawPipe(d.id); el(d.id + "-i").textContent = ""; };
  H.kwpord = function (d) { var S = ST[d.id]; S.fast = !S.fast; drawPipe(d.id); el(d.id + "-i").textContent = S.fast ? "Schnelle Prüfungen zuerst (fail fast)." : "Ungünstig: langsame Tests zuerst."; };
  H.kwpgo = function (d) {
    var S = ST[d.id], ord = pipeOrder(S), i = 0, t = 0, run = ++S.run;
    (function step() {
      if (S.run !== run || !el(d.id)) return;
      var k = ord[i]; t += STG[k][1];
      var fail = S.bug && k === S.bug;
      drawPipe(d.id, i, fail ? k : null);
      if (fail) { el(d.id + "-i").innerHTML = "❌ Gestoppt bei <b>" + STG[k][0] + "</b>. Feedback nach <b>" + t + " Minuten</b>." + (t > 10 ? " Zu spät: Wer schnelle Prüfungen zuerst laufen lässt, erfährt viele Fehler in wenigen Minuten." : " Schnelles Feedback: so soll es sein."); return; }
      if (++i < ord.length) setTimeout(step, 380); else el(d.id + "-i").innerHTML = "✅ Alles grün nach <b>" + t + " Minuten</b>. Dieses Artefakt ist auslieferbar." + (S.bug ? "" : "");
    })();
  };

  /* ---------- SLO- und Fehlerbudget-Rechner ---------- */
  W.slo = function (id) {
    ST[id] = { slo: 99.9, used: 0 };
    el(id).innerHTML = '<div class="kwsae">' + [99, 99.5, 99.9, 99.95, 99.99].map(function (v) { return '<button class="btn kwb" data-act="kwslo" data-id="' + id + '" data-k="' + v + '">' + String(v).replace(".", ",") + "</button>"; }).join("") + "</div>" +
      '<div class="kwbig" id="' + id + '-r"></div><svg class="kwsvg" id="' + id + '-g" viewBox="0 0 300 30"></svg>' +
      '<div class="kwrow">' + b("kwslo5", "+ Störung 5 min", id) + b("kwslo30", "+ Störung 30 min", id) + b("kwslor", "Neu", id) + '</div><div class="kwinfo small" id="' + id + '-i"></div>';
    drawSlo(id);
  };
  function drawSlo(id) {
    var S = ST[id], budget = 43200 * (100 - S.slo) / 100, left = budget - S.used, f = Math.max(0, Math.min(1, S.used / budget));
    [].forEach.call(el(id).querySelectorAll(".kwsae button"), function (x) { x.classList.toggle("primary", +x.dataset.k === S.slo); });
    el(id + "-r").innerHTML = fmt(budget, budget < 10 ? 2 : 1) + ' min<span class="small mute"> Fehlerbudget pro 30 Tage bei ' + String(S.slo).replace(".", ",") + " %</span>";
    el(id + "-g").innerHTML = '<rect x="0" y="6" width="300" height="18" rx="9" class="kwtrack"/><rect x="0" y="6" width="' + (f * 300).toFixed(1) + '" height="18" rx="9" class="' + (f >= 1 ? "kwlow" : f > 0.7 ? "kwmid" : "kwgood") + '"/>';
    el(id + "-i").innerHTML = "Verbraucht <b>" + fmt(S.used) + " min</b> · " + (left < 0 ? "überzogen um <b>" + fmt(-left, 1) : "übrig <b>" + fmt(left, 1)) + " min</b><br>" +
      (left < 0 ? "Budget überzogen: Jetzt hat Stabilität Vorrang, riskante Releases warten." : f > 0.7 ? "Budget wird knapp: vorsichtiger ausliefern." : "Genug Budget: Das Team darf Neues ausprobieren.");
  }
  H.kwslo = function (d) { ST[d.id].slo = +d.k; drawSlo(d.id); };
  H.kwslo5 = function (d) { ST[d.id].used += 5; drawSlo(d.id); }; H.kwslo30 = function (d) { ST[d.id].used += 30; drawSlo(d.id); };
  H.kwslor = function (d) { ST[d.id].used = 0; drawSlo(d.id); };
})();
