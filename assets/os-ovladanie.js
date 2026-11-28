/* LEROUX100 (26. 11. 2026): prevzaté zo živého fantomopery.sk, popisky podľa jazyka stránky (sk / fr / en). */
var OVL_T=(function(){var L=(document.documentElement.lang||"sk").slice(0,2),D={
 sk:{grp:"Ovládanie osi",re:"Od začiatku",vol:"Hlasitosť",volA:"Hlasitosť hudby",play:"Prehrať",pause:"Pauza"},
 fr:{grp:"Commandes de l’axe",re:"Depuis le début",vol:"Volume",volA:"Volume de la musique",play:"Lecture",pause:"Pause"},
 en:{grp:"Timeline controls",re:"From the start",vol:"Volume",volA:"Music volume",play:"Play",pause:"Pause"}};return D[L]||D.sk})();
/* Fantóm opery na Zámku: viditeľné ovládanie osi „Hodina dvadsať za osem minút“ (Martin 12. 11. 2026 6.45: „Nemá to button“).
   Textové tlačidlá Prehrať / Pauza a Od začiatku pri hodinách. Nič v osi nemenia: len volajú existujúce okrúhle tlačidlá (.tla-pp, .tla-re)
   a popis berú z atribútov data-play a data-pause. Samostatný súbor, aby ho os_build.py neprepísal. */
(function () {
  function build(root) {
    if (root.__ovl) return;
    var clock = root.querySelector(".tla-clock"), pp = root.querySelector(".tla-pp"), re = root.querySelector(".tla-re");
    if (!clock || !pp || !re) return;
    root.__ovl = true;
    var wrap = document.createElement("div");
    wrap.className = "tla-txtctl";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", OVL_T.grp);
    var a = document.createElement("button"); a.type = "button"; a.className = "tla-txtbtn is-main";
    var b = document.createElement("button"); b.type = "button"; b.className = "tla-txtbtn"; b.textContent = OVL_T.re;
    wrap.appendChild(a); wrap.appendChild(b);
    /* Zapnúť hudbu: pôvodné tlačidlo (s jeho obsluhou v timeline.js) sa presunie sem, vedľa Od začiatku; k nemu hlasitosť */
    var snd = root.querySelector(".tla-snd"), aud = root.querySelector(".tla-aud");
    if (snd && aud) {
      wrap.appendChild(snd);
      var vol = document.createElement("label"); vol.className = "tla-vol";
      var vl = document.createElement("span"); vl.className = "tla-vol-l"; vl.textContent = OVL_T.vol;
      var rg = document.createElement("input"); rg.type = "range"; rg.min = "0"; rg.max = "100"; rg.step = "1"; rg.value = "100";
      rg.setAttribute("aria-label", OVL_T.volA);
      vol.appendChild(vl); vol.appendChild(rg); wrap.appendChild(vol);
      /* prehliadače, kde sa audio.volume nedá meniť (iPhone, iPad), idú cez Web Audio GainNode */
      var gain = null, ctx = null, native = null;
      function nativeOk() {
        if (native !== null) return native;
        var keep = aud.volume; try { aud.volume = 0.5; } catch (e) {}
        native = Math.abs(aud.volume - 0.5) < 0.01; try { aud.volume = keep; } catch (e) {}
        return native;
      }
      function apply() {
        var v = rg.value / 100;
        rg.setAttribute("aria-valuetext", rg.value + " %");
        if (nativeOk()) { aud.volume = v; return; }
        var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        if (!ctx) {
          try { ctx = new AC(); var src = ctx.createMediaElementSource(aud); gain = ctx.createGain(); src.connect(gain); gain.connect(ctx.destination); } catch (e) { ctx = null; return; }
        }
        if (ctx.state === "suspended" && ctx.resume) ctx.resume();
        gain.gain.value = v * v;
      }
      rg.addEventListener("input", apply);
      snd.addEventListener("click", function () { if (!nativeOk() && ctx && ctx.state === "suspended") ctx.resume(); else if (!nativeOk() && !ctx) apply(); });
      apply();
    }
    clock.parentNode.insertBefore(wrap, clock.nextSibling);
    function sync() {
      var on = root.classList.contains("is-playing");
      a.textContent = root.getAttribute(on ? "data-pause" : "data-play") || (on ? OVL_T.pause : OVL_T.play);
      a.setAttribute("aria-pressed", on ? "true" : "false");
    }
    a.addEventListener("click", function () { pp.click(); });
    b.addEventListener("click", function () { re.click(); });
    if (window.MutationObserver) new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["class"] });
    sync();
  }
  function init() { [].forEach.call(document.querySelectorAll(".tla"), build); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
