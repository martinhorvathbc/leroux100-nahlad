/* LEROUX100 v6 – Epilóg s anglickými titulkami (26. 11. 2026).
   Titulky kreslí vlastná vrstva .epi-cap (Cormorant Garamond), aby mali knižnú typografiu.
   Natívne titulky prehliadača sa zapnú len vo fullscreene alebo keď si ich divák vyberie v menu prehrávača. */
(function () {
  function pick(v, lang) {
    for (var i = 0; i < v.textTracks.length; i++) if (v.textTracks[i].language === lang) return v.textTracks[i];
    return null;
  }
  document.querySelectorAll('.epi-player').forEach(function (w) {
    var v = w.querySelector('video'), cap = w.querySelector('.epi-cap'), btn = w.parentNode.querySelector('.epi-cc');
    if (!v || !cap) return;
    var tr = pick(v, 'en'), on = true, fs = false;
    if (!tr) return;
    w.classList.add('js');
    function render() {
      var c = tr.activeCues, txt = '';
      if (on && !fs && tr.mode === 'hidden' && c && c.length) txt = c[0].text;
      cap.textContent = '';
      if (txt) {
        txt.split('\n').forEach(function (line, i) {
          if (i) cap.appendChild(document.createElement('br'));
          var s = document.createElement('span'); s.textContent = line; cap.appendChild(s);
        });
      }
      cap.hidden = !txt;
    }
    function sync() {
      if (fs) { if (on && tr.mode !== 'showing') tr.mode = 'showing'; }
      else if (on && tr.mode === 'showing' && w.dataset.native !== '1') tr.mode = 'hidden';
      render();
    }
    tr.mode = 'hidden';
    tr.addEventListener('cuechange', render);
    v.textTracks.addEventListener && v.textTracks.addEventListener('change', function () {
      // divák si titulky prepol v menu prehrávača: necháme natívne, vlastnú vrstvu skryjeme
      if (!fs) w.dataset.native = tr.mode === 'showing' ? '1' : '';
      if (tr.mode === 'disabled') on = false;
      if (btn) btn.setAttribute('aria-pressed', on && tr.mode !== 'disabled' ? 'true' : 'false');
      render();
    });
    document.addEventListener('fullscreenchange', function () { fs = document.fullscreenElement === v; if (!fs && on) tr.mode = 'hidden'; sync(); });
    v.addEventListener('webkitbeginfullscreen', function () { fs = true; sync(); });
    v.addEventListener('webkitendfullscreen', function () { fs = false; if (on) tr.mode = 'hidden'; sync(); });
    if (btn) btn.addEventListener('click', function () {
      on = !on; w.dataset.native = '';
      tr.mode = on ? (fs ? 'showing' : 'hidden') : 'disabled';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      render();
    });
    render();
  });
})();
