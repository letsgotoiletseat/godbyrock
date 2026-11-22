/* ---------- 비주얼노벨 · 조사 · 추론 ---------- */
G.VN = (function(){
let q=[], onDone=null, cur=null, typing=false, shown=0, full='', timer=0, auto=false, autoT=0, skipping=false, active=false, mode='vn';
let left=null, right=null, bgKey='void', bgRects=null, log=[], blinkAt=0, talkFlip=false, waitingChoice=false;
const SPEED=[1,2,5];
const BGNAME={hq:'무당협회 협회장실',lab:'공방',train:'전뇌성채행 열차',tunnel:'터널',gate:'전뇌성채 입국심사대',city:'전뇌성채 시가',altar:'접신 장소',clinic:'엔젤 병원',roof:'청룡그룹 지사 옥상',server:'크레인 미디어 서버실',basement:'엔젤 병원 지하'};
let locT=0;
const VOICE={seon:520,sung:262,juon:392,jin:165,skull:165,sejong:220,tracy:660,officer:294,ghost:147,ceo:247,dr:233,sys:880};
let curSp='', blipN=0;
const ROLE={seon:'예언무당 · 동자신',sung:'기술자 · 빙의 체질',juon:'박수 · 장군신',jin:'박수 · 해커',skull:'SKULL · 통신',sejong:'전국무당협회장',tracy:'천재 의사',officer:'입국심사관',ghost:'전뇌 영령',ceo:'크레인 미디어 회장',dr:'엔젤 병원',sys:'시스템 윤동주'};
const ACC={seon:'#ef4a34',sung:'#0f9d8c',juon:'#2f5bea',jin:'#3b3f6b',skull:'#3b3f6b',sejong:'#b3202a',tracy:'#7c4ddb',officer:'#5a6180',ghost:'#14a594',ceo:'#c76a00',dr:'#5a6180',sys:'#0f9d8c'};

function fit(){}
function open(){ if(!active){ active=true; $('vn').classList.add('on'); G.Stage.cover(true); fit(); } }
function close(){ active=false; $('vn').classList.remove('on','inv-idle'); G.Stage.cover(false); clearTimeout(timer); clearTimeout(autoT); left=right=null; $('invHot').innerHTML=''; $('invBar').hidden=true; $('vnChoices').innerHTML=''; hidePanels(); }
function setBg(k,rects){ bgKey=k; bgRects=rects||null; G.Art.bg($('vnBg'),k,bgRects); }
function drawPor(){
  const now=performance.now(), blink=(now%3400)<130;
  const draw=(cv,p,isL)=>{ cv.style.visibility=p?'visible':'hidden'; if(!p) return; cv.classList.toggle('dim',!isL);
    G.Art.portrait(cv,p.id,{mood:p.mood,blink:blink&&p.mood!=='surprise',talk:isL&&typing&&talkFlip,alt:G.CHARS[p.id]&&G.S.wear[p.id]}); };
  draw($('vnL'),left,true); draw($('vnR'),right,false);
}
setInterval(()=>{ if(active){ talkFlip=!talkFlip; drawPor(); } },130);

function say(sp,mood,text){
  text=text.replace('{keys}',G.keysText());
  const think=mood==='think', narr=!sp;
  if(sp){ if(!left||left.id!==sp){ if(left&&left.id!==sp) right=left; left={id:sp,mood:think?'':mood}; if(right&&right.id===sp) right=null; const pl=$('vnL'); pl.classList.remove('pop'); void pl.offsetWidth; pl.classList.add('pop'); } else left.mood=think?'':mood; }
  $('vnName').textContent=narr?'':G.NAMES[sp]||sp; $('vnName').style.visibility=narr?'hidden':'visible'; $('vnName').style.background=''; $('vnName').dataset.sub=ROLE[sp]||''; 
  $('vnText').className=narr?'narr':think?'think':'';
  curSp=sp; full=think?'('+text+')':text; shown=0; typing=true; $('vnNext').style.visibility='hidden';
  log.push((narr?'':(G.NAMES[sp]||sp)+'  ')+full); if(log.length>200) log.shift();
  drawPor(); tick();
}
function tick(){
  clearTimeout(timer);
  if(skipping){ shown=full.length; }
  else { shown=Math.min(full.length,shown+SPEED[G.S.set.text]); if(curSp&&VOICE[curSp]&&(blipN++%3===0)) G.Audio.sfx('blip',VOICE[curSp]); }
  $('vnText').textContent=full.slice(0,shown);
  if(shown<full.length) timer=setTimeout(tick,26);
  else { typing=false; $('vnNext').style.visibility='visible'; drawPor();
    if(skipping) timer=setTimeout(next,30);
    else if(auto) autoT=setTimeout(next,900+full.length*45); }
}
function next(){
  clearTimeout(autoT);
  if(waitingChoice) return;
  if(typing){ shown=full.length; clearTimeout(timer); $('vnText').textContent=full; typing=false; $('vnNext').style.visibility='visible'; drawPor(); if(auto) autoT=setTimeout(next,1200); return; }
  if(!q.length){ const f=onDone; onDone=null; skipping=false; $('vnSkip').setAttribute('aria-pressed','false'); if(f) f(); return; }
  const n=q.shift();
  if(Array.isArray(n)){ say(n[0],n[1],n[2]); return; }
  if(n.bg){ setBg(n.bg); left=right=null; drawPor(); const L=$('vnLoc'); clearTimeout(locT); if(BGNAME[n.bg]&&!skipping){ L.textContent=BGNAME[n.bg]; L.classList.add('on'); locT=setTimeout(()=>L.classList.remove('on'),2400); } else L.classList.remove('on'); return next(); }
  if(n.fx){ if(n.fx==='steps') G.Audio.sfx('steps'); const v=$('vn'); v.classList.remove('fade'); void v.offsetWidth; v.classList.add('fade'); return next(); }
  if(n.c){ choice(n.c.map(o=>o[0]),i=>{ const o=n.c[i]; if(o[1]){ G.S.aff[o[1]]=(G.S.aff[o[1]]||0)+1; G.save(); toast(G.NAMES[o[1]]+'의 호감도가 올랐습니다'); } q=(o[2]||[]).concat(q); next(); }); return; }
  next();
}
function choice(opts,cb){
  skipping=false; $('vnSkip').setAttribute('aria-pressed','false'); waitingChoice=true;
  const box=$('vnChoices'); box.innerHTML='';
  opts.forEach((t,i)=>{ const b=document.createElement('button'); b.type='button'; const k=document.createElement('kbd'); k.textContent=i+1; b.appendChild(k); b.appendChild(document.createTextNode(t)); b.addEventListener('click',ev=>{ ev.stopPropagation(); G.Audio.sfx('ok'); box.innerHTML=''; waitingChoice=false; cb(i); }); box.appendChild(b); });
  box.firstChild.focus();
}
function run(lines,done){ open(); mode='vn'; $('vn').classList.remove('inv-idle'); $('vnBox').hidden=false; q=lines.slice(); onDone=done; next(); }
let toastT=0;
function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('on'),2200); }
function hidePanels(){ $('vnLogPanel').hidden=true; $('vnNotePanel').hidden=true; }

