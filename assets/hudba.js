/* LEROUX100 – „Écoutez la musique / Ukážka hudby“ (7. 11. 2026)
   Prehrávač trojice ukážok: naraz hrá jedna stopa, priebeh sa dá posúvať myšou, dotykom aj klávesmi, vizualizácia je kruh sály z animácie osi
   (12 reproduktorov, diváci dokola) so zlatými vlnami podľa živého zvuku (Web Audio API, AnalyserNode). Vlastný kód, bez knižníc a CDN.
   prefers-reduced-motion: žiadne vlny, kruh sa nakreslí raz. Ak analyzátor nedostane dáta (napr. súbor otvorený z disku), vlny poháňa obálka hlasitosti stopy.
   Test: ?mus=1&t=12 vyberie 2. stopu a nastaví 12. sekundu bez prehrávania. */
(function(){
  var RM=false;try{RM=window.matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}
  var PI2=Math.PI*2;
  function pad(n){return n<10?"0"+n:""+n}
  function mmss(s){s=Math.max(0,Math.floor(s+.001));return Math.floor(s/60)+":"+pad(s%60)}
  function q(r,s){return r.querySelector(s)}
  function clamp(v,a,b){return v<a?a:v>b?b:v}
  var active=null; // inštancia, ktorá práve hrá (na stránke hrá naraz len jedna)

  function setup(root){
    if(root.__mus)return root.__mus;
    var N=+root.getAttribute("data-n")||3;
    var tracks=[].slice.call(root.querySelectorAll(".mus-trk")).map(function(li,i){
      var w=q(li,".mus-wave");
      return{li:li,i:i,src:li.getAttribute("data-src"),dur:parseFloat(li.getAttribute("data-dur"))||30,title:li.getAttribute("data-title"),
        btn:q(li,".mus-btn"),wave:w,bars:[].slice.call(w.querySelectorAll("i")),dtxt:q(li,".mus-dur"),on:-1,
        peaks:[].slice.call(w.querySelectorAll("i")).map(function(b){return(parseFloat(b.style.height)||5)/100})};
    });
    var o={root:root,cur:0,playing:false};root.__mus=o;
    var nameEl=q(root,".mus-name"),kickEl=q(root,".mus-kick"),tcEl=q(root,".mus-tc"),totEl=q(root,".mus-tot"),errEl=q(root,".mus-error"),cv=q(root,".mus-cv");
    var L={play:root.getAttribute("data-play")||"Play",pause:root.getAttribute("data-pause")||"Pause",kick:root.getAttribute("data-kick")||"%d / %d",artist:root.getAttribute("data-artist")||""};
    root.classList.add("is-js");tracks[0].li.classList.add("is-cur");
    var audio=null,ctx=null,an=null,fd=null,td=null,srcNode=null,haveData=false,silentFrames=0,pendingSeek=null,loaded=-1,graphOff=false;

    /* ---------- zvuk ---------- */
    function ensureAudio(){
      if(audio)return;
      audio=new Audio();audio.preload="none";
      audio.addEventListener("ended",function(){o.playing=false;seekTo(0);state();kickLoop()});
      audio.addEventListener("pause",function(){if(!audio.ended){o.playing=false;state();kickLoop()}});
      audio.addEventListener("play",function(){o.playing=true;errEl.hidden=true;state();kickLoop()});
      audio.addEventListener("error",function(){o.playing=false;errEl.hidden=false;state()});
      audio.addEventListener("loadedmetadata",function(){
        if(pendingSeek!=null){var ps=pendingSeek;pendingSeek=null;try{audio.currentTime=ps}catch(e){}verifySeek(ps)}
        if(isFinite(audio.duration)&&audio.duration>1){tracks[o.cur].dur=audio.duration;totEl.textContent="/ "+mmss(audio.duration)}
      });
    }
    function ensureGraph(){
      if(ctx||RM||graphOff)return;
      try{
        // MediaElementSource zo zdroja mimo pôvodu stránky (alebo zo súboru na disku) by dal ticho: vtedy analyzátor nepoužijeme
        if(location.protocol==="file:"||new URL(tracks[0].src,location.href).origin!==location.origin){graphOff=true;return}
        var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
        ctx=new AC();an=ctx.createAnalyser();an.fftSize=1024;an.smoothingTimeConstant=.78;
        srcNode=ctx.createMediaElementSource(audio);srcNode.connect(an);an.connect(ctx.destination);
        fd=new Uint8Array(an.frequencyBinCount);td=new Uint8Array(an.fftSize);
      }catch(e){ctx=null;an=null}
    }
    function load(i){
      if(loaded===i)return;
      loaded=i;audio.src=blobs[i]||tracks[i].src;
    }
    function select(i){
      if(i===o.cur&&loaded===i)return;
      var prev=o.cur;o.cur=i;
      tracks[prev].wave.style.setProperty("--p",0);paintBars(tracks[prev],0);tracks[prev].li.classList.remove("is-cur","is-playing");
      nameEl.textContent=tracks[i].title;kickEl.textContent=L.kick.replace("%d",i+1).replace("%d",N);
      totEl.textContent="/ "+mmss(tracks[i].dur);tcEl.textContent="0:00";
      tracks[i].li.classList.add("is-cur");
      try{if("mediaSession" in navigator&&window.MediaMetadata)navigator.mediaSession.metadata=new MediaMetadata({title:tracks[i].title,artist:L.artist,album:"LEROUX100"})}catch(e){}
    }
    function play(i,ratio){
      if(active&&active!==o&&active.pause)active.pause();
      active=o;ensureAudio();ensureGraph();
      if(ctx&&ctx.state==="suspended"){try{ctx.resume()}catch(e){}}
      var sw=i!==o.cur||loaded!==i;
      select(i);if(sw){load(i);audio.currentTime=0}
      if(ratio!=null){seekTo(ratio)}
      var p=audio.play();if(p&&p.catch)p.catch(function(){o.playing=false;state()});
    }
    function pause(){if(audio&&!audio.paused)audio.pause()}
    function seekTo(ratio){
      var t=tracks[o.cur],s=clamp(ratio,0,1)*(audio&&isFinite(audio.duration)&&audio.duration>1&&loaded===o.cur?audio.duration:t.dur);
      if(!audio||loaded!==o.cur){paint(ratio);return}
      if(audio.readyState<1){pendingSeek=s}else{try{audio.currentTime=s}catch(e){}verifySeek(s)}
      paint(ratio);
    }
    // server bez Range (napr. lokálny náhľad) neumožní posun v streame: ukážka má < 1 MB, tak ju stiahneme celú a posunieme v nej
    var lastSeek=null,blobs={};
    function verifySeek(s){
      var mark=lastSeek={i:o.cur,s:s,at:Date.now()};
      setTimeout(function(){
        if(lastSeek!==mark||!audio||loaded!==mark.i||/^blob:/.test(audio.src))return;
        var exp=mark.s+(audio.paused?0:(Date.now()-mark.at)/1000);
        if(Math.abs(audio.currentTime-exp)>2.5)viaBlob(mark.i,exp)
      },400);
    }
    function viaBlob(i,s){
      function use(u){
        if(loaded!==i)return;
        var was=!audio.paused;audio.src=u;pendingSeek=s;
        if(was){var pp=audio.play();if(pp&&pp.catch)pp.catch(function(){})}
      }
      if(blobs[i]){use(blobs[i]);return}
      if(!window.fetch||!window.URL||!URL.createObjectURL)return;
      fetch(tracks[i].src).then(function(r){return r.blob()}).then(function(b){blobs[i]=URL.createObjectURL(b);use(blobs[i])}).catch(function(){});
    }
    o.pause=pause;o.play=play;

    /* ---------- stav a priebeh ---------- */
    function state(){
      tracks.forEach(function(t){
        var on=o.playing&&t.i===o.cur;
        t.li.classList.toggle("is-playing",on);
        var lab=(on?L.pause:L.play)+" : "+t.title;t.btn.setAttribute("aria-label",lab);
      });
      root.classList.toggle("is-playing",o.playing);
    }
    function paintBars(t,p){
      var k=Math.floor(p*t.bars.length+.0001);
      if(k===t.on)return;
      var a=Math.min(k,t.on<0?0:t.on),b=Math.max(k,t.on<0?t.bars.length:t.on);
      for(var j=Math.max(0,a);j<Math.min(t.bars.length,b);j++)t.bars[j].classList.toggle("on",j<k);
      if(t.on<0){for(var m=0;m<t.bars.length;m++)t.bars[m].classList.toggle("on",m<k)}
      t.on=k;
    }
    function paint(p){
      var t=tracks[o.cur],dur=(audio&&loaded===o.cur&&isFinite(audio.duration)&&audio.duration>1)?audio.duration:t.dur,s=p*dur;
      t.wave.style.setProperty("--p",p);paintBars(t,p);
      tcEl.textContent=mmss(s);
      t.wave.setAttribute("aria-valuenow",Math.round(s));t.wave.setAttribute("aria-valuetext",mmss(s)+" / "+mmss(dur));
      t.wave.setAttribute("aria-valuemax",Math.round(dur));
    }
    function progress(){
      if(!audio||loaded!==o.cur)return 0;
      var d=isFinite(audio.duration)&&audio.duration>1?audio.duration:tracks[o.cur].dur;
      if(pendingSeek!=null)return clamp(pendingSeek/d,0,1);
      return clamp(audio.currentTime/d,0,1);
    }

    /* ---------- ovládanie ---------- */
    tracks.forEach(function(t){
      t.btn.addEventListener("click",function(){
        if(o.playing&&o.cur===t.i)pause();else play(t.i);
      });
      var drag=false,was=false;
      function at(ev){var r=t.wave.getBoundingClientRect();return clamp((ev.clientX-r.left)/r.width,0,1)}
      t.wave.addEventListener("pointerdown",function(ev){
        if(ev.button)return;
        var r=at(ev);
        if(t.i!==o.cur||loaded!==t.i){play(t.i,r);return}
        drag=true;was=o.playing;try{t.wave.setPointerCapture(ev.pointerId)}catch(e){}
        seekTo(r);
      });
      t.wave.addEventListener("pointermove",function(ev){if(drag)seekTo(at(ev))});
      function up(){drag=false}
      t.wave.addEventListener("pointerup",up);t.wave.addEventListener("pointercancel",up);
      t.wave.addEventListener("keydown",function(ev){
        var k=ev.key;
        if(k===" "||k==="Enter"){ev.preventDefault();t.btn.click();return}
        var d=k==="ArrowRight"||k==="ArrowUp"?2:k==="ArrowLeft"||k==="ArrowDown"?-2:0;
        if(k==="Home"||k==="End"){ev.preventDefault();if(t.i!==o.cur||loaded!==t.i)play(t.i,k==="Home"?0:.98);else seekTo(k==="Home"?0:.98);return}
        if(d){ev.preventDefault();var base=(t.i===o.cur&&loaded===t.i)?progress():0,dur=t.dur;
          if(t.i!==o.cur||loaded!==t.i)play(t.i,clamp(base+d/dur,0,1));else seekTo(clamp(base+d/dur,0,1))}
      });
    });

    /* ---------- kruh sály ---------- */
    var g=cv.getContext("2d"),W=0,S=1,DPR=1;
    var NB=72,spec=new Float32Array(NB),band=new Float32Array(12),wav=new Float32Array(96),lvl=0,srcAng=-Math.PI/2,lastT=0,raf=0,idleT=0;
    var tgS=new Float32Array(NB),tgW=new Float32Array(96),tgL=0,tgB=new Float32Array(12);
    function size(){
      DPR=Math.min(2,window.devicePixelRatio||1);
      var w=cv.clientWidth||320;W=Math.round(w*DPR);cv.width=W;cv.height=W;S=W/240;
      drawFrame(0,true);
    }
    // živé dáta z analyzátora, inak obálka stopy (súbor z disku: audio zo zdroja bez CORS dáva analyzátoru ticho)
    function sample(t){
      var live=false;
      if(an&&o.playing){
        an.getByteFrequencyData(fd);an.getByteTimeDomainData(td);
        var sum=0,dev=0,i;for(i=0;i<fd.length;i+=4)sum+=fd[i];for(i=0;i<td.length;i+=8)dev+=Math.abs(td[i]-128);
        if(sum>0||dev>2){live=true;haveData=true;silentFrames=0}else{silentFrames++}
      }
      if(live){
        var bins=fd.length,half=NB/2,k,a,b,m,v,s2=0;
        for(k=0;k<half;k++){
          a=Math.floor(2*Math.pow(150/2,k/half));b=Math.max(a+1,Math.floor(2*Math.pow(150/2,(k+1)/half)));
          m=0;for(v=a;v<b&&v<bins;v++)if(fd[v]>m)m=fd[v];
          var x=Math.pow(m/255,1.25)*(1+k/half*.35);
          tgS[k]=tgS[NB-1-k]=clamp(x,0,1);
        }
        for(k=0;k<96;k++){tgW[k]=(td[Math.floor(k*td.length/96)]-128)/128}
        var e=0;for(k=0;k<td.length;k+=4){var z=(td[k]-128)/128;e+=z*z}
        tgL=clamp(Math.sqrt(e/(td.length/4))*3.2,0,1);
        for(k=0;k<12;k++){var c=0;for(v=0;v<NB/12;v++)c+=tgS[k*NB/12+v];tgB[k]=c/(NB/12)}
      }else if(o.playing&&(!an||silentFrames>25)){
        fake(t);
      }else if(!o.playing){
        tgL=0;for(var j=0;j<NB;j++)tgS[j]=0;for(j=0;j<96;j++)tgW[j]=0;for(j=0;j<12;j++)tgB[j]=0;
      }
    }
    function fake(t){
      var tr=tracks[o.cur],p=progress(),f=p*(tr.peaks.length-1),i=Math.floor(f),pk=tr.peaks[i]*(1-(f-i))+tr.peaks[Math.min(i+1,tr.peaks.length-1)]*(f-i);
      var lv=clamp((pk-.05)*1.15,0,1);tgL=lv*.8;var ts=t/1000,k;
      for(k=0;k<NB;k++){var kk=k<NB/2?k:NB-1-k;tgS[k]=clamp(lv*(.28+.72*Math.abs(Math.sin(kk*.43+ts*1.9+Math.sin(kk*.21+ts*.7)*2)))*(1-kk/NB*.8),0,1)}
      for(k=0;k<96;k++)tgW[k]=lv*Math.sin(k/96*PI2*3+ts*5.2)*.6*Math.sin(k/96*PI2*2+ts*1.3);
      for(k=0;k<12;k++){var c=0;for(var v=0;v<NB/12;v++)c+=tgS[k*NB/12+v];tgB[k]=c/(NB/12)}
    }
    function ease(dt){
      var up=1-Math.exp(-dt/45),dn=1-Math.exp(-dt/190),i,d;
      for(i=0;i<NB;i++){d=tgS[i]-spec[i];spec[i]+=d*(d>0?up:dn)}
      for(i=0;i<96;i++){wav[i]+=(tgW[i]-wav[i])*(1-Math.exp(-dt/60))}
      for(i=0;i<12;i++){d=tgB[i]-band[i];band[i]+=d*(d>0?up:dn)}
      d=tgL-lvl;lvl+=d*(d>0?up:1-Math.exp(-dt/260));
    }
    function drawFrame(t,still){
      var c=W/2,s=S;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,W);g.globalCompositeOperation="source-over";
      var breath=(RM||still)?0:.5+.5*Math.sin(t/1900),L0=lvl;
      // pozadie: bordová žiara sály
      var bg=g.createRadialGradient(c,c,0,c,c,118*s);bg.addColorStop(0,"rgba(42,13,18,"+(.55+.2*L0)+")");bg.addColorStop(.7,"rgba(18,8,6,.35)");bg.addColorStop(1,"rgba(8,5,4,0)");
      g.fillStyle=bg;g.beginPath();g.arc(c,c,118*s,0,PI2);g.fill();
      // obežná dráha
      g.save();g.strokeStyle="rgba(107,82,54,.55)";g.lineWidth=.7*s;g.setLineDash([1*s,3.2*s]);g.beginPath();g.arc(c,c,104*s,0,PI2);g.stroke();g.restore();
      // diváci (rovnako ako v pôdoryse osi: 36 a 28 bodov)
      g.fillStyle="#1a110c";g.strokeStyle="#6b5236";g.lineWidth=.55*s;
      var j,a;
      for(j=0;j<36;j++){a=PI2*(j+.5)/36;g.beginPath();g.arc(c+76*s*Math.cos(a),c+76*s*Math.sin(a),2*s,0,PI2);g.fill();g.stroke()}
      for(j=0;j<28;j++){a=PI2*j/28;g.beginPath();g.arc(c+62*s*Math.cos(a),c+62*s*Math.sin(a),1.7*s,0,PI2);g.fill();g.stroke()}
      // pódium: pulz podľa hlasitosti
      var sg=g.createRadialGradient(c,c,0,c,c,34*s);sg.addColorStop(0,"rgba(239,204,138,"+(.06+.42*L0+.04*breath)+")");sg.addColorStop(1,"rgba(17,10,7,.9)");
      g.fillStyle=sg;g.strokeStyle="rgba(214,170,92,.42)";g.lineWidth=.8*s;g.beginPath();g.arc(c,c,34*s,0,PI2);g.fill();g.stroke();
      // zlatá vlna (časová oblasť) okolo pódia
      if(!RM&&!still){
        var gl=g.createLinearGradient(0,c-60*s,0,c+60*s);gl.addColorStop(0,"rgba(255,227,160,.95)");gl.addColorStop(1,"rgba(214,170,92,.85)");
        g.save();g.strokeStyle=gl;g.lineWidth=1.5*s;g.lineJoin="round";g.shadowColor="rgba(239,204,138,.7)";g.shadowBlur=10*s*(.3+L0);
        g.beginPath();
        var M=96,amp=13+10*L0,r0=49+2*breath*(1-L0);
        for(j=0;j<=M;j++){var jj=j%M,ang=PI2*jj/M-Math.PI/2,sm=(wav[jj]+wav[(jj+1)%M]+wav[(jj+M-1)%M])/3,rr=r0+sm*amp*1.4+(spec[jj%NB]-.0)*4;
          var px=c+rr*s*Math.cos(ang),py=c+rr*s*Math.sin(ang);if(j===0)g.moveTo(px,py);else g.lineTo(px,py)}
        g.closePath();g.stroke();
        // druhá, slabšia vlna: ozvena
        g.globalAlpha=.35;g.lineWidth=.9*s;g.beginPath();
        for(j=0;j<=M;j++){var j2=j%M,ang2=PI2*j2/M-Math.PI/2,rr2=r0+4+wav[(j2+M-6)%M]*amp*1.1;var qx=c+rr2*s*Math.cos(ang2),qy=c+rr2*s*Math.sin(ang2);if(j===0)g.moveTo(qx,qy);else g.lineTo(qx,qy)}
        g.closePath();g.stroke();g.restore();
      }else{
        g.save();g.strokeStyle="rgba(239,204,138,.5)";g.lineWidth=1.2*s;g.beginPath();g.arc(c,c,50*s,0,PI2);g.stroke();g.restore();
      }
      // spektrum: zlaté lúče medzi divákmi a reproduktormi
      g.save();g.lineCap="round";
      for(j=0;j<NB;j++){
        a=PI2*(j+NB/2)/NB-Math.PI/2;var v=spec[j],len=1.4+v*15.5,r1=83;
        g.strokeStyle="rgba("+(214+Math.round(25*v))+","+(170+Math.round(34*v))+","+(92+Math.round(46*v))+","+(.28+.72*Math.min(1,v*1.4))+")";
        g.lineWidth=1.9*s;g.beginPath();g.moveTo(c+r1*s*Math.cos(a),c+r1*s*Math.sin(a));g.lineTo(c+(r1+len)*s*Math.cos(a),c+(r1+len)*s*Math.sin(a));g.stroke();
      }
      g.restore();
      // zdroj zvuku obieha sálu; reproduktory svietia podľa pásma a blízkosti zdroja
      var sa=srcAng;
      for(j=0;j<12;j++){
        a=PI2*j/12-Math.PI/2;var sx=c+104*s*Math.cos(a),sy=c+104*s*Math.sin(a);
        var dif=Math.abs(((a-sa)%PI2+PI2*1.5)%PI2-Math.PI),near=Math.max(0,1-dif/.9);
        var glow=clamp(band[j]*.9+near*L0*.9,0,1);
        if(glow>.02){g.globalCompositeOperation="lighter";var hg=g.createRadialGradient(sx,sy,0,sx,sy,22*s);hg.addColorStop(0,"rgba(239,204,138,"+(.75*glow)+")");hg.addColorStop(.4,"rgba(239,204,138,"+(.25*glow)+")");hg.addColorStop(1,"rgba(239,204,138,0)");
          g.fillStyle=hg;g.beginPath();g.arc(sx,sy,22*s,0,PI2);g.fill();g.globalCompositeOperation="source-over"}
        g.save();g.translate(sx,sy);g.rotate(a+Math.PI/2);g.fillStyle=glow>.05?"rgb("+Math.round(29+190*glow)+","+Math.round(19+150*glow)+","+Math.round(13+80*glow)+")":"#1d130d";g.strokeStyle="#8a6a3a";g.lineWidth=.8*s;
        g.beginPath();if(g.roundRect)g.roundRect(-4.5*s,-4*s,9*s,8*s,1.6*s);else g.rect(-4.5*s,-4*s,9*s,8*s);g.fill();g.stroke();g.restore();
      }
      if(!RM&&!still&&(L0>.03||o.playing)){
        var ssx=c+104*s*Math.cos(sa),ssy=c+104*s*Math.sin(sa);
        g.globalCompositeOperation="lighter";
        for(j=9;j>=0;j--){var ta=sa-j*.075,tx=c+104*s*Math.cos(ta),ty=c+104*s*Math.sin(ta),al=(1-j/10)*(.12+.5*L0);
          var tg=g.createRadialGradient(tx,ty,0,tx,ty,(14-j*.9)*s);tg.addColorStop(0,"rgba(255,230,170,"+al+")");tg.addColorStop(1,"rgba(255,230,170,0)");g.fillStyle=tg;g.beginPath();g.arc(tx,ty,(14-j*.9)*s,0,PI2);g.fill()}
        g.strokeStyle="rgba(239,204,138,"+(.1+.3*L0)+")";g.lineWidth=.8*s;g.beginPath();g.moveTo(ssx,ssy);g.lineTo(c+40*s*Math.cos(sa),c+40*s*Math.sin(sa));g.stroke();
        g.globalCompositeOperation="source-over";
      }
    }
    function loop(now){
      raf=0;
      var dt=Math.min(80,now-(lastT||now));lastT=now;
      sample(now);ease(dt);
      if(o.playing){srcAng+=dt/1000*PI2/17*(.55+.9*lvl)}
      drawFrame(now,false);
      if(o.playing)paint(progress());
      var calm=!o.playing&&lvl<.004;for(var i=0;i<NB&&calm;i++)if(spec[i]>.01)calm=false;
      if(!calm&&visible)raf=requestAnimationFrame(loop);else if(calm){lastT=0;drawFrame(now,false)}
    }
    var visible=true;
    function kickLoop(){if(RM){drawFrame(0,true);if(o.playing)tick();return}if(!raf){lastT=0;raf=requestAnimationFrame(loop)}}
    // RM a záloha: priebeh bez vĺn sa obnovuje časovačom
    var tickT=0;
    function tick(){if(tickT)return;tickT=setInterval(function(){if(!o.playing){clearInterval(tickT);tickT=0;return}paint(progress())},250)}
    if(!RM){
      setInterval(function(){if(o.playing&&!raf&&!document.hidden)paint(progress())},500);
      document.addEventListener("visibilitychange",function(){if(!document.hidden&&o.playing)kickLoop()});
    }
    if("IntersectionObserver" in window){
      new IntersectionObserver(function(es){es.forEach(function(e){visible=e.isIntersecting;if(visible&&(o.playing||lvl>.004))kickLoop()})},{threshold:0}).observe(cv);
    }
    if("ResizeObserver" in window)new ResizeObserver(function(){size()}).observe(cv);else window.addEventListener("resize",size);
    size();
    // spustí sa ihneď aj v režime bez vĺn, aby sa priebeh obnovoval
    var m=/[?&]mus=(\d)/.exec(location.search);
    if(m){var ti=/[?&]t=([\d.]+)/.exec(location.search);var i0=clamp(+m[1]-1,0,N-1);ensureAudio();select(i0);load(i0);
      if(ti){var ts=parseFloat(ti[1]);tracks[i0].wave.style.setProperty("--p",ts/tracks[i0].dur);paintBars(tracks[i0],ts/tracks[i0].dur);tcEl.textContent=mmss(ts)}}
    return o;
  }
  function init(){[].forEach.call(document.querySelectorAll(".mus"),setup)}
  window.__musinit=init;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
