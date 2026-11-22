/* ---------- 곡 생성 + 채보 + 오디오 ---------- */
G.Audio = (function(){
const VOL = x => Math.pow(Math.max(0,x)/10,2)*.75;   // 볼륨 0~10 → 귀에 고르게 들리도록 제곱 곡선
const mtof = m => 440*Math.pow(2,(m-69)/12);
const BARS = 36, cache = {};
const PA=['x...x...x...x.x.','x...x.x.x...x...','x.x.x...x.x.x...','x.......x...x.x.','x.x.x.x.x.......','x..x..x.x...x...'];
const PB=['x.x.x.x.x.x.x...','x..x..x.x..x..x.','x.x.x...x.xxx...','x.......x.x.x.x.','x.x.x.x.x..x..x.','x.....x.x...x.x.'];
const PF=['x.xxx.x.x.x.x.x.','x.x.x.xxx.x.x...','x..x..x.x.xxx.x.','x.......x.x.xxx.','xxx.x.x.x.......','x.x.x.x.x.xxx.x.'];

function song(id){
  if(cache[id]) return cache[id];
  if(G.SONGS[id].file){ const m=G.MUSIC[id], SPB=60/m.bpm;            // 음원 파일 곡: 곡 시작 3초 전부터 노트가 내려옴
    return cache[id]={id, file:true, ev:[{t:0,k:'file',id}], mel:[], SPB, S16:SPB/4, len:m.dur+1.2, pre:3.2}; }
  const c = G.SONGS[id], R = G.rng(c.seed), ev = [], mel = [];
  const SPB = 60/c.bpm, S16 = SPB/4, tonic = 57 + c.key;
  const SC = []; for(let o=0;o<3;o++) for(const s of c.scale) SC.push(tonic + o*12 + s);
  const top = SC.length-1, pick = a => a[Math.floor(R()*a.length)];
  let idx = Math.floor(top/2);
  const kit = c.kit;
  for(let i=0;i<4;i++) ev.push({t:-4*SPB+i*SPB,k:'duk',g:.3});
  for(let bar=0;bar<BARS;bar++){
    const sec = bar<4?'I':bar<12?'A':bar<20?'B':bar<24?'K':'F';
    const ch = (sec==='B'?c.progB:c.progA)[bar%4], root = tonic-12+ch[0], third = ch[1]?3:4;
    const tones = [root+12,root+19,root+24,root+12+third,root+19,root+24+third,root+24,root+19];
    let pat;
    if(bar===0) pat='................';
    else if(sec==='I') pat = bar===2?'x.......x.......':bar===3?'x...x...x.x.x...':'x...x...x...x...';
    else if(sec==='A') pat=pick(PA);
    else if(sec==='B') pat=pick(PB);
    else if(sec==='K') pat = bar===23?'x...x...x.x.x.x.':'x.......x.......';
    else pat=pick(PF);
    const t0 = bar*16*S16;
    if(bar===0||bar===4||bar===12||bar===20||bar===24) ev.push({t:t0,k:'jing'});
    if(c.gtr && (sec==='B'||sec==='F')){ ev.push({t:t0,k:'gtr',f:mtof(root),d:SPB*1.9}); ev.push({t:t0+8*S16,k:'gtr',f:mtof(root),d:SPB*(sec==='F'?.9:1.9)}); if(sec==='F') ev.push({t:t0+12*S16,k:'gtr',f:mtof(root),d:SPB*.9}); }
    if(c.choir && (sec==='K'||sec==='F')) ev.push({t:t0,k:'choir',f:[mtof(root+12),mtof(root+12+third),mtof(root+19)],d:SPB*3.9});
    for(let s=0;s<16;s++){
      const step = bar*16+s, t = step*S16;
      // 장단
      if(kit==='techno'){
        if(sec!=='K'&&sec!=='I'){ if(s%4===0) ev.push({t,k:'kick'}); if(s%4===2) ev.push({t,k:'hat',g:.12}); if(s===4||s===12) ev.push({t,k:'snare',g:.22}); if(sec==='F'&&s%2) ev.push({t,k:'kkwaeng'}); }
        else { if(s===0||s===8) ev.push({t,k:'kick'}); if(s%4===2) ev.push({t,k:'kkwaeng'}); }
      } else if(kit==='soft'){
        if(sec==='A'||sec==='B'||sec==='F'){ if(s===0||(s===10&&sec!=='A')) ev.push({t,k:'kung'}); if(s===4||s===12) ev.push({t,k:'duk',g:.16}); if(s%4===2) ev.push({t,k:'hat',g:.05}); if(sec==='F'&&s===8) ev.push({t,k:'kick'}); }
        else if(s===0) ev.push({t,k:'kung'});
      } else {
        const rock = kit==='rock';
        if(sec==='I'){ if(s===0||s===8) ev.push({t,k:rock?'kung':'kick'}); if(s===4||s===12) ev.push({t,k:'duk',g:.16}); }
        else if(sec==='A'){ if(s===0||s===8) ev.push({t,k:'kick'}); if((s===6||s===10)&&(bar%2||rock)) ev.push({t,k:'kung'});
          if([3,4,12,14].includes(s)) ev.push({t,k:'duk',g:s===4||s===12?.3:.16}); if(s%2===0) ev.push({t,k:'hat',g:.06}); }
        else if(sec==='B'){ if(s===0||s===6||s===8) ev.push({t,k:'kick'}); if(s===4||s===12) ev.push({t,k:'snare',g:.26});
          if([3,11,14].includes(s)) ev.push({t,k:'duk',g:.2}); if(s===10) ev.push({t,k:'kung'}); if(s%2===0) ev.push({t,k:'hat',g:.08}); }
        else if(sec==='K'){ if(s===0) ev.push({t,k:'kung'}); if(s===8) ev.push({t,k:'duk',g:.14}); if(bar===23&&s>=8) ev.push({t,k:'duk',g:.1+.035*(s-8)}); }
        else { if(s%4===0) ev.push({t,k:'kick'}); if(s===4||s===12) ev.push({t,k:'snare',g:.3});
          if([3,7,11,14,15].includes(s)) ev.push({t,k:'duk',g:.2}); if(s%4===2&&!rock) ev.push({t,k:'kkwaeng'}); if(rock&&(s===6||s===14)) ev.push({t,k:'kung'}); ev.push({t,k:'hat',g:s%2?.04:.09}); }
      }
      // 베이스
      if(sec==='I'||sec==='A'){ if([0,3,6,8,11,14].includes(s)) ev.push({t,k:'bass',f:mtof(root),d:S16*1.6}); }
      else if(sec==='K'){ if(s===0) ev.push({t,k:'bass',f:mtof(root),d:SPB*3.6}); }
      else if(s%2===0) ev.push({t,k:'bass',f:mtof(root+((s/2)%2?12:0)),d:S16*1.7});
      // 가야금풍 아르페지오
      if(sec==='B'||sec==='F'||(kit==='soft'&&sec==='A'&&s%2===0)) ev.push({t,k:'arp',f:mtof(tones[s%8]),d:S16*1.4});
      if(sec==='K'&&s%2===0) ev.push({t,k:'arp',f:mtof(tones[(s/2)%8]),d:S16*2.4});
      // 리드
      if(pat[s]==='x'){
        idx += [-2,-1,-1,1,1,2][Math.floor(R()*6)];
        if(idx<0) idx=-idx; if(idx>top) idx=2*top-idx;
        let tone = c.lead[sec]; if(c.alt && bar%2) tone = tone==='bell'?'sq':'bell';
        const e = {t,k:'lead',tone,f:mtof(SC[idx]),d:.3};
        ev.push(e); mel.push({t,step,s,bar,sec,idx,e});
      }
    }
  }
  const tEnd = BARS*16*S16, r0 = tonic-12;
  ev.push({t:tEnd,k:'jing'},{t:tEnd,k:'kick'},{t:tEnd,k:'bass',f:mtof(r0),d:1.6},{t:tEnd,k:'lead',tone:c.lead.F,f:mtof(tonic+12),d:1.4,vib:1},{t:tEnd,k:'lead',tone:'piri',f:mtof(tonic+19),d:1.4,vib:1});
  if(c.gtr) ev.push({t:tEnd,k:'gtr',f:mtof(r0),d:2});
  for(let i=0;i<mel.length;i++){
    const m = mel[i], gap = (i+1<mel.length?mel[i+1].step:BARS*16) - m.step;
    m.long = gap>=6 ? (gap-2)*S16 : 0;
    m.e.d = m.long ? m.long+S16*.6 : Math.min(gap*S16*.92,.32); m.e.vib = m.long?1:0;
    m.gim = !m.long && m.s===8 && m.bar%2===1 && m.bar>=8 && (m.sec==='A'||m.sec==='B'||m.sec==='F');
  }
  mel.push({t:tEnd,step:BARS*16,s:0,bar:BARS,sec:'F',idx:1,long:0,gim:false,last:true});
  ev.sort((a,b)=>a.t-b.t);
  return cache[id] = {id, ev, mel, SPB, S16, len:tEnd+2.6, pre:Math.max(3,4*SPB)+.3};
}
function chart(id,d){
  const mk = (t,lane,len,kind) => ({t,lane,len,tEnd:t+len,kind,done:false,miss:false,headDone:false,holding:false,spark:0,ph:t*7,mesh:null,body:null,tail:null,mark:null});
  if(G.SONGS[id].file) return G.MUSIC[id].charts[d].map(a=>mk(a[0],a[1],a[2],a[3]));
  const sg = song(id), S16 = sg.S16, mod = [4,2,1][d], out = []; let prev = null;
  for(const m of sg.mel){
    if(m.s%mod) continue;
    let lane = m.idx%4;
    if(prev && lane===prev.lane && m.t-prev.tEnd<S16*2.5) lane=(lane+1)%4;
    const gim = m.gim && (d>0 || m.bar%4===3);
    const n = mk(m.t,lane,m.long,m.long?'l':gim?'g':'n');
    out.push(n); prev = n;
    const dbl = m.last || (!gim && m.sec==='F' && ((d===2&&m.s%8===0)||(d===1&&m.s===0)));
    if(dbl) out.push(mk(m.t,(lane+2)%4,0,'n'));
  }
  return out;
}

const bufs={}, loading={}; let fileSrc=null;
function load(id){ const f=G.SONGS[id]&&G.SONGS[id].file; if(!f||bufs[id]) return Promise.resolve();
  return loading[id]||(loading[id]=fetch(f).then(r=>{ if(!r.ok) throw new Error('음원을 불러오지 못했습니다'); return r.arrayBuffer(); })
    .then(a=>new Promise((ok,no)=>ac.decodeAudioData(a,ok,no))).then(b=>{ bufs[id]=b; }).catch(e=>{ delete loading[id]; throw e; })); }
function playFile(id,t,from,loop){ const b=bufs[id]; if(!b||!bus) return null; const s=ac.createBufferSource(); s.buffer=b; s.connect(bus);
  if(loop){ s.loop=true; s.loopStart=loop[0]; s.loopEnd=loop[1]; } s.start(Math.max(t,ac.currentTime),from||0); return s; }
let ac = null, bus = null, noise = null, shaper = null, sfxG = null, ambG = null, ambTimer = 0, ambNext = 0, ambStep = 0;
function init(){
  if(!ac){
    ac = new (window.AudioContext||window.webkitAudioContext)();
    const len = ac.sampleRate; noise = ac.createBuffer(1,len,len);
    const d = noise.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
    shaper = new Float32Array(1024); for(let i=0;i<1024;i++){ const x=i/512-1; shaper[i]=Math.tanh(x*6); }
    sfxG = ac.createGain(); sfxG.connect(ac.destination); ambG = ac.createGain(); ambG.connect(ac.destination); setVol();
  }
  return ac.resume();
}
function newBus(){
  if(pv){ clearInterval(pv.timer); pv=null; }
  stopBus(); bus = ac.createGain(); bus.gain.value = VOL(G.S.set.mv);
  const comp = ac.createDynamicsCompressor(); bus.connect(comp); comp.connect(ac.destination);
}
function setVol(){ bgmVol(); if(!ac) return; const s=G.S.set; if(bus) bus.gain.value=VOL(s.mv); sfxG.gain.value=VOL(s.sv)*1.2; ambG.gain.value=VOL(s.mv)*.6; }
// 홈·대화 화면 배경음: 궁조(장조 5음) 가야금 + 가벼운 장구 장단, 112 BPM
let bgmEl=null, bgmLast=-1, bgmWant=false;
function bgmVol(){ if(bgmEl) bgmEl.volume=Math.min(1,VOL(G.S.set.mv)*.8); }
function bgmNext(){ const L=G.BGM||[]; if(!L.length) return; let i=Math.floor(Math.random()*L.length); if(L.length>1&&i===bgmLast) i=(i+1)%L.length; bgmLast=i;
  bgmEl.src=L[i]; bgmVol(); const p=bgmEl.play(); if(p&&p.catch) p.catch(()=>{}); }
function amb(on){
  if(G.BGM&&G.BGM.length){                       // 메뉴·이야기 배경음: 공유마당 곡 중 하나를 무작위로, 끝나면 다음 곡
    bgmWant=on;
    if(!bgmEl){ bgmEl=new Audio(); bgmEl.preload='auto'; bgmEl.addEventListener('ended',()=>{ if(bgmWant) bgmNext(); });
      const kick=()=>{ if(bgmWant&&bgmEl.paused){ const p=bgmEl.play(); if(p&&p.catch) p.catch(()=>{}); } };
      addEventListener('pointerdown',kick,true); addEventListener('keydown',kick,true); }
    if(!on){ bgmEl.pause(); return; }
    if(!bgmEl.src) bgmNext(); else if(bgmEl.paused){ bgmVol(); const p=bgmEl.play(); if(p&&p.catch) p.catch(()=>{}); }
    return; }
  if(!on){ clearInterval(ambTimer); ambTimer=0; return; }
  if(ambTimer||!ac) return; ambNext=ac.currentTime+.15; ambStep=0;
  const E8=60/112/2, ROOT=[48,43,45,41], SC=[60,62,64,67,69,72,74,76,79,81];
  const MEL=[4,5,7,5,4,2,4,0, 5,7,8,7,5,4,2,4, 7,5,4,5,7,8,9,7, 5,4,2,0,2,4,2,0];
  ambTimer=setInterval(()=>{ if(ac.state!=='running') return; if(ambNext<ac.currentTime) ambNext=ac.currentTime+.05;
    while(ambNext<ac.currentTime+.5){ const i=ambStep++, bar=(i>>3)%4, s=i%8, t=ambNext, r=ROOT[bar];
      if(s%2===0||s===7) osc('triangle',mtof(SC[MEL[i%32]]+(i%64>=32&&s%4===0?12:0)),t,.9,.07,0,true,ambG);
      if(s%2===1) osc('triangle',mtof(r+24+[0,7,12,16][(i>>1)%4]),t,.5,.035,0,true,ambG);
      if(s===0) osc('sine',mtof(r),t,E8*7,.11,0,false,ambG);
      if(s===0||s===4){ const o=ac.createOscillator(), v=ac.createGain(); o.frequency.setValueAtTime(s===0?130:110,t); o.frequency.exponentialRampToValueAtTime(70,t+.12);
        v.gain.setValueAtTime(s===0?.22:.12,t); v.gain.exponentialRampToValueAtTime(.001,t+.25); o.connect(v); v.connect(ambG); o.start(t); o.stop(t+.27); }
      if(s===2||s===6||s===7){ const n=ac.createBufferSource(), f=ac.createBiquadFilter(), v=ac.createGain(); n.buffer=noise; f.type='highpass'; f.frequency.value=2600;
        v.gain.setValueAtTime(s===7?.035:.06,t); v.gain.exponentialRampToValueAtTime(.001,t+.05); n.connect(f); f.connect(v); v.connect(ambG); n.start(t,Math.random()*.5); n.stop(t+.06); }
      if(i%32===0) osc('sine',mtof(r+36),t,2.2,.025,0,true,ambG);
      ambNext+=E8; } },120);
}
// 곡 선택 화면 미리듣기: 후반 절정부 8마디를 반복
let pv=null;
function preview(id){
  stopPreview(); if(!ac||ac.state!=='running') return;
  if(G.SONGS[id].file){ const tok={}; preview.tok=tok; load(id).then(()=>{ if(preview.tok!==tok) return;
      newBus(); const g=bus, vol=VOL(G.S.set.mv)*.8, d=G.MUSIC[id].dur, a=Math.max(0,d*.38), b=Math.min(d,a+20);
      g.gain.setValueAtTime(0,ac.currentTime); g.gain.linearRampToValueAtTime(vol,ac.currentTime+.8);
      const src=playFile(id,ac.currentTime+.05,a,[a,b]); pv={id,g,src,timer:0}; }).catch(()=>{});
    return; }
  const sg=song(id), BAR=sg.S16*16, a=24*BAR, b=32*BAR, evs=sg.ev.filter(e=>e.t>=a&&e.t<b);
  newBus(); const g=bus, vol=VOL(G.S.set.mv)*.7; g.gain.setValueAtTime(0,ac.currentTime); g.gain.linearRampToValueAtTime(vol,ac.currentTime+.8);
  const t0=ac.currentTime+.08; let loop=0, k=0;
  pv={id,g,timer:setInterval(()=>{ if(bus!==g) return; const now=ac.currentTime;
    for(let guard=0;guard<400;guard++){ if(k>=evs.length){ k=0; loop++; } const e=evs[k], at=t0+loop*(b-a)+(e.t-a); if(at>now+.4) break; if(at>=now-.03) play(e,at); k++; } },90)};
}
function stopPreview(){
  preview.tok=null; if(!pv) return; clearInterval(pv.timer); const g=pv.g, src=pv.src; pv=null; if(src) setTimeout(()=>{ try{src.stop()}catch(e){} },350);
  if(bus===g){ const t=ac.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value,t); g.gain.linearRampToValueAtTime(0,t+.3); bus=null; setTimeout(()=>{ try{g.disconnect()}catch(e){} },400); }
}
function stopBus(){ if(fileSrc){ try{fileSrc.stop()}catch(e){} fileSrc=null; } if(bus){ try{bus.disconnect()}catch(e){} bus=null; } }
function osc(type,f,t,d,g,cut,pluck,dest){
  const o=ac.createOscillator(), v=ac.createGain(); o.type=type; o.frequency.value=f;
  v.gain.setValueAtTime(g,t); if(!pluck) v.gain.setValueAtTime(g,t+d*.6); v.gain.exponentialRampToValueAtTime(.001,t+d);
  if(cut){ const fl=ac.createBiquadFilter(); fl.type='lowpass'; fl.frequency.value=cut; o.connect(fl); fl.connect(v);} else o.connect(v);
  v.connect(dest||bus); o.start(t); o.stop(t+d+.03);
}
function nz(t,d,g,hp){
  const s=ac.createBufferSource(), f=ac.createBiquadFilter(), v=ac.createGain();
  s.buffer=noise; f.type='highpass'; f.frequency.value=hp;
  v.gain.setValueAtTime(g,t); v.gain.exponentialRampToValueAtTime(.001,t+d);
  s.connect(f); f.connect(v); v.connect(bus); s.start(t,Math.random()*.5); s.stop(t+d+.02);
}
function drum(f0,f1,t,d,g){
  const o=ac.createOscillator(), v=ac.createGain(); o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+d*.5);
  v.gain.setValueAtTime(g,t); v.gain.exponentialRampToValueAtTime(.001,t+d); o.connect(v); v.connect(bus); o.start(t); o.stop(t+d+.02);
}
function dist(freqs,t,d,g,cut){            // 디스토션 기타
  const ws=ac.createWaveShaper(), lp=ac.createBiquadFilter(), v=ac.createGain(), pre=ac.createGain();
  ws.curve=shaper; lp.type='lowpass'; lp.frequency.value=cut; pre.gain.value=.5;
  v.gain.setValueAtTime(.001,t); v.gain.linearRampToValueAtTime(g,t+.008); v.gain.setValueAtTime(g,t+d*.7); v.gain.exponentialRampToValueAtTime(.001,t+d);
  pre.connect(ws); ws.connect(lp); lp.connect(v); v.connect(bus);
  freqs.forEach((f,i)=>{ const o=ac.createOscillator(); o.type='sawtooth'; o.frequency.value=f; o.detune.value=(i%2?5:-5); o.connect(pre); o.start(t); o.stop(t+d+.03); });
}
function lead(e,t){
  const d=e.d;
  if(e.tone==='gtr'){ dist([e.f,e.f*1.003],t,d,.07,3600); return; }
  if(e.tone==='sq'){ osc('square',e.f,t,d,.08,3800); osc('square',e.f*1.006,t,d,.04,3800); return; }
  if(e.tone==='bell'){ osc('sine',e.f,t,Math.max(d,.5),.14,0,true); osc('sine',e.f*3,t,.25,.04,0,true); osc('triangle',e.f*2,t,.4,.03,0,true); return; }
  const o=ac.createOscillator(), pk=ac.createBiquadFilter(), lp=ac.createBiquadFilter(), v=ac.createGain(), g=.075;      // 태평소
  o.type='sawtooth'; o.frequency.setValueAtTime(e.f*.93,t); o.frequency.exponentialRampToValueAtTime(e.f,t+.05);
  pk.type='peaking'; pk.frequency.value=1700; pk.Q.value=1.6; pk.gain.value=10; lp.type='lowpass'; lp.frequency.value=4300;
  v.gain.setValueAtTime(.001,t); v.gain.linearRampToValueAtTime(g,t+.012); v.gain.setValueAtTime(g,t+d*.75); v.gain.exponentialRampToValueAtTime(.001,t+d);
  o.connect(pk); pk.connect(lp); lp.connect(v); v.connect(bus); o.start(t); o.stop(t+d+.03);
  if(e.vib){ const l=ac.createOscillator(), lg=ac.createGain(); l.frequency.value=5.6; lg.gain.setValueAtTime(0,t); lg.gain.linearRampToValueAtTime(e.f*.014,t+.25);
    l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t+d+.03); }
}
function choir(e,t){                          // "아—" 코러스
  const v=ac.createGain(), d=e.d; v.gain.setValueAtTime(.001,t); v.gain.linearRampToValueAtTime(.5,t+.25); v.gain.setValueAtTime(.5,t+d*.8); v.gain.linearRampToValueAtTime(.001,t+d); v.connect(bus);
  const fs=[[800,.9],[1150,.6],[2900,.2]].map(([fq,g])=>{ const b=ac.createBiquadFilter(); b.type='bandpass'; b.frequency.value=fq; b.Q.value=6; const bg=ac.createGain(); bg.gain.value=g; b.connect(bg); bg.connect(v); return b; });
  e.f.forEach((f,i)=>{ for(const dt of [-7,7]){ const o=ac.createOscillator(); o.type='sawtooth'; o.frequency.value=f; o.detune.value=dt+i; const og=ac.createGain(); og.gain.value=.05; o.connect(og); fs.forEach(b=>og.connect(b)); o.start(t); o.stop(t+d+.05); } });
}
function play(e,t){
  if(e.k==='file'){ fileSrc=playFile(e.id,t); return; }
  if(!bus) return; t=Math.max(t,ac.currentTime);
  switch(e.k){
    case 'kick': drum(165,42,t,.24,.95); break;
    case 'kung': drum(120,70,t,.3,.6); break;
    case 'duk': nz(t,.05,e.g,2600); osc('triangle',640,t,.04,e.g*.5); break;
    case 'snare': nz(t,.15,e.g,1400); osc('triangle',190,t,.08,e.g*.6); break;
    case 'hat': nz(t,.035,e.g,8000); break;
    case 'kkwaeng': osc('square',1240,t,.07,.03); osc('square',1873,t,.07,.022); break;
    case 'jing': [[82,.3,3.2],[121.4,.16,2.6],[178,.1,2],[238,.06,1.4]].forEach(p=>osc('sine',p[0],t,p[2],p[1],0,true)); break;
    case 'bass': osc('square',e.f,t,e.d,.17,520); break;
    case 'arp': osc('triangle',e.f,t,e.d,.09,0,true); break;
    case 'gtr': dist([e.f,e.f*1.498,e.f*2],t,e.d,.085,2400); break;
    case 'choir': choir(e,t); break;
    case 'lead': lead(e,t); break;
  }
}
// 효과음 (메뉴·대화용, 굿과 별개로 바로 출력)
function sfx(kind,f){
  if(!ac || ac.state!=='running') return;
  const t=ac.currentTime+.005, d=sfxG, o=(ty,f,dd,g,at)=>osc(ty,f,t+(at||0),dd,g,0,true,d);
  if(kind==='blip'){ o(f<200?'square':'triangle',f,.045,.035); return; }
  if(kind==='hit'||kind==='hit2'){ const s=ac.createBufferSource(), fl=ac.createBiquadFilter(), v=ac.createGain(); s.buffer=noise; fl.type='highpass'; fl.frequency.value=3000;
    v.gain.setValueAtTime(.16,t); v.gain.exponentialRampToValueAtTime(.001,t+.04); s.connect(fl); fl.connect(v); v.connect(d); s.start(t); s.stop(t+.05);
    o('triangle',kind==='hit2'?1180:760,.05,.07); if(kind==='hit2') o('sine',2360,.12,.03); return; }
  if(kind==='fever'){ [784,988,1175,1568].forEach((q,i)=>o('triangle',q,.3,.07,i*.05)); return; }
  if(kind==='hover'){ o('triangle',1320,.03,.02); return; }
  if(kind==='tick') o('square',880,.03,.03);
  else if(kind==='ok'){ o('triangle',660,.12,.08); o('triangle',990,.2,.08,.09); }
  else if(kind==='no') o('square',140,.2,.06);
  else if(kind==='clue'){ o('sine',1320,.3,.08); o('sine',1760,.4,.06,.08); }
  else if(kind==='bell'){ o('sine',2100,.5,.06); o('sine',3150,.4,.03); }
  else if(kind==='steps'){ for(let i=0;i<4;i++){ const s=ac.createBufferSource(), f=ac.createBiquadFilter(), v=ac.createGain(); s.buffer=noise; f.type='lowpass'; f.frequency.value=500; v.gain.setValueAtTime(.3,t+i*.32); v.gain.exponentialRampToValueAtTime(.001,t+i*.32+.09); s.connect(f); f.connect(v); v.connect(d); s.start(t+i*.32); s.stop(t+i*.32+.1); } }
  else if(kind==='lvup'){ [523,659,784,1047].forEach((f,i)=>o('square',f,.18,.05,i*.09)); }
}
return {song, chart, load, init, newBus, stopBus, play, sfx, amb, preview, stopPreview, setVol, ctx:()=>ac};
})();
