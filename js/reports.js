/* Gemeldete Fragen: werden auf dem Gerät gesammelt und im Profil angezeigt. Von dort lassen sie sich als Text
   kopieren (zum Weitergeben oder Korrigieren in data/) und löschen. Es wird nichts automatisch verschickt. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, D = WF.data, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn;
  function S() { return WF.store.data; }
  function list() { return S().reports || (S().reports = []); }

  H.report = function (d, t) {
    var x = E.cur(), l = list();
    if (!l.some(function (r) { return r.id === x.id; })) {
      var right = x.opts.filter(function (o) { return o.ok; })[0];
      l.push({ id: x.id, q: x.q, a: right ? right.t : "", c: x.c, s: x.s, at: U.today() });
      WF.store.save();
    }
    t.outerHTML = '<span class="mute">Gemeldet. Du findest die Liste im Profil.</span>';
  };

  function asText() {
    return list().map(function (r, i) {
      var x = D.byId && D.byId[r.id], file = "";
      D.topics.forEach(function (tp) { if (tp.c === r.c) file = tp.file; });
      return (i + 1) + ". [" + r.at + "] " + (r.c ? r.c + " · " + r.s + " · " : "") + "id " + r.id + (file && x && !x.key ? " (data/" + file + ")" : "") +
        "\n   Frage: " + r.q + (r.a ? "\n   Richtige Antwort laut App: " + r.a : "");
    }).join("\n\n");
  }
  H.repcopy = function () {
    var txt = asText();
    try { navigator.clipboard.writeText(txt).then(function () { ui.toast({ title: "Liste kopiert" }); }, fail); } catch (e) { fail(); }
    function fail() { var ta = document.getElementById("reptext"); if (ta) { ta.hidden = false; ta.value = txt; ta.select(); } ui.toast({ title: "Text unten markieren und kopieren" }); }
  };
  H.repdel = function (d) { list().splice(+d.i, 1); WF.store.save(); ui.refresh(); };
  H.repclear = function () { S().reports = []; WF.store.save(); ui.refresh(); };

  WF.registerEntry({ where: "profile", order: 30, render: function () {
    var l = list();
    if (!l.length) return "";
    var h = "<h2>Gemeldete Fragen · " + l.length + '</h2><div class="card">';
    l.forEach(function (r, i) {
      h += '<div class="wrong"><b>' + esc(r.q) + "</b>" + (r.a ? '<br><span class="mute">Antwort laut App: ' + esc(r.a) + "</span>" : "") +
        '<br><span class="small mute">' + esc(r.at) + (r.c ? " · " + esc(r.c) : "") + '</span> <button class="link small" data-act="repdel" data-i="' + i + '">Entfernen</button></div>';
    });
    h += '<div class="grid2" style="margin-top:8px">' + btn("repcopy", "Als Text kopieren") + btn("repclear", "Liste leeren") + "</div>";
    return h + '<textarea id="reptext" hidden readonly></textarea></div>';
  } });
})();
