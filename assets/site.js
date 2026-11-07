(function(){
  var lang=document.documentElement.lang||"fr";
  function $all(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  /* burger */
  document.addEventListener("click",function(e){
    var b=e.target.closest&&e.target.closest(".burger");
    if(b){var n=b.closest(".top").querySelector(".nav");var o=n.classList.toggle("open");b.setAttribute("aria-expanded",o?"true":"false")}
  });
  /* countdown to LEROUX NIGHT: 15 Apr 2027, 20:00 CEST */
  var target=Date.parse("2027-04-15T20:00:00+02:00");
  function tick(){
    var d=Math.max(0,Math.ceil((target-Date.now())/86400000));
    $all(".cd-n").forEach(function(el){el.textContent=d});
  }
  tick();
  /* form -> mailto (no backend, no automatic sending) */
  var TO="william@leroux100.com";
  var L={
    fr:{lic:"Demande de licence",nuit:"Rejoindre la NUIT LEROUX",both:"Demande de licence et NUIT LEROUX",
        h:"Bonjour,",t:"Théâtre / institution",c:"Ville, pays",n:"Nom",e:"E-mail",l:"Langue de la représentation",m:"Message",
        done:"Votre messagerie s’ouvre avec le message prêt à envoyer. Rien n’est envoyé automatiquement."},
    sk:{lic:"Žiadosť o licenciu",nuit:"Pripojiť sa k LEROUX NOCI",both:"Žiadosť o licenciu a LEROUX NOC",
        h:"Dobrý deň,",t:"Divadlo / inštitúcia",c:"Mesto, krajina",n:"Meno",e:"E-mail",l:"Jazyk predstavenia",m:"Správa",
        done:"Otvorí sa váš poštový program s pripravenou správou. Nič sa neodosiela automaticky."}
  }[lang==="sk"?"sk":"fr"];
  function bind(form){
    if(form.__b)return;form.__b=1;
    form.addEventListener("submit",function(ev){
      ev.preventDefault();
      var g=function(n){var x=form.elements[n];return x?x.value.trim():""};
      var kind=(form.querySelector("input[name=kind]:checked")||{}).value||"lic";
      var subj="LEROUX100 – "+L[kind]+(g("theatre")?" – "+g("theatre"):"");
      var body=L.h+"\n\n"+L.t+": "+g("theatre")+"\n"+L.c+": "+g("city")+"\n"+L.n+": "+g("name")+"\n"+L.e+": "+g("email")+"\n"+L.l+": "+g("lang")+"\n\n"+g("msg")+"\n";
      var ok=form.parentNode.querySelector(".ok");if(ok){ok.textContent=L.done;ok.style.display="block"}
      location.href="mailto:"+TO+"?subject="+encodeURIComponent(subj)+"&body="+encodeURIComponent(body);
    });
  }
  function init(){
    $all("form.f").forEach(bind);
    $all("a[data-kind]").forEach(function(a){
      a.addEventListener("click",function(){try{sessionStorage.setItem("l100kind",a.getAttribute("data-kind"))}catch(e){}});
    });
    var k=null;try{k=sessionStorage.getItem("l100kind")}catch(e){}
    if(!k&&location.hash==="#nuit")k="nuit";
    if(k){$all("form.f input[name=kind]").forEach(function(r){if(r.value===k)r.checked=true})}
  }
  window.__l100init=init;
  init();
})();
