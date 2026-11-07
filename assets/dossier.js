/* LEROUX100 – sekcia „Dossier de production“ (7. 11. 2026). Vlastný JS, bez knižníc a bez CDN.
   Rozbaľovací strom (klik, klávesnica), tlačidlá Rozbaliť/Zbaliť všetko, odhalenie osi pri zobrazení.
   prefers-reduced-motion: všetko otvorené a statické (aj pri zmene nastavenia za behu). Bez JS: všetko viditeľné. */
(function () {
  "use strict";
  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

  function init(sec) {
    if (sec.__dsr) return;
    sec.__dsr = 1;
    sec.classList.add("dsr-js");
    var nodes = [].slice.call(sec.querySelectorAll(".dsr-node"));
    var btns = nodes.map(function (n) { return n.querySelector(".dsr-btn"); });
    var toolO = sec.querySelector('[data-act="open"]');
    var toolC = sec.querySelector('[data-act="close"]');

    function set(node, open) {
      node.classList.toggle("is-open", open);
      var b = node.querySelector(".dsr-btn");
      b.setAttribute("aria-expanded", open ? "true" : "false");
    }
    function setAll(open) { nodes.forEach(function (n) { set(n, open); }); }

    function applyMotion() {
      if (mq.matches) {
        sec.classList.add("dsr-static");
        sec.classList.add("dsr-in");
        setAll(true);
        btns.forEach(function (b) { b.setAttribute("tabindex", "-1"); b.setAttribute("aria-disabled", "true"); });
      } else {
        var wasStatic = sec.classList.contains("dsr-static");
        sec.classList.remove("dsr-static");
        btns.forEach(function (b) { b.removeAttribute("tabindex"); b.removeAttribute("aria-disabled"); });
        if (wasStatic || !sec.__started) { setAll(false); set(nodes[0], true); }
        sec.__started = 1;
      }
    }

    btns.forEach(function (b, i) {
      b.addEventListener("click", function () {
        if (mq.matches) return;
        set(nodes[i], !nodes[i].classList.contains("is-open"));
      });
      b.addEventListener("keydown", function (e) {
        if (mq.matches) return;
        var k = e.key, j = -1;
        if (k === "ArrowDown") j = (i + 1) % btns.length;
        else if (k === "ArrowUp") j = (i - 1 + btns.length) % btns.length;
        else if (k === "Home") j = 0;
        else if (k === "End") j = btns.length - 1;
        if (j > -1) { e.preventDefault(); btns[j].focus(); }
      });
    });
    if (toolO) toolO.addEventListener("click", function () { setAll(true); });
    if (toolC) toolC.addEventListener("click", function () { setAll(false); });

    // odhalenie osi mechaniky pri zobrazení
    var axis = sec.querySelector(".dsr-axis");
    function reveal() { sec.classList.add("dsr-in"); }
    if (axis && "IntersectionObserver" in window && !mq.matches) {
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { io.disconnect(); reveal(); }
      }, { threshold: 0.35 });
      io.observe(axis);
    } else { reveal(); }

    applyMotion();
    if (mq.addEventListener) mq.addEventListener("change", applyMotion);
    else if (mq.addListener) mq.addListener(applyMotion);
  }

  function boot() { [].slice.call(document.querySelectorAll(".dsr")).forEach(init); }
  window.__dsrinit = boot;   // pre náhľad s routerom (skryté stránky)
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
