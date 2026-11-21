/* Speicher: Fortschritt im Browser, Einstellungen, Export und Import per Code. */
(function () {
  "use strict";
  var WF = window.WF, KEY = "wissensfundament-v2", PREFIX = "WF1:";

  function fresh() {
    return { qs: {}, cats: {}, sub: {}, xp: 0, days: {}, streak: { last: "", n: 0, best: 0 }, best: { blitz: 0, survive: 0 },
             dailyDone: {}, badges: {}, saved: {}, reports: [], tot: { r: 0, t: 0 }, goalClaimed: {}, maxCombo: 0, hist: {}, idMig: 0,
             settings: { difficulty: "auto", last: null, theme: "auto", font: "m", fx: "off" } };
  }
  function normalize(s) {
    var f = fresh();
    for (var k in f) if (s[k] === undefined) s[k] = f[k];
    if (!s.settings || typeof s.settings !== "object") s.settings = f.settings;
    if (!s.settings.difficulty) s.settings.difficulty = "auto";
    if (!s.settings.theme) s.settings.theme = "auto";
    if (!s.settings.font) s.settings.font = "m";
    if (!s.settings.fx) s.settings.fx = "off";
    return s;
  }
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.qs) return normalize(s); } catch (e) {}
    return fresh();
  }

  var store = WF.store = { data: load() };
  store.save = function () { try { localStorage.setItem(KEY, JSON.stringify(store.data)); } catch (e) {} };

  /* Umzug alter Fragen-IDs auf neue: map = { alteId: neueId }. Läuft je Version nur einmal. */
  store.migrateIds = function (map, version) {
    var d = store.data, n = 0;
    if ((d.idMig || 0) >= version) return 0;
    ["qs", "saved"].forEach(function (k) {
      Object.keys(map).forEach(function (o) { var nw = map[o]; if (o !== nw && d[k][o] !== undefined) { if (d[k][nw] === undefined) d[k][nw] = d[k][o]; delete d[k][o]; n++; } });
    });
    (d.reports || []).forEach(function (r) { if (map[r.id]) r.id = map[r.id]; });
    d.idMig = version; store.save();
    return n;
  };

  store.reset = function () { store.data = fresh(); store.save(); };

  /* Der Code enthält den gesamten Fortschritt als Text. */
  store.exportCode = function () {
    return PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(store.data))));
  };
  store.importCode = function (text) {
    try {
      var t = String(text || "").replace(/\s+/g, "");
      if (t.indexOf(PREFIX) !== 0) return false;
      var o = JSON.parse(decodeURIComponent(escape(atob(t.slice(PREFIX.length)))));
      if (!o || typeof o !== "object" || !o.qs || !o.tot || !o.streak) return false;
      store.data = normalize(o);
      store.save();
      if (WF.data && WF.data.idMap) store.migrateIds(WF.data.idMap, 1);
      return true;
    } catch (e) { return false; }
  };
})();
