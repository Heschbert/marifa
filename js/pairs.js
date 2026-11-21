/* Paar-Tabellen: aus Zeilen "A|B|Hinweis" entstehen Fragen in beide Richtungen, mit erzeugten Falschantworten
   samt Begründung. Für Jahreszahlen (year:true) werden benachbarte Jahre als Alternativen gebildet. */
(function () {
  "use strict";
  var WF = window.WF, U = WF.util;

  function ystr(y) { return y < 0 ? -y + " v. Chr." : String(y); }
  function century(y) { var c = Math.ceil(Math.abs(y) / 100); return c + ". Jahrhundert" + (y < 0 ? " v. Chr." : ""); }
  function fill(t, r) { return t.split("%y").join(r.bs).split("%a").join(r.a).split("%b").join(r.bs).split("%n").join(r.n); }
  function hintText(ans) { var l = ans.replace(/[^A-Za-zÄÖÜäöüß]/g, "").length; return "Beginnt mit „" + ans.charAt(0) + "“ und hat " + l + " Buchstaben."; }

  WF.builders.pairs = function (J) {
    var out = [];
    J.sets.forEach(function (S) {
      var year = !!S.year, rows = S.rows.map(function (r) { var p = r.split("|"); return { a: p[0], b: p[1], n: p[2] || "", d: +p[3] || S.d || 2 }; });
      rows.forEach(function (r) { r.bs = year ? ystr(+r.b) : r.b; if (year) r.y = +r.b; });
      var byText = {}, cnt = {};
      rows.forEach(function (r) { cnt[r.bs] = (cnt[r.bs] || 0) + 1; byText[r.bs] = r; });
      var byA = {}; rows.forEach(function (r) { byA[r.a] = r; });
      var bpool = Object.keys(cnt), apool = rows.map(function (r) { return r.a; });
      var w1 = S.w1 || "In %b liegt/lag das: %a.";
      function why1(t) { var r = byText[t]; return r && cnt[t] === 1 ? (S.why1 ? fill(S.why1, r) : (year ? t + ": " + r.a + "." : t + ": " + r.a + ".")) : (r ? fill(S.why1x || "%b passt zu: %a, aber nicht zu dieser Frage.", r) : ""); }
      function why2(t) { var r = byA[t]; return r ? (S.why2 ? fill(S.why2, r) : t + ": " + r.bs + ".") : ""; }
      rows.forEach(function (r) {
        var e = fill(S.e || "%a: %b.", r) + (r.n && (S.e || "").indexOf("%n") < 0 ? " " + r.n : "");
        var q1 = { c: S.c, s: S.s, q: fill(S.q1, r), ans: r.bs, why: why1, e: e, d: r.d };
        if (year) {
          q1.h = "Das war im " + century(r.y) + ".";
          q1.mkd = function () {
            var ds = [1, 2, 3, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 80], seen = {}, res = []; seen[r.y] = 1;
            U.shuffle(ds).forEach(function (dd) {
              var v = r.y + (Math.random() < .5 ? -dd : dd);
              if (res.length < 3 && !seen[v] && (r.y < 0 ? v < 0 : v > 0 && v <= 2026)) { seen[v] = 1; res.push(ystr(v)); }
            });
            return res;
          };
        } else { q1.pool = bpool.filter(function (t) { return t !== r.bs; }); q1.h = hintText(r.bs); }
        out.push(q1);
        if (S.q2 && cnt[r.bs] === 1) {
          out.push({ c: S.c, s: S.s, q: fill(S.q2, r), ans: r.a, pool: apool.filter(function (t) { return t !== r.a; }), why: why2, e: e, d: Math.min(3, r.d + (year ? 0 : 1)), h: year ? "Es geschah im " + century(r.y) + "." : hintText(r.a) });
        }
      });
    });
    return out;
  };
})();
