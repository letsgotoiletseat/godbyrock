/* ---------- 화면 흐름: 타이틀 · 홈 · 스토리 맵 · 곡 선택(캐러셀) · 파트너 · 상점 · 설정 · 결과 ---------- */
G.App = (function(){
const SCREENS=['boot','title','menu','album','story','songs','team','shop','settings','idcard','pause','result'];
const RANKS=['갑','을','병','정','무'], RMUL=[1.3,1.15,1,.9,.8];
const VERDICT=['영령이 한을 풀고 편히 잠들었습니다.','영령이 고개를 끄덕이며 물러갔습니다.','영령이 조금은 누그러졌습니다.','영령이 아직 서성이고 있습니다.','영령이 전뇌를 떠돌고 있습니다.'];
const MISSIONS=['굿 성공','을 등급 이상','아이고 없이 완주'];
const STEPNAME={idcard:'인증',vn:'대화',inv:'조사',deduce:'추론',gut:'굿'};
const DCOL=['#1fa59b','#f5c518','#c4502f'];
const CHAPCOL={pro:'#0f3a24',ch1:'#151b44',ch2:'#3a2a1e',ch3:'#2e130d',ch4:'#0b2c2a'};
const FORTUNE=['오늘의 굿 성공 확률 71%. 나머지 29는 별이 흐려 보이지 않습니다.','동쪽에서 귀인이 옵니다. 아마 택배입니다.','긴 천을 끝까지 쥐는 사람에게 복이 옵니다.',
  '도깨비불은 늘 두 박자 먼저 거짓말을 합니다. 바닥의 별을 믿으세요.','오늘은 사과를 먹기 좋은 날입니다.','장군신의 기분이 좋습니다. 신명을 길게 이어 보세요.',
  '해골물 주의보. 마시기 전에 한 번 더 확인하세요.','별이 맑습니다. 만신 굿에 도전해 볼 만합니다.','심부름은 백진혁에게 시키지 마십시오.'];
let cur='title', selSong='g04', selDiff=1, ctx=null, teamBack='lobby', assist=false, epRun=null, rebinding=-1, resetArm=false, lastGut=null;
let selPack='gongu';
let selChap=-1, teamIdx=0, setTab=0, talkI=0, cutT=0, lastHover=null, quitArm=0, ctaFn=null, wheelT=0, smallOk=false, countRaf=0, pvT=0, cards={};
const el=(tag,cls,txt)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; };
const btn=(txt,cls,fn)=>{ const b=el('button',cls,txt); b.type='button'; b.addEventListener('click',fn); return b; };
const por=(id,alt,mood)=>{ const c=el('canvas','por'); c.width=48; c.height=60; c.dataset.por=id; if(alt) c.dataset.alt='1'; if(mood) c.dataset.mood=mood; return c; };
const charOpen=id=>G.STORY_LOCK||!G.CHARS[id].from||G.S.cleared[G.CHARS[id].from];
const songOpen=id=>G.STORY_LOCK||!G.SONGS[id].from||G.S.cleared[G.SONGS[id].from];
/* 앨범 표지: 캐릭터 도트 대신 곡 번호 + 제목 + 전통 무늬(구름·물결) 타이포 표지 */
function jacket(node,s,show){ node.innerHTML=''; node.style.background=jgrad(s); node.classList.add('jk');
  const ids=Object.keys(G.SONGS), no=String(ids.indexOf(s.id||ids.find(k=>G.SONGS[k]===s))+1).padStart(2,'0');
  node.appendChild(el('span','jk-pat')); node.appendChild(el('span','jk-no',no)); node.appendChild(el('span','jt',show===false?'? ? ?':s.title));
  node.appendChild(el('span','jk-sub',s.bpm+' BPM · '+(s.tag||''))); }
const jgrad=s=>'linear-gradient(160deg,'+s.tint.ui+' 0%,'+s.tint.soft+' 100%)';
const josa=(w,a,b)=>{ const c=w.charCodeAt(w.length-1)-0xAC00; return w+((c>=0&&c<=11171&&c%28)?a:b); };
const LVC={};
function songLv(id,d){ const k=id+d; if(LVC[k]) return LVC[k];
  const sg=G.Audio.song(id), w=G.Audio.chart(id,d).reduce((a,x)=>a+(x.len?1.5:x.kind==='g'?1.4:1),0), nps=w/(sg.len-sg.pre);
  return LVC[k]=Math.max(1,Math.min(12,Math.round(nps*2.1+d*1.0-.6))); }

/* 16:9 고정 스테이지를 창에 맞춤 */
function fitStage(){
  const s=Math.min(innerWidth/1920,innerHeight/1080);
  $('stage').style.transform='translate(-50%,-50%) scale('+s+')';
  if(G.Stage.setScale) G.Stage.setScale(s);
  const small=innerWidth<960||innerHeight<540||innerWidth/innerHeight<1.3;
  $('small').hidden=!(small&&!smallOk);
}
function fullscreen(){ const d=document.documentElement, no=()=>G.VN.toast('브라우저가 전체 화면을 막았습니다. F11 키를 써 보세요.');
  try{ const p=document.fullscreenElement?document.exitFullscreen():(d.requestFullscreen&&d.requestFullscreen()); if(p&&p.catch) p.catch(no); }catch(e){ no(); } }

let prevScr='title';
function show(id){
  const menu=!!id&&id!=='pause'&&id!=='boot';
  $('bg').hidden=!menu; G.Stage.cover(menu||G.VN.active());
  if(menu&&id!==prevScr&&prevScr!==null&&prevScr!=='boot'&&!G.calm){ const w=$('wipe'); w.classList.remove('on'); void w.offsetWidth; w.classList.add('on'); clearTimeout(show.t); show.t=setTimeout(()=>w.classList.remove('on'),620); }
  cur=id; prevScr=id;
  SCREENS.forEach(s=>$(s).classList.toggle('on',s===id)); $('pauseBtn').classList.toggle('on',id===null&&G.Stage.state()==='play');
  if(id!=='songs'){ clearTimeout(pvT); G.Audio.stopPreview(); }
  status(); paint();
}
function status(){
  const lv=G.level(), max=lv>=G.LV.length;
  document.querySelectorAll('.st-lv').forEach(e=>e.textContent='Lv.'+lv);
  document.querySelectorAll('.st-bar i').forEach(e=>e.style.width=Math.round(G.lvProgress()*100)+'%');
  document.querySelectorAll('.st-exp').forEach(e=>e.textContent=max?'MAX':(G.S.exp-G.LV[lv-1])+'/'+(G.LV[lv]-G.LV[lv-1]));
  document.querySelectorAll('.st-coin').forEach(e=>e.textContent='엽전 '+G.S.coins);
}
/* 스탠딩 일러스트: 받은 캐릭터는 큰 초상화 자리에 도트 대신 일러스트를 그림 */
const ILL={seon:'art/seon.png'}, ILLIMG={};
function illImg(id){ if(!ILL[id]) return null; let im=ILLIMG[id]; if(!im){ im=ILLIMG[id]=new Image(); im.onload=()=>paint(); im.src=ILL[id]; } return im.complete&&im.naturalWidth?im:null; }
function drawIll(c,id){ const im=illImg(id); if(!im) return false; if(c.dataset.drawn===id) return true;
  const W=480,H=600; c.width=W; c.height=H; c.style.imageRendering='auto'; const x=c.getContext('2d'); x.clearRect(0,0,W,H);
  const k=Math.min(W/im.naturalWidth,H/im.naturalHeight), w=im.naturalWidth*k, h=im.naturalHeight*k; x.drawImage(im,(W-w)/2,H-h,w,h); c.dataset.drawn=id; return true; }
function paint(){ const blink=(performance.now()%3400)<140;
  document.querySelectorAll('.screen.on canvas[data-por]').forEach(c=>{ const id=c.dataset.por;
    if(c.dataset.ill&&drawIll(c,id)) return;
    if(c.dataset.drawn){ delete c.dataset.drawn; c.width=48; c.height=60; c.style.imageRendering=''; }
    G.Art.portrait(c,id,{blink,mood:c.dataset.mood||'',alt:c.dataset.alt?c.dataset.alt==='1':(G.CHARS[id]&&G.S.wear[id])}); }); }
setInterval(paint,140);
function cutin(id,line){ const c=$('cutin'); $('cutWho').textContent=G.CHARS[id].name; $('cutLine').textContent=line;
  c.classList.remove('on'); void c.offsetWidth; c.classList.add('on'); clearTimeout(cutT); cutT=setTimeout(()=>c.classList.remove('on'),1900); }

/* ---------- 메인 메뉴 (아르케아식) ---------- */
function lobby(){ ctx=null; assist=false; menu(); }
function menu(){ G.Audio.amb(true); hubInfo(); show('menu'); $('navMusic').focus(); }
function freePlay(){ ctx=null; assist=false; songs(); }
function hubInfo(){
  const id=G.S.char, c=G.CHARS[id], a=G.S.aff[id]||0;
  $('homePor').dataset.por=id; $('homeHan').textContent=c.god; $('homeName').textContent=c.name; $('homePass').textContent='「'+c.passive+'」 '+c.desc;
  talkI=a>=4?2:a>=2?1:0; $('homeBubble').textContent=c.talk[talkI];
  $('fortune').textContent=FORTUNE[Math.floor(Date.now()/864e5)%FORTUNE.length];
  const nx=G.EPORDER.find(e=>!G.S.cleared[e]), go=$('navNext'); go.innerHTML='';
  const add=(cls,t)=>go.appendChild(el('span',cls,t));
  add("lab","NEXT");
  if(nx){ const e=G.EPS[nx], p=G.S.prog[nx]||0, lvOk=G.level()>=e.lv;
    add('gn',ROMAN[G.EPORDER.indexOf(nx)]); add('gt',e.title); add('gs',!lvOk?'Lv.'+e.lv+' 필요':p>0?'이어서 '+p+'/'+e.steps.length:'NEW!');
    go.classList.toggle('new',lvOk); go.dataset.ep=nx; }
  else { add('gn','✓'); add('gt','모두 완료'); add('gs','다시 보기'); go.classList.remove('new'); go.dataset.ep=''; }
  $('navMusic').querySelector('b').textContent='자유 굿';
  $('navAlbum').classList.toggle('new',!!G.S.newWall);
  $('navNext').hidden=!!G.STORY_LOCK; $('navStory').classList.toggle('soon',!!G.STORY_LOCK); $('navStory').querySelector('b').textContent=G.STORY_LOCK?'스토리 · 준비 중':'스토리';
}
function talk(){ const c=G.CHARS[G.S.char], a=G.S.aff[G.S.char]||0, n=a>=4?3:a>=2?2:1; talkI=(talkI+1)%n; $('homeBubble').textContent=c.talk[talkI]; G.Audio.sfx('blip',520);
  const h=$('homeChar'); h.classList.remove('squash'); void h.offsetWidth; h.classList.add('squash'); }

/* ---------- 스토리 (Act 카드) ---------- */
const ROMAN=['P','Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ'];
const ACTS=[{n:'ACT I',t:'별 헤는 밤',eps:['pro','ch1','ch2']},{n:'ACT II',t:'굿바이락',eps:['ch3','ch4']}];
function epState(id){ const e=G.EPS[id], done=!!G.S.cleared[id], needOk=!e.need||!!G.S.cleared[e.need], lvOk=G.level()>=e.lv; return {e,done,needOk,lvOk,open:needOk&&lvOk,prog:G.S.prog[id]||0}; }
function chapBtn(i){ return $('actWrap').querySelector('[data-i="'+i+'"]'); }
function story(){
  G.Audio.amb(true);
  if(selChap<0) selChap=Math.max(0,G.EPORDER.findIndex(id=>{ const s=epState(id); return s.open&&!s.done; }));
  renderStory(); show('story'); chapBtn(selChap).focus();
}
function renderStory(){
  const wrap=$('actWrap'); wrap.innerHTML='';
  ACTS.forEach(act=>{ const g=el('div','act'), all=act.eps.every(x=>G.S.cleared[x]), any=act.eps.some(x=>epState(x).open||G.S.cleared[x]);
    const h=el('div','act-h'); h.appendChild(el('span','lab',act.n)); h.appendChild(el('b',null,any?act.t:'? ? ?')); if(all) h.appendChild(el('span','act-ok','CLEAR')); g.appendChild(h);
    const row=el('div','act-row');
    act.eps.forEach(id=>{ const i=G.EPORDER.indexOf(id), s=epState(id), seen=s.open||s.done;
      const b=btn('','chap'+(s.done?' done':'')+(s.open?'':' lock'),()=>{ if(i===selChap){ startChap(); return; } selChap=i; G.Audio.sfx('hover'); renderStory(); chapBtn(i).focus(); });
      b.dataset.i=i; b.style.setProperty('--cc',CHAPCOL[id]); b.setAttribute('aria-pressed',String(i===selChap));
      b.appendChild(el('span','dia',ROMAN[i])); const pc=por(s.e.face,false,'smile'); pc.dataset.ill='1'; if(!seen) pc.classList.add('sil'); b.appendChild(pc);
      const cap=el('span','cap'); cap.appendChild(el('span','lab',i===0?'PROLOGUE':'CHAPTER '+i)); cap.appendChild(el('b',null,seen?s.e.sub:'잠김'));
      const bar=el('span','cbar'), f=el('i'); f.style.width=(s.done?100:Math.round(s.prog/s.e.steps.length*100))+'%'; bar.appendChild(f); cap.appendChild(bar);
      cap.appendChild(el('small',null,s.done?'CLEAR':!s.needOk?'이전 장 완료 필요':!s.lvOk?'Lv.'+s.e.lv+' 필요':s.prog+' / '+s.e.steps.length));
      b.appendChild(cap); if(!s.open) b.appendChild(el('span','lk','🔒'));
      row.appendChild(b); });
    g.appendChild(row); wrap.appendChild(g); });
  const id=G.EPORDER[selChap], s=epState(id), seen=s.open||s.done;
  $('ciNo').textContent=(selChap===0?'PROLOGUE':'CHAPTER '+selChap)+' · '+s.e.title; $('ciTitle').textContent=seen?s.e.sub:'? ? ?';
  $('ciSyn').textContent=seen?s.e.syn:'아직 별이 보여 주지 않은 이야기입니다.';
  const nodes=$('ciSteps'); nodes.innerHTML='';
  s.e.steps.forEach((st,k)=>{ const t=Object.keys(st)[0]; nodes.appendChild(el('li',(s.done&&!s.prog)||k<s.prog?'done':k===s.prog&&s.open?'now':'',STEPNAME[t])); });
  const go=$('ciGo'); go.disabled=!s.open; go.textContent=!s.open?'잠김':s.prog>0?'이어 감상하기 ▶':s.done?'다시 보기':'감상하기 ▶';
  $('ciLock').textContent=!s.needOk?josa(G.EPS[s.e.need].title,'을','를')+' 마치면 열립니다.':!s.lvOk?'레벨 '+s.e.lv+'이 필요합니다 (지금 Lv.'+G.level()+'). 자유 굿으로 경험치를 모으세요.':s.done?'이미 마친 이야기입니다. 완료 보상은 한 번만 받습니다.':'';
  paint();
}
function startChap(){ const id=G.EPORDER[selChap], s=epState(id); if(!s.open){ G.Audio.sfx('no'); return; } G.Audio.sfx('ok'); runEpisode(id); }
function runEpisode(id){
  const ep=G.EPS[id]; let i=G.S.prog[id]||0; if(i>=ep.steps.length) i=0;
  selChap=G.EPORDER.indexOf(id);
  const go=()=>{
    if(i>=ep.steps.length) return complete();
    G.S.prog[id]=i; G.save();
    const s=ep.steps[i], nx=()=>{ i++; go(); }; G.Audio.amb(true);
    if(s.idcard){ G.VN.close(); idcard(nx); }
    else if(s.vn){ show(null); G.VN.run(s.vn,nx); }
    else if(s.inv){ show(null); G.VN.investigate(s.inv,nx); }
    else if(s.deduce){ show(null); G.VN.deduce(s.deduce,lost=>{ const x=40-10*lost; G.addExp(x); G.VN.toast('추론 성공 · 경험치 +'+x); nx(); },()=>{ while(i>0&&!ep.steps[i].inv) i--; go(); }); }
    else if(s.gut){ G.VN.close(); ctx={ep:id,song:s.gut.song,fixed:s.gut.diff,next:nx}; songs(); }
  };
  const complete=()=>{ const first=!G.S.cleared[id]; G.S.cleared[id]=true; G.S.prog[id]=0; G.VN.close(); ctx=null;
    if(first){ const up=G.addExp(50); G.VN.toast(ep.title+' 완료 · 경험치 +50'+(up?' · 레벨 업!':'')+(id==='pro'?' · 자유 굿과 새 파트너가 열렸습니다':'')); if(up) G.Audio.sfx('lvup');
      const nxi=G.EPORDER.indexOf(id)+1; if(nxi<G.EPORDER.length) selChap=nxi; }
    G.save(); story(); };
  epRun={quit:()=>{ G.VN.close(); ctx=null; story(); }};
  go();
}
function idcard(done){
  show('idcard'); $('idMsg').textContent='화면을 누르거나 아무 키나 눌러 인증'; $('idcard').classList.remove('ok'); let used=false;
  const fire=()=>{ if(used) return; used=true; removeEventListener('keydown',fire); $('idcard').removeEventListener('click',fire);
    G.Audio.sfx('ok'); $('idcard').classList.add('ok'); $('idMsg').textContent='승인되었습니다'; setTimeout(done,1100); };
  setTimeout(()=>{ addEventListener('keydown',fire); $('idcard').addEventListener('click',fire); },250);
}

/* ---------- 곡 선택 (캐러셀 + 미리듣기) ---------- */
function packOf(id){ return G.PACKS.find(p=>p.songs.includes(id)); }
function songIds(){ return ctx?[ctx.song]:G.PACKS.find(p=>p.id===selPack).songs.filter(id=>!G.SONGS[id].alpha||G.S.set.alpha); }   // 알파 모드 전용 곡은 알파 모드에서만 보임
function renderPack(){
  const p=G.PACKS.find(x=>x.id===selPack), n=$('packName'); n.innerHTML='';
  n.appendChild(el('span','lab',p.sub+' · '+(G.PACKS.indexOf(p)+1)+' / '+G.PACKS.length)); n.appendChild(document.createTextNode(p.name+'  ('+p.songs.length+'곡)'));
  $('packBar').hidden=!!ctx;
}
function movePack(dir){ const ok=G.PACKS.filter(p=>p.songs.length); if(ok.length<2){ G.Audio.sfx('no'); G.VN.toast('다른 앨범 팩은 아직 곡이 없습니다. 팩 이름을 누르면 목록을 볼 수 있어요.'); return; }
  let i=ok.findIndex(p=>p.id===selPack); i=(i+dir+ok.length)%ok.length; selPack=ok[i].id; selSong=ok[i].songs[0]; G.Audio.sfx('hover'); songs(); }
function packWin(open){
  const w=$('packWin'); w.hidden=!open; if(!open){ $('packName').focus(); return; }
  const list=$('packList'); list.innerHTML='';
  G.PACKS.forEach(p=>{ const b=btn('','pk',()=>{ if(!p.songs.length){ G.Audio.sfx('no'); G.VN.toast(p.name+': '+p.soon); return; } selPack=p.id; selSong=p.songs[0]; packWin(false); songs(); });
    b.style.setProperty('--pc',p.col); b.setAttribute('aria-pressed',String(p.id===selPack));
    b.appendChild(el('span','lab',p.sub)); b.appendChild(el('b',null,p.name)); b.appendChild(el('small',null,p.songs.length?p.songs.length+'곡':p.soon));
    if(!p.songs.length) b.appendChild(el('span','soon','COMING SOON'));
    list.appendChild(b); });
  list.querySelector('[aria-pressed="true"]').focus();
}
function songs(){
  G.Audio.amb(false);
  if(ctx){ selSong=ctx.song; if(ctx.fixed!=null) selDiff=ctx.fixed; } else { if(!songIds().includes(selSong)) selSong=songIds()[0]; if(!songOpen(selSong)) selSong=songIds().find(songOpen)||songIds()[0]; }
  renderPack(); $('packWin').hidden=true;
  $('songsSub').textContent=ctx?G.EPS[ctx.ep].title+' 굿판':'곡 선택';
  $('songsBack').textContent=ctx?'◀ 이야기로':'◀ 메인 메뉴';
  const list=$('songList'); list.innerHTML=''; cards={};
  songIds().forEach(id=>{ const s=G.SONGS[id], open=!!ctx||songOpen(id);
    const b=btn('','srow'+(open?'':' lock')+(s.alpha?' alpha':''),()=>{ if(selSong===id){ if(open) playGut(selSong,selDiff); else lockedToast(s); return; } selSong=id; G.Audio.sfx('hover'); renderSongs(); });
    b.style.setProperty('--sc',s.tint.ui);
    b.appendChild(el('span','lvbox','')); const t=el('span','st'); t.appendChild(el('b',null,open?s.title:'? ? ?')); t.appendChild(el('small',null,open?(s.artist||(s.file?'공유마당':(G.NAMES[s.who]||'')))+' · '+s.bpm+' BPM':josa(G.EPS[s.from].title,'을','를')+' 마치면 열림')); b.appendChild(t);
    b.appendChild(el('span','go-tag','START ▶'));
    list.appendChild(b); cards[id]=b; });
  const n=songIds().filter(id=>!!ctx||songOpen(id)).length; $('packName').dataset.cnt=n+' / '+songIds().length;
  renderSongs(); show('songs'); $('songStart').focus();
}
function lockedToast(s){ G.Audio.sfx('no'); G.VN.toast(josa(G.EPS[s.from].title,'을','를')+' 마치면 열립니다.'); }
function renderSongs(){
  const ids=songIds();
  ids.forEach(id=>{ const b=cards[id], on=id===selSong; b.classList.toggle('on',on); b.setAttribute('aria-pressed',String(on)); b.tabIndex=-1;
    b.querySelector('.lvbox').textContent=songLv(id,selDiff); b.style.setProperty('--dc',DCOL[selDiff]); });
  const cb=cards[selSong]; if(cb&&cb.scrollIntoView) cb.scrollIntoView({block:'nearest'});
  const s=G.SONGS[selSong], open=!!ctx||songOpen(selSong);
  $('songs').style.setProperty('--acc',s.tint.ui);
  const jk=$('jacketBig'); jacket(jk,s,open); jk.classList.toggle('lock',!open);
  jk.classList.remove('swap'); void jk.offsetWidth; jk.classList.add('swap');
  $('sdTag').textContent=s.alpha?'★ 알파 모드 전용 · 노래 '+s.artist:s.file?'공유마당 무료 음원':s.tag+' · '+(G.NAMES[s.who]||'')+' 테마'; $('sdTitle').textContent=open?s.title:'? ? ?'; $('sdNote').textContent=open?s.bpm+' BPM · '+s.note:G.EPS[s.from].title+' 완료 후 열림';
  const bst=(G.S.best[selSong]||{})[selDiff]; $('sdBest').textContent=bst?String(bst.score).padStart(7,'0'):'0000000'; $('sdRank').textContent=bst?bst.rank:'—';
  const mz=G.S.miss[selSong]||[], ml=$('sdMiss'); ml.innerHTML='';
  MISSIONS.forEach((t,k)=>{ const li=el('li',mz[k]?'ok':''); li.appendChild(el('i',null,mz[k]?'★':'☆')); li.appendChild(document.createTextNode(t)); li.appendChild(el('small',null,'엽전 50')); ml.appendChild(li); });
  const dr=$('sdDiff'); dr.innerHTML='';
  G.DIFFS.forEach((nm,i)=>{ const b=btn('','',()=>{ selDiff=i; G.Audio.sfx('hover'); renderSongs(); $('songStart').focus(); });
    b.style.setProperty('--dc',DCOL[i]); b.appendChild(el('b',null,String(songLv(selSong,i)))); b.appendChild(el('span',null,nm)); b.setAttribute('aria-pressed',String(i===selDiff)); b.setAttribute('aria-label',nm+' 레벨 '+songLv(selSong,i));
    if(ctx&&ctx.fixed!=null&&i!==ctx.fixed) b.disabled=true; dr.appendChild(b); });
  $('sdRule').textContent='달램 '+Math.round(G.CLEAR[selDiff]*100)+'% 이상이면 굿 성공'+(assist?' · 동자신의 가호 적용 중':'');
  const c=G.CHARS[G.S.char]; $('sdCharPor').dataset.por=G.S.char; $('sdCharName').textContent=c.name; $('sdCharPass').textContent='「'+c.passive+'」 '+c.desc;
  $('songStart').disabled=!open;
  paint();
  clearTimeout(pvT); G.Audio.stopPreview(); if(open) pvT=setTimeout(()=>{ if(cur==='songs') G.Audio.preview(selSong); },350);
}
function moveSong(dir){ const ids=songIds(); if(ids.length<2) return; let i=ids.indexOf(selSong); i=Math.max(0,Math.min(ids.length-1,i+dir)); if(ids[i]===selSong) return; selSong=ids[i]; G.Audio.sfx('hover'); renderSongs(); $('songStart').focus(); }
function moveDiff(dir){ if(ctx&&ctx.fixed!=null) return; const v=Math.max(0,Math.min(2,selDiff+dir)); if(v===selDiff) return; selDiff=v; G.Audio.sfx('hover'); renderSongs(); $('songStart').focus(); }
function playGut(song,diff){
  clearTimeout(pvT); G.Audio.stopPreview();
  lastGut={song,diff}; show(null); G.Audio.amb(false); const cid=G.S.char, c=G.CHARS[cid], s=G.SONGS[song];
  jacket($('cuJk'),s);
  const cu=$('curtain'); cu.style.setProperty('--acc',s.tint.ui); cu.style.setProperty('--acc-soft',s.tint.soft);
  $('cuSub').textContent=ctx?G.EPS[ctx.ep].title+' 굿판 · '+G.EPS[ctx.ep].sub:'FREE PLAY'; $('cuTitle').textContent=s.title;
  $('cuDiff').textContent=G.DIFFS[diff]+' '+songLv(song,diff)+'  ·  '+s.bpm+' BPM  ·  '+c.name+' 출전';
  cu.classList.remove('on'); void cu.offsetWidth; cu.classList.add('on'); clearTimeout(playGut.t); playGut.t=setTimeout(()=>cu.classList.remove('on'),1750);
  G.Stage.start({song,diff,mods:G.mods(),assist,tutorial:!!(ctx&&ctx.ep==='pro')||(G.STORY_LOCK?!Object.keys(G.S.best).length:!G.S.cleared.pro),onEnd:onResult,onPause:()=>{ show('pause'); $('resume').focus(); },onFever:()=>cutin(cid,c.cut[1])})
    .then(()=>{ $('pauseBtn').classList.add('on'); clearTimeout(playGut.c); playGut.c=setTimeout(()=>{ if(G.Stage.state()==='play') cutin(cid,c.cut[0]); },1450); })
    .catch(()=>{ G.VN.toast('오디오를 시작하지 못했습니다. 다시 눌러 주세요.'); songs(); });
}

/* ---------- 결과 ---------- */
function countUp(node,to){ cancelAnimationFrame(countRaf); if(G.calm){ node.textContent=String(to).padStart(7,'0'); return; }
  const t0=performance.now(), step=now=>{ const k=Math.min(1,(now-t0)/1000), v=Math.round(to*(1-Math.pow(1-k,3))); node.textContent=String(v).padStart(7,'0'); if(k<1) countRaf=requestAnimationFrame(step); };
  countRaf=requestAnimationFrame(step); }
function onResult(r){
  const m=G.mods(), d=r.diff, key=r.song+'.'+d, cid=G.S.char, c=G.CHARS[cid], s=G.SONGS[r.song];
  const exp=Math.round(G.EXPBASE[d]*RMUL[r.rank]*(r.clear?1:.25)*m.exp), coin=Math.round(G.COINBASE[d]*(r.clear?1:.3)*m.coin);
  const b=G.S.best[r.song]||(G.S.best[r.song]={}), isNew=r.clear&&(!b[d]||r.score>b[d].score);
  if(isNew) b[d]={score:r.score,rank:RANKS[r.rank]};
  G.Audio.amb(true);
  const got=[r.clear, r.clear&&r.rank<=1, r.clear&&r.cnt[3]===0], mz=G.S.miss[r.song]||(G.S.miss[r.song]=[false,false,false]), newM=[];
  got.forEach((g,k)=>{ if(g&&!mz[k]){ mz[k]=true; newM.push(MISSIONS[k]); G.S.coins+=50; } });
  const lv0=G.level(), p0=G.lvProgress(); G.lastPiece=null;
  G.S.fails[key]=r.clear?0:(G.S.fails[key]||0)+1; G.S.coins+=coin; const up=G.addExp(exp);
  const lv1=G.level(), p1=G.lvProgress();
  const jk=$('rJacket'); jacket(jk,s);
  $('rTitle').textContent=r.clear?'굿 성공':'굿 실패'; $('result').classList.toggle('fail',!r.clear);
  $('rRank').textContent=RANKS[r.rank]; $('rVerdict').textContent=r.clear?VERDICT[r.rank]:'달램이 '+Math.round(G.CLEAR[d]*100)+'%에 못 미쳤습니다. '+VERDICT[4];
  $('rNew').textContent=G.DIFFS[d]+' '+songLv(r.song,d)+' · '+s.bpm+' BPM';
  $('rNewRec').hidden=!isNew;
  const bf=$('rBarFill'); bf.style.transition='none'; bf.style.width='0'; void bf.offsetWidth; bf.style.transition=''; bf.style.width=Math.round(r.acc*100)+'%';
  $('rBarMark').style.left=Math.round(G.CLEAR[d]*100)+'%'; $('rBarTxt').textContent='달램 '+(r.acc*100).toFixed(1)+'%  ·  성공 기준 '+Math.round(G.CLEAR[d]*100)+'%';
  const rk=$('rRank'); rk.classList.remove('stamp'); void rk.offsetWidth; rk.classList.add('stamp');
  countUp($('rScore'),r.score);
  $('rAcc').textContent=(r.acc*100).toFixed(1)+'%'; $('rCombo').textContent=r.maxCombo; $('rFever').textContent=r.fevers||0;
  $('rP').textContent=r.cnt[0]; $('rG').textContent=r.cnt[1]; $('rO').textContent=r.cnt[2]; $('rM').textContent=r.cnt[3];
  $('rPor').dataset.por=cid; $('rPor').dataset.mood=r.clear?'smile':'sad'; $('rLine').textContent=c.res[r.clear?0:1];
  $('rGain').textContent='경험치 +'+exp+'  ·  엽전 +'+coin+(up?'  ·  레벨 업 보너스 엽전 +'+100*up:'')+(up&&G.lastPiece?'  ·  월페이퍼 조각 「'+G.lastPiece.name+'」 획득!':'');
  $('rMiss').textContent=newM.length?'★ 과제 달성: '+newM.join(', ')+'  (엽전 +'+50*newM.length+')':'';
  const xb=$('rExpBar'); $('rLv').textContent='Lv.'+lv0; $('rLvUp').hidden=true;
  xb.style.transition='none'; xb.style.width=Math.round(p0*100)+'%'; void xb.offsetWidth; xb.style.transition='width .7s ease-out';
  setTimeout(()=>{ if(up){ xb.style.width='100%'; setTimeout(()=>{ $('rLv').textContent='Lv.'+lv1; $('rLvUp').hidden=false; G.Audio.sfx('lvup');
      xb.style.transition='none'; xb.style.width='0'; void xb.offsetWidth; xb.style.transition='width .6s ease-out'; xb.style.width=Math.round(p1*100)+'%'; },760); }
    else xb.style.width=Math.round(p1*100)+'%'; },350);
  const act=$('rActions'); act.innerHTML=''; let first;
  if(r.clear&&ctx){ first=btn('이야기 계속 ▶','go',()=>{ const n=ctx.next; ctx=null; assist=false; n(); }); act.appendChild(first); }
  else { first=btn('다시 굿하기','go',()=>playGut(r.song,r.diff)); act.appendChild(first); }
  if(!r.clear&&G.S.fails[key]>=2){ const lab=()=>assist?'동자신의 가호 끄기':'동자신의 가호 받기 (판정 +50%)';
    const ab=btn(lab(),'',()=>{ assist=!assist; ab.textContent=lab(); ab.setAttribute('aria-pressed',String(assist)); }); ab.setAttribute('aria-pressed',String(assist)); act.insertBefore(ab,first); }
  if(ctx) act.insertBefore(btn('이야기로 돌아가기','',()=>{ const q=epRun; ctx=null; assist=false; q.quit(); }),act.firstChild);
  else act.insertBefore(btn('곡 선택으로','',freePlay),act.firstChild);
  G.save(); show('result'); first.focus();
}

/* ---------- 파트너 ---------- */
function team(from){ G.Audio.amb(true); teamBack=from||'menu'; teamIdx=Math.max(0,Object.keys(G.CHARS).indexOf(G.S.char)); renderTeam(); show('team'); $('teamPick').focus(); }
function renderTeam(swap){
  const ids=Object.keys(G.CHARS), id=ids[teamIdx], c=G.CHARS[id], open=charOpen(id);
  const th=$('teamList'); th.innerHTML='';
  ids.forEach((k,i)=>{ const o=charOpen(k), a=G.S.aff[k]||0, b=btn('','trow'+(o?'':' lock')+(k===G.S.char?' cur':''),()=>{ teamIdx=i; G.Audio.sfx('hover'); renderTeam(true); });
    const tp=por(k); tp.dataset.ill='1'; b.appendChild(tp); const t=el('span','tt'); t.appendChild(el('b',null,o?G.CHARS[k].name:'? ? ?')); t.appendChild(el('small',null,o?G.CHARS[k].god:'프롤로그 후 합류')); b.appendChild(t);
    b.appendChild(el('span','lvb','Lv.'+(o?1+Math.min(4,a):0))); b.setAttribute('aria-pressed',String(i===teamIdx)); b.setAttribute('aria-label',G.CHARS[k].name); b.tabIndex=-1; th.appendChild(b); });
  const p=$('teamPor'); p.dataset.por=id; p.classList.toggle('lock',!open); if(swap){ p.classList.remove('swap'); void p.offsetWidth; p.classList.add('swap'); }
  const a=G.S.aff[id]||0;
  $('tmLv').textContent='Lv.'+(open?1+Math.min(4,a):0); $('tmHan').textContent=c.god; $('tmName').textContent=c.name; $('tmRole').textContent=c.role;
  $('tmQuote').textContent=open?'“'+c.talk[a>=4?2:a>=2?1:0]+'”':'아직 묘수팀에 합류하지 않았습니다.';
  $('tmPass').textContent='「'+c.passive+'」'; $('tmPassD').textContent=c.desc;
  $('tmCos').textContent='「'+c.costume.name+'」'; const own=!!G.S.own[id], w=$('tmWear');
  $('tmCosD').textContent=own?'추가 스킬: '+c.costume.desc:'상점 엽전 300 · '+c.costume.desc;
  w.hidden=!(own&&open); w.textContent=G.S.wear[id]?'코스튬 벗기':'코스튬 입히기'; w.setAttribute('aria-pressed',String(!!G.S.wear[id]));
  $('tmAff').textContent='호감도 '+'♥'.repeat(Math.min(5,a))+'♡'.repeat(Math.max(0,5-a));
  const pk=$('teamPick'); pk.disabled=!open; pk.textContent=!open?'프롤로그 후 합류':id===G.S.char?'출전 중 ✓':'출전하기';
  paint();
}

/* ---------- 월페이퍼 앨범 ---------- */
function album(){
  G.Audio.amb(true); G.S.newWall=false; G.save();
  const list=$('albumList'); list.innerHTML='';
  const next=G.WALLS.find(w=>(G.S.walls[w.id]||0)<4);
  $('albumHint').textContent=next?'레벨이 오를 때마다 월페이퍼 조각을 하나씩 얻어요. 다음 조각: 「'+next.name+'」 ('+((G.S.walls[next.id]||0)+1)+'/4)':'모든 월페이퍼를 모았어요! 새 그림이 추가되면 다시 모을 수 있어요.';
  G.WALLS.forEach(w=>{ const n=G.S.walls[w.id]||0, done=n>=4, card=btn('','wcard'+(done?' done':''),()=>{ if(!done){ G.Audio.sfx('no'); G.VN.toast('조각을 4개 모으면 크게 볼 수 있어요. ('+n+'/4)'); return; } openWall(w); });
    const pic=el('span','wpic'); pic.style.backgroundImage='url('+w.src+')'; pic.style.backgroundSize=w.fit==='contain'?'contain':'cover'; card.appendChild(pic);
    const grid=el('span','wgrid'); for(let k=0;k<4;k++) grid.appendChild(el('i',k<n?'got':'',k<n?'':'?')); card.appendChild(grid);
    const cap=el('span','wcap'); cap.appendChild(el('b',null,done?w.name:'? ? ?')); cap.appendChild(el('small',null,'조각 '+n+' / 4')); card.appendChild(cap);
    list.appendChild(card); });
  $('albumView').hidden=true; show('album'); (list.querySelector('button')||$('albumBack')).focus();
}
function openWall(w){ $('albumImg').src=w.src; $('albumName').textContent=w.name; $('albumView').hidden=false; $('albumClose').focus(); }

/* ---------- 상점 ---------- */
function shop(){
  G.Audio.amb(true);
  const list=$('shopList'); list.innerHTML=''; const cols=['var(--gold)','var(--jade)','var(--indigo)','var(--pink)'];
  Object.keys(G.CHARS).forEach((id,i)=>{ const c=G.CHARS[id], card=el('div','scard'); card.style.setProperty('--c',cols[i%4]);
    card.appendChild(por(id,true)); card.appendChild(el('p','sc-name',c.name)); card.appendChild(el('p','sc-cos','「'+c.costume.name+'」'));
    card.appendChild(el('p',null,'추가 스킬: '+c.costume.desc));
    if(G.S.own[id]) card.appendChild(el('p','owned','✓ 보유 중 · 파트너 화면에서 입힐 수 있습니다'));
    else card.appendChild(btn('엽전 300으로 구매','go',()=>{ if(G.S.coins<300){ G.Audio.sfx('no'); G.VN.toast('엽전이 부족합니다. 굿과 과제로 엽전을 모으세요.'); return; }
      G.S.coins-=300; G.S.own[id]=true; G.S.wear[id]=true; G.save(); G.Audio.sfx('clue'); G.VN.toast(c.name+' 코스튬 「'+c.costume.name+'」을 입혔습니다.'); shop(); }));
    list.appendChild(card); });
  show('shop'); (list.querySelector('button')||$('shopBack')).focus();
}

/* ---------- 설정 ---------- */
const KCOL=['#2f5bea','#ef4a34','#ffbf1f','#9aa3c0'];
function settings(){
  const s=G.S.set, kr=$('setKeys'); kr.innerHTML='';
  s.keys.forEach((k,i)=>{ const b=btn(rebinding===i?'…':G.keyName(k),'keycap',()=>{ rebinding=i; settings(); b.focus(); }); b.style.setProperty('--kc',KCOL[i]); b.setAttribute('aria-label',(i+1)+'번 레인 키 변경, 현재 '+G.keyName(k)); kr.appendChild(b); });
  $('setSpeed').textContent=s.speed; $('setOff').textContent=(s.offset>0?'+':'')+s.offset+'ms';
  const pips=n=>'■'.repeat(n)+'□'.repeat(10-n); $('setMv').textContent=pips(s.mv); $('setSv').textContent=pips(s.sv);
  $('setHit').setAttribute('aria-pressed',String(!!s.hit)); $('setHit').textContent=s.hit?'켜짐':'꺼짐';
  $('setAlpha').setAttribute('aria-pressed',String(!!s.alpha)); $('setAlpha').textContent=s.alpha?'켜짐':'꺼짐';
  document.querySelectorAll('#setLine button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===s.line)));
  document.querySelectorAll('#setText button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===s.text)));
  document.querySelectorAll('#setTabs button').forEach((b,i)=>{ b.setAttribute('aria-pressed',String(i===setTab)); b.setAttribute('aria-selected',String(i===setTab)); });
  document.querySelectorAll('#setPanes .pane').forEach((p,i)=>p.classList.toggle('on',i===setTab));
  $('setReset').textContent=resetArm?'한 번 더 누르면 모두 지워집니다':'저장 기록 초기화';
  if(cur!=='settings'){ G.Audio.amb(true); show('settings'); }
}

/* ---------- 입력 ---------- */
function navArrows(e,dir){
  const root=G.VN.active()?($('vnChoices').children.length?$('vnChoices'):$('invHot')):(cur==='songs'&&!$('packWin').hidden)?$('packWin'):cur?$(cur):null; if(!root) return false;
  const bs=[...root.querySelectorAll('button:not(:disabled)')].filter(b=>b.tabIndex>=0&&(b.offsetParent!==null||b.closest('#vn')));
  if(!bs.length) return false;
  let i=bs.indexOf(document.activeElement); i=i<0?0:(i+dir+bs.length)%bs.length; bs[i].focus(); G.Audio.sfx('hover'); e.preventDefault(); return true;
}
function back(){
  if(cur==='pause'){ $('resume').click(); return; }
  if(cur==='album'&&!$('albumView').hidden){ $('albumView').hidden=true; return; }
  const map={album:'albumBack',story:'storyBack',songs:'songsBack',team:'teamBack',shop:'shopBack',settings:'setBack'}; if(cur==='songs'&&!$('packWin').hidden){ packWin(false); return; }
  if(map[cur]&&!$(map[cur]).hidden) $(map[cur]).click();
}
function bind(){
  const start=()=>{ if(cur!=='title'||performance.now()-titleT<400) return; try{ G.Audio.init(); }catch(e){} G.Audio.sfx('ok'); lobby(); };
  $('title').addEventListener('click',start);
  $('boot').addEventListener('click',bootNext);
  $('fsBtn').addEventListener('click',e=>{ e.stopPropagation(); fullscreen(); });
  $('setFs').addEventListener('click',fullscreen); $('smallFs').addEventListener('click',()=>{ fullscreen(); smallOk=true; fitStage(); });
  $('smallOk').addEventListener('click',()=>{ smallOk=true; fitStage(); });
  addEventListener('resize',fitStage);
  addEventListener('keydown',e=>{
    if(e.target&&e.target.tagName==='TEXTAREA') return;
    if(!$('small').hidden) return;
    if(rebinding>=0&&cur==='settings'){ e.preventDefault(); const bad=['Escape','Enter','Space','Tab'];
      if(e.code==='Escape'){ rebinding=-1; settings(); return; }
      if(bad.includes(e.code)||G.S.set.keys.includes(e.code)){ G.Audio.sfx('no'); G.VN.toast('그 키는 쓸 수 없습니다. 다른 키를 눌러 주세요.'); return; }
      G.S.set.keys[rebinding]=e.code; rebinding=-1; G.save(); settings(); return; }
    if(cur==='boot'){ e.preventDefault(); bootNext(); return; }
    if(cur==='title'){ e.preventDefault(); start(); return; }
    if(e.defaultPrevented) return;
    const k=e.code, h=k==='ArrowLeft'?-1:k==='ArrowRight'?1:0, v=k==='ArrowUp'?-1:k==='ArrowDown'?1:0;
    if(cur==='songs'&&!$('packWin').hidden){ if(k==='Escape'){ packWin(false); e.preventDefault(); return; } if(h||v){ navArrows(e,h||v); return; } return; }
    if(!G.VN.active()){
      if(cur==='songs'&&!ctx&&(k==='KeyQ'||k==='KeyE')){ movePack(k==='KeyE'?1:-1); e.preventDefault(); return; }
      if(cur==='songs'&&v){ moveSong(v); e.preventDefault(); return; }
      if(cur==='songs'&&h){ moveDiff(h); e.preventDefault(); return; }
      if(cur==='story'&&h){ const i=Math.max(0,Math.min(G.EPORDER.length-1,selChap+h)); if(i!==selChap){ selChap=i; G.Audio.sfx('hover'); renderStory(); } chapBtn(selChap).focus(); e.preventDefault(); return; }
      if(cur==='story'&&v){ (v>0?$('ciGo'):chapBtn(selChap)).focus(); e.preventDefault(); return; }
      if(cur==='team'&&(h||v)){ const n=Object.keys(G.CHARS).length; teamIdx=(teamIdx+(h||v)+n)%n; G.Audio.sfx('hover'); renderTeam(true); e.preventDefault(); return; }
      if(cur==='team'&&false){ const n=Object.keys(G.CHARS).length; teamIdx=(teamIdx+h+n)%n; G.Audio.sfx('hover'); renderTeam(true); e.preventDefault(); return; }
      if(cur==='settings'&&(k==='PageUp'||k==='PageDown'||k==='KeyQ'||k==='KeyE')){ setTab=(setTab+(k==='PageDown'||k==='KeyE'?1:3))%4; settings(); e.preventDefault(); return; }
    }
    if(h||v){ if(navArrows(e,h||v)) return; }
    if(k==='Escape'&&!G.VN.active()) back();
  });
  document.addEventListener('mouseover',e=>{ const b=e.target.closest&&e.target.closest('button'); if(b&&b!==lastHover&&!b.disabled){ lastHover=b; G.Audio.sfx('hover'); } if(!b) lastHover=null; });
  document.addEventListener('click',e=>{ if(e.target.closest&&e.target.closest('button')) G.Audio.sfx('tick'); },true);
  // 곡 목록 위아래 드래그: 목록이 손가락(마우스)을 따라 움직이고, 64px 끌 때마다 한 곡씩 넘어감. 놓으면 제자리로 착 붙음
  { const L=$('songList'); let y0=null, moved=false, base=0, pid=null;
    const set=v=>{ L.style.transform=v?'translateY('+v+'px)':''; };
    L.addEventListener('pointerdown',e=>{ if(e.button>0) return; y0=e.clientY; base=0; moved=false; pid=e.pointerId; L.style.transition='none'; });
    L.addEventListener('pointermove',e=>{ if(y0===null||e.pointerId!==pid) return; const sc=$('stage').getBoundingClientRect().height/1080, d=(e.clientY-y0)/sc-base;
      if(Math.abs(d)>8&&!moved){ moved=true; try{ L.setPointerCapture(pid); }catch(_){} }
      if(!moved) return;
      if(Math.abs(d)>=64){ const n=Math.trunc(d/64), before=selSong; moveSong(-n); base+=n*64; if(before===selSong) base=(e.clientY-y0)/sc-Math.sign(d)*20; }
      set(Math.max(-40,Math.min(40,(e.clientY-y0)/sc-base))); });
    const end=()=>{ if(y0===null) return; y0=null; L.style.transition='transform .18s ease-out'; set(0); };
    L.addEventListener('pointerup',end); L.addEventListener('pointercancel',end); L.addEventListener('lostpointercapture',end);
    L.addEventListener('click',e=>{ if(moved){ e.stopPropagation(); e.preventDefault(); moved=false; } },true);
    L.style.touchAction='none'; }
  $('songList').addEventListener('wheel',e=>{ e.preventDefault(); const now=performance.now(); if(now-wheelT<120) return; wheelT=now; moveSong((e.deltaY||e.deltaX)>0?1:-1); },{passive:false});
  $('homeChar').addEventListener('click',talk);
  $('navStory').addEventListener('click',()=>{ if(G.STORY_LOCK){ G.Audio.sfx('no'); G.VN.toast('스토리 모드는 준비 중입니다. 지금은 자유 굿으로 즐겨 주세요!'); return; } story(); });
  $('navMusic').addEventListener('click',freePlay);
  $('navNext').addEventListener('click',()=>{ const id=$('navNext').dataset.ep; if(id){ selChap=G.EPORDER.indexOf(id); const st=epState(id); if(st.open){ G.Audio.sfx('ok'); runEpisode(id); return; } } story(); });
  $('navTeam').addEventListener('click',()=>team('menu'));
  $('sdCharBtn').addEventListener('click',()=>team('songs'));
  $('navShop').addEventListener('click',shop);
  $('navAlbum').addEventListener('click',album); $('albumBack').addEventListener('click',menu); $('albumClose').addEventListener('click',()=>{ $('albumView').hidden=true; });
  $('albumView').addEventListener('click',e=>{ if(e.target===$('albumView')||e.target===$('albumImg')) $('albumView').hidden=true; });
  $('navSet').addEventListener('click',()=>{ rebinding=-1; resetArm=false; settings(); $('setTabs').children[setTab].focus(); });
  $('storyBack').addEventListener('click',lobby); $('shopBack').addEventListener('click',lobby);
  $('setBack').addEventListener('click',()=>{ rebinding=-1; G.Stage.applySettings(); lobby(); });
  $('songsBack').addEventListener('click',()=>{ if(ctx){ const q=epRun; ctx=null; assist=false; q.quit(); } else lobby(); });
  $('teamBack').addEventListener('click',()=>{ if(teamBack==='songs') songs(); else menu(); });
  $('packPrev').addEventListener('click',()=>movePack(-1)); $('packNext').addEventListener('click',()=>movePack(1));
  $('packName').addEventListener('click',()=>packWin(true)); $('packClose').addEventListener('click',()=>packWin(false));
  $('songStart').addEventListener('click',()=>{ if(!(!!ctx||songOpen(selSong))){ lockedToast(G.SONGS[selSong]); return; } playGut(selSong,selDiff); });
  $('ciGo').addEventListener('click',startChap);
  $('teamPrev').addEventListener('click',()=>{ const n=Object.keys(G.CHARS).length; teamIdx=(teamIdx-1+n)%n; renderTeam(true); });
  $('teamNext').addEventListener('click',()=>{ const n=Object.keys(G.CHARS).length; teamIdx=(teamIdx+1)%n; renderTeam(true); });
  $('teamPick').addEventListener('click',()=>{ const id=Object.keys(G.CHARS)[teamIdx]; if(!charOpen(id)) return; G.S.char=id; G.save(); G.Audio.sfx('ok'); G.VN.toast(G.CHARS[id].name+' 출전'); cutin(id,G.CHARS[id].cut[0]); renderTeam(); });
  $('tmWear').addEventListener('click',()=>{ const id=Object.keys(G.CHARS)[teamIdx]; G.S.wear[id]=!G.S.wear[id]; G.save(); renderTeam(); });
  $('pauseBtn').addEventListener('click',()=>G.Stage.pause());
  $('resume').addEventListener('click',()=>{ show(null); $('pauseBtn').classList.add('on'); G.Stage.resume(); });
  $('retryP').addEventListener('click',()=>{ G.Stage.abort(); playGut(lastGut.song,lastGut.diff); });
  $('quitP').addEventListener('click',()=>{ G.Stage.abort(); songs(); });
  $('vnQuit').addEventListener('click',ev=>{ ev.stopPropagation(); const b=$('vnQuit'); if(!quitArm){ b.textContent='정말 나가기?'; quitArm=setTimeout(()=>{ quitArm=0; b.textContent='나가기'; },2500); return; }
    clearTimeout(quitArm); quitArm=0; b.textContent='나가기'; if(epRun) epRun.quit(); });
  document.querySelectorAll('#setTabs button').forEach((b,i)=>b.addEventListener('click',()=>{ setTab=i; settings(); }));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const step=(id,key,dv,a,b)=>$(id).addEventListener('click',()=>{ const st=G.S.set; st[key]=clamp(st[key]+dv,a,b); G.save(); G.Audio.setVol(); if(key==='sv') G.Audio.sfx('ok'); settings(); });
  step('spDown','speed',-1,1,5); step('spUp','speed',1,1,5); step('offDown','offset',-10,-200,200); step('offUp','offset',10,-200,200);
  step('mvDown','mv',-1,0,10); step('mvUp','mv',1,0,10); step('svDown','sv',-1,0,10); step('svUp','sv',1,0,10);
  $('setHit').addEventListener('click',()=>{ G.S.set.hit=!G.S.set.hit; G.save(); settings(); });
  $('setAlpha').addEventListener('click',()=>{ G.S.set.alpha=!G.S.set.alpha; G.save(); alphaText(); settings(); G.VN.toast(G.S.set.alpha?'알파 모드 켜짐. 줴줴이야~ 자유 굿에 숨겨진 곡이 나타났습니다!':'알파 모드 꺼짐'); });
  $('saveOut').addEventListener('click',()=>{ const t=$('saveCode'); t.value=G.exportSave(); t.focus(); t.select(); G.VN.toast('코드를 복사해 다른 기기의 같은 칸에 붙여 넣으세요.'); });
  $('saveIn').addEventListener('click',()=>{ if(G.importSave($('saveCode').value)){ G.Audio.setVol(); alphaText(); G.Stage.applySettings(); G.VN.toast('저장 기록을 불러왔습니다.'); lobby(); } else { G.Audio.sfx('no'); G.VN.toast('코드가 올바르지 않습니다. 전체를 빠짐없이 붙여 넣었는지 확인하세요.'); } });
  document.querySelectorAll('#setLine button').forEach((b,i)=>b.addEventListener('click',()=>{ G.S.set.line=i; G.save(); G.Stage.applySettings(); settings(); }));
  document.querySelectorAll('#setText button').forEach((b,i)=>b.addEventListener('click',()=>{ G.S.set.text=i; G.save(); settings(); }));
  $('setReset').addEventListener('click',()=>{ if(!resetArm){ resetArm=true; settings(); return; } const keep=G.S.set; G.S=G.def(); G.S.set=keep; G.save(); resetArm=false; selChap=-1; G.VN.toast('저장 기록을 초기화했습니다.'); lobby(); });
}
/* 알파 모드: 판정 이름과 하단 키 안내 문구를 바꿈 */
function alphaText(){ const on=!!G.S.set.alpha;
  document.querySelectorAll('[data-a]').forEach(e=>{ if(e.dataset.o==null) e.dataset.o=e.textContent; e.textContent=on?e.dataset.a:e.dataset.o; });
  document.querySelectorAll('.keys > span').forEach(sp=>{ const ks=[...sp.querySelectorAll('kbd')].map(k=>k.textContent).join(' '); if(!ks) return;
    const tn=[...sp.childNodes].filter(n=>n.nodeType===3).pop(); if(!tn) return; if(sp.dataset.o==null) sp.dataset.o=tn.textContent;
    let alt=null; if(/Enter/.test(ks)) alt='요이~'; else if(/Esc/.test(ks)) alt='아뇨아뇨아뇨아뇨'; else if(/Q/.test(ks)&&/E/.test(ks)) alt='아 예?'; else if(/[↑↓←→]/.test(ks)) alt='티원~';
    tn.textContent=on&&alt?alt:sp.dataset.o; }); }
function boot(hot){
  G.loadSave(hot);
  window.claude?.hot?.snapshot?.(()=>G.S);
  const err=G.Stage.init($('gl'));
  if(err){ $('titleErr').hidden=false; $('titleErr').textContent=err; }
  const lg=$('logo'); lg.innerHTML=''; [...'굿바이락'].forEach(ch=>lg.appendChild(el('span',null,ch))); lg.appendChild(el('span','ex','!'));
  G.VN.bind(); bind(); alphaText(); fitStage(); show('boot'); bootStep=0; $('bootLogo').classList.add('on'); $('bootWarn').classList.remove('on'); bootT=setTimeout(bootNext,2000);
}
/* 부팅: 개발사 로고 → 광과민성·헤드폰 안내 → 타이틀 */
let bootStep=0, bootT=0, titleT=0;
function bootNext(){ clearTimeout(bootT);
  if(cur!=='boot') return;
  if(bootStep===0){ bootStep=1; $('bootLogo').classList.remove('on'); $('bootWarn').classList.add('on'); bootT=setTimeout(bootNext,2600); return; }
  bootStep=2; titleT=performance.now(); show('title'); G.Audio.amb(true);
}
return {boot};
})();
if(window.claude?.hot?.ready) window.claude.hot.ready(G.App.boot); else G.App.boot(window.claude?.hot?.data ?? {});