/* 조사: 화면 속 사물을 눌러 살핌 */
function investigate(id,done){
  open(); mode='inv';
  const sc=G.SCENES[id], seen={}; let busy=false;
  const rects=[]; sc.objs.forEach(o=>o.rects.forEach(r=>rects.push(r)));
  setBg(sc.bg,rects); left=right=null; drawPor();
  const hot=$('invHot'); hot.innerHTML='';
  const bar=$('invBar'); bar.hidden=false;
  const upd=()=>{ const n=Object.keys(seen).length; bar.textContent=sc.title+'  ·  조사 '+n+'/'+sc.objs.length; };
  const idle=()=>{ $('vn').classList.add('inv-idle'); $('vnBox').style.borderTopColor=''; $('vnName').style.visibility='hidden'; $('vnText').className='narr'; $('vnText').textContent='화면에서 살펴볼 곳을 누르세요. 방향키로 고르고 Enter로 살펴볼 수도 있습니다.'; $('vnNext').style.visibility='hidden'; };
  sc.objs.forEach(o=>{
    const b=document.createElement('button'); b.type='button'; b.className='hot'; b.setAttribute('aria-label',o.name);
    b.style.left=(o.x/160*100)+'%'; b.style.top=(o.y/90*100)+'%'; b.style.width=(o.w/160*100)+'%'; b.style.height=(o.h/90*100)+'%';
    const lab=document.createElement('span'); lab.textContent=o.name; b.appendChild(lab);
    b.addEventListener('click',ev=>{ ev.stopPropagation(); if(busy||waitingChoice) return; busy=true; $('vn').classList.remove('inv-idle'); G.Audio.sfx('tick'); hot.classList.add('busy');
      q=o.lines.slice(); onDone=()=>{
        if(!seen[o.id]){ seen[o.id]=1; b.classList.add('seen');
          if(o.clue){ G.S.clues[id+'.'+o.id]=o.clue; G.Audio.sfx('clue'); toast('단서 획득: '+o.clue[0]); }
          if(o.aff){ G.S.aff[o.aff]=(G.S.aff[o.aff]||0)+1; }
          G.save(); }
        busy=false; hot.classList.remove('busy'); left=right=null; drawPor(); upd();
        if(Object.keys(seen).length===sc.objs.length){ $('vn').classList.remove('inv-idle'); $('vnName').style.visibility='hidden'; $('vnText').className='narr'; $('vnText').textContent='살펴볼 곳은 다 살폈다.';
          choice(['조사 마치기'],()=>{ hot.innerHTML=''; bar.hidden=true; done(); }); }
        else idle();
      }; next(); });
    hot.appendChild(b);
  });
  upd(); idle();
}
/* 추론: 틀리면 기력이 깎이고, 다 떨어지면 조사부터 다시 */
function deduce(d,done,fail){
  open(); mode='vn'; $('vn').classList.remove('inv-idle'); let hp=3;
  const bar=$('invBar'); bar.hidden=false;
  const ask=()=>{ bar.textContent='추론  ·  기력 '+'●'.repeat(hp)+'○'.repeat(3-hp);
    left={id:'seon',mood:''}; right=null; drawPor(); $('vnName').textContent='추론'; $('vnName').style.background=''; $('vnName').style.visibility='visible'; $('vnText').className=''; $('vnText').textContent=d.q; $('vnNext').style.visibility='hidden';
    choice(d.opts,i=>{
      if(i===d.a){ G.Audio.sfx('clue'); bar.hidden=true; q=d.right.slice(); onDone=()=>done(3-hp); next(); }
      else { hp--; G.Audio.sfx('no'); if(hp<=0){ bar.hidden=true; q=[['seon','sad','머리가 안 돌아간다. 기력이 다했어. 처음부터 다시 살펴보자.']]; onDone=fail; next(); }
        else { q=[d.wrong]; onDone=ask; next(); } }
    }); };
  ask();
}
function showLog(){ const p=$('vnLogPanel'); p.hidden=false; const l=$('vnLogList'); l.innerHTML=''; log.slice(-60).forEach(t=>{ const d=document.createElement('p'); d.textContent=t; l.appendChild(d); }); l.scrollTop=l.scrollHeight; $('vnLogClose').focus(); }
function showNote(){ const p=$('vnNotePanel'); p.hidden=false; const l=$('vnNoteList'); l.innerHTML=''; const ks=Object.keys(G.S.clues);
  if(!ks.length){ const d=document.createElement('p'); d.textContent='아직 모은 단서가 없습니다.'; l.appendChild(d); }
  ks.forEach(k=>{ const c=G.S.clues[k], d=document.createElement('p'); const b=document.createElement('b'); b.textContent=c[0]; d.appendChild(b); d.appendChild(document.createTextNode('  '+c[1])); l.appendChild(d); }); $('vnNoteClose').focus(); }
