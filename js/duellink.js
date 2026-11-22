/* Duell per Link, ohne Server: Du spielst 10 Fragen und schickst einen Link. Darin stecken die Fragen-IDs,
   ein Startwert für die Reihenfolge der Antworten, dein Name und deine Ergebnisse (richtig/falsch je Frage).
   Wer den Link öffnet, spielt dieselben Fragen in derselben Reihenfolge und kann das Ergebnis per Link zurückschicken.
   Grenzen: Beide brauchen dieselbe App-Version (gleiche Fragen-IDs). Wer den Link entschlüsselt, sieht die Ergebnisse,
   aber keine richtigen Antworten. Auf dem iPhone öffnet ein Link Safari, nicht die Homescreen-App. */
(function () {
  "use strict";
  var WF = window.WF, E = WF.engine, D = WF.data, U = WF.util, esc = U.esc, ui = WF.ui, H = ui.H, btn = ui.btn;
  function S() { return WF.store.data; }
  var N = 10, L = null, incoming = null;

  /* ---------- Kodierung ---------- */
  function enc(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function dec(t) {
    try {
      t = t.replace(/-/g, "+").replace(/_/g, "/"); while (t.length % 4) t += "=";
      var o = JSON.parse(decodeURIComponent(escape(atob(t))));
      if (!o || o.v !== 1 || !Array.isArray(o.q) || o.q.length < 1 || o.q.length > 20 || typeof o.s !== "number") return null;
      return o;
    } catch (e) { return null; }
  }
  function link(kind, o) { return location.origin + location.pathname + "#" + kind + "=" + enc(o); }
  function bits(a) { return a.map(function (b) { return b ? "1" : "0"; }).join(""); }
  function unbits(s) { return String(s || "").split("").map(function (c) { return c === "1"; }); }
  function prep(o) {
    var miss = o.q.filter(function (id) { return !D.byId[id]; });
    if (miss.length) return null;
    return o.q.map(function (id, k) { return E.prep(D.byId[id], U.mulberry(o.s + k * 7919)); });
  }
  function myName() { return S().settings.myName || ""; }
  function nameField() { return '<label class="small mute" for="dlname">Dein Name</label><input id="dlname" class="inp" maxlength="14" value="' + esc(myName()) + '" placeholder="z. B. Alex">'; }
  function readName() { var el = document.getElementById("dlname"), v = el ? el.value.trim() : myName(); S().settings.myName = v; WF.store.save(); return v || "Unbekannt"; }

  /* ---------- Herausfordern ---------- */
  H.dl = function () {
    ui.setView(H.dl);
    ui.show('<button class="ghost" data-act="home">‹ Zurück</button><h1>Duell per Link</h1><p class="mute">Du spielst 10 Fragen. Danach schickst du einen Link, und dein Gegenüber spielt genau dieselben Fragen. Ein Server ist nicht nötig.</p>' +
      '<div class="card">' + nameField() + ui.rubrikSel() + "</div>" + btn("dlgo", "Herausforderung starten", { primary: true }), "home");
  };
  H.dlgo = function () {
    var name = readName(), c = ui.playC();
    var cand = D.real.filter(function (x) { return x.a && !x.pool && !x.mkd && (!c || x.c === c); });
    if (cand.length < N) { ui.toast({ title: "Zu wenige Fragen in dieser Rubrik" }); return; }
    var o = { v: 1, s: Math.floor(Math.random() * 1e9), q: U.shuffle(cand.slice()).slice(0, N).map(function (x) { return x.id; }), n: name, c: c || "" };
    play(o, "a");
  };

  /* ---------- Spielen (beide Seiten) ---------- */
  function play(o, role) { L = { o: o, role: role, qs: prep(o), i: 0, res: [] }; q(); }
  function q() {
    var x = L.qs[L.i];
    var h = '<div class="topbar"><span class="chip">Duell per Link</span><span class="chip">' + (L.i + 1) + " / " + L.qs.length + "</span></div>" + ui.bar(L.i / L.qs.length * 100, "Fortschritt") +
      '<div class="qmeta">' + esc(x.c) + " · " + esc(x.s) + '</div><p class="q">' + esc(x.q) + '</p><div id="opts" role="group" aria-label="Antworten">';
    x.opts.forEach(function (op, i) { h += '<button class="ans" data-act="dlpick" data-i="' + i + '">' + esc(op.t) + "</button>"; });
    ui.show(h + '</div><div id="fb" aria-live="polite"></div>', null);
  }
  H.dlpick = function (d) {
    if (L.res.length > L.i) return;
    var x = L.qs[L.i], i = +d.i, ok = x.opts[i].ok, btns = document.querySelectorAll("#opts .ans");
    L.res.push(ok);
    E.registerPlay(); if (ok) E.addXP(5); WF.store.save();
    WF.emit("answered", { ok: ok, gain: ok ? 5 : 0, x: { retry: false }, link: true });
    x.opts.forEach(function (op, k) { var b = btns[k]; b.disabled = true; b.classList.add(op.ok ? "ok" : k === i ? "bad" : "dim"); });
    var right = x.opts.filter(function (op) { return op.ok; })[0];
    document.getElementById("fb").innerHTML = '<div class="fb ' + (ok ? "ok" : "bad") + '"><b class="h">' + (ok ? "Richtig" : "Richtig wäre: " + esc(right.t)) + "</b>" + (x.e ? "<p>" + esc(x.e) + "</p>" : "") + "</div>" +
      btn("dlnext", L.i + 1 >= L.qs.length ? "Ergebnis" : "Weiter", { primary: true });
    ui.say(ok ? "Richtig." : "Falsch. Richtig ist: " + right.t);
    var nb = document.querySelector('[data-act="dlnext"]'); if (nb) try { nb.focus({ preventScroll: true }); } catch (e) {}
  };
  H.dlnext = function () { L.i++; if (L.i < L.qs.length) return q(); L.role === "a" ? doneA() : doneB(); };
  function sum(a) { return a.filter(Boolean).length; }

  function doneA() {
    var o = L.o; o.r = bits(L.res);
    L.url = link("d", o);
    L.text = o.n + " fordert dich bei Marifa heraus: " + sum(L.res) + " von " + L.res.length + " richtig. Schaffst du mehr?";
    ui.show("<h1>Deine Herausforderung</h1>" + '<div class="score">' + sum(L.res) + " von " + L.res.length + "</div>" +
      '<p class="mute">Schick jetzt den Link. Wenn dein Gegenüber fertig ist, kann es dir das Ergebnis zurückschicken.</p>' +
      btn("dlshare", "Link teilen", { primary: true }) + '<textarea id="dllink" readonly aria-label="Link zur Herausforderung">' + esc(L.url) + "</textarea>" +
      '<div style="margin:8px 0">' + btn("home", "Zur Startseite") + "</div>", null);
  }
  function doneB() {
    var o = L.o, a = unbits(o.r), b = L.res, sa = sum(a), sb = sum(b), me = readName();
    var reply = { v: 1, s: o.s, q: o.q, n: o.n, r: o.r, c: o.c, n2: me, r2: bits(b) };
    L.url = link("dr", reply);
    L.text = me + " hat deine Herausforderung gespielt: " + sb + " zu " + sa + ". Hier das Ergebnis:";
    ui.show(compare(o.n, a, me, b, true) + btn("dlshare", "Ergebnis zurückschicken", { primary: true }) + '<textarea id="dllink" readonly aria-label="Link zum Ergebnis">' + esc(L.url) + "</textarea>" +
      '<div style="margin:8px 0">' + btn("dl", "Selbst jemanden herausfordern") + '<div style="height:8px"></div>' + btn("home", "Zur Startseite") + "</div>", null);
  }
  function compare(na, a, nb, b, meIsB) {
    var sa = sum(a), sb = sum(b), title = sa === sb ? "Unentschieden" : (sb > sa ? nb : na) + " gewinnt";
    var qs = L ? L.qs : null;
    var h = "<h1>" + esc(title) + '</h1><div class="grid2 vs"><div class="stat"><b>' + sa + "</b><span>" + esc(na) + '</span></div><div class="stat"><b>' + sb + "</b><span>" + esc(nb) + (meIsB ? " (du)" : "") + "</span></div></div>";
    h += '<div class="card"><ol class="recap">' + a.map(function (ok, k) {
      return "<li>" + (qs ? esc(qs[k].q) : "Frage " + (k + 1)) + '<div class="who"><span class="whochip p0' + (ok ? "" : " off") + '">' + esc(na) + (ok ? " ✓" : " ✗") + '</span><span class="whochip p1' + (b[k] ? "" : " off") + '">' + esc(nb) + (b[k] ? " ✓" : " ✗") + "</span></div></li>";
    }).join("") + "</ol></div>";
    return h;
  }
  H.dlshare = function () {
    var url = L.url, text = L.text;
    if (navigator.share) { navigator.share({ title: "Marifa", text: text, url: url }).catch(function () {}); return; }
    try { navigator.clipboard.writeText(text + "\n" + url).then(function () { ui.toast({ title: "Link kopiert", sub: "Jetzt in einen Chat einfügen." }); }, sel); } catch (e) { sel(); }
    function sel() { var ta = document.getElementById("dllink"); if (ta) ta.select(); ui.toast({ title: "Link oben markieren und kopieren" }); }
  };

  /* ---------- Link öffnen ---------- */
  function fail(msg) {
    ui.show("<h1>Duell per Link</h1><p>" + esc(msg) + "</p>" + btn("home", "Zur Startseite", { primary: true }), null);
  }
  function openLink() {
    var m = /^#(d|dr)=([A-Za-z0-9_-]+)$/.exec(location.hash || "");
    if (!m) return;
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    var o = dec(m[2]);
    if (!o) return fail("Der Link ist beschädigt oder unvollständig.");
    var qs = prep(o);
    if (!qs) return fail("Einige Fragen aus diesem Link gibt es in deiner App-Version nicht. Lade die App neu und versuch es noch einmal.");
    if (m[1] === "dr") {
      L = { o: o, qs: qs };
      return ui.show(compare(o.n, unbits(o.r), o.n2 || "Gegenüber", unbits(o.r2), false) + btn("dl", "Neue Herausforderung", { primary: true }) + '<div style="height:8px"></div>' + btn("home", "Zur Startseite"), null);
    }
    incoming = o;
    ui.show('<h1>Herausforderung</h1><div class="handcard p0"><p>' + esc(o.n) + " fordert dich heraus</p><h1>" + sum(unbits(o.r)) + " von " + o.q.length + '</h1><p class="small">' + o.q.length + " Fragen" + (o.c ? " · " + esc(o.c) : " · alle Themen") + "</p></div>" +
      '<div class="card">' + nameField() + "</div>" + btn("dlaccept", "Annehmen und spielen", { primary: true }) + '<div style="height:8px"></div>' + btn("home", "Später"), null);
  }
  H.dlaccept = function () { readName(); play(incoming, "b"); };
  WF.on("ready", openLink);
  window.addEventListener("hashchange", function () { if (D.ready) openLink(); });

  WF.registerEntry({ where: "home", order: 45, render: function () { return ui.row("dl", "↗", "Duell per Link", "Freunde herausfordern, jeder spielt, wann er will", {}); } });
})();
