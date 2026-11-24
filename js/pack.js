/* Paket-Modus: spielt eine feste Liste von Fragen (opts.ids) im Lernmodus.
   Genutzt von Lernpfaden und Themenwochen. Titel kommt über opts.title. */
(function () {
  "use strict";
  var WF = window.WF, D = WF.data;
  WF.registerMode({
    id: "pack", title: "Paket", learn: true, helps: "free", requeue: true, scoped: false, hidden: true,
    desc: "Feste Fragenliste",
    build: function (s) { return (s.opts.ids || []).map(function (id) { return D.byId[id]; }).filter(Boolean); }
  });
})();
