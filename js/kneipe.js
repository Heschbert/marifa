/* Kneipe: Pub-Quiz und Trinkspiele im Irish-Pub-Stil. Eigenständiger Baustein:
   Wo der Einstieg erscheint, steuern PLACE und ORDER (z. B. "home", "profile"). Daten: data/kneipe.json
   (erzeugt mit tools/kneipe-daten.py). Alle Spiele laufen auf einem Handy, das man herumreicht. */
(function () {
  "use strict";
  var WF = window.WF, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn;
  var PLACE = "profile", ORDER = 30;
  var K = null; /* geladene Daten */
  function load(f) {
    if (K) return f();
    fetch("data/kneipe.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (j) { K = j; f(); })
      .catch(function () { ui.toast({ title: "Kneipe konnte nicht geladen werden" }); });
  }
  function show(h) { ui.show('<div class="pubwrap">' + h + "</div>", null, "pub"); }
  function back(act, label) { return '<button class="ghost pubback" data-act="' + (act || "pub") + '">‹ ' + esc(label || "Kneipe") + "</button>"; }
  function rnd(n) { return Math.floor(Math.random() * n); }

  /* ---------- Eingang ---------- */
  function hub() {
    ui.setView(function () { load(hub); });
    var h = '<button class="ghost pubback" data-act="profile">‹ Profil</button><div class="pubsign"><span>☘</span><h1>Kneipe</h1><p>Pub-Quiz &amp; Spiele für die Runde</p></div>';
    h += '<div class="pubtiles">' + tile("pq", "?", "Pub-Quiz", "Teams, Runden, Auflösung wie im Pub") + tile("mx", "⚂", "Mäxchen", "Würfeln, bluffen, anzweifeln") +
      tile("bf", "♠", "Busfahrer", "Rot oder schwarz, höher oder tiefer") + tile("kg", "♛", "König", "Karte ziehen, Regel befolgen") + tile("nie", "✋", "Ich hab noch nie & Co.", "Ich hab noch nie, Wer würde eher, Wahrheit oder Pflicht") + "</div>";
    h += '<p class="pubnote">Ab 18. Trinkt verantwortungsvoll. Ein „Schluck“ geht auch mit Wasser oder Limo, und Nein sagen ist immer okay.</p>';
    show(h);
  }
  function tile(act, ico, t, sub) { return '<button class="pubtile" data-act="' + act + '"><span class="pubico">' + ico + '</span><b>' + esc(t) + '</b><span>' + esc(sub) + "</span></button>"; }
  H.pub = function () { load(hub); };
  WF.registerEntry({ where: PLACE, order: ORDER, render: function () {
    return '<h2>Kneipe</h2><button class="pubentry" data-act="pub"><span>☘</span><div><b>Kneipe</b><small>Pub-Quiz, Mäxchen, Busfahrer, König, Ich hab noch nie</small></div><i>›</i></button>';
  } });

  /* ---------- Pub-Quiz ---------- */
  var Q = null;
  function pqSetup() {
    ui.setView(pqSetup);
    var s = WF.store.data.settings.pub || (WF.store.data.settings.pub = { teams: ["Team 1", "Team 2"], rounds: 3 });
    var h = back() + '<h1 class="pubh">Pub-Quiz</h1><p class="pubp">Eine Person ist Quizmaster und liest vor. Jede Runde hat ein Thema mit 6 Fragen. Nach jeder Runde gibt es die Auflösung, dann trägt der Quizmaster die Punkte ein. Allein spielen: nur ein Team, dann tippst du selbst.</p>';
    h += '<div class="pubcard"><b>Teams</b>';
    s.teams.forEach(function (t, i) { h += '<div class="pqteam"><input class="pubin" data-input="pqname" data-i="' + i + '" value="' + esc(t) + '" maxlength="18">' + (s.teams.length > 1 ? '<button class="pubx" data-act="pqdel" data-i="' + i + '" aria-label="Team entfernen">✕</button>' : "") + "</div>"; });
    if (s.teams.length < 6) h += '<button class="publink" data-act="pqadd">+ Team hinzufügen</button>';
    h += '</div><div class="pubcard"><b>Runden</b><div class="pubseg">';
    [2, 3, 4, 6].forEach(function (n) { h += '<button class="' + (s.rounds === n ? "on" : "") + '" data-act="pqrounds" data-n="' + n + '">' + n + "</button>"; });
    h += "</div></div>" + '<button class="pubbtn" data-act="pqstart">Quiz starten</button>';
    show(h);
  }
  H.pq = function () { load(pqSetup); };
  H.pqname = function (el) { WF.store.data.settings.pub.teams[+el.dataset.i] = el.value.slice(0, 18); WF.store.save(); };
  H.pqadd = function () { var t = WF.store.data.settings.pub.teams; t.push("Team " + (t.length + 1)); WF.store.save(); pqSetup(); };
  H.pqdel = function (d) { WF.store.data.settings.pub.teams.splice(+d.i, 1); WF.store.save(); pqSetup(); };
  H.pqrounds = function (d) { WF.store.data.settings.pub.rounds = +d.n; WF.store.save(); pqSetup(); };
  H.pqstart = function () {
    var s = WF.store.data.settings.pub, themes = U.shuffle(K.quiz.slice()).slice(0, s.rounds);
    Q = { teams: s.teams.map(function (t) { return { n: t || "Team", p: 0 }; }), solo: s.teams.length === 1, r: 0, i: 0, picked: null,
      rounds: themes.map(function (t) { return { t: t.t, qs: U.shuffle(t.qs.slice()).slice(0, 6).map(function (q) { var o = q.o.map(function (x, k) { return { t: x, ok: k === 0 }; }); return { q: q.q, o: U.shuffle(o) }; }) }; }) };
    pqIntro();
  };
  function pqIntro() {
    var R = Q.rounds[Q.r];
    show('<div class="pqround"><span>Runde ' + (Q.r + 1) + " von " + Q.rounds.length + '</span><h1 class="pubh">' + esc(R.t) + "</h1><p>6 Fragen</p></div>" + '<button class="pubbtn" data-act="pqq">Los geht’s</button>');
  }
  H.pqq = function () { Q.picked = null; pqQ(); };
  function pqQ() {
    var R = Q.rounds[Q.r], x = R.qs[Q.i];
    var h = '<div class="pqtop"><button class="ghost pubback" data-act="pqend">✕ Beenden</button><span>' + esc(R.t) + " · " + (Q.i + 1) + "/6</span></div>";
    h += '<p class="pubq">' + esc(x.q) + '</p><div class="pqopts">';
    x.o.forEach(function (o, k) {
      var cls = Q.solo && Q.picked !== null ? (o.ok ? " ok" : k === Q.picked ? " bad" : " dim") : "";
      h += '<button class="pqopt' + cls + '" data-act="pqpick" data-k="' + k + '"' + (Q.solo ? "" : " disabled") + "><b>" + "ABCD"[k] + "</b>" + esc(o.t) + "</button>";
    });
    h += "</div>";
    if (!Q.solo || Q.picked !== null) h += '<button class="pubbtn" data-act="pqnext">' + (Q.i < 5 ? "Nächste Frage" : "Zur Auflösung") + "</button>";
    show(h);
  }
  H.pqpick = function (d) { if (!Q.solo || Q.picked !== null) return; Q.picked = +d.k; if (Q.rounds[Q.r].qs[Q.i].o[Q.picked].ok) Q.teams[0].p++; pqQ(); };
  H.pqnext = function () { Q.picked = null; if (Q.i < 5) { Q.i++; pqQ(); } else pqReveal(); };
  function pqReveal() {
    var R = Q.rounds[Q.r];
    var h = '<h1 class="pubh">Auflösung</h1><p class="pubp">' + esc(R.t) + '</p><ol class="pqans">';
    R.qs.forEach(function (x) { h += "<li><span>" + esc(x.q) + "</span><b>" + esc(x.o.filter(function (o) { return o.ok; })[0].t) + "</b></li>"; });
    h += "</ol>";
    if (Q.solo) h += '<div class="pubcard center"><b>' + Q.teams[0].p + " Punkte</b></div>";
    else {
      Q.add = Q.teams.map(function () { return 0; });
      h += '<div class="pubcard"><b>Richtige Antworten dieser Runde</b><div id="pqsc">' + scoreRows() + "</div></div>";
    }
    h += '<button class="pubbtn" data-act="pqtable">Zwischenstand</button>';
    show(h);
  }
  function scoreRows() {
    return Q.teams.map(function (t, i) { return '<div class="pqrow"><span>' + esc(t.n) + '</span><button class="pubx" data-act="pqm" data-i="' + i + '">−</button><b>' + Q.add[i] + '</b><button class="pubx" data-act="pqp" data-i="' + i + '">+</button></div>'; }).join("");
  }
  H.pqp = function (d) { if (Q.add[+d.i] < 6) Q.add[+d.i]++; document.getElementById("pqsc").innerHTML = scoreRows(); };
  H.pqm = function (d) { if (Q.add[+d.i] > 0) Q.add[+d.i]--; document.getElementById("pqsc").innerHTML = scoreRows(); };
  H.pqtable = function () {
    if (!Q.solo && Q.add) { Q.teams.forEach(function (t, i) { t.p += Q.add[i]; }); Q.add = null; }
    var last = Q.r >= Q.rounds.length - 1, max = (Q.r + 1) * 6, sorted = Q.teams.slice().sort(function (a, b) { return b.p - a.p; });
    var h = '<h1 class="pubh">' + (last ? "Endstand" : "Zwischenstand") + '</h1><div class="pints">';
    sorted.forEach(function (t, i) { h += '<div class="pint"><div class="glass"><i style="--f:' + Math.round(t.p / max * 100) + '%"></i></div><b>' + t.p + "</b><span>" + (i === 0 ? "🏆 " : "") + esc(t.n) + "</span></div>"; });
    h += "</div>" + '<button class="pubbtn" data-act="' + (last ? "pq" : "pqnr") + '">' + (last ? "Neues Quiz" : "Nächste Runde") + "</button>" + (last ? '<button class="publink" data-act="pub">Zurück zur Kneipe</button>' : "");
    show(h);
    if (last) WF.emit("celebrate", { icon: "🏆", kind: "record", title: sorted[0].n, sub: "gewinnt das Pub-Quiz mit " + sorted[0].p + " Punkten" });
  };
  H.pqnr = function () { Q.r++; Q.i = 0; pqIntro(); };
  H.pqend = function () { load(hub); };

  /* ---------- Würfel (Mäxchen) ---------- */
  function die(n) {
    var P = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] }, h = '<span class="die">';
    for (var i = 1; i <= 9; i++) h += "<i" + (P[n].indexOf(i) >= 0 ? ' class="p"' : "") + "></i>";
    return h + "</span>";
  }
  /* Rangfolge: 21 (Mäxchen) > Paschs 66 … 11 > Rest von 65 abwärts bis 31 */
  function rank(a, b) { var hi = Math.max(a, b), lo = Math.min(a, b); return hi === 2 && lo === 1 ? 1000 : hi === lo ? 500 + hi : hi * 10 + lo; }
  function name(v) { return v === 1000 ? "Mäxchen (21)" : v > 500 ? "Pasch " + (v - 500) + (v - 500) : String(v); }
  var ALL = (function () { var o = [], seen = {}; for (var a = 1; a <= 6; a++) for (var b = 1; b <= 6; b++) { var v = rank(a, b); if (!seen[v]) { seen[v] = 1; o.push(v); } } return o.sort(function (x, y) { return x - y; }); })();
  var M = null;
  function mx(h) { show(back() + '<h1 class="pubh">Mäxchen</h1>' + h); }
  H.mx = function () { M = { claim: 0, roll: null, peek: false }; mxTurn(); };
  function mxTurn() {
    mx('<p class="pubp">' + (M.claim ? "Letzte Ansage: <b>" + esc(name(M.claim)) + "</b>. Du musst höher ansagen." : "Neue Runde. Würfle verdeckt, schau heimlich nach und sag an. Lügen erlaubt.") + "</p>" +
      '<div class="cup"><div class="cupbody">☘</div></div><button class="pubbtn" data-act="mxroll">Würfeln</button>' + rules("Rangfolge: Mäxchen (2 und 1) ist am höchsten, dann Paschs (66 bis 11), dann die übrigen Würfe, die höhere Zahl vorn (65 bis 31). Wer beim Aufdecken verliert, trinkt einen Schluck, bei Mäxchen zwei."));
  }
  function rules(t) { return '<details class="pubrules"><summary>Regeln</summary><p>' + esc(t) + "</p></details>"; }
  H.mxroll = function () {
    M.roll = [1 + rnd(6), 1 + rnd(6)]; M.peek = false;
    mx('<div class="cup shake"><div class="cupbody">☘</div></div><p class="pubp center">Der Becher wird geschüttelt …</p>');
    setTimeout(mxHidden, ui.reduced() ? 50 : 900);
  };
  function mxHidden() {
    var v = rank(M.roll[0], M.roll[1]);
    var h = '<div class="dice' + (M.peek ? "" : " hidden") + '">' + die(M.roll[0]) + die(M.roll[1]) + "</div>";
    h += '<button class="publink" data-act="mxpeek">' + (M.peek ? "Becher wieder zu" : "Heimlich ansehen") + "</button>";
    if (M.peek && v === 1000) h += '<p class="pubp center"><b>Mäxchen!</b> Ansagen, und die nächste Person muss es glauben oder aufdecken.</p>';
    h += '<div class="pubcard"><b>Ansage</b><div class="mxclaims">';
    ALL.filter(function (x) { return x > M.claim; }).forEach(function (x) { h += '<button data-act="mxsay" data-v="' + x + '">' + esc(name(x)) + "</button>"; });
    h += "</div></div>";
    mx(h);
  }
  H.mxpeek = function () { M.peek = !M.peek; mxHidden(); };
  H.mxsay = function (d) {
    M.claim = +d.v;
    mx('<p class="pubp center">Becher weitergeben.</p><div class="pubcard center"><span class="mute">Angesagt</span><div class="mxbig">' + esc(name(M.claim)) + "</div></div>" +
      '<p class="pubp center">Nächste Person: glauben und selbst höher würfeln, oder aufdecken?</p><div class="pubgrid"><button class="pubbtn alt" data-act="mxshow">Aufdecken!</button><button class="pubbtn" data-act="mxbelieve">Glauben</button></div>');
  };
  H.mxbelieve = function () { if (M.claim === 1000) { mxResult(true, "Mäxchen geglaubt: zwei Schlucke für dich, dann neue Runde."); return; } M.roll = null; mxTurn(); };
  H.mxshow = function () {
    var real = rank(M.roll[0], M.roll[1]), honest = real >= M.claim, sips = M.claim === 1000 ? 2 : 1;
    mxResult(false, (honest ? "Stimmt! Wer aufgedeckt hat, trinkt " : "Gelogen! Wer angesagt hat, trinkt ") + sips + (sips > 1 ? " Schlucke." : " Schluck."));
  };
  function mxResult(believed, msg) {
    var h = '<div class="dice">' + die(M.roll[0]) + die(M.roll[1]) + "</div>" + '<div class="pubcard center"><span class="mute">Gewürfelt: ' + esc(name(rank(M.roll[0], M.roll[1]))) + " · Angesagt: " + esc(name(M.claim)) + '</span><div class="mxbig">' + esc(msg) + "</div></div>" + '<button class="pubbtn" data-act="mx">Neue Runde</button>';
    M.claim = 0; mx(h);
  }

  /* ---------- Karten ---------- */
  var SUITS = [["♥", "r"], ["♦", "r"], ["♣", "b"], ["♠", "b"]], RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "B", "D", "K", "A"];
  function deck() { var d = []; SUITS.forEach(function (s) { RANKS.forEach(function (r, i) { d.push({ r: r, v: i + 2, s: s[0], c: s[1] }); }); }); return U.shuffle(d); }
  function card(c, cls) { return c ? '<div class="pcard ' + c.c + (cls ? " " + cls : "") + '"><span>' + c.r + "<br>" + c.s + "</span><b>" + c.s + '</b><span class="br">' + c.r + "<br>" + c.s + "</span></div>" : '<div class="pcard back"></div>'; }

  /* Busfahrer: vier Stufen; ein Fehler heißt trinken und von vorn */
  var B = null;
  var BQ = [["Rot oder schwarz?", [["r", "Rot"], ["b", "Schwarz"]]], ["Höher oder tiefer als die erste Karte?", [["hi", "Höher"], ["lo", "Tiefer"]]],
    ["Zwischen den ersten beiden oder außerhalb?", [["in", "Zwischen"], ["out", "Außerhalb"]]], ["Welches Zeichen?", [["♥", "♥"], ["♦", "♦"], ["♣", "♣"], ["♠", "♠"]]]];
  H.bf = function () { B = { d: deck(), got: [], step: 0, sips: 0, msg: "" }; bfView(); };
  function bfView(flip) {
    var h = back() + '<h1 class="pubh">Busfahrer</h1><div class="bfrow">';
    for (var i = 0; i < 4; i++) h += B.got[i] ? card(B.got[i], i === B.got.length - 1 && flip ? "flip" : "") : '<div class="pcard back' + (i === B.step ? " next" : "") + '"></div>';
    h += "</div>";
    if (B.msg) h += '<div class="pubcard center bfmsg ' + (B.ok ? "ok" : "bad") + '">' + esc(B.msg) + "</div>";
    if (B.step >= 4) h += '<div class="pubcard center"><div class="mxbig">Angekommen! 🚌</div><span class="mute">Insgesamt ' + B.sips + " Schlucke unterwegs.</span></div>" + '<button class="pubbtn" data-act="bf">Neue Fahrt</button>';
    else if (B.wait) h += '<button class="pubbtn" data-act="bfgo">' + (B.ok ? "Weiter" : "Von vorn") + "</button>";
    else { var q = BQ[B.step]; h += '<p class="pubp center"><b>Stufe ' + (B.step + 1) + ":</b> " + q[0] + '</p><div class="pubgrid' + (q[1].length > 2 ? " four" : "") + '">'; q[1].forEach(function (o) { h += '<button class="pubbtn alt" data-act="bfg" data-v="' + o[0] + '">' + o[1] + "</button>"; }); h += "</div>"; }
    h += rules("Vier Karten nacheinander richtig erraten. Gleiche Werte zählen als falsch. Jeder Fehler: so viele Schlucke wie die Stufe, dann von vorn mit neuen Karten.");
    show(h);
  }
  H.bfg = function (d) {
    if (B.d.length < 4) B.d = deck();
    var c = B.d.pop(), g = B.got, v = d.v, ok;
    if (B.step === 0) ok = c.c === v;
    else if (B.step === 1) ok = v === "hi" ? c.v > g[0].v : c.v < g[0].v;
    else if (B.step === 2) { var lo = Math.min(g[0].v, g[1].v), hi = Math.max(g[0].v, g[1].v); ok = v === "in" ? c.v > lo && c.v < hi : c.v < lo || c.v > hi; }
    else ok = c.s === v;
    g.push(c); B.ok = ok; B.wait = true;
    if (ok) B.msg = "Richtig!"; else { B.sips += B.step + 1; B.msg = "Daneben: " + (B.step + 1) + (B.step ? " Schlucke" : " Schluck") + ", dann von vorn."; }
    bfView(true);
  };
  H.bfgo = function () { B.wait = false; B.msg = ""; if (B.ok) B.step++; else { B.got = []; B.step = 0; } bfView(); };

  /* König: Karte ziehen, Regel anzeigen; der vierte König trinkt den Königsbecher */
  var G = null;
  H.kg = function () { G = { d: deck(), cur: null, kings: 0 }; kgView(); };
  function kgView(flip) {
    var rule = G.cur ? K.koenig.filter(function (r) { return r[0] === G.cur.r; })[0] : null;
    var h = back() + '<h1 class="pubh">König</h1><p class="pubp center">' + G.d.length + " Karten übrig · Könige: " + G.kings + " von 4</p>";
    h += '<div class="kgtable"><button class="kgdeck" data-act="kgdraw"' + (G.d.length ? "" : " disabled") + ' aria-label="Karte ziehen"><div class="pcard back"></div><div class="pcard back"></div><div class="pcard back"></div></button>' + (G.cur ? card(G.cur, flip ? "flip" : "") : "") + "</div>";
    if (rule) h += '<div class="pubcard center kgrule"><div class="mxbig">' + esc(rule[1]) + "</div><p>" + esc(G.cur.r === "K" && G.kings === 4 ? "Der vierte König! Du trinkst den Königsbecher. Spiel vorbei." : rule[2]) + "</p></div>";
    else h += '<p class="pubp center">Tippe auf den Stapel, um eine Karte zu ziehen.</p>';
    if (!G.d.length || G.kings === 4) h += '<button class="pubbtn" data-act="kg">Neues Spiel</button>';
    h += '<details class="pubrules"><summary>Alle Regeln</summary><ul>' + K.koenig.map(function (r) { return "<li><b>" + r[0] + " · " + esc(r[1]) + ":</b> " + esc(r[2]) + "</li>"; }).join("") + "</ul></details>";
    show(h);
  }
  H.kgdraw = function () { if (!G.d.length || G.kings === 4) return; G.cur = G.d.pop(); if (G.cur.r === "K") G.kings++; kgView(true); };

  /* Ich hab noch nie & Co.: Kartenstapel mit drei Varianten */
  var N = null;
  var NT = [["nie", "Ich hab noch nie"], ["eher", "Wer würde eher"], ["wp", "Wahrheit oder Pflicht"]];
  H.nie = function () { N = N || { t: "nie", bag: {}, cur: "" }; nieDraw(); };
  function pull(key) { var bag = N.bag[key]; if (!bag || !bag.length) bag = N.bag[key] = U.shuffle(K[key].slice()); return bag.pop(); }
  function nieDraw() { N.cur = N.t === "wp" ? "" : pull(N.t); nieView(true); }
  function nieView(anim) {
    var h = back() + '<h1 class="pubh">Ich hab noch nie &amp; Co.</h1><div class="pubseg">';
    NT.forEach(function (t) { h += '<button class="' + (N.t === t[0] ? "on" : "") + '" data-act="niet" data-t="' + t[0] + '">' + t[1] + "</button>"; });
    h += "</div>";
    var hint = { nie: "Wer es schon mal gemacht hat, trinkt.", eher: "Auf drei zeigen alle auf eine Person. Wer die meisten Finger abbekommt, trinkt.", wp: "Wähle Wahrheit oder Pflicht. Wer kneift, trinkt zwei." }[N.t];
    if (N.t === "wp" && !N.cur) h += '<div class="niecard"><p>Wahrheit oder Pflicht?</p></div><div class="pubgrid"><button class="pubbtn alt" data-act="niew">Wahrheit</button><button class="pubbtn" data-act="niep">Pflicht</button></div>';
    else h += '<div class="niecard' + (anim && !ui.reduced() ? " in" : "") + '"><p>' + esc(N.cur) + '</p></div><button class="pubbtn" data-act="ninext">Nächste Karte</button>';
    h += '<p class="pubnote">' + esc(hint) + "</p>";
    show(h);
  }
  H.niet = function (d) { N.t = d.t; nieDraw(); };
  H.ninext = function () { nieDraw(); };
  H.niew = function () { N.cur = pull("wahrheit"); nieView(true); };
  H.niep = function () { N.cur = pull("pflicht"); nieView(true); };
})();
