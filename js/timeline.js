/* Zeitstrahl: vier Ereignisse in die richtige Reihenfolge bringen (älteste zuerst).
   Nutzt die Jahreszahl-Tabellen aus data/pairs.json (Sets mit "year": true), es sind keine neuen Daten nötig.
   Schwierigkeit: leicht = Jahre weit auseinander, schwer = Jahre nah beieinander.
   Wirkt auf XP, Tagesserie und Tagesziel, nicht auf den Lernstand einzelner Fragen. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, D = WF.data, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn;
  function S() { return WF.store.data; }
  var ROUNDS = 5, N = 4, T = null, all = null;

  function ystr(y) { return y < 0 ? -y + " v. Chr." : String(y); }
  function events() {
    if (all) return all;
    all = [];
    ((D.raw && D.raw.pairs && D.raw.pairs.sets) || []).forEach(function (S_) {
      if (!S_.year) return;
      S_.rows.forEach(function (r) { var p = r.split("|"); if (p[0] && !isNaN(+p[1])) all.push({ t: p[0], y: +p[1], n: p[2] || "", c: S_.c, s: S_.s }); });
    });
    return all;
  }
  function pool(c, s) { return events().filter(function (e) { return D.inScope(e, c, s); }); }
  WF.timeline = { available: function (c, s) { return pool(c, s).length >= 12; } };

  /* Vier Ereignisse mit verschiedenen Jahren. gapMin: Mindestabstand, win: alle innerhalb dieses Zeitfensters (0 = egal). */
  function pickSet(list, lvl) {
    var gapMin = [0, 40, 8, 1][lvl], win = [0, 0, 400, 120][lvl];
    for (var tries = 0; tries < 200; tries++) {
      var a = list[Math.floor(Math.random() * list.length)], cand = U.shuffle(list.slice()), out = [a];
      for (var i = 0; i < cand.length && out.length < N; i++) {
        var e = cand[i];
        if (win && Math.abs(e.y - a.y) > win) continue;
        if (out.every(function (o) { return Math.abs(o.y - e.y) >= gapMin && o.t !== e.t; })) out.push(e);
      }
      if (out.length === N) return out;
    }
    /* Rückfall: einfach vier verschiedene Jahre */
    var seen = {}, res = [];
    U.shuffle(list.slice()).forEach(function (e) { if (res.length < N && !seen[e.y]) { seen[e.y] = 1; res.push(e); } });
    return res;
  }
  function level() { var d = S().settings.difficulty; return d === "auto" ? 2 : +d; }

  function start(c, s) {
    var list = pool(c, s);
    if (list.length < 12) { ui.toast({ title: "Zu wenige Ereignisse", sub: "Hier gibt es keine Jahreszahlen." }); return; }
    T = { c: c, s: s, i: 0, tasks: [], pos: 0, perfect: 0, xp: 0, lvl: level() };
    for (var k = 0; k < ROUNDS; k++) T.tasks.push({ ev: U.shuffle(pickSet(list, T.lvl)), order: [], done: false });
    task();
  }
  H.tl = function (d) { start(d.c || null, d.s || null); };

  function task() {
    var t = T.tasks[T.i];
    var h = '<div class="topbar"><button class="ghost" data-act="tlquit">✕ Beenden</button><span class="chip">' + (T.i + 1) + " / " + ROUNDS + "</span></div>" + ui.bar(T.i / ROUNDS * 100, "Fortschritt");
    h += '<div class="qmeta">Zeitstrahl' + (T.s || T.c ? " · " + esc(T.s || T.c) : "") + '</div><p class="q">Tippe die Ereignisse in der richtigen Reihenfolge an, das älteste zuerst.</p>';
    h += '<div id="tlopts" role="group" aria-label="Ereignisse">';
    t.ev.forEach(function (e, k) {
      var p = t.order.indexOf(k);
      h += '<button class="ans tl' + (p >= 0 ? " sel" : "") + '" data-act="tlpick" data-k="' + k + '"' + (t.done ? " disabled" : "") + ' aria-label="' + esc(e.t) + (p >= 0 ? ", Position " + (p + 1) : "") + '">' +
        '<span class="num" aria-hidden="true">' + (p >= 0 ? p + 1 : "") + "</span><span>" + esc(e.t) + "</span></button>";
    });
    h += "</div>";
    if (!t.done) h += btn("tlcheck", t.order.length < N ? "Noch " + (N - t.order.length) + " antippen" : "Prüfen", { primary: true, off: t.order.length < N });
    else h += '<div id="fb" aria-live="polite">' + reveal(t) + "</div>" + btn("tlnext", T.i + 1 >= ROUNDS ? "Ergebnis ansehen" : "Weiter", { primary: true });
    ui.show(h, null, false);
  }
  H.tlpick = function (d) {
    var t = T.tasks[T.i], k = +d.k, p = t.order.indexOf(k);
    if (t.done) return;
    if (p >= 0) t.order.splice(p, 1); else if (t.order.length < N) t.order.push(k);
    task();
    var b = document.querySelector('[data-act="tlpick"][data-k="' + k + '"]'); if (b) try { b.focus({ preventScroll: true }); } catch (e) {}
  };
  function correct(t) { return t.ev.map(function (e, k) { return k; }).sort(function (a, b) { return t.ev[a].y - t.ev[b].y; }); }
  H.tlcheck = function () {
    var t = T.tasks[T.i];
    if (t.order.length < N) return;
    var right = correct(t), hits = 0;
    t.order.forEach(function (k, p) { if (right[p] === k) hits++; });
    t.done = true; t.hits = hits;
    T.pos += hits; if (hits === N) T.perfect++;
    var gain = hits * 3 + (hits === N ? 8 : 0);
    E.registerPlay(); E.addXP(gain); T.xp += gain;
    WF.store.save();
    WF.emit("answered", { ok: hits === N, gain: gain, x: { retry: false }, timeline: true });
    task();
    var nb = document.querySelector('[data-act="tlnext"]'); if (nb) try { nb.focus({ preventScroll: true }); } catch (e) {}
  };
  function reveal(t) {
    var right = correct(t), ok = t.hits === N;
    var h = '<div class="fb ' + (ok ? "ok" : "bad") + '"><b class="h">' + (ok ? "Alles richtig" : t.hits + " von " + N + " an der richtigen Stelle") + "</b><ol class=\"tlres\">";
    right.forEach(function (k, p) {
      var e = t.ev[k], mine = t.order[p] === k;
      h += "<li><b>" + ystr(e.y) + "</b> · " + esc(e.t) + (mine ? ' <span class="okm">✓</span>' : ' <span class="badm" title="Du hattest hier etwas anderes">✗</span>') + (e.n ? '<br><span class="small mute">' + esc(e.n) + "</span>" : "") + "</li>";
    });
    return h + "</ol></div>";
  }
  H.tlnext = function () { T.i++; if (T.i >= ROUNDS) return end(); task(); };
  H.tlquit = function () { if (T.tasks.some(function (t) { return t.done; })) end(); else ui.go("home"); };
  function end() {
    var st = S(), tl = st.tl || (st.tl = { games: 0, perfect: 0 }), done = T.tasks.filter(function (t) { return t.done; }).length;
    tl.games++; tl.perfect = Math.max(tl.perfect, T.perfect);
    WF.store.save();
    ui.show("<h1>Zeitstrahl</h1>" + '<div class="score">' + T.perfect + " von " + done + "</div>" +
      '<p class="mute">Reihen komplett richtig · ' + T.pos + " von " + done * N + " Positionen · +" + T.xp + " XP</p>" +
      '<div style="margin:16px 0">' + btn("tl", "Nochmal", { primary: true, data: { c: T.c || "", s: T.s || "" } }) + '<div style="height:8px"></div>' + btn("home", "Zur Startseite") + "</div>", null, false);
  }

  WF.registerEntry({ where: "home", order: 35, render: function () {
    var c = S().settings.playC || null, ok = WF.timeline.available(c, null);
    return ui.row("tl", "↹", "Zeitstrahl", ok ? "4 Ereignisse ordnen · 5 Runden" : "Für diese Rubrik gibt es keine Jahreszahlen", { c: ok ? c || "" : "", s: "" }, !ok);
  } });
  WF.registerEntry({ where: "scope", order: 15, render: function (x) {
    return WF.timeline.available(x.c, x.s) ? ui.row("tl", "↹", "Zeitstrahl", "Ereignisse dieses Bereichs ordnen", { c: x.c, s: x.s || "" }) : "";
  } });
})();
