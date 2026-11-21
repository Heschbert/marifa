/* Karteikarten: Frage lesen, Antwort aufdecken, selbst bewerten. Wirkt auf den Lernstand der Frage. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, D = WF.data, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn;
  var C = null;

  H.cards = function (d) {
    var list = E.orderLearn(D.realList(d.c, d.s || null)).slice(0, 20).map(function (x) { return E.prep(x); });
    if (!list.length) { ui.toast({ title: "Keine Karten" }); return; }
    C = { list: list, i: 0, known: 0, scope: d };
    card(false);
  };
  function card(open) {
    var x = C.list[C.i], right = x.opts.filter(function (o) { return o.ok; })[0];
    var h = '<div class="topbar"><button class="ghost" data-act="cquit">✕ Beenden</button><span class="chip">' + (C.i + 1) + " / " + C.list.length + "</span></div>" + ui.bar(C.i / C.list.length * 100);
    h += '<div class="qmeta">' + esc(x.c) + " · " + esc(x.s) + '</div><div class="card"><p class="q">' + esc(x.q) + "</p>";
    if (open) h += "<p><b>" + esc(right.t) + "</b></p>" + (x.e ? '<p class="mute">' + esc(x.e) + "</p>" : "");
    h += "</div>";
    h += open ? '<div class="grid2">' + btn("cno", "Nochmal") + btn("cyes", "Gewusst", { primary: true }) + "</div>" : btn("cshow", "Antwort zeigen", { primary: true });
    ui.show(h, null, true);
  }
  H.cshow = function () { card(true); };
  function rate(ok) {
    var x = C.list[C.i], st = WF.store.data, rec = st.qs[x.id] || (st.qs[x.id] = { b: 0 });
    E.schedule(rec, ok); if (ok) { C.known++; E.addXP(3); }
    WF.store.save();
    C.i++;
    if (C.i >= C.list.length) return done();
    card(false);
  }
  H.cyes = function () { rate(true); };
  H.cno = function () { rate(false); };
  function done() {
    ui.show("<h1>Karten durch</h1>" + '<div class="score">' + C.known + " von " + C.list.length + "</div><p class=\"mute\">gewusst</p>" +
      '<div style="margin:16px 0">' + btn("cards", "Noch eine Runde", { primary: true, data: C.scope }) + '<div style="height:8px"></div>' + btn("home", "Zur Startseite") + "</div>", null, true);
  }
  H.cquit = function () { if (C.i) done(); else H.areas(); };
})();
