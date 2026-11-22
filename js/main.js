/* Einstiegspunkt. Hier steht an EINER Stelle, welche Bausteine die App lädt und in welcher Reihenfolge.
   Ein neues Feature: Datei in js/ anlegen, sich darin mit WF.registerMode / WF.registerEntry / WF.on eintragen,
   und hier eine import-Zeile ergänzen. Zum Abschalten die Zeile auskommentieren. Es gibt keinen Build-Schritt.

   Reihenfolge: Grundlagen → Daten-Bausteine → Logik → Oberfläche → Features. */
import "./core.js";
import "./store.js";
import "./gen.js";
import "./geo.js";
import "./pairs.js";
import "./data.js";
import "./engine.js";
import "./modes.js";
import "./badges.js";
import "./ui.js";
import "./entries.js";

/* Features (unabhängig voneinander, Reihenfolge egal) */
import "./estimate.js";
import "./duel.js";
import "./duellink.js";
import "./cards.js";
import "./browse.js";
import "./stats.js";
import "./reports.js";
import "./share.js";
import "./fx.js";
import "./conf.js";
import "./timeline.js";
import "./typein.js";
import "./wall.js";
import "./version.js";
import "./game.js";
import "./quests.js";
import "./ladder.js";
import "./safe.js";

/* Start: Daten laden, dann die Oberfläche öffnen. */
const WF = window.WF;
function boot() {
  WF.ui.applyPrefs(); WF.ui.loading();
  WF.data.load().then(() => { WF.ui.go("home"); WF.emit("ready"); }).catch(e => { console.error(e); WF.ui.failed(String((e && e.message) || e)); });
}
WF.boot = boot;
boot();
