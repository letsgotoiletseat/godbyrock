'use strict';
const G = {};
const $ = id => document.getElementById(id);
G.calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
G.LV = [0]; for(let i=1;i<30;i++) G.LV.push(G.LV[i-1]+100+50*(i-1));   // 누적 경험치 → 레벨 (최대 30)
G.def = () => ({v:2, exp:0, coins:0, cleared:{}, prog:{}, best:{}, char:'seon', own:{}, wear:{}, aff:{seon:0,sung:0,juon:0,jin:0,tracy:0},
  fails:{}, clues:{}, miss:{}, walls:null, newWall:false, set:{keys:['KeyD','KeyF','KeyJ','KeyK'], speed:3, line:0, offset:0, text:2, mv:5, sv:5, hit:true}});
G.S = G.def();
G.loadSave = hot => {
  let d = hot && hot.v === 2 ? hot : null;
  if(!d){ try{ d = JSON.parse(localStorage.getItem('gutbyerock-save') || 'null'); }catch(e){} }
  if(d && d.v === 2){ const b = G.def(); G.S = Object.assign(b, d); G.S.set = Object.assign(G.def().set, d.set || {}); G.S.aff = Object.assign(G.def().aff, d.aff || {}); }
  G.wallsInit();
};
G.save = () => { try{ localStorage.setItem('gutbyerock-save', JSON.stringify(G.S)); }catch(e){} };
G.level = () => { let l = 1; for(let i=0;i<G.LV.length;i++) if(G.S.exp >= G.LV[i]) l = i+1; return l; };
G.lvProgress = () => { const l = G.level(); if(l >= G.LV.length) return 1; return (G.S.exp - G.LV[l-1]) / (G.LV[l] - G.LV[l-1]); };
G.addExp = n => { const before = G.level(); G.S.exp += Math.round(n); const after = G.level(); if(after > before){ G.S.coins += 100*(after-before); for(let i=before;i<after;i++) G.givePiece(); } G.save(); return after - before; };
// 월페이퍼 조각: 레벨이 오를 때마다 아직 다 모으지 못한 월페이퍼의 조각을 하나씩 줌
G.wallsInit = () => { if(!G.S.walls){ G.S.walls={}; for(let i=1;i<G.level();i++) G.givePiece(true); } };
G.givePiece = quiet => { if(!G.S.walls) G.S.walls={}; const w=(G.WALLS||[]).find(x=>(G.S.walls[x.id]||0)<4); if(!w) return null; G.S.walls[w.id]=(G.S.walls[w.id]||0)+1; if(!quiet){ G.S.newWall=true; G.lastPiece=w; } return w; };
G.keyName = c => c.replace(/^Key|^Digit|^Numpad/,'').replace('Semicolon',';').replace('Comma',',').replace('Period','.').replace('Slash','/').replace('Space','SP').replace('Arrow','').slice(0,3).toUpperCase();
G.exportSave = () => btoa(unescape(encodeURIComponent(JSON.stringify(G.S))));
G.importSave = code => { try{ const d = JSON.parse(decodeURIComponent(escape(atob(code.trim())))); if(!d || d.v !== 2 || typeof d.exp !== 'number') return false;
  const b = G.def(); G.S = Object.assign(b, d); G.S.set = Object.assign(G.def().set, d.set || {}); G.S.aff = Object.assign(G.def().aff, d.aff || {}); G.save(); return true; }catch(e){ return false; } };
G.keysText = () => G.S.set.keys.map(G.keyName).join(' ');
G.rng = a => () => { a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
G.mods = () => {                    // 선택한 캐릭터 + 코스튬 패시브 합산
  const c = G.CHARS[G.S.char], m = Object.assign({win:1,score:1,exp:1,coin:1,shield:0,foresee:0}, c.mods);
  if(G.S.wear[G.S.char]){ const k = c.costume.mods; for(const key in k) m[key] = (key==='shield'||key==='foresee') ? k[key] : m[key]*k[key]; }
  return m;
};
