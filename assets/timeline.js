/* LEROUX100 – „Comment c’est fait / Ako je to urobené“ (7. 11. 2026)
   Celé predstavenie 1:19:52 za 30 s: hlava prechádza osou, bloky sa rozsvecujú, nad osou časť a popisok.
   Spustí sa samo, keď sa na sekciu doroluje; pri odrolovaní sa pozastaví. prefers-reduced-motion a bez JS: statická os.
   Test: ?tla=12 nastaví 12. sekundu animácie a zastaví. */
(function(){
  var RM=false;try{RM=window.matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}
  function pad(n){return (n<10?"0":"")+n}
  function tc(s){s=Math.max(0,Math.round(s));return Math.floor(s/3600)+":"+pad(Math.floor(s%3600/60))+":"+pad(s%60)}
  function q(r,s){return r.querySelector(s)}
  function setup(root){
    if(root.__tla)return root.__tla;
    var TOT=parseFloat(root.getAttribute("data-total"))||4792,DUR=(parseFloat(root.getAttribute("data-dur"))||30)*1000;
    var o={root:root,t:0,playing:false,started:false,ended:false,auto:false,last:0,raf:0};
    root.__tla=o;
    if(RM)return o;
    root.classList.remove("is-static");root.classList.add("is-anim");
    var els=[].slice.call(root.querySelectorAll(".tla-grid [data-a]")).map(function(el){return{el:el,a:+el.getAttribute("data-a"),b:+el.getAttribute("data-b"),s:-1}});
    var parts=[].slice.call(root.querySelectorAll(".tla-pseg"));
    var snd=[].slice.call(root.querySelectorAll(".tla-son [data-mode]")).map(function(el){return{a:+el.getAttribute("data-a"),b:+el.getAttribute("data-b"),m:el.getAttribute("data-mode")}});
    var mus=[].slice.call(root.querySelectorAll(".tla-mus [data-a]")).map(function(el){return{a:+el.getAttribute("data-a"),b:+el.getAttribute("data-b")}});
    var lum=[].slice.call(root.querySelectorAll("[data-light]")).map(function(el){return{a:+el.getAttribute("data-a"),b:+el.getAttribute("data-b"),m:el.getAttribute("data-light")}});
    var caps=[].slice.call(root.querySelectorAll(".tla-steps li")).map(function(li){var c=li.cloneNode(true);var sp=c.querySelector("span");if(sp)c.removeChild(sp);return{t:+li.getAttribute("data-t"),x:c.textContent.trim()}});
    var ph=q(root,".tla-ph"),tcEl=q(root,".tla-tc"),partEl=q(root,".tla-part"),capEl=q(root,".tla-cap"),bar=q(root,".tla-bar span"),axis=q(root,".tla-axis"),
        stS=q(root,".tla-st-s span"),stL=q(root,".tla-st-l span"),pp=q(root,".tla-pp"),grid=q(root,".tla-track");
    var curCap=-1,curSnd="",curLum="",curPart="";
    function find(arr,T){for(var i=0;i<arr.length;i++){if(T>=arr[i].a&&T<arr[i].b)return arr[i]}return null}
    function render(){
      var p=Math.min(1,o.t/DUR),T=p*TOT;
      ph.style.left=(p*100)+"%";bar.style.width=(p*100)+"%";
      tcEl.textContent=tc(T);
      axis.setAttribute("aria-valuenow",Math.round(T));axis.setAttribute("aria-valuetext",tc(T));
      for(var i=0;i<els.length;i++){var e=els[i],s=T>=e.a?(T<e.b||(e.b-e.a<25&&T<e.a+25)?2:1):0;
        if(p>=1)s=1;
        if(s!==e.s){e.s=s;e.el.classList.toggle("is-on",s>0);e.el.classList.toggle("is-now",s===2)}}
      for(var j=0;j<parts.length;j++){var pa=parts[j];if(T>=+pa.getAttribute("data-a")&&(T<+pa.getAttribute("data-b")||j===parts.length-1)){if(curPart!==j){curPart=j;partEl.textContent=pa.getAttribute("data-n")}break}}
      var ci=0;for(var k=0;k<caps.length;k++){if(T>=caps[k].t)ci=k}
      if(ci!==curCap){var first=curCap<0;curCap=ci;
        if(first){capEl.textContent=caps[ci].x}else{capEl.classList.add("is-out");setTimeout(function(){capEl.textContent=caps[curCap].x;capEl.classList.remove("is-out")},260)}}
      var sm=find(snd,T),m=sm?sm.m:(find(mus,T)?"music":"");
      if(m!==curSnd){curSnd=m;root.setAttribute("data-snd",m);stS.textContent=m?(root.getAttribute("data-m-"+m)||""):"–"}
      var lm=find(lum,T),l=lm?lm.m:(lum.length?lum[lum.length-1].m:"");
      if(l!==curLum){curLum=l;root.setAttribute("data-lum",l);stL.textContent=root.getAttribute("data-l-"+l)||""}
      root.classList.toggle("is-end",p>=1);
    }
    function frame(now){
      o.raf=0;if(!o.playing)return;
      var dt=Math.min(100,now-(o.last||now));o.last=now;o.t+=dt;
      if(o.t>=DUR){o.t=DUR;o.ended=true;stop()}
      render();
      if(o.playing)o.raf=requestAnimationFrame(frame);
    }
    function label(){var on=o.playing;pp.setAttribute("aria-label",root.getAttribute(on?"data-pause":"data-play"));root.classList.toggle("is-playing",on)}
    function play(){if(o.ended||o.t>=DUR){o.t=0;o.ended=false}o.started=true;o.playing=true;o.last=0;label();if(!o.raf)o.raf=requestAnimationFrame(frame)}
    function stop(){o.playing=false;label()}
    o.play=play;o.pause=stop;o.render=render;
    o.seek=function(sec){o.t=Math.max(0,Math.min(DUR,sec*1000));o.ended=o.t>=DUR;render()};
    pp.addEventListener("click",function(){o.auto=false;if(o.playing)stop();else play()});
    q(root,".tla-re").addEventListener("click",function(){o.auto=false;o.t=0;o.ended=false;render();play()});
    q(root,".tla-again").addEventListener("click",function(){o.auto=false;o.t=0;o.ended=false;render();play()});
    // posúvanie osou
    var drag=false,was=false;
    function at(ev){var r=grid.getBoundingClientRect();var x=(ev.clientX-r.left)/r.width;o.t=Math.max(0,Math.min(1,x))*DUR;o.ended=o.t>=DUR;o.started=true;render()}
    axis.addEventListener("pointerdown",function(ev){if(ev.button)return;drag=true;was=o.playing;stop();try{axis.setPointerCapture(ev.pointerId)}catch(e){}at(ev)});
    axis.addEventListener("pointermove",function(ev){if(drag)at(ev)});
    function up(){if(!drag)return;drag=false;if(was&&o.t<DUR)play()}
    axis.addEventListener("pointerup",up);axis.addEventListener("pointercancel",up);
    axis.addEventListener("keydown",function(ev){var k=ev.key,d=k==="ArrowRight"?1000:k==="ArrowLeft"?-1000:k==="End"?DUR:k==="Home"?-DUR:0;
      if(k===" "||k==="Enter"){ev.preventDefault();pp.click();return}
      if(d){ev.preventDefault();stop();o.t=Math.max(0,Math.min(DUR,o.t+d));o.ended=o.t>=DUR;o.started=true;render()}});
    // spustenie po dorolovaní, pauza pri odrolovaní
    var m=/[?&]tla=([\d.]+)/.exec(location.search);
    if(m){o.started=true;o.seek(parseFloat(m[1]));label();return o}
    render();label();
    if("IntersectionObserver" in window){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){
        if(e.isIntersecting&&e.intersectionRatio>=.35){if(!o.started||o.auto){o.auto=false;if(!o.ended)play()}}
        else if(o.playing&&e.intersectionRatio<.1){stop();o.auto=true}
      })},{threshold:[0,.1,.35,.6]});
      io.observe(q(root,".tla-stage"));
    }else play();
    return o;
  }
  function init(){[].forEach.call(document.querySelectorAll(".tla"),setup)}
  window.__tlainit=init;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
