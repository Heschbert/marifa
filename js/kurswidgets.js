/* Interaktive Elemente für Kurslektionen (Animationen und Simulationen).
   In einer Lektion: "figs": [{ "after": <Absatz>, "w": "<name>", "cap": "<Bildunterschrift>" }].
   Vorhanden: coin, birthday, tree2, dice, bayes, monty, galton, normal, pi.
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
  KW.mount = function () { [].forEach.call(document.querySelectorAll(".kw[data-w]"), function (e) { if (W[e.dataset.w]) W[e.dataset.w](e.id); }); };
  var W = {};

  /* ---------- Münzwurf: Gesetz der großen Zahlen ---------- */
  W.coin = function (id) {
    ST[id] = { n: 0, k: 0, hist: [] };
    el(id).innerHTML = '<div class="kwstat" id="' + id + '-s"></div><svg class="kwsvg" id="' + id + '-g" viewBox="0 0 300 140" preserveAspectRatio="none"></svg>' +
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
})();
