/* Engine: Fragenauswahl, Schwierigkeit, Hilfen, Auswertung, XP und Serie. Keine Oberfläche, nur Logik und Ereignisse. */
(function () {
  "use strict";
  var WF = window.WF, U = WF.util, D = WF.data;
  function S() { return WF.store.data; }
  var E = WF.engine = { s: null };
  var C = E.consts = { ROUND: 10, GOAL: 10, DAILY_N: 5, BLITZ_S: 60, LIVES: 3 };

  /* ---------- Level, XP, Serie ---------- */
  /* Level 1–30. XP für Level L: 50 × L × (L − 1). Level 30 ist das Höchstlevel. */
  var TITLES = ["Neugierig", "Wissbegierig", "Aufgeweckt", "Belesen", "Kenner", "Allrounder", "Querdenker", "Experte", "Gelehrter", "Universalgenie"];
  var TIERS = [[11, "Wissensmeister"], [15, "Weiser"], [20, "Großmeister"], [25, "Legende"], [30, "Marifa-Meister"]];
  E.MAXLVL = 30;
  E.lvlStart = function (L) { return 50 * L * (L - 1); };
  E.levelOf = function (xp) { var L = 1; while (L < E.MAXLVL && xp >= E.lvlStart(L + 1)) L++; return L; };
  E.titleOf = function (L) { if (L <= TITLES.length) return TITLES[L - 1]; var t = TITLES[TITLES.length - 1]; TIERS.forEach(function (x) { if (L >= x[0]) t = x[1]; }); return t; };
  function daysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return U.dkey(d); }
  /* Serienschutz: ein verpasster Tag wird überbrückt, wenn ein Schutz vorhanden ist (freeze). */
  E.curStreak = function () { var s = S().streak; return (s.last === U.today() || s.last === U.yesterday() || (s.last === daysAgo(2) && (s.freeze || 0) > 0)) ? s.n : 0; };

  /* Combo-Multiplikator nach Serie richtiger Antworten in der Runde */
  E.mult = function (streak) { return streak >= 10 ? 4 : streak >= 6 ? 3 : streak >= 3 ? 2 : 1; };

  E.addXP = function (n) {
    var before = E.levelOf(S().xp);
    S().xp += n;
    if (E.s) E.s.roundXP += n;
    var after = E.levelOf(S().xp);
    if (after > before) WF.emit("toast", { title: "Level " + after, sub: E.titleOf(after) });
  };
  E.registerPlay = function () {
    var st = S(), t = U.today(), s = st.streak;
    if (s.last !== t) {
      if (s.last === U.yesterday()) s.n = s.n + 1;
      else if (s.last === daysAgo(2) && (s.freeze || 0) > 0) { s.freeze--; s.n = s.n + 1; WF.emit("toast", { title: "Serienschutz eingesetzt", sub: "Deine Serie läuft weiter." }); }
      else s.n = 1;
      if (s.n > 0 && s.n % 7 === 0 && (s.freeze || 0) < 2) { s.freeze = (s.freeze || 0) + 1; WF.emit("toast", { title: s.n + " Tage geschafft", sub: "+1 Serienschutz" }); }
      s.last = t;
      if (s.n > s.best) s.best = s.n;
      if (s.n > 1) WF.emit("toast", { title: s.n + " Tage in Folge", sub: "Die Serie läuft." });
    }
    st.days[t] = (st.days[t] || 0) + 1;
    if (st.days[t] >= C.GOAL && !st.goalClaimed[t]) {
      st.goalClaimed[t] = 1; E.addXP(50); WF.emit("toast", { title: "Tagesziel erreicht", sub: "+50 XP" });
    }
  };

  /* ---------- Wiederholungsplan (Spaced Repetition) ---------- */
  var INTERVALS = [1, 3, 7, 21, 60];
  function inDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return U.dkey(d); }
  E.schedule = function (rec, ok) {
    if (ok) { rec.b = Math.min(rec.b + 1, 4); rec.due = inDays(INTERVALS[rec.b - 1]); }
    else { rec.b = 0; rec.due = U.today(); }
  };
  E.dueList = function (scope) {
    var qs = S().qs, t = U.today();
    return D.realList(scope.c, scope.s).filter(function (x) { var r = qs[x.id]; return r && (r.due ? r.due <= t : r.b >= 1 && r.b < 4); })
      .sort(function (a, b) { return (qs[a.id].due || "0") < (qs[b.id].due || "0") ? -1 : 1; });
  };
  E.savedList = function () { return Object.keys(S().saved).map(function (id) { return D.byId[id]; }).filter(Boolean); };

  /* ---------- Bereiche ---------- */
  E.totalIn = function (c, s) { return D.realList(c, s).length; };
  E.masteredIn = function (c, s) {
    var qs = S().qs, n = 0, l = D.realList(c, s);
    for (var i = 0; i < l.length; i++) { var r = qs[l[i].id]; if (r && r.b >= 3) n++; }
    return n;
  };
  /* Wissensstand: jede Frage zählt nach ihrer Stufe (zuletzt richtig 1 → ein Drittel, 2 → zwei Drittel, ab 3 → ganz).
     Steigt also schon mit der ersten richtigen Antwort, nicht erst nach Tagen. */
  var LV = [0, 1 / 3, 2 / 3, 1, 1];
  E.levelPct = function (c, s) {
    var qs = S().qs, l = D.realList(c, s), sum = 0;
    for (var i = 0; i < l.length; i++) { var r = qs[l[i].id]; if (r) sum += LV[Math.min(r.b, 4)]; }
    return l.length ? sum / l.length * 100 : 0;
  };
  E.knownIn = function (c, s) {
    var qs = S().qs, n = 0, l = D.realList(c, s);
    for (var i = 0; i < l.length; i++) { var r = qs[l[i].id]; if (r && r.b >= 1) n++; }
    return n;
  };
  E.fmtPct = function (p) { return p > 0 && p < 10 ? (Math.floor(p * 10) / 10).toString().replace(".", ",") : String(Math.floor(p)); };
  E.seenIn = function (c, s) {
    var qs = S().qs, n = 0, l = D.realList(c, s);
    for (var i = 0; i < l.length; i++) if (qs[l[i].id]) n++;
    return n;
  };
  E.accIn = function (c, s) {
    var st = S();
    if (c && s) return st.sub[c + "|" + s] || { r: 0, t: 0 };
    if (c) return st.cats[c] || { r: 0, t: 0 };
    return st.tot;
  };
  E.missedList = function (scope) {
    var qs = S().qs;
    return D.realList(scope.c, scope.s).filter(function (x) { var r = qs[x.id]; return r && r.b === 0; });
  };

  /* ---------- Schwierigkeit ---------- */
  /* Stufen: 1 leicht, 2 mittel, 3 schwer. "auto" folgt der Trefferquote je Unterbereich. */
  E.target = function (c, s) {
    var d = S().settings.difficulty;
    if (d === "auto") { var st = S().sub[c + "|" + s]; return (st && st.lv) || 2; }
    return +d;
  };
  function diffMult(x) {
    var dd = Math.abs((x.d || 2) - E.target(x.c, x.s));
    return dd === 0 ? 2 : dd === 1 ? 1 : 0.5;
  }
  function trackLevel(x, ok) {
    var st = S(), k = x.c + "|" + x.s, sb = st.sub[k] || (st.sub[k] = { r: 0, t: 0 });
    sb.win = (sb.win || []).concat(ok ? 1 : 0).slice(-10);
    if (sb.win.length >= 10) {
      var sum = sb.win.reduce(function (a, b) { return a + b; }, 0), lv = sb.lv || 2;
      if (sum >= 8 && lv < 3) { sb.lv = lv + 1; sb.win = []; }
      else if (sum <= 4 && lv > 1) { sb.lv = lv - 1; sb.win = []; }
    }
  }

  /* ---------- Auswahl ---------- */
  /* Zuletzt gesehen: st.seen = { id: Tagnummer }. Was heute oder gestern kam, wird stark zurückgestellt,
     damit nicht jede Runde dieselben Fragen bringt. Einträge älter als 21 Tage werden beim Start entfernt. */
  function dayNo() { return Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5); }
  E.markSeen = function (id) { var st = S(); (st.seen || (st.seen = {}))[id] = dayNo(); };
  E.seenAge = function (id) { var v = (S().seen || {})[id]; return v === undefined ? 99 : dayNo() - v; };
  E.pruneSeen = function () { var sn = S().seen || {}, t = dayNo(); Object.keys(sn).forEach(function (k) { if (t - sn[k] > 21) delete sn[k]; }); };
  function recency(x, wrong) {
    var a = E.seenAge(x.id);
    if (wrong) return a === 0 ? 0.25 : 1;
    return a === 0 ? 0.05 : a === 1 ? 0.25 : a === 2 ? 0.6 : 1;
  }
  function weight(x) {
    if (x.gen) return 2 * diffMult(x) * recency(x);
    var r = S().qs[x.id];
    /* cw: wie oft „sicher“ und trotzdem falsch. Solche Fragen kommen bevorzugt wieder, bis sie sitzen.
       Neue Fragen (kein Eintrag) haben das höchste Gewicht, damit man mehr vom Bestand sieht. */
    return (r ? [4, 2.5, 1.5, 0.6, 0.25][Math.min(r.b, 4)] * (r.cw && r.b < 3 ? 1.6 : 1) : 5) * diffMult(x) * recency(x, r && r.b === 0);
  }
  E.pool = function (scope) { return D.Q.filter(function (x) { return D.inScope(x, scope.c, scope.s); }); };
  E.order = function (list, balanced) {
    return list.map(function (x) { var w = weight(x); if (balanced) w = w / D.catN[x.c]; return { x: x, k: Math.log(Math.random()) / w }; })
      .sort(function (a, b) { return b.k - a.k; }).map(function (o) { return o.x; });
  };
  function levelKey(x) {
    var base = 0;
    var wrong = false;
    if (!x.gen) { var r = S().qs[x.id]; wrong = r && r.b === 0; base = r ? (r.b === 0 ? (r.cw ? -1.5 : -1) : r.b) : 0; }
    var a = E.seenAge(x.id);
    base += wrong ? (a === 0 ? 1 : 0) : (a === 0 ? 4 : a === 1 ? 2 : 0);
    return base + Math.abs((x.d || 2) - E.target(x.c, x.s)) * 0.4;
  }
  E.orderLearn = function (list) { return U.shuffle(list.slice()).sort(function (a, b) { return levelKey(a) - levelKey(b); }); };

  /* Hinweise für erzeugte Fragen (Tabellen): erst wenn die Antwortmöglichkeiten feststehen.
     Ein Anfangsbuchstabe oder Jahrhundert wird nur genannt, wenn ihn mindestens eine falsche Antwort teilt,
     sonst wäre der Hinweis die Lösung. Andernfalls schließt der Hinweis eine falsche Antwort aus. */
  function first(t) { return String(t).replace(/^(der|die|das|den)\s+/i, "").charAt(0).toUpperCase(); }
  function yearOf(t) { var m = /^(\d+)( v\. Chr\.)?$/.exec(String(t)); return m ? (m[2] ? -1 : 1) * (+m[1]) : null; }
  function century(y) { return y < 0 ? -Math.ceil(-y / 100) : Math.ceil(y / 100); }
  function genHint(x, opts, rng) {
    var right = opts.filter(function (o) { return o.ok; })[0], wrong = opts.filter(function (o) { return !o.ok; });
    if (!right || !wrong.length) return x.h || "";
    if (x.mkd) {
      var ry = yearOf(right.t);
      if (ry !== null && wrong.some(function (o) { var y = yearOf(o.t); return y !== null && century(y) === century(ry); })) return x.h || "";
    } else {
      var f = first(right.t);
      if (wrong.some(function (o) { return first(o.t) === f; })) return "Beginnt mit „" + f + "“.";
    }
    var w = wrong[Math.floor((rng || Math.random)() * wrong.length)];
    return "„" + w.t + "“ ist es nicht.";
  }
  E.genHint = genHint;

  E.prep = function (x, rng) {
    if (x.gen) return WF.gen.make(x);
    var opts;
    if (x.pool || x.mkd) {
      var d;
      if (x.mkd) d = x.mkd();
      else {
        d = [];
        /* ab Stufe „mittel“: Falschantworten aus der Nachbarschaft, damit Ausschließen nicht reicht */
        if (x.near && E.target(x.c, x.s) >= 2) d = U.shuffle(x.near.filter(function (t) { return t !== x.ans && x.pool.indexOf(t) >= 0; }), rng).slice(0, 3);
        if (d.length < 3) d = d.concat(U.shuffle(x.pool.filter(function (t) { return t !== x.ans && d.indexOf(t) < 0; }), rng)).slice(0, 3);
      }
      opts = [{ t: x.ans, ok: true, why: "" }].concat(d.map(function (t) { return { t: t, ok: false, why: x.why ? x.why(t) : "" }; }));
    } else {
      opts = x.a.map(function (t, i) { return { t: t, ok: i === 0, why: (x.w && x.w[i]) || "" }; });
    }
    var h = (x.pool || x.mkd) && !x.fixedHint ? genHint(x, opts, rng) : (x.h || "");
    return { id: x.id, src: x.src || "", c: x.c, s: x.s, q: x.q, img: x.img, imgAlt: x.imgAlt, big: x.big, e: x.e, h: h, d: x.d || 2, opts: U.shuffle(opts, rng), helped: false, hidden: [], hintShown: false };
  };
  E.dailyList = function () {
    var rng = U.mulberry(U.seedOf(U.today()));
    return U.shuffle(D.cats(), rng).slice(0, C.DAILY_N).map(function (c) {
      var cand = D.real.filter(function (x) { return !x.pool && !x.mkd && x.c === c; });
      return E.prep(cand[Math.floor(rng() * cand.length)], rng);
    });
  };

  /* ---------- Runde ---------- */
  E.clearAdv = function () { if (E.s && E.s.adv) { clearTimeout(E.s.adv); E.s.adv = null; } };

  E.start = function (modeId, scope) {
    var m = WF.modes[modeId];
    scope = scope || { c: null, s: null };
    var s = E.s = { m: m, scope: scope, round: [], idx: 0, score: 0, wrong: [], streak: 0, best: 0, lives: m.lives || 0, endAt: 0, roundXP: 0,
                    newBadges: [], log: [], planned: 0, learned: {}, retries: {}, mastNew: 0, answered: false, over: false, record: false,
                    shownAt: Date.now(), adv: null, jokers: { fifty: m.helps === "limited" ? 1 : 0, hint: m.helps === "limited" ? 1 : 0 } };
    var list = m.build(s);
    s.round = m.prepped ? list : list.map(function (x) { return E.prep(x); });
    s.planned = s.round.length;
    if (!s.round.length) return false;
    if (m.timer) s.endAt = Date.now() + m.timer * 1000;
    if (!m.daily && (scope.c || scope.s)) { S().settings.last = { c: scope.c, s: scope.s }; WF.store.save(); }
    return true;
  };
  E.cur = function () { return E.s.round[E.s.idx]; };
  E.timeLeft = function () { return Math.max(0, (E.s.endAt - Date.now()) / 1000); };

  /* ---------- Hilfen ---------- */
  E.canHelp = function (kind) {
    var s = E.s, x = E.cur();
    if (s.answered || s.over || s.m.helps === "none") return false;
    if (kind === "fifty" && x.hidden.length) return false;
    if (kind === "hint" && (!x.h || x.hintShown)) return false;
    return s.m.helps === "free" || s.jokers[kind] > 0;
  };
  E.useFifty = function () {
    if (!E.canHelp("fifty")) return false;
    var x = E.cur(), wrongIdx = [];
    x.opts.forEach(function (o, i) { if (!o.ok) wrongIdx.push(i); });
    x.hidden = U.shuffle(wrongIdx).slice(0, 2);
    x.helped = true;
    if (E.s.m.helps === "limited") E.s.jokers.fifty--;
    return true;
  };
  E.useHint = function () {
    if (!E.canHelp("hint")) return false;
    var x = E.cur();
    x.hintShown = true; x.helped = true;
    if (E.s.m.helps === "limited") E.s.jokers.hint--;
    return true;
  };

  /* ---------- Antwort ---------- */
  /* conf (optional): Selbsteinschätzung "g" geraten, "z" ziemlich sicher, "s" sicher.
     Richtig, aber geraten: zählt nicht als gewusst (keine höhere Stufe). Falsch, aber sicher: wird markiert. */
  /* typed (optional): eingetippte Antwort { t: Text, ok: richtig? }, dann ist i = -1. Eingetippt und richtig zählt mehr XP. */
  E.answer = function (i, conf, typed) {
    var s = E.s;
    if (!s || s.answered || s.over) return null;
    var x = E.cur(), m = s.m;
    if (x.hidden.indexOf(i) >= 0) return null;
    s.answered = true;
    var given = i >= 0 ? x.opts[i] : { t: typed ? typed.t : "", ok: !!(typed && typed.ok), why: "" };
    var st = S(), ok = given.ok, ms = Date.now() - s.shownAt, retry = !!x.retry, gain = 0, slow = false;
    /* Sicherheit automatisch: Wer bei einer richtigen Antwort lange zögert, hat vermutlich eher geraten.
       Die Frage steigt dann nicht auf und kommt früher wieder. Grenze wächst mit der Textlänge. */
    if (!conf && m.learn && st.settings.conf !== "learn" && st.settings.conf !== "all" && i >= 0) {
      var len = x.q.length + x.opts.reduce(function (a, o) { return a + o.t.length; }, 0);
      if (ok && ms > 8000 + len * 60) { conf = "g"; slow = true; }
    }
    E.registerPlay();
    var cs = st.cats[x.c] || (st.cats[x.c] = { r: 0, t: 0 });
    var sk = x.c + "|" + x.s, ss = st.sub[sk] || (st.sub[sk] = { r: 0, t: 0 });
    if (!retry) { cs.t++; ss.t++; st.tot.t++; }
    var rec = null, before = 0;
    if (!x.gen) { rec = st.qs[x.id] || (st.qs[x.id] = { b: 0 }); before = rec.b; }
    E.markSeen(x.id);
    var requeued = false;
    if (ok) {
      s.learned[x.id] = 1;
      if (!retry) {
        s.log.push(1);
        s.score++; s.streak++; cs.r++; ss.r++; st.tot.r++;
        if (s.streak > s.best) s.best = s.streak;
        if (s.streak > st.maxCombo) st.maxCombo = s.streak;
        /* Punkte: 10 plus Zeitbonus (bis 10, in 15 s abnehmend), mal Combo-Multiplikator */
        gain = (10 + Math.round(10 * Math.max(0, 1 - ms / 15000))) * E.mult(s.streak);
      } else gain = 5;
      if (x.helped) gain = Math.ceil(gain / 2);
      if (typed) gain += 5;
      if (conf === "g") gain = Math.ceil(gain / 2);
      if (rec && !x.helped && conf !== "g") E.schedule(rec, true);
      E.addXP(gain);
    } else {
      s.streak = 0;
      if (rec) E.schedule(rec, false);
      if (rec && conf === "s") rec.cw = (rec.cw || 0) + 1;
      if (m.lives) s.lives--;
      if (!retry) s.log.push(0);
      if (!retry) s.wrong.push({ q: x.q, given: given.t, why: given.why, right: x.opts.filter(function (o) { return o.ok; })[0].t, e: x.e });
      if (m.requeue && (s.retries[x.id] || 0) < 2) {
        s.retries[x.id] = (s.retries[x.id] || 0) + 1;
        var copy = { id: x.id, c: x.c, s: x.s, q: x.q, e: x.e, h: x.h, d: x.d, gen: x.gen, retry: 1, helped: false, hidden: [], hintShown: false,
                     opts: U.shuffle(x.opts.map(function (o) { return { t: o.t, ok: o.ok, why: o.why }; })) };
        s.round.splice(Math.min(s.idx + 3, s.round.length), 0, copy);
        requeued = true;
      }
    }
    if (!retry) trackLevel(x, ok);
    var mastered = !!(rec && before < 3 && rec.b >= 3);
    if (mastered) s.mastNew++;
    var last = m.lives ? s.lives <= 0 : (!m.extend && s.idx === s.round.length - 1);
    var res = { before: rec ? before : -1, ok: ok, gain: gain, mastered: mastered, requeued: requeued, last: last, picked: i, given: given, typed: !!typed, x: x, conf: conf || null, slow: slow, mult: E.mult(s.streak), streak: s.streak };
    WF.emit("answered", res);
    WF.store.save();
    return res;
  };

  /* "question" oder "result" */
  E.next = function () {
    var s = E.s;
    E.clearAdv();
    if (s.over) return "result";
    if (s.m.lives && s.lives <= 0) { E.finish(); return "result"; }
    if (s.idx >= s.round.length - 1) {
      if (s.m.extend) {
        var more = E.order(E.pool(s.scope), !s.scope.c).slice(0, 30).map(function (x) { return E.prep(x); });
        if (!more.length) { E.finish(); return "result"; }
        s.round = s.round.concat(more);
      } else { E.finish(); return "result"; }
    }
    s.idx++; s.answered = false; s.shownAt = Date.now();
    return "question";
  };

  E.finish = function () {
    var s = E.s, st = S();
    if (s.over) return;
    s.over = true;
    E.clearAdv();
    if (s.m.id === "blitz" && s.score > st.best.blitz) { st.best.blitz = s.score; s.record = true; }
    if (s.m.id === "survive" && s.score > st.best.survive) { st.best.survive = s.score; s.record = true; }
    /* Tagesrätsel: zählt als gespielt, sobald eine Frage beantwortet ist, auch bei Abbruch.
       So lässt es sich nicht neu starten, nachdem man Antworten gesehen hat. Bonus-XP nur für vollständige Runden. */
    var answered = s.score + s.wrong.length;
    if (s.m.daily && !st.dailyDone[U.today()] && answered > 0) {
      st.dailyDone[U.today()] = { s: s.score, n: answered, log: s.log.slice() };
      if (answered === s.round.length) { E.addXP(30); if (s.score === s.round.length) E.addXP(20); }
    }
    WF.emit("roundEnd", s);
    WF.store.save();
  };
})();
