/* Karte: Länder, Hauptstädte, Flüsse und Gebirge lernen und abfragen, je Kontinent.
   Zwei Wege:
   - Lernen: Der Kontinent wird in kleine, räumlich zusammenhängende Teile zerlegt (je bis zu 7 Orte).
     Jeder Teil: erst ansehen (alles beschriftet), dann üben, bis alles einmal richtig war. Fortschritt bleibt gespeichert,
     ein Ort gilt als „sicher“, wenn er in zwei Übungen beim ersten Versuch richtig war.
   - Quiz: 10 zufällige Fragen aus dem gewählten Gebiet.
   Tipps: 1. ein Kreis um den Bereich, 2. Nachbarländer bzw. „fließt durch …“. Jeder Tipp kostet XP.
   Daten: data/karte.json (Natural Earth, erzeugt mit tools/karte-bau.mjs). */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, D = WF.data, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn;
  function S() { return WF.store.data; }
  var MAP = null, G = null, NAMES = null;
  var KINDS = [["land", "Länder"], ["cap", "Hauptstädte"], ["river", "Flüsse"], ["mt", "Gebirge"]];
  var PACK = 7;
  function cfg() { var s = S().settings; s.map = s.map || {}; var m = s.map; m.k = m.k || "land"; m.r = m.r || "Europa"; m.mode = m.mode || "learn"; return m; }
  function prog() { return S().mapL || (S().mapL = {}); }
  function load() {
    if (MAP) return Promise.resolve(MAP);
    return fetch("data/karte.json").then(function (r) { if (!r.ok) throw new Error("karte.json " + r.status); return r.json(); }).then(function (j) { MAP = j; return j; });
  }
  var EXTRA = { EH: "Westsahara", PS: "Palästinensische Gebiete", TW: "Taiwan", XK: "Kosovo", GL: "Grönland", PR: "Puerto Rico", FK: "Falklandinseln", NC: "Neukaledonien",
    TF: "Französische Süd- und Antarktisgebiete", AQ: "Antarktis", SJ: "Spitzbergen" };
  function nameOf(a2) { if (!NAMES) { NAMES = {}; Object.keys(WF.countryISO).forEach(function (n) { NAMES[WF.countryISO[n]] = n; }); } return NAMES[a2] || EXTRA[a2] || ""; }
  function regionNames() { var geo = D.raw.geo || D.raw.flags || {}; return Object.keys(geo).filter(function (r) { return r !== "Deutschland" && geo[r].caps; }); }
  function kindName(k) { return KINDS.filter(function (x) { return x[0] === k; })[0][1]; }

  /* ---------- Orte einer Auswahl ---------- */
  function items(k, region) {
    var out = [];
    if (k === "land") {
      var geo = D.raw.geo || D.raw.flags || {}, iso = WF.countryISO;
      regionNames().forEach(function (r) {
        if (region !== "Welt" && r !== region) return;
        geo[r].caps.split(";").forEach(function (x) {
          var n = x.split("|")[0], c = iso[n], m = c && MAP.c[c]; if (!m) return;
          var b = m.b; if ((b[2] - b[0]) * (b[3] - b[1]) < 2 || b[2] - b[0] > MAP.w / 2) return; /* winzig oder über die Datumsgrenze */
          out.push({ k: k, id: c, n: n, r: r, b: b, a: c });
        });
      });
    } else if (k === "cap") {
      MAP.caps.forEach(function (x) { if (region === "Welt" || x.r === region) out.push({ k: k, id: x.a, n: x.n, land: x.l, a: x.a, r: x.r, x: x.x, y: x.y, b: [x.x, x.y, x.x, x.y] }); });
    } else {
      (k === "river" ? MAP.rv : MAP.mt).forEach(function (x) { if (region === "Welt" || x.r.indexOf(region) >= 0) out.push({ k: k, id: x.n, n: x.n, r: region === "Welt" ? x.r[0] : region, b: x.b, l: x.l || [] }); });
    }
    return out;
  }
  function center(it) { return [(it.b[0] + it.b[2]) / 2, (it.b[1] + it.b[3]) / 2]; }
  /* Räumliche Teile: Fläche so lange entlang der längeren Seite teilen, bis höchstens PACK Orte übrig sind */
  function split(list) {
    if (list.length <= PACK) return [list];
    var xs = list.map(function (i) { return center(i)[0]; }), ys = list.map(function (i) { return center(i)[1]; });
    var wide = Math.max.apply(null, xs) - Math.min.apply(null, xs) >= (Math.max.apply(null, ys) - Math.min.apply(null, ys)) * 1.2;
    var s = list.slice().sort(function (a, b) { return wide ? center(a)[0] - center(b)[0] : center(a)[1] - center(b)[1]; });
    var parts = Math.ceil(list.length / PACK), cut = Math.round(s.length * Math.floor(parts / 2) / parts) || Math.ceil(s.length / 2);
    return split(s.slice(0, cut)).concat(split(s.slice(cut)));
  }
  function packs(k, region) {
    /* Nach Fläche, Länge bzw. Bekanntheit sortiert bleibt der Zuschnitt stabil; jeder Teil wird von Nordwest nach Südost sortiert */
    return split(items(k, region).sort(function (a, b) { return a.id < b.id ? -1 : 1; })).map(function (p) {
      return p.sort(function (a, b) { return center(a)[1] - center(b)[1] || center(a)[0] - center(b)[0]; });
    });
  }
  function key(it) { return it.k + "|" + it.id; }
  function level(it) { return prog()[key(it)] || 0; }
  function sure(it) { return level(it) >= 2; }
  function learned(it) { return level(it) >= 1; }
  /* Ein Teil gilt als geschafft, wenn jeder Ort einmal beim ersten Versuch richtig war; „sicher“ erst nach zweimal */
  function packDone(p) { return p.every(learned); }
  /* Nächster offener Teil nach „from“ (vorwärts, dann von vorn); sind alle geschafft, der nächste noch nicht sichere */
  function nextPack(P, from) {
    var n = P.length, i, j;
    for (i = 1; i <= n; i++) { j = (from + i + n) % n; if (from < 0) j = i - 1; if (!packDone(P[j])) return j; }
    for (i = 1; i <= n; i++) { j = (from + i + n) % n; if (from < 0) j = i - 1; if (j !== from && !P[j].every(sure)) return j; }
    return -1;
  }

  /* ---------- Ausschnitt ---------- */
  function ratio() { var w = Math.min(560, window.innerWidth) - 32, h = Math.min(window.innerHeight * 0.5, w * 1.15); return Math.max(0.7, Math.min(1.6, w / h)); }
  function fit(b, minW) {
    var rt = ratio(), bw = b[2] - b[0], bh = b[3] - b[1];
    var ww = Math.max(minW || 60, bw * 1.3, bh * 1.3 * rt), wh = ww / rt;
    var x = (b[0] + b[2]) / 2 - ww / 2, y = (b[1] + b[3]) / 2 - wh / 2;
    return [Math.max(-20, Math.min(MAP.w - ww + 20, x)), Math.max(-20, Math.min(MAP.h - wh + 20, y)), ww, wh];
  }
  /* Quiz: Fenster um den Ort, der Ort liegt zufällig im mittleren Bereich (verrät die Lage nicht) */
  function around(b, minW) {
    var rt = ratio(), cw = b[2] - b[0], ch = b[3] - b[1];
    var ww = Math.max(minW, cw * 1.6, ch * 1.6 * rt), wh = ww / rt;
    var x = b[0] - (ww - cw) * (0.25 + Math.random() * 0.5), y = b[1] - (wh - ch) * (0.25 + Math.random() * 0.5);
    return [Math.max(0, Math.min(MAP.w - ww, x)), Math.max(0, Math.min(MAP.h - wh, y)), ww, wh];
  }
  function hits(b, vb) { return b[2] > vb[0] && b[0] < vb[0] + vb[2] && b[3] > vb[1] && b[1] < vb[1] + vb[3]; }
  function bboxOf(list) { var b = [1e9, 1e9, -1e9, -1e9]; list.forEach(function (i) { b = [Math.min(b[0], i.b[0]), Math.min(b[1], i.b[1]), Math.max(b[2], i.b[2]), Math.max(b[3], i.b[3])]; }); return b; }

  /* ---------- Zeichnen ---------- */
  /* o: { vb, k, target, focus: {id:1} (gesuchte Region hell), show: {id:"ok"|"bad"|"lbl"}, tapLand, hint, tap:{x,y} } */
  function draw(o) {
    var vb = o.vb, fs = vb[2] / 19, h = '<svg class="kmap" id="kmap" viewBox="' + vb.map(function (v) { return v.toFixed(1); }).join(" ") + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Karte">';
    h += '<rect x="' + (vb[0] - 50) + '" y="' + (vb[1] - 50) + '" width="' + (vb[2] + 100) + '" height="' + (vb[3] + 100) + '" class="ksea"/>';
    var tint = {};
    if (o.hint >= 2 && o.target) (o.target.k === "land" ? (MAP.c[o.target.id].nb || []) : o.target.k === "cap" ? [o.target.a] : o.target.l || []).forEach(function (c) { tint[c] = 1; });
    Object.keys(MAP.c).forEach(function (c) {
      var m = MAP.c[c]; if (!hits(m.b, vb)) return;
      var cls = "kc" + (o.focus && o.focus[c] ? " foc" : "") + (tint[c] ? " tint" : "") + (o.show && o.show[c] ? " " + o.show[c] : "");
      h += '<path class="' + cls + '" d="' + m.d + '"' + (o.tapLand ? ' data-act="ktap" data-c="' + c + '"' : "") + "/>";
    });
    if (o.k === "mt") MAP.mt.forEach(function (m) {
      if (!hits(m.b, vb)) return;
      h += '<path class="kmt' + (o.show && o.show[m.n] ? " " + o.show[m.n] : "") + '" d="' + m.d + '"' + (o.tapFeat ? ' data-act="ktap" data-c="' + esc(m.n) + '"' : "") + "/>";
    });
    if (o.k === "river") MAP.rv.forEach(function (r) {
      if (!hits(r.b, vb)) return;
      h += '<path class="krv' + (o.show && o.show[r.n] ? " " + o.show[r.n] : "") + '" d="' + r.d + '"/>';
      if (o.tapFeat) h += '<path class="krvhit" d="' + r.d + '" data-act="ktap" data-c="' + esc(r.n) + '"/>';
    });
    if (o.k === "cap" && o.dots) o.dots.forEach(function (d) {
      h += '<circle class="kdot ' + (d.cls || "") + '" cx="' + d.x + '" cy="' + d.y + '" r="' + (vb[2] / 70).toFixed(2) + '"/>';
    });
    /* Tipp 1: Kreis um den Bereich, Mittelpunkt leicht versetzt */
    if (o.hint >= 1 && o.target && o.ring) h += '<circle class="khint" cx="' + o.ring[0].toFixed(1) + '" cy="' + o.ring[1].toFixed(1) + '" r="' + o.ring[2].toFixed(1) + '"/>';
    if (o.tap) h += '<line class="kline" x1="' + o.tap.x.toFixed(1) + '" y1="' + o.tap.y.toFixed(1) + '" x2="' + o.target.x + '" y2="' + o.target.y + '"/><circle class="kdot bad" cx="' + o.tap.x.toFixed(1) + '" cy="' + o.tap.y.toFixed(1) + '" r="' + (vb[2] / 70).toFixed(2) + '"/>';
    /* Beschriftungen */
    var placed = [];
    (o.labels || []).slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (l) {
      var f = fs * (l.s || 1), w = Math.max(2.4, String(l.t).length * 0.3) * f;
      var x = Math.max(vb[0] + w / 2 + 2, Math.min(vb[0] + vb[2] - w / 2 - 2, l.x)), y = Math.max(vb[1] + f * 0.8, Math.min(vb[1] + vb[3] - f * 0.6, l.y));
      for (var t = 0; t < 8; t++) {
        var clash = placed.filter(function (p) { return Math.abs(p.y - y) < (p.f + f) * 0.55 && Math.abs(p.x - x) < (p.w + w) / 2; })[0];
        if (!clash) break;
        y = clash.y + (clash.f + f) * 0.58;
      }
      placed.push({ x: x, y: y, w: w, f: f });
      h += '<text class="klabel ' + (l.cls || "") + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" font-size="' + (fs * (l.s || 1)).toFixed(1) + '" text-anchor="middle" dominant-baseline="middle">' + esc(l.t) + "</text>";
    });
    return h + "</svg>";
  }
  function labelFor(it, cls, s) {
    if (it.k === "cap") return { x: it.x, y: it.y - (G && G.vb ? G.vb[2] / 26 : 6), t: it.n, cls: cls, s: s };
    var c = center(it); return { x: c[0], y: c[1], t: it.k === "land" ? nameOf(it.id) : it.n, cls: cls, s: s };
  }
  function flag(a2) { return a2 ? '<img class="kflag" src="img/flags/' + a2.toLowerCase() + '.svg" alt="">' : ""; }
  function promptOf(it) {
    if (it.k === "land") return flag(it.a) + "<span>Wo liegt <b>" + esc(it.n) + "</b>?</span>";
    if (it.k === "cap") return flag(it.a) + "<span>Wo liegt <b>" + esc(it.n) + '</b>? <span class="mute">(' + esc(it.land) + ")</span></span>";
    if (it.k === "river") return "<span>Wo fließt der Fluss <b>" + esc(it.n) + "</b>?</span>";
    return "<span>Wo liegt das Gebirge <b>" + esc(it.n) + "</b>?</span>";
  }
  function howTo(k) { return k === "cap" ? "Tippe dorthin, wo die Stadt liegt." : k === "land" ? "Tippe auf das Land." : k === "river" ? "Tippe auf eine blaue Linie." : "Tippe auf eine braune Fläche."; }
  function hintText(it) {
    if (it.k === "land") { var nb = (MAP.c[it.id].nb || []).map(nameOf).filter(Boolean); return nb.length ? "Nachbarn: " + nb.join(", ") : "Ein Inselstaat ohne Landgrenzen."; }
    if (it.k === "cap") return "Die Stadt liegt in " + it.land + " (eingefärbt).";
    var l = (it.l || []).map(nameOf).filter(Boolean);
    return l.length ? (it.k === "river" ? "Fließt u. a. durch: " : "Liegt u. a. in: ") + l.join(", ") : "";
  }

  /* ---------- Auswahl (Startseite der Karte) ---------- */
  function setup() {
    ui.setView(setup);
    var c = cfg(), regs = regionNames().concat(["Welt"]);
    var h = '<button class="ghost" data-act="home">‹ Zurück</button><h1>Karte</h1>';
    h += '<div class="seg kmode" role="group" aria-label="Art">' + [["learn", "Lernen"], ["quiz", "Quiz"]].map(function (m) {
      return '<button class="' + (c.mode === m[0] ? "on" : "") + '" aria-pressed="' + (c.mode === m[0]) + '" data-act="kset" data-f="mode" data-v="' + m[0] + '">' + m[1] + "</button>";
    }).join("") + "</div>";
    h += '<p class="small mute" style="margin:8px 0 0">' + (c.mode === "learn" ? "Schritt für Schritt: Jeder Teil wird erst gezeigt, dann geübt, bis alles sitzt." : "10 zufällige Fragen. Tipps kosten XP.") + "</p>";
    h += '<div class="kpick">' + KINDS.map(function (k) { return '<button class="chipsel' + (c.k === k[0] ? " on" : "") + '" data-act="kset" data-f="k" data-v="' + k[0] + '">' + k[1] + "</button>"; }).join("") + "</div>";
    h += '<div class="kpick">' + regs.map(function (r) { return '<button class="chipsel sm' + (c.r === r ? " on" : "") + '" data-act="kset" data-f="r" data-v="' + esc(r) + '">' + esc(r) + "</button>"; }).join("") + "</div>";
    if (c.mode === "quiz") h += '<div style="margin-top:16px">' + btn("kquiz", "Quiz starten", { primary: true }) + "</div>";
    else {
      var P = packs(c.k, c.r), all = [].concat.apply([], P), ok = all.filter(sure).length, lr = all.filter(learned).length, pd = P.filter(packDone).length, next = nextPack(P, -1);
      h += '<div class="card kprog">' + ui.ring(all.length ? lr / all.length * 100 : 0, "var(--accent)", pd + "/" + P.length) + '<div class="grow"><b>' + esc(kindName(c.k)) + " · " + esc(c.r) + '</b><div class="small mute">' + pd + " von " + P.length + " Teilen geschafft · " + lr + " von " + all.length + " gelernt · " + ok + " sicher</div></div></div>";
      if (next >= 0) h += btn("kexp", (packDone(P[next]) ? "Festigen: Teil " : "Weiter mit Teil ") + (next + 1), { primary: true, data: { p: next } });
      else if (all.length) h += '<p class="small mute">Alles sicher. Stark! Teste dich im Quiz.</p>';
      h += '<div class="kparts">';
      P.forEach(function (p, i) {
        var s = p.filter(sure).length, l = p.filter(learned).length, done = l === p.length, all2 = s === p.length, names = p.map(function (x) { return x.n; });
        h += '<button class="item kpart' + (all2 ? " sure" : done ? " done" : "") + (i === next ? " next" : "") + '" data-act="kexp" data-p="' + i + '">' + ui.ring(l / p.length * 100, all2 ? "#f5b100" : "var(--accent)", all2 ? "★" : done ? "✓" : String(i + 1)) +
          '<div class="grow"><div class="t">Teil ' + (i + 1) + (all2 ? ' <span class="kbadge gold">sicher</span>' : done ? ' <span class="kbadge">geschafft</span>' : l ? ' <span class="kbadge soft">' + l + "/" + p.length + "</span>" : "") + (i === next ? ' <span class="kbadge next">als Nächstes</span>' : "") +
          '</div><div class="small mute">' + esc(names.slice(0, 4).join(", ") + (names.length > 4 ? " …" : "")) + '</div></div><span class="chev">›</span></button>';
      });
      h += "</div>";
    }
    ui.show(h, null);
  }
  H.kset = function (d) { cfg()[d.f] = d.v; WF.store.save(); setup(); };
  H.kstart = function () { ui.loading(); load().then(setup).catch(fail); };
  function fail(e) { console.error(e); ui.toast({ title: "Karte konnte nicht geladen werden" }); ui.go("home"); }

  /* ---------- Lernen: Teil ansehen ---------- */
  H.kexp = function (d) {
    var c = cfg(), P = packs(c.k, c.r), p = P[+d.p]; if (!p) return;
    var vb = fit(bboxOf(p), c.k === "cap" ? 90 : 70);
    G = { vb: vb };
    var focus = {}, show = {};
    p.forEach(function (it) { if (it.k !== "cap") show[it.id] = "lbl"; else focus[it.a] = 1; });
    var mapH = draw({ vb: vb, k: c.k, focus: focus, show: show, dots: c.k === "cap" ? p.map(function (it) { return { x: it.x, y: it.y, cls: "ok" }; }) : null,
      labels: p.map(function (it) { return labelFor(it, "ok", 0.78); }) });
    var list = p.map(function (it) { return '<li>' + flag(it.a) + "<b>" + esc(it.n) + "</b>" + (it.k === "cap" ? ' <span class="mute">' + esc(it.land) + "</span>" : "") + (sure(it) ? ' <span class="okc">✓</span>' : "") + "</li>"; }).join("");
    ui.show('<div class="topbar"><button class="ghost" data-act="kstart">‹ Teile</button><span class="chip">' + esc(kindName(c.k)) + " · Teil " + (+d.p + 1) + "</span></div>" +
      '<p class="kq">Schau dir die Lage an. Danach übst du.</p><div class="kwrap">' + mapH + '</div><ul class="klist">' + list + "</ul>" +
      '<div class="nextbar">' + btn("kprac", "Jetzt üben", { primary: true, data: { p: d.p } }) + "</div>", null);
  };

  /* ---------- Üben (Teil) und Quiz ---------- */
  H.kprac = function (d) {
    var c = cfg(), p = packs(c.k, c.r)[+d.p]; if (!p) return;
    G = { mode: "learn", pack: +d.p, k: c.k, queue: U.shuffle(p.slice()), first: {}, done: 0, total: p.length, score: 0, xp: 0, vb: fit(bboxOf(p), c.k === "cap" ? 90 : 70), pool: p };
    ask();
  };
  H.kquiz = function () {
    var c = cfg(), list = U.shuffle(items(c.k, c.r)).slice(0, 10);
    if (list.length < 3) { ui.toast({ title: "Zu wenig für diese Auswahl" }); return; }
    G = { mode: "quiz", k: c.k, queue: list, first: {}, done: 0, total: list.length, score: 0, xp: 0, log: [] };
    ask();
  };
  function head() {
    return '<div class="topbar"><button class="ghost" data-act="kquit">✕ Beenden</button><span class="chip">' + esc(kindName(G.k)) + (G.mode === "learn" ? " · Teil " + (G.pack + 1) : "") + '</span><span class="chip">' + Math.min(G.done + 1, G.total) + " / " + G.total + "</span></div>" + ui.bar(G.done / G.total * 100, "Fortschritt");
  }
  function cur() { return G.queue[0]; }
  function ask() {
    var it = cur(); if (!it) return end();
    G.it = it; G.q = { hint: 0, done: false };
    if (G.mode === "quiz") G.vb = around(it.b, it.k === "cap" ? (it.r === "Europa" ? 150 : 230) : it.k === "land" ? (it.r === "Europa" ? 170 : 250) : 140);
    /* Kreis für Tipp 1: Mittelpunkt bis zu einem halben Radius versetzt */
    var c = it.k === "cap" ? [it.x, it.y] : center(it), rad = Math.max((it.b[2] - it.b[0]), (it.b[3] - it.b[1]), G.vb[2] * 0.08) * 0.9 + G.vb[2] * 0.06, ang = Math.random() * Math.PI * 2;
    G.q.ring = [c[0] + Math.cos(ang) * rad * 0.45, c[1] + Math.sin(ang) * rad * 0.45, rad];
    render();
  }
  function focusOf(it) { var f = {}; if (it.k === "land" || it.k === "cap") { var reg = it.r; items("land", reg).forEach(function (x) { f[x.id] = 1; }); } return f; }
  function render(msg) {
    var it = G.it, q = G.q, show = {}, labels = [], dots = null;
    if (q.done) {
      if (it.k === "cap") { dots = [{ x: it.x, y: it.y, cls: "ok" }]; labels.push(labelFor(it, "ok")); }
      else { show[it.id] = "ok"; labels.push(labelFor(it, "ok")); if (q.wrong && q.wrong !== it.id) { show[q.wrong] = "bad"; var w = it.k === "land" ? { k: "land", id: q.wrong, b: MAP.c[q.wrong].b } : (it.k === "river" ? MAP.rv : MAP.mt).filter(function (x) { return x.n === q.wrong; }).map(function (x) { return { k: it.k, id: x.n, n: x.n, b: x.b }; })[0]; if (w) labels.push(labelFor(w, "bad")); } }
    }
    if (!q.done && q.hint >= 2 && it.k === "land") (MAP.c[it.id].nb || []).forEach(function (c) { var m = MAP.c[c]; if (m && hits(m.b, G.vb)) labels.push({ x: (m.b[0] + m.b[2]) / 2, y: (m.b[1] + m.b[3]) / 2, t: nameOf(c), cls: "nbl", s: 0.7 }); });
    var mapH = draw({ vb: G.vb, k: it.k, target: it, hint: q.done ? 0 : q.hint, ring: q.ring, focus: focusOf(it), show: show, labels: labels, dots: dots,
      tapLand: !q.done && it.k === "land", tapFeat: !q.done && (it.k === "river" || it.k === "mt"), tap: q.done && it.k === "cap" ? q.tap : null });
    var xp = G.mode === "quiz" ? [15, 10, 5][q.hint] : 10;
    var hintBox = !q.done && q.hint >= 2 ? '<p class="khinttxt">💡 ' + esc(hintText(it)) + "</p>" : !q.done && q.hint === 1 ? '<p class="khinttxt">💡 Es liegt im eingekreisten Bereich.</p>' : "";
    var foot = q.done ? (msg || "") + '<div class="nextbar">' + btn("knext", "Weiter", { primary: true }) + "</div>"
      : hintBox + '<div class="kfoot"><span class="small mute">' + howTo(it.k) + "</span>" + (q.hint < 2 ? '<button class="btn khbtn" data-act="khint">💡 Tipp' + (G.mode === "quiz" ? " (−5 XP)" : "") + "</button>" : "") + "</div>";
    ui.show(head() + '<p class="kq">' + promptOf(it) + '</p><div class="kwrap">' + mapH + "</div>" + foot, null);
    if (!q.done && it.k === "cap") {
      var el = document.getElementById("kmap");
      el.addEventListener("click", function (e) { var pt = el.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var p = pt.matrixTransform(el.getScreenCTM().inverse()); answer(null, p); });
    }
  }
  H.khint = function () { if (G && G.q && !G.q.done && G.q.hint < 2) { G.q.hint++; render(); } };
  H.ktap = function (d) { answer(d.c, null); };
  function answer(id, pt) {
    var it = G.it, q = G.q; if (!it || q.done) return;
    var ok;
    if (it.k === "cap") {
      var tol = G.vb[2] * 0.06;
      if (G.mode === "learn") G.pool.forEach(function (o) { if (o !== it) tol = Math.min(tol, Math.hypot(o.x - it.x, o.y - it.y) * 0.45); });
      ok = Math.hypot(pt.x - it.x, pt.y - it.y) <= Math.max(tol, G.vb[2] * 0.025); q.tap = pt;
    } else { ok = id === it.id; if (!ok) q.wrong = id; }
    q.done = true;
    var firstTry = !G.first[key(it)];
    G.first[key(it)] = 1;
    var gain = 0;
    if (ok) {
      G.queue.shift(); G.done++;
      if (firstTry && q.hint === 0) { G.score++; if (G.mode === "learn") prog()[key(it)] = Math.min(2, level(it) + 1); }
      gain = G.mode === "quiz" ? (firstTry ? [15, 10, 5][q.hint] : 0) : (firstTry ? (q.hint ? 5 : 10) : 0);
    } else {
      if (G.mode === "learn") { G.queue.push(G.queue.shift()); prog()[key(it)] = 0; }   /* kommt am Ende des Teils noch einmal */
      else { G.queue.shift(); G.done++; }
    }
    if (G.mode === "quiz") G.log.push({ n: it.n, ok: ok });
    if (gain) { G.xp += gain; E.addXP(gain); }
    WF.store.save();
    var what = it.k === "land" ? (nameOf(q.wrong) || "ein anderes Land") : q.wrong;
    var msg = ok ? '<div class="fb ok"><b class="h">Richtig' + (gain ? " · +" + gain + " XP" : "") + "</b></div>"
      : '<div class="fb bad"><b class="h">Nicht ganz</b><p>' + (it.k === "cap" ? "Dein Tipp ist rot, " + esc(it.n) + " liegt beim grünen Punkt." : "Du hast <b>" + esc(what || "") + "</b> getippt. " + esc(it.n) + " ist grün.") +
        (G.mode === "learn" ? " Kommt gleich noch einmal." : "") + "</p></div>";
    render(msg);
  }
  H.knext = function () { if (G.queue.length) ask(); else end(); };
  function end() {
    var c = cfg(), st = S();
    if (G.mode === "quiz") {
      var k = "map_" + G.k, best = st.best[k] || 0; if (G.score > best) st.best[k] = G.score; WF.store.save();
      ui.show("<h1>" + G.score + " von " + G.total + '</h1><p class="mute">' + esc(kindName(G.k)) + " · " + esc(c.r) + " · +" + G.xp + " XP · Rekord " + Math.max(best, G.score) + "</p>" +
        '<div class="card"><div class="kdots">' + G.log.map(function (o) { return '<span class="' + (o.ok ? "ok" : "bad") + '">' + esc(o.n) + "</span>"; }).join("") + "</div></div>" +
        btn("kquiz", "Nochmal", { primary: true }) + '<div style="height:8px"></div>' + btn("kstart", "Zur Auswahl"), null);
      return;
    }
    var P = packs(c.k, c.r), p = P[G.pack], s = p.filter(sure).length, nextI = nextPack(P, G.pack);
    if (s === p.length) WF.emit("celebrate", { icon: "🗺", kind: "course", title: "Teil " + (G.pack + 1) + " sitzt", sub: kindName(G.k) + " · " + c.r });
    ui.show("<h1>Teil " + (G.pack + 1) + ' geschafft</h1><p class="mute">' + G.score + " von " + G.total + " beim ersten Versuch · +" + G.xp + " XP</p>" +
      '<div class="card"><p style="margin:0">' + s + " von " + p.length + " Orten sind jetzt sicher" + (s < p.length ? ". Wer zweimal beim ersten Versuch richtig liegt, gilt als sicher: am besten morgen noch einmal üben." : ".") + "</p></div>" +
      (s < p.length ? btn("kprac", "Gleich nochmal üben", { primary: !packDone(p), data: { p: G.pack } }) + '<div style="height:8px"></div>' : "") +
      (nextI >= 0 ? btn("kexp", (packDone(P[nextI]) ? "Festigen: Teil " : "Weiter mit Teil ") + (nextI + 1), { primary: packDone(p), data: { p: nextI } }) + '<div style="height:8px"></div>' : "") + btn("kstart", "Zur Übersicht"), null);
  }
  H.kquit = function () { setup(); };
  WF.registerEntry({ where: "home", order: 37, render: function () { return ui.row("kstart", "🗺", "Karte", "Länder, Hauptstädte, Flüsse und Gebirge lernen", {}); } });
})();
