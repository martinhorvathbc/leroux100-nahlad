/* LEROUX100 – vizualizácia sály: plátna sa pomaly spúšťajú z tmy podľa rolovania (a pomaly aj samy).
   prefers-reduced-motion: statický obraz (--p:1), žiadny cyklus. Bez JS: statický obraz. */
(function(){
  var RM=false;try{RM=window.matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}
  var items=[],raf=0,io=null;
  function clamp(x){return x<0?0:x>1?1:x}
  function collect(){
    items=[].slice.call(document.querySelectorAll(".vz")).map(function(el){
      if(el.__vz)return el.__vz;
      var o={el:el,mode:el.getAttribute("data-mode")||"view",p:0,t0:0,top0:null,done:false,vis:false};
      el.__vz=o;
      if(RM){el.style.setProperty("--p","1");o.done=true;return o}
      el.classList.add("vz-live");el.style.setProperty("--p","0");
      return o;
    });
  }
  function target(o,now){
    var r=o.el.getBoundingClientRect(),vh=window.innerHeight||800;
    if(r.height<5||r.bottom<0||r.top>vh){o.vis=false;return null}
    o.vis=true;
    if(!o.t0)o.t0=now;
    if(o.top0===null)o.top0=r.top;
    var ps;
    if(o.mode==="top"){ps=clamp((o.top0-r.top)/(r.height*.8))}
    else{ps=clamp((vh*.92-r.top)/(vh*.42+r.height/2))}
    var el=(now-o.t0)/(o.mode==="top"?26000:15000);
    var pt=1-Math.pow(1-clamp(el),2);
    return Math.max(ps,pt);
  }
  function frame(now){
    raf=0;var busy=false;
    items.forEach(function(o){
      if(o.done)return;
      var t=target(o,now);
      o.el.classList.toggle("vz-on",o.vis);
      if(t===null)return;
      o.p+=(t-o.p)*.035;
      if(t>=1&&o.p>.995){o.p=1;o.done=true}
      o.el.style.setProperty("--p",o.p.toFixed(4));
      busy=true;
    });
    if(busy)raf=requestAnimationFrame(frame);
  }
  function kick(){if(!raf&&!RM)raf=requestAnimationFrame(frame)}
  function init(){
    collect();
    items.forEach(function(o){o.el.classList.add("vz-on")});
    if(RM)return;
    if(!io&&"IntersectionObserver" in window){
      io=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle("vz-on",e.isIntersecting)});kick()},{rootMargin:"80px"});
    }
    if(io)items.forEach(function(o){if(!o.io){o.io=1;io.observe(o.el)}});
    kick();
  }
  window.addEventListener("scroll",kick,{passive:true});
  window.addEventListener("resize",kick);
  window.__vizinit=init;
  init();
})();
