/* LEROUX100 v6 – zväčšenie obrázkov po kliknutí, bez knižníc. 26. 11. 2026 */
(function(){
  var links=[].slice.call(document.querySelectorAll('a.lb'));
  if(!links.length)return;
  var T={sk:['Zavrieť','Predchádzajúci','Ďalší'],fr:['Fermer','Précédent','Suivant'],en:['Close','Previous','Next']}[document.documentElement.lang]||['Zavrieť','Predchádzajúci','Ďalší'];
  var box=document.createElement('div');box.className='lbx';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');
  box.innerHTML='<button class="x" type="button"></button><button class="pv" type="button">&#8249;</button><img alt=""><div class="lbcap"></div><button class="nx" type="button">&#8250;</button>';
  document.body.appendChild(box);
  var img=box.querySelector('img'),cap=box.querySelector('.lbcap'),bx=box.querySelector('.x'),bp=box.querySelector('.pv'),bn=box.querySelector('.nx');
  bx.innerHTML='&times;';bx.setAttribute('aria-label',T[0]);bp.setAttribute('aria-label',T[1]);bn.setAttribute('aria-label',T[2]);
  var cur=-1,last=null;
  function show(i){cur=(i+links.length)%links.length;var a=links[cur];img.src=a.getAttribute('href');var im=a.querySelector('img');img.alt=im?im.alt:'';cap.textContent=a.getAttribute('data-cap')||'';}
  function open(i){last=document.activeElement;show(i);box.classList.add('on');document.body.classList.add('lb-open');bx.focus();}
  function close(){box.classList.remove('on');document.body.classList.remove('lb-open');img.removeAttribute('src');if(last)last.focus();}
  links.forEach(function(a,i){a.addEventListener('click',function(e){if(e.ctrlKey||e.metaKey||e.shiftKey)return;e.preventDefault();open(i);});});
  bx.addEventListener('click',close);
  bp.addEventListener('click',function(e){e.stopPropagation();show(cur-1);});
  bn.addEventListener('click',function(e){e.stopPropagation();show(cur+1);});
  box.addEventListener('click',function(e){if(e.target===box)close();});
  document.addEventListener('keydown',function(e){if(!box.classList.contains('on'))return;if(e.key==='Escape')close();else if(e.key==='ArrowLeft')show(cur-1);else if(e.key==='ArrowRight')show(cur+1);});
})();