function bind(){
  $('vnBox').addEventListener('click',()=>{ if(mode==='inv'&&!onDone) return; next(); });
  $('vnScene').addEventListener('click',()=>{ if(mode==='vn') next(); });
  addEventListener('keydown',e=>{ if(!active||!$('vnLogPanel').hidden||!$('vnNotePanel').hidden) return;
    const cb=$('vnChoices').querySelectorAll('button'), m=/^(?:Digit|Numpad)([1-9])$/.exec(e.code);
    if(m&&cb[m[1]-1]){ e.preventDefault(); cb[m[1]-1].click(); return; }
    if((e.code==='Space'||e.code==='Enter')&&document.activeElement.tagName!=='BUTTON'){ e.preventDefault(); if(mode==='inv'&&!onDone) return; next(); } });
  $('vnAuto').addEventListener('click',ev=>{ ev.stopPropagation(); auto=!auto; $('vnAuto').setAttribute('aria-pressed',String(auto)); if(auto&&!typing&&!waitingChoice&&onDone) autoT=setTimeout(next,600); else clearTimeout(autoT); });
  $('vnSkip').addEventListener('click',ev=>{ ev.stopPropagation(); if(waitingChoice||!onDone) return; skipping=!skipping; $('vnSkip').setAttribute('aria-pressed',String(skipping)); if(skipping) next(); });
  $('vnLog').addEventListener('click',ev=>{ ev.stopPropagation(); showLog(); });
  $('vnNote').addEventListener('click',ev=>{ ev.stopPropagation(); showNote(); });
  $('vnLogClose').addEventListener('click',hidePanels); $('vnNoteClose').addEventListener('click',hidePanels);
  addEventListener('resize',()=>{ if(active) fit(); });
}
return {run, investigate, deduce, close, toast, bind, setBg, open, active:()=>active};
})();
