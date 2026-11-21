/* Daten: lädt Themen und Fragen aus data/*.json und führt sie mit den Generatoren zusammen.
   Ein neues Thema entsteht durch einen Eintrag in data/index.json und eine JSON-Datei. */
(function () {
  "use strict";
  var WF = window.WF, U = WF.util;
  var D = WF.data = { topics: [], Q: [], real: [], bySub: {}, byCat: {}, catN: {}, ready: false };

  function getJSON(u) {
    return fetch(u).then(function (r) { if (!r.ok) throw new Error(u + " (" + r.status + ")"); return r.json(); });
  }

  D.load = function () {
    return getJSON("data/index.json").then(function (idx) {
      D.topics = idx.topics;
      var jobs = idx.topics.map(function (t) { return getJSON("data/" + t.file).then(function (a) { return { t: t, a: a }; }); });
      var ex = (idx.extras || []).map(function (x) { return getJSON("data/" + x.file).then(function (j) { return { x: x, j: j }; }); });
      return Promise.all([Promise.all(jobs), Promise.all(ex)]);
    }).then(function (res) {
      var list = [];
      res[0].forEach(function (r) {
        r.a.forEach(function (q) { list.push({ id: q.id || "", c: r.t.c, s: q.s, q: q.q, a: q.a, e: q.e, w: q.w || null, h: q.h || "", d: q.d || 2, src: q.src || "" }); });
      });
      res[1].forEach(function (r) { list = list.concat(WF.builders[r.x.builder](r.j)); });
      /* IDs: feste id aus der JSON-Datei, bei erzeugten Fragen aus dem Schlüssel (key). Nur ohne beides aus dem Fragetext.
         Frühere Versionen nutzten immer den Fragetext; idMap verweist von alt auf neu, damit der Lernstand erhalten bleibt. */
      var idMap = {}, seen = {};
      list.forEach(function (x) {
        var legacy = U.hash(x.q);
        x.id = x.id || (x.key ? "k_" + U.hash(x.key) : legacy);
        if (x.id !== legacy) idMap[legacy] = x.id;
        if (seen[x.id]) console.warn("Doppelte Fragen-ID " + x.id + ": " + x.q); seen[x.id] = 1;
      });
      D.idMap = idMap;
      WF.store.migrateIds(idMap, 1);
      D.real = list; D.byId = {}; list.forEach(function (x) { D.byId[x.id] = x; });
      D.Q = list.concat(WF.gen.entries());
      D.bySub = {}; D.byCat = {}; D.catN = {};
      list.forEach(function (x) {
        (D.bySub[x.c + "|" + x.s] = D.bySub[x.c + "|" + x.s] || []).push(x);
        (D.byCat[x.c] = D.byCat[x.c] || []).push(x);
      });
      D.Q.forEach(function (x) { D.catN[x.c] = (D.catN[x.c] || 0) + 1; });
      D.ready = true;
    });
  };

  D.cats = function () { return D.topics.map(function (t) { return t.c; }); };
  D.subsOf = function (c) { for (var i = 0; i < D.topics.length; i++) if (D.topics[i].c === c) return D.topics[i].subs; return []; };
  D.inScope = function (x, c, s) { return (!c || x.c === c) && (!s || x.s === s); };
  D.realList = function (c, s) { return c && s ? (D.bySub[c + "|" + s] || []) : c ? (D.byCat[c] || []) : D.real; };
})();
