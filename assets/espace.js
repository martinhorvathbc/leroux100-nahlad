/* LEROUX100 – uzavreté zóny (DEMO). Nič sa neodosiela ani neukladá: žiadny fetch, žiadne cookies, žiadne localStorage. Dáta sú v <script id="esp-cfg">. */
(function(){
  "use strict";
  var el=document.getElementById("esp-cfg");
  if(!el)return;
  var C;try{C=JSON.parse(el.textContent)}catch(e){return}
  var login=document.getElementById("esp-login"),board=document.getElementById("esp-board");
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

  if(C.kind==="licencies")licencies();

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

})();
