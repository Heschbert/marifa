/* Duell an einem Handy: 2 bis 4 Spieler, jeder antwortet geheim, danach gemeinsame Auflösung.
   Spielarten: Klassisch (1 Punkt je richtige Antwort) oder Mit Einsatz (1 bis 3 setzen: richtig +Einsatz, falsch −(Einsatz−1)).
   Optional: Schätzfragen (jede 4. Frage, wer am nächsten liegt bekommt 2 Punkte) und ein 50:50-Joker pro Spieler.
   Der Startspieler wechselt jede Frage, damit niemand immer zuerst oder zuletzt dran ist.
   Spielstand und Fragenfolge liegen im Zustand G; ein Netzwerk-Transport könnte denselben Ablauf nutzen. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn;
  function S() { return WF.store.data; }
  var G = null;
  var DEF = { n: 2, names: ["Spieler 1", "Spieler 2", "Spieler 3", "Spieler 4"], rounds: 10, mode: "classic", est: true, joker: true };

  function cfg() { var c = S().settings.duel || (S().settings.duel = JSON.parse(JSON.stringify(DEF))); for (var k in DEF) if (c[k] === undefined) c[k] = DEF[k]; return c; }
  function num(n) { return (n < 0 ? "−" : "") + Math.abs(n); }
  function pts(n) { return num(n) + (Math.abs(n) === 1 ? " Punkt" : " Punkte"); }
  function av(p, big) { return '<span class="av p' + p.c + (big ? " big" : "") + '" aria-hidden="true">' + esc((p.name.trim().charAt(0) || "?").toUpperCase()) + "</span>"; }
  function seg(label, act, cur, opts) {
    return '<div class="cfg"><label>' + label + '</label><div class="seg" role="group" aria-label="' + esc(label) + '" style="grid-template-columns:repeat(' + opts.length + ',1fr)">' +
      opts.map(function (o) { var on = String(cur) === String(o[0]); return '<button aria-pressed="' + on + '" class="' + (on ? "on" : "") + '" data-act="' + act + '" data-v="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div></div>";
  }

  /* ---------- Einstellungen ---------- */
  function readNames() {
    var c = cfg();
    for (var i = 0; i < 4; i++) { var el = document.getElementById("dn" + i); if (el) c.names[i] = el.value.trim() || "Spieler " + (i + 1); }
  }
  function setup() {
    ui.setView(function () { readNames(); setup(); });
    var c = cfg(), h = '<button class="ghost" data-act="home">‹ Zurück</button><h1>Duell</h1><p class="mute">Ein Handy, mehrere Spieler. Jeder antwortet geheim, dann wird gemeinsam aufgelöst.</p>';
    h += '<div class="card">' + seg("Spieler", "dnum", c.n, [[2, "2"], [3, "3"], [4, "4"]]);
    for (var i = 0; i < c.n; i++) h += '<div class="namerow">' + av({ c: i, name: c.names[i] }) + '<input id="dn' + i + '" class="inp" maxlength="14" aria-label="Name Spieler ' + (i + 1) + '" value="' + esc(c.names[i]) + '"></div>';
    h += "</div>";
    h += '<div class="card cfg">' + ui.rubrikSel() + ui.diffSeg().replace('class="cfg"', 'class="cfg" style="margin:0"') + "</div>";
    h += '<div class="card">' + seg("Fragen", "drounds", c.rounds, [[5, "5"], [10, "10"], [15, "15"]]) +
      seg("Spielart", "dmode", c.mode, [["classic", "Klassisch"], ["bet", "Mit Einsatz"]]) +
      '<p class="small mute" style="margin:-6px 0 12px">' + (c.mode === "bet" ? "Vor der Auflösung setzt jeder 1 bis 3 Punkte. Richtig: + Einsatz. Falsch: Einsatz 2 kostet 1 Punkt, Einsatz 3 kostet 2." : "Jede richtige Antwort bringt 1 Punkt.") + "</p>" +
      seg("Schätzfragen", "dest", c.est ? 1 : 0, [[1, "Einstreuen"], [0, "Ohne"]]) +
      seg("50:50-Joker", "djoker", c.joker ? 1 : 0, [[1, "Einer pro Spieler"], [0, "Ohne"]]) + "</div>";
    h += '<div style="margin-top:16px">' + btn("dstart", "Los geht’s", { primary: true }) + "</div>";
    ui.show(h, "home");
  }
  H.duel = setup;
  H.dnum = function (d) { readNames(); cfg().n = +d.v; WF.store.save(); setup(); };
  H.drounds = function (d) { readNames(); cfg().rounds = +d.v; WF.store.save(); setup(); };
  H.dmode = function (d) { readNames(); cfg().mode = d.v; WF.store.save(); setup(); };
  H.dest = function (d) { readNames(); cfg().est = d.v === "1"; WF.store.save(); setup(); };
  H.djoker = function (d) { readNames(); cfg().joker = d.v === "1"; WF.store.save(); setup(); };
  WF.registerEntry({ where: "home", order: 40, render: function () { return ui.row("duel", "2", "Duell", "2 bis 4 Spieler an einem Handy · mit Einsatz, Joker und Schätzfragen", {}); } });

  /* ---------- Spiel ---------- */
  H.dstart = function () {
    readNames(); WF.store.save();
    var c = cfg(), sc = ui.playC();
    var mc = E.order(E.pool({ c: sc }), !sc).slice(0, c.rounds).map(function (x) { return { t: "mc", x: E.prep(x) }; });
    var est = c.est && WF.est ? U.shuffle(WF.est.list(sc).length >= 3 ? WF.est.list(sc).slice() : WF.est.list(null).slice()) : [];
    var qs = [];
    for (var k = 0, m = 0, e = 0; k < c.rounds; k++) {
      if (c.est && (k + 1) % 4 === 0 && e < est.length) qs.push({ t: "est", x: est[e++] });
      else if (m < mc.length) qs.push(mc[m++]);
    }
    if (!qs.length) { ui.toast({ title: "Keine passenden Fragen" }); return; }
    G = { c: c, qs: qs, i: 0, turn: 0, picks: [], hist: [],
          pl: c.names.slice(0, c.n).map(function (n, i) { return { name: n, c: i, score: 0, right: 0, mcN: 0, streak: 0, best: 0, estPts: 0, joker: c.joker ? 1 : 0 }; }) };
    handover();
  };
  function order() { var n = G.pl.length, s = G.i % n, o = []; for (var k = 0; k < n; k++) o.push((s + k) % n); return o; }
  function cur() { return G.pl[order()[G.turn]]; }

  function scoreboard(delta) {
    /* Balken relativ zwischen niedrigstem (oder 0) und höchstem Stand, damit auch negative Stände sichtbar sind */
    var sc = G.pl.map(function (p) { return p.score; }), lo = Math.min.apply(null, sc.concat([0])), hi = Math.max.apply(null, sc.concat([lo + 1]));
    var ranked = G.pl.slice().sort(function (a, b) { return b.score - a.score; }), lead = ranked[0].score > (ranked[1] ? ranked[1].score : -1e9) ? ranked[0] : null;
    return '<div class="sboard">' + G.pl.map(function (p, i) {
      var d = delta ? delta[i] : null;
      return '<div class="sbrow">' + av(p) + '<div class="grow"><div class="row sb small"><b>' + esc(p.name) + (lead === p ? ' <span class="lead">führt</span>' : "") + "</b><span>" +
        (d ? '<span class="delta ' + (d > 0 ? "up" : "down") + '" title="diese Runde">' + (d > 0 ? "+" : "−") + Math.abs(d) + '<span class="sr-only"> in dieser Runde, Stand</span></span>'  : "") + "<b>" + pts(p.score) + '</b></span></div><div class="bar pbar p' + p.c + '" aria-hidden="true"><i style="width:' + Math.max(3, (p.score - lo) / (hi - lo) * 100) + '%"></i></div></div></div>';
    }).join("") + "</div>";
  }

  function handover() {
    var p = cur(), q = G.qs[G.i];
    ui.show('<div class="topbar"><button class="ghost" data-act="dquit">✕ Beenden</button><span class="chip">Frage ' + (G.i + 1) + " / " + G.qs.length + "</span></div>" +
      '<div class="handcard p' + p.c + '">' + av(p, true) + "<p>Gib das Handy an</p><h1>" + esc(p.name) + "</h1><p class=\"small\">" + (q.t === "est" ? "Schätzfrage · Die anderen schauen weg." : "Die anderen schauen weg.") + "</p>" +
      '<button class="btn handbtn" data-act="dready">Ich bin ' + esc(p.name) + " – zeig die Frage</button></div>" + scoreboard(), null);
  }
  H.dready = function () { turn(); };

  function turn(sel) {
    var p = cur(), q = G.qs[G.i], x = q.x, pk = G.picks[order()[G.turn]] || {};
    var h = '<div class="topbar"><span class="chip pchip p' + p.c + '">' + av(p) + esc(p.name) + '</span><span class="chip">' + (G.i + 1) + " / " + G.qs.length + "</span></div>";
    if (q.t === "est") {
      h += '<div class="qmeta">Schätzfrage · ' + esc(x.c) + '</div><p class="q">' + esc(x.q) + "</p>" +
        '<form id="destf">' + WF.est.inputFor(x, "destv") + '<p class="small mute" id="desterr" aria-live="polite"></p><button type="submit" class="btn primary">Schätzung abgeben</button></form>';
      ui.show(h, null);
      var inp = document.getElementById("destv"); if (inp) try { inp.focus(); } catch (e) {}
      document.getElementById("destf").addEventListener("submit", function (e) {
        e.preventDefault();
        var v = WF.est.parse(document.getElementById("destv").value);
        if (v === null) { document.getElementById("desterr").textContent = "Bitte eine Zahl eingeben."; return; }
        G.picks[order()[G.turn]] = { v: v }; done();
      });
      return;
    }
    h += '<div class="qmeta">' + esc(x.c) + " · " + esc(x.s) + '</div><p class="q">' + esc(x.q) + "</p>";
    if (p.joker && !pk.hidden) h += '<div class="helps"><button data-act="djok">50:50-Joker einsetzen (1)</button></div>';
    h += '<div id="opts" role="group" aria-label="Antworten">';
    x.opts.forEach(function (o, i) {
      var gone = pk.hidden && pk.hidden.indexOf(i) >= 0;
      h += '<button class="ans' + (gone ? " gone" : "") + (sel === i ? " sel" : "") + '" data-act="dpick" data-i="' + i + '"' + (gone ? " disabled" : "") + ' aria-pressed="' + (sel === i) + '">' + esc(o.t) + "</button>";
    });
    h += "</div>";
    if (G.c.mode === "bet" && sel !== undefined) {
      h += '<div class="confbox"><p class="small"><b>Wie viel setzt du?</b></p><div class="seg" role="group" aria-label="Einsatz" style="grid-template-columns:repeat(3,1fr)">' +
        [[1, "1 · ohne Risiko"], [2, "2 · −1 bei Fehler"], [3, "3 · −2 bei Fehler"]].map(function (b) { return '<button data-act="dbet" data-v="' + b[0] + '">' + b[1] + "</button>"; }).join("") + "</div></div>";
    }
    ui.show(h, null);
    if (sel !== undefined) { var fb = document.querySelector('[data-act="dbet"]'); if (fb) try { fb.focus({ preventScroll: true }); } catch (e) {} }
  }
  H.djok = function () {
    var p = cur(), x = G.qs[G.i].x, k = order()[G.turn], wrong = [];
    if (!p.joker) return;
    x.opts.forEach(function (o, i) { if (!o.ok) wrong.push(i); });
    G.picks[k] = { hidden: U.shuffle(wrong).slice(0, 2), fifty: true };
    p.joker = 0; turn();
  };
  H.dpick = function (d) {
    var k = order()[G.turn], prev = G.picks[k] || {};
    G.picks[k] = { i: +d.i, hidden: prev.hidden, fifty: prev.fifty, bet: 1 };
    if (G.c.mode === "bet") turn(+d.i); else done();
  };
  H.dbet = function (d) { G.picks[order()[G.turn]].bet = +d.v; done(); };
  function done() { if (G.turn < G.pl.length - 1) { G.turn++; handover(); } else reveal(); }

  /* ---------- Auflösung ---------- */
  function reveal() {
    var q = G.qs[G.i], x = q.x, delta = G.pl.map(function () { return 0; }), rec = { q: x.q, t: q.t, res: [] }, h;
    if (q.t === "est") {
      var sc = G.picks.map(function (pk) { return WF.est.score(x, pk.v); });
      var best = Math.min.apply(null, sc.map(function (r) { return r.off; }));
      sc.forEach(function (r, i) {
        var pts = r.off === best ? 2 : r.p >= 2 ? 1 : 0;
        delta[i] = pts; G.pl[i].score += pts; G.pl[i].estPts += pts; rec.res[i] = pts > 0;
      });
      h = '<div class="qmeta">Auflösung · Schätzfrage</div><p class="q">' + esc(x.q) + '</p><div class="fb ok"><b class="h">Richtig: ' + esc(WF.est.answerText(x)) + "</b>" +
        '<ol class="estlist">' + G.pl.map(function (p, i) { return { p: p, i: i, r: sc[i] }; }).sort(function (a, b) { return a.r.off - b.r.off; }).map(function (o) {
          return "<li>" + av(o.p) + "<b>" + esc(o.p.name) + "</b>: " + esc(WF.est.fmt(G.picks[o.i].v)) + (x.u ? " " + esc(x.u) : "") + ' <span class="small mute">' + esc(o.r.txt) + "</span>" + (delta[o.i] ? ' <span class="delta up">+' + delta[o.i] + "</span>" : "") + "</li>";
        }).join("") + "</ol>" + (x.e ? '<p class="small">' + esc(x.e) + "</p>" : "") + '<p class="small mute">Am nächsten dran: 2 Punkte. Höchstens 10 % daneben: 1 Punkt.</p></div>';
    } else {
      h = '<div class="qmeta">Auflösung · ' + esc(x.c) + '</div><p class="q">' + esc(x.q) + "</p>";
      G.picks.forEach(function (pk, i) {
        var p = G.pl[i], ok = x.opts[pk.i].ok, bet = G.c.mode === "bet" ? pk.bet || 1 : 1;
        p.mcN++;
        if (ok) { delta[i] = bet; p.right++; p.streak++; if (p.streak > p.best) p.best = p.streak; } else { delta[i] = -(bet - 1); p.streak = 0; }
        p.score += delta[i]; rec.res[i] = ok;
      });
      x.opts.forEach(function (o, i) {
        var who = G.pl.filter(function (p, k) { return G.picks[k].i === i; });
        h += '<div class="ans ' + (o.ok ? "ok" : who.length ? "bad" : "dim") + '">' + esc(o.t) + (who.length ? '<div class="who">' + who.map(function (p) {
          var pk = G.picks[p.c]; return '<span class="whochip p' + p.c + '">' + esc(p.name) + (G.c.mode === "bet" ? " · Einsatz " + pk.bet : "") + (pk.fifty ? " · 50:50" : "") + "</span>"; }).join("") + "</div>" : "") + "</div>";
      });
      h += '<div class="fb">' + (x.e ? "<p>" + esc(x.e) + "</p>" : "");
      var whys = {};
      G.picks.forEach(function (pk) { var o = x.opts[pk.i]; if (!o.ok && o.why) whys[o.t] = o.why; });
      Object.keys(whys).forEach(function (t) { h += '<p class="small"><b>Warum nicht „' + esc(t) + '“?</b> ' + esc(whys[t]) + "</p>"; });
      h += "</div>";
    }
    G.hist.push(rec);
    h += scoreboard(delta) + '<div style="margin-top:12px">' + btn("dnext", G.i + 1 >= G.qs.length ? "Siegerehrung" : "Nächste Frage", { primary: true }) + "</div>";
    ui.show('<div id="fb" aria-live="polite">' + h + "</div>", null);
    ui.say(G.pl.map(function (p, i) { return p.name + (delta[i] >= 0 ? " plus " : " minus ") + Math.abs(delta[i]); }).join(", "));
  }
  H.dnext = function () { G.i++; G.turn = 0; G.picks = []; if (G.i >= G.qs.length) return end(); handover(); };
  H.dquit = function () { if (G && G.hist.length) end(); else setup(); };

  /* ---------- Siegerehrung ---------- */
  function end() {
    var ranked = G.pl.slice().sort(function (a, b) { return b.score - a.score || b.right - a.right; });
    var top = ranked[0], tie = ranked[1] && ranked[1].score === top.score && ranked[1].right === top.right;
    var h = "<h1>" + (tie ? "Unentschieden" : esc(top.name) + " gewinnt") + "</h1>";
    var pod = [ranked[1], ranked[0], ranked[2]].filter(Boolean);
    h += '<div class="podium" aria-label="Platzierung">' + pod.map(function (p) {
      var place = ranked.indexOf(p) + 1;
      return '<div class="pod pl' + place + '">' + av(p, true) + "<b>" + esc(p.name) + '</b><span class="small">' + pts(p.score) + '</span><div class="step p' + p.c + '">' + place + "</div></div>";
    }).join("") + "</div>";
    if (ranked[3]) h += '<p class="small mute center">4. Platz: ' + esc(ranked[3].name) + " · " + pts(ranked[3].score) + "</p>";
    h += '<h2>Statistik</h2><div class="card"><table class="stbl"><thead><tr><th>Spieler</th><th>Punkte</th><th>Richtig</th><th>Beste Serie</th>' + (G.c.est ? "<th>Schätzen</th>" : "") + "</tr></thead><tbody>" +
      ranked.map(function (p) { return "<tr><td>" + av(p) + esc(p.name) + "</td><td>" + num(p.score) + "</td><td>" + p.right + "/" + p.mcN + "</td><td>" + p.best + "</td>" + (G.c.est ? "<td>" + p.estPts + "</td>" : "") + "</tr>"; }).join("") + "</tbody></table></div>";
    h += '<details class="card"><summary><b>Alle Fragen im Rückblick</b></summary><ol class="recap">' + G.hist.map(function (r) {
      return "<li>" + esc(r.q) + '<div class="who">' + G.pl.map(function (p, i) { return '<span class="whochip p' + p.c + (r.res[i] ? "" : " off") + '">' + esc(p.name) + (r.res[i] ? " ✓" : " ✗") + "</span>"; }).join("") + "</div></li>";
    }).join("") + "</ol></details>";
    h += '<div style="margin:16px 0">' + btn("dstart", "Revanche", { primary: true, sub: "gleiche Spieler und Einstellungen, neue Fragen" }) + '<div style="height:8px"></div>' + btn("duel", "Einstellungen ändern") + '<div style="height:8px"></div>' + btn("home", "Zur Startseite") + "</div>";
    ui.show(h, null);
  }
})();
