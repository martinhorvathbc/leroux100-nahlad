/* LEROUX100 – uzavreté zóny (DEMO). Nič sa neodosiela ani neukladá: žiadny fetch, žiadne cookies, žiadne localStorage. Dáta sú v <script id="esp-cfg">. */
(function(){
  "use strict";
  var el=document.getElementById("esp-cfg");
  if(!el)return;
  var C;try{C=JSON.parse(el.textContent)}catch(e){return}
  var U=C.ui,login=document.getElementById("esp-login"),board=document.getElementById("esp-board");
  var $=function(s,r){return (r||document).querySelector(s)};
  var first=true;

  /* ---------- prepínanie login / prehľad (hash #apercu) ---------- */
  function route(){
    var on=location.hash==="#apercu";
    login.hidden=on;board.hidden=!on;
    if(!first)window.scrollTo(0,0);
    first=false;
  }
  window.addEventListener("hashchange",route);
  route();
  document.addEventListener("click",function(e){
    var a=e.target.closest&&e.target.closest(".esp-out");
    if(a){e.preventDefault();if(location.hash)history.pushState("",document.title,location.pathname+location.search);route()}
  });

  /* ---------- prihlasovací formulár: nič sa neodosiela ---------- */
  var form=$(".esp-form");
  if(form){
    form.addEventListener("submit",function(e){
      e.preventDefault();
      var pw=$(".esp-pwrow input",form);if(pw)pw.value="";
      $(".esp-msg",form).hidden=false;
    });
    var eye=$(".esp-eye",form);
    eye.addEventListener("click",function(){
      var pw=$(".esp-pwrow input",form),show=pw.type==="password";
      pw.type=show?"text":"password";
      eye.textContent=show?eye.getAttribute("data-hide"):eye.getAttribute("data-show");
    });
  }

  if(C.kind==="licencies")return licencies();
  partenaires();

  /* ---------- Espace licenciés ---------- */
  function licencies(){
    var btns=[].slice.call(document.querySelectorAll(".esp-ty"));
    function pick(i){
      btns.forEach(function(b,k){b.setAttribute("aria-checked",k===i?"true":"false");b.tabIndex=k===i?0:-1});
      $("#esp-type").textContent=C.types[i].n;$("#esp-valid").textContent=C.types[i].v;
    }
    btns.forEach(function(b,i){
      b.addEventListener("click",function(){pick(i)});
      b.addEventListener("keydown",function(e){
        var k=e.key,n=btns.length,j=i;
        if(k==="ArrowDown"||k==="ArrowRight")j=(i+1)%n;else if(k==="ArrowUp"||k==="ArrowLeft")j=(i+n-1)%n;else return;
        e.preventDefault();pick(j);btns[j].focus();
      });
    });
    pick(0);
  }

  /* ---------- Espace partenaires ---------- */
  function partenaires(){
    var coll=new Intl.Collator(C.lang==="sk"?"sk":"fr",{sensitivity:"base"});
    var rows=C.rows.slice(),S={c:"",s:"",q:"",x:true,n:30};
    function cname(r){return C.countries[r.k].n}
    rows.sort(function(a,b){
      return (b.s-a.s)||(a.x?0:1)-(b.x?0:1)||coll.compare(cname(a),cname(b))||coll.compare(a.m||"",b.m||"")||coll.compare(a.t||"",b.t||"");
    });
    function norm(s){return (s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")}
    function tname(r){return r.x?U.ex_t.replace("%s",r.x):r.t}
    function mname(r){return r.x?U.ex_c:r.m}
    rows.forEach(function(r){r._q=norm(tname(r)+" "+mname(r)+" "+cname(r))});
    var base=function(){return S.x?rows:rows.filter(function(r){return !r.x})};

    function fmtD(d){var p=d.split("-");return C.lang==="sk"?(+p[2])+". "+(+p[1])+". "+p[0]:p[2]+"/"+p[1]+"/"+p[0]}
    function mk(tag,cls,txt){var n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=txt;return n}

    /* súhrn */
    function tiles(){
      var b=base(),n=function(f,list){return (list||b).filter(f).length};
      var ex=b.filter(function(r){return r.x});
      var defs=[[U.t_total,b.length,ex.length,null],
        [U.t_contacted,n(function(r){return r.s>=1}),n(function(r){return r.s>=1},ex),null],
        [U.t_replied,n(function(r){return r.s>=2}),n(function(r){return r.s>=2},ex),null],
        [U.t_sent,n(function(r){return r.s>=3}),n(function(r){return r.s>=3},ex),null],
        [U.t_paid,n(function(r){return r.s===4}),n(function(r){return r.s===4},ex),n(function(r){return r.s===3})]];
      var box=$("#esp-tiles");box.textContent="";
      defs.forEach(function(d,i){
        var t=mk("div","esp-tile");
        if(i===4){
          var yn=mk("div","yn"),y=mk("div"),no=mk("div");
          y.appendChild(mk("b",null,d[1]));y.appendChild(mk("small",null,U.t_yes));
          no.appendChild(mk("b",null,d[3]));no.appendChild(mk("small",null,U.t_no));
          yn.appendChild(y);yn.appendChild(no);t.appendChild(yn);
          t.appendChild(mk("span","l",d[0]));t.appendChild(mk("span","s",U.t_no+" = "+U.t_no_s));
        }else{
          t.appendChild(mk("b",null,d[1]));t.appendChild(mk("span","l",d[0]));
        }
        if(d[2])t.appendChild(mk("span","s",U.t_of_which+" "+d[2]+" "+U.t_ex));
        box.appendChild(t);
      });
    }

    /* zoznam krajín s počtami */
    function chips(){
      var cnt={},b=base();
      b.forEach(function(r){cnt[r.k]=(cnt[r.k]||0)+1});
      var box=$("#esp-chips");box.textContent="";
      var keys=Object.keys(cnt);
      $("#esp-cn").textContent=keys.filter(function(k){return k!=="_ex"}).length+" · "+b.length;
      function chip(k,label,c){
        var bt=mk("button","esp-chip");bt.type="button";bt.setAttribute("aria-pressed",S.c===k?"true":"false");
        bt.appendChild(document.createTextNode(label+" "));bt.appendChild(mk("i",null,c));
        bt.addEventListener("click",function(){S.c=(S.c===k&&k!=="")?"":k;S.n=30;$("#esp-fc").value=S.c;draw()});
        return bt;
      }
      var all=mk("div","esp-chips");all.appendChild(chip("",U.f_all,b.length));box.appendChild(all);
      [["e",U.c_eu],["w",U.c_w],["x",U.c_x]].forEach(function(g){
        var ks=keys.filter(function(k){return C.countries[k].r===g[0]});
        if(!ks.length)return;
        ks.sort(function(a,b2){return cnt[b2]-cnt[a]||coll.compare(C.countries[a].n,C.countries[b2].n)});
        var grp=mk("div","esp-cg"),wrap=mk("div","esp-chips");
        grp.appendChild(mk("b",null,g[1]));
        ks.forEach(function(k){wrap.appendChild(chip(k,C.countries[k].n,cnt[k]))});
        grp.appendChild(wrap);box.appendChild(grp);
      });
    }

    /* filtre */
    function selects(){
      var fc=$("#esp-fc"),fs=$("#esp-fs"),o=function(v,t){var x=mk("option",null,t);x.value=v;return x};
      fc.textContent="";fc.appendChild(o("",U.f_allc));
      var ks=Object.keys(C.countries).filter(function(k){return k!=="_ex"}).sort(function(a,b){return coll.compare(C.countries[a].n,C.countries[b].n)});
      ks.push("_ex");
      ks.forEach(function(k){fc.appendChild(o(k,C.countries[k].n))});
      fs.textContent="";fs.appendChild(o("",U.f_alls));
      C.states.forEach(function(t,i){fs.appendChild(o(String(i),t))});
      fc.addEventListener("change",function(){S.c=fc.value;S.n=30;draw()});
      fs.addEventListener("change",function(){S.s=fs.value;S.n=30;draw()});
      $("#esp-fq").addEventListener("input",function(e){S.q=norm(e.target.value.trim());S.n=30;table()});
      $("#esp-fx").addEventListener("change",function(e){S.x=e.target.checked;S.n=30;draw()});
      $("#esp-more").addEventListener("click",function(){S.n+=60;table()});
    }

    /* tabuľka */
    function table(){
      var list=base().filter(function(r){
        return (!S.c||r.k===S.c)&&(S.s===""||r.s===+S.s)&&(!S.q||r._q.indexOf(S.q)>-1);
      });
      var tb=$("#esp-tb");tb.textContent="";
      var frag=document.createDocumentFragment();
      list.slice(0,S.n).forEach(function(r){
        var tr=mk("tr",r.x?"ex":"");
        function td(label,cls){var c=mk("td",cls||"");c.setAttribute("data-l",label);tr.appendChild(c);return c}
        td(U.th_country).textContent=cname(r);
        td(U.th_city).textContent=mname(r);
        var t=td(U.th_theatre,"t");t.appendChild(document.createTextNode(tname(r)));
        if(r.x)t.appendChild(mk("span","esp-tag",U.ex_tag));
        var ch=td(U.th_channel);
        if(r.c)ch.textContent=C.channels[r.c];else ch.appendChild(mk("span","esp-dash","–"));
        var d=td(U.th_date);
        if(r.s>=3&&r.d)d.textContent=fmtD(r.d);else d.appendChild(mk("span","esp-dash","–"));
        var st=td(U.th_state),bd=mk("span","esp-b s"+r.s),pp=mk("span","esp-pips");
        pp.setAttribute("aria-hidden","true");
        for(var i=1;i<=4;i++)pp.appendChild(mk("i",i<=r.s?"on":""));
        bd.appendChild(pp);bd.appendChild(document.createTextNode(C.states[r.s]));st.appendChild(bd);
        var p=td(U.th_paid);
        if(r.s===4)p.appendChild(mk("span","esp-yes","✓ "+U.paid_yes));
        else if(r.s===3)p.appendChild(mk("span","esp-no",U.paid_no));
        else p.appendChild(mk("span","esp-dash","–"));
        var w=td(U.th_who);
        if(r.w)w.textContent=U.who.replace("%s",r.w);else w.appendChild(mk("span","esp-dash","–"));
        frag.appendChild(tr);
      });
      if(!list.length){var tr=mk("tr"),c=mk("td",null,U.none);c.colSpan=8;tr.appendChild(c);frag.appendChild(tr)}
      tb.appendChild(frag);
      $("#esp-count").textContent=U.shown.replace("%s",Math.min(S.n,list.length)).replace("%s",list.length);
      $("#esp-more").parentNode.hidden=list.length<=S.n;
    }
    function draw(){tiles();chips();table()}

    selects();draw();
    if(window.matchMedia&&window.matchMedia("(max-width:860px)").matches)$("#esp-countries").open=false;
  }
})();
