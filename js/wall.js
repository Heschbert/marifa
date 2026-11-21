/* Das Wissensfundament als Mauer: jede Steinreihe ist ein Thema, jeder Stein steht für 1/12 der Fragen dieses Themas.
   Ein Stein füllt sich mit den gemeisterten Fragen (Stufe 3 und höher). Erscheint oben im Profil und klein auf der Lernseite. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, D = WF.data, U = WF.util, esc = U.esc;
  var PER = 12, BW = 24, BH = 12, G = 2;

  function rows() {
    return D.topics.map(function (t, i) { var n = E.totalIn(t.c), m = E.masteredIn(t.c); return { c: t.c, n: n, m: m, f: n ? m / n * PER : 0, hue: Math.round(i * 360 / D.topics.length) }; });
  }
  function svg(rs, small) {
    var w = PER * (BW + G) + BW / 2, h = rs.length * (BH + G), out = "";
    /* unterste Reihe = erstes Thema: die Mauer wächst nach oben */
    rs.forEach(function (r, k) {
      var y = h - (k + 1) * (BH + G), off = k % 2 ? BW / 2 : 0;
      for (var b = 0; b < PER; b++) {
        var fill = Math.max(0, Math.min(1, r.f - b)), x = off + b * (BW + G);
        out += '<rect x="' + x + '" y="' + y + '" width="' + BW + '" height="' + BH + '" rx="2" class="brick-empty"/>';
        if (fill > 0) out += '<rect x="' + x + '" y="' + y + '" width="' + (BW * fill).toFixed(1) + '" height="' + BH + '" rx="2" style="fill:hsl(' + r.hue + ' 55% var(--brick-l))"><title>' + esc(r.c) + ": " + r.m + " von " + r.n + " gemeistert</title></rect>";
      }
    });
    return '<svg class="wall' + (small ? " small" : "") + '" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="Mauer aus ' + rs.length + ' Themen-Reihen">' + out + "</svg>";
  }
  function summary(rs) {
    var full = 0, m = 0, n = 0; rs.forEach(function (r) { full += Math.floor(r.f); m += r.m; n += r.n; });
    return { full: full, all: rs.length * PER, m: m, n: n };
  }

  WF.registerEntry({ where: "profiletop", order: 1, render: function () {
    var rs = rows(), s = summary(rs);
    var h = '<h2>Dein Fundament</h2><div class="card">' + svg(rs) +
      '<p class="small" style="margin:10px 0 0"><b>' + s.full + " von " + s.all + " Steinen</b> komplett · " + s.m + " von " + s.n + ' Fragen gemeistert</p>' +
      '<p class="small mute" style="margin:4px 0 0">Jede Reihe ist ein Thema, die unterste ist ' + esc(rs[0] ? rs[0].c : "") + ". Ein Stein füllt sich, wenn du Fragen dieses Themas sicher beherrschst.</p>" +
      '<ul class="sr-only">' + rs.map(function (r) { return "<li>" + esc(r.c) + ": " + r.m + " von " + r.n + " gemeistert</li>"; }).join("") + "</ul></div>";
    return h;
  } });
  WF.registerEntry({ where: "areas", order: 5, render: function () {
    var rs = rows(), s = summary(rs);
    return '<button class="item wallitem" data-act="profile" aria-label="Dein Fundament: ' + s.m + ' Fragen gemeistert. Zum Profil.">' + svg(rs, true) + '<div class="grow"><div class="t">Dein Fundament</div><div class="small mute">' + s.m + " von " + s.n + ' gemeistert</div></div><span class="chev" aria-hidden="true">›</span></button>';
  } });
})();
