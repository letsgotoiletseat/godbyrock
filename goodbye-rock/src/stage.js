/* ---------- 굿판: 전뇌성채 3D 무대 + CRT + 리듬 플레이 ---------- */
G.Stage = (function(){
const LX=[-1.95,-0.65,0.65,1.95];
const LCOL=[0x2f6bff,0xe63946,0xffc72c,0xf4f1e8], LCSS=['#5b8cff','#ff5a66','#ffc72c','#f4f1e8'];   // 오방색: 청 적 황 백
const HOLO=0x22d679, BG=0x0d3320, SKY0=['#020604','#0d3320'], EDGE=0x22d679, BASEWIN=[0.045,0.09,0.135];
const NUMF='"Press Start 2P", monospace', KOF='"Do Hyeon", sans-serif';
const JN=['얼쑤!','좋다!','그렇지','아이고'], AJN=['줴줴이야','야르','엄','야랄'], SIN=()=>G.S.set.alpha?'스껄':'신명', JC=['#ffc72c','#39e6c8','#8fb0ff','#ff5a66'], JS=[1000,700,300,0], JA=[1,.7,.3,0];
const SCROLL=16, CYCLE=174;
let renderer, scene, camera, rt, hud, hc, hudTex, crt, postScene, postCam, canvas;
let W=426, H=240, numOK=false, koOK=false, covered=false, ready=false;
const texJobs=[], movers=[], lanterns=[], jamo=[], parts=[], beatLines=[], recs=[], glows=[], glow=[0,0,0,0], held=[false,false,false,false];
let grid, holoTower, snow, snowPos, warnMat, noteGroup, lineSets=[], baseCol, edgeMat, holoMats=[], flashDur=.7;
let noteGeo, noteMat, missMat, bodyGeo, tailGeo, bodyMat, holdMat, flameGeo, flameMat, markGeo, markMat, pGeo, pMat, pI=0;
const labelPos=[[0,0],[0,0],[0,0],[0,0]], judgePos=[0,0];
let syncP=0, syncA=0;
let state='idle', run=null, clock=0, scroll=0, shake=0, comboPop=0, jText='', jCol='#fff', jAt=-9, flashText='', flashAt=-9, last=0;

const KOB=s=>'bold '+s+'px "Do Hyeon", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
function textTex(w,h,draw){ const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d');
  const tx=new THREE.CanvasTexture(c); tx.minFilter=tx.magFilter=THREE.NearestFilter; tx.generateMipmaps=false;
  const job=()=>{ x.clearRect(0,0,w,h); draw(x); tx.needsUpdate=true; }; job(); texJobs.push(job); return tx; }

function init(cv){
  canvas=cv;
  if(!window.THREE) return '3D 라이브러리를 불러오지 못했습니다. 새로고침해 주세요.';
  try{ renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'}); }
  catch(e){ return '이 브라우저에서 WebGL을 사용할 수 없어 굿판을 열 수 없습니다.'; }
  tmpV=new THREE.Vector3();
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  scene=new THREE.Scene(); scene.background=new THREE.Color(BG); scene.fog=new THREE.Fog(BG,40,160);
  camera=new THREE.PerspectiveCamera(58,1,.1,420);
  scene.add(new THREE.AmbientLight(0x9fd8b8,.7));
  const key=new THREE.DirectionalLight(0xe9fff2,.75); key.position.set(-3,6,5); scene.add(key);
  const rim=new THREE.DirectionalLight(0x22d679,.6); rim.position.set(2,3,-8); scene.add(rim);
  const R2=G.rng(7);
  const lam=(c,e)=>new THREE.MeshPhongMaterial({color:c,emissive:e||0,flatShading:true,shininess:0,specular:0x000000});
  const bas=(c,o)=>new THREE.MeshBasicMaterial(Object.assign({color:c},o||{}));
  const box=(w,h,d,mat,x,y,z)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x||0,y||0,z||0); return m; };
  const obMat=[bas(0xc4502f),bas(0x4b48c8),bas(0xefbf98),bas(0xffffff),bas(0x1fa59b)];

  // 전뇌 격자 바닥 + 굿길
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(500,500),bas(0x050806)); ground.rotation.x=-Math.PI/2; ground.position.set(0,-1.5,-120); scene.add(ground);
  grid=new THREE.GridHelper(320,80,0x22d679,0x0f3a24); grid.position.y=-1.48; scene.add(grid);
  const road=new THREE.Mesh(new THREE.PlaneGeometry(5.5,150),bas(0x080b09)); road.rotation.x=-Math.PI/2; road.position.set(0,0,-70); scene.add(road);
  scene.add(box(5.9,1.5,150,lam(0x101813),0,-.78,-70));
  edgeMat=bas(EDGE); const divMat=bas(0x1d4a31);
  for(let i=0;i<5;i++){ const edge=i===0||i===4; scene.add(box(edge?.14:.04,edge?.16:.02,150,edge?edgeMat:divMat,-2.6+i*1.3,edge?.08:.01,-70)); }
  // 판정선 3종
  { const a=new THREE.Group(); a.add(box(5.3,.03,.1,bas(0xffffff),0,.02,0));
    const b=new THREE.Group(); b.add(box(5.3,.05,.26,bas(0xffffff),0,.03,0));
    const c=new THREE.Group(); for(let i=0;i<4;i++) c.add(box(1.28,.05,.18,bas(LCOL[i]),LX[i],.03,0));
    lineSets=[a,b,c]; lineSets.forEach(g=>scene.add(g)); }
  for(let i=0;i<12;i++){ const m=box(5.2,.02,.05,bas(0x1a5a36)); scene.add(m); beatLines.push(m); }
  baseCol=LCOL.map(c=>new THREE.Color(c));
  for(let i=0;i<4;i++){
    const r=box(1.14,.1,.5,bas(LCOL[i]),LX[i],.05,0); scene.add(r); recs.push(r);
    const g=new THREE.Mesh(new THREE.PlaneGeometry(1.26,46),bas(LCOL[i],{transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
    g.rotation.x=-Math.PI/2; g.position.set(LX[i],.015,-23); scene.add(g); glows.push(g);
  }
  // 노트 재료
  noteGeo=new THREE.OctahedronGeometry(.5,0); noteGeo.scale(1.08,.5,.62);
  noteMat=LCOL.map(c=>lam(c,new THREE.Color(c).multiplyScalar(.5)));
  missMat=lam(0x343a55,0x0e1124);
  bodyGeo=new THREE.BoxGeometry(.66,.06,1); bodyGeo.translate(0,0,-.5);
  tailGeo=new THREE.BoxGeometry(.9,.1,.22);
  bodyMat=LCOL.map(c=>bas(c,{transparent:true,opacity:.62}));
  holdMat=LCOL.map(c=>bas(new THREE.Color(c).lerp(new THREE.Color(0xffffff),.55)));
  flameGeo=new THREE.IcosahedronGeometry(.44,0); flameMat=lam(HOLO,0x1fa890);
  markGeo=new THREE.OctahedronGeometry(.62,0); markGeo.scale(1,.08,1);
  markMat=LCOL.map(c=>bas(new THREE.Color(c).lerp(new THREE.Color(0xffffff),.5),{wireframe:true}));
  noteGroup=new THREE.Group(); scene.add(noteGroup);

  // ── AR 층: 첨성대 홀로그램 + 건곤감리 + 별자리 (〈별 헤는 밤〉이 띄우는 것) ──
  const hm=bas(HOLO,{fog:false,wireframe:true}), hs=bas(HOLO,{fog:false});
  const CX=0, CY=20, CZ=-168;
  { const pts=[[6.2,0],[6,5],[5.2,13],[4.2,20],[3.7,26],[3.7,30]].map(p=>new THREE.Vector2(p[0],p[1]));
    holoTower=new THREE.Group();
    holoTower.add(new THREE.Mesh(new THREE.LatheGeometry(pts,10),hm));
    const top=new THREE.Mesh(new THREE.BoxGeometry(9,1.6,9),hm); top.position.y=31; holoTower.add(top);
    const base=new THREE.Mesh(new THREE.BoxGeometry(15,1.4,15),hm); base.position.y=-.7; holoTower.add(base);
    const win=new THREE.Mesh(new THREE.BoxGeometry(2.4,2.4,.4),hs); win.position.set(0,15,5.2); holoTower.add(win);
    holoTower.position.set(CX,2,CZ); scene.add(holoTower); }
  [[135,[1,1,1]],[45,[0,1,0]],[225,[1,0,1]],[315,[0,0,0]]].forEach(([deg,pat])=>{
    const a=deg*Math.PI/180, g=new THREE.Group();
    pat.forEach((solid,r)=>{ const y=(r-1)*2.3; if(solid) g.add(box(8.4,1.4,.4,hs,0,y,0)); else g.add(box(3.7,1.4,.4,hs,-2.35,y,0), box(3.7,1.4,.4,hs,2.35,y,0)); });
    g.position.set(CX+Math.cos(a)*27,CY+Math.sin(a)*22,CZ); g.rotation.z=a-Math.PI/2; scene.add(g); });
  { const sp=[], lp=[];
    for(let i=0;i<200;i++) sp.push((R2()-.5)*520,14+R2()*120,-205-R2()*30);
    for(let c=0;c<11;c++){ let x=(R2()-.5)*360, y=34+R2()*80; const n=4+Math.floor(R2()*3);
      if(Math.abs(x)<50&&y<70) x+=x<0?-58:58;
      for(let k=0;k<n;k++){ const nx=x+(R2()-.5)*38, ny=y+(R2()-.5)*24; sp.push(x,y,-200); if(k<n-1) lp.push(x,y,-200,nx,ny,-200); x=nx; y=ny; } }
    const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
    scene.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0xf4f1e8,size:1.6,sizeAttenuation:false,fog:false})));
    const lg=new THREE.BufferGeometry(); lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));
    const lm=new THREE.LineBasicMaterial({color:HOLO,fog:false,transparent:true,opacity:.55}); scene.add(new THREE.LineSegments(lg,lm)); holoMats=[hm,hs,lm]; }

  // ── 전뇌성채: 건물 안에 건물이 얽힌 추운 폐쇄 도시 ──
  const steel=[0x141c17,0x18221c,0x101612,0x1d2721].map(c=>lam(c,0x020403));
  const winWarm=bas(0xefbf98), winCold=bas(0x22d679), pipeMat=bas(0x1fa59b), dark=lam(0x0b100d);
  warnMat=bas(0xff3b4a);
  const WORDS=['NO MAGIC','SECTOR 07','HEAT LINE','ID CHECK','CLINIC','CORE','GATE 03','WARM ZONE'], SC=['#22d679','#5fe6da','#efbf98','#f2f5f0'];
  const signMats=WORDS.map((w,i)=>new THREE.MeshBasicMaterial({map:textTex(w.length*7+6,13,x=>{ const ww=w.length*7+6; x.fillStyle='#060a14'; x.fillRect(0,0,ww,13); x.strokeStyle=SC[i%4]; x.strokeRect(.5,.5,ww-1,12);
    x.fillStyle=SC[i%4]; x.font='bold 10px "Courier New", monospace'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(w,ww/2,7); })}));
  for(let i=0;i<22;i++){
    const g=new THREE.Group(), side=i%2?1:-1, w=7+R2()*6, h=18+R2()*30, d=6+R2()*5, inner=-side*(w/2);
    g.add(box(w,h,d,steel[i%4],0,h/2,0));
    const w2=w*.5, h2=h*(.25+R2()*.3), y2=2+R2()*6;                         // 건물 안에 박힌 건물
    g.add(box(w2,h2,d*.7,steel[(i+1)%4],inner-side*(-w2/2+.8),y2+h2/2,(R2()-.5)*2));
    g.add(box(w2*.6,h2*.4,d*.5,steel[(i+2)%4],inner-side*(-w2*.3+.5),y2+h2+h2*.2,(R2()-.5)*2));
    for(let k=0;k<10;k++){ const wy=3+R2()*(h-5), mat=k%3?winCold:winWarm;
      g.add(box(.6+R2()*2.2,.2,.06,mat,(R2()-.5)*w*.7,wy,d/2+.04));
      g.add(box(.06,.2,.6+R2()*2,mat,inner-side*.04,3+R2()*(h-5),(R2()-.5)*d*.7)); }
    g.add(box(.5,.5,d+4,pipeMat,inner-side*.3,4+R2()*10,0));                  // 난방 배관
    g.add(box(.3,h*.6,.3,dark,inner-side*.5,h*.3,d/2-.4));
    const wi=i%WORDS.length, wl=WORDS[wi].length*7+6, sp=new THREE.Mesh(new THREE.PlaneGeometry(wl*.085,13*.085),signMats[wi]);
    sp.position.set(inner-side*1.2,5+R2()*5,d/2+.12); g.add(sp);
    g.position.set(side*(8.5+w/2+R2()*5),-1.5,-160+Math.floor(i/2)*(CYCLE/11)+R2()*3); scene.add(g); movers.push(g);
  }
  for(let i=0;i<4;i++){                                                      // 천장 늑골
    const g=new THREE.Group();
    g.add(box(90,1.4,1.4,dark,0,36,0), box(1.2,40,1.2,dark,-30,16,0), box(1.2,40,1.2,dark,30,16,0));
    for(const sd of [-1,1]){ const st=box(1,26,1,dark,sd*20,27,0); st.rotation.z=sd*.9; g.add(st); g.add(box(.6,.6,.6,warnMat,sd*10,35,.8)); }
    g.position.set(0,0,-160+i*(CYCLE/4)+20); scene.add(g); movers.push(g);
  }
  for(let i=0;i<3;i++){                                                      // 건물 사이 구름다리
    const g=new THREE.Group(), y=11+R2()*7;
    g.add(box(46,1.8,3,steel[i%4],0,y,0), box(44,.3,.06,winCold,0,y+.2,1.53), box(46,.3,3.2,dark,0,y+1,0));
    g.position.set(0,0,-160+i*(CYCLE/3)+45); scene.add(g); movers.push(g);
  }
  { snowPos=new Float32Array(260*3); for(let i=0;i<260;i++){ snowPos[i*3]=(R2()-.5)*60; snowPos[i*3+1]=R2()*36; snowPos[i*3+2]=-110+R2()*114; }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(snowPos,3));
    snow=new THREE.Points(g,new THREE.PointsMaterial({color:0xbfffd9,size:1.6,sizeAttenuation:false})); scene.add(snow); }

  // ── 굿의 AR 소품: 오색천 줄, 청사초롱, 한글 자모 ──
  const woodMat=lam(0x7a5230,0x1a0f06), poleMat=lam(0x1a1430);
  for(let i=0;i<3;i++){
    const g=new THREE.Group();
    g.add(box(.14,8.4,.14,woodMat,-4.8,2.6,0), box(.14,8.4,.14,woodMat,4.8,2.6,0), box(9.6,.05,.05,obMat[3],0,6.5,0));
    for(let k=0;k<15;k++){ const len=1.1+((k*7)%5)*.28; g.add(box(.3,len,.03,obMat[k%5],-4.2+k*.6,6.5-len/2,0)); }
    g.position.set(0,0,-160+i*(CYCLE/3)); scene.add(g); movers.push(g);
  }
  for(let i=0;i<8;i++){
    const g=new THREE.Group();
    for(const sd of [-1,1]){ const x=sd*3.5; g.add(box(.08,2.4,.08,poleMat,x,.4,0), box(.5,.36,.5,obMat[0],x,1.85,0), box(.5,.36,.5,obMat[1],x,1.49,0), box(.6,.06,.6,obMat[2],x,2.06,0)); }
    g.position.set(0,0,-160+i*(CYCLE/8)+8); scene.add(g); movers.push(g); lanterns.push(g);
  }
  { const geo=new THREE.PlaneGeometry(1.4,1.4);
    const mats='ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅎ'.split('').map(ch=>new THREE.MeshBasicMaterial({transparent:true,alphaTest:.5,
      map:textTex(20,20,x=>{ x.fillStyle='#39e6c8'; x.font=KOB(18); x.textAlign='center'; x.textBaseline='middle'; x.fillText(ch,10,11); })}));
    for(let i=0;i<12;i++){ const m=new THREE.Mesh(geo,mats[i]); m.position.set((i%2?1:-1)*(4.6+R2()*3.4),3.4+R2()*6,-150+R2()*160); m.userData.s=.4+R2(); scene.add(m); movers.push(m); jamo.push(m); } }
  // 불티
  pGeo=new THREE.TetrahedronGeometry(.2,0); pMat=LCOL.map(c=>bas(c));
  for(let i=0;i<72;i++){ const m=new THREE.Mesh(pGeo,pMat[0]); m.visible=false; m.userData={v:new THREE.Vector3(),life:0}; scene.add(m); parts.push(m); }

  // 저해상도 렌더 타깃 + CRT
  rt=new THREE.WebGLRenderTarget(W,H,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
  hud=document.createElement('canvas'); hc=hud.getContext('2d');
  hudTex=new THREE.CanvasTexture(hud); hudTex.minFilter=hudTex.magFilter=THREE.NearestFilter; hudTex.generateMipmaps=false;
  crt=new THREE.ShaderMaterial({
    uniforms:{tScene:{value:rt.texture},tHud:{value:hudTex},res:{value:new THREE.Vector2(W,H)},time:{value:0},pulse:{value:0},calm:{value:G.calm?1:0}},
    depthTest:false,depthWrite:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`
precision highp float;
uniform sampler2D tScene; uniform sampler2D tHud; uniform vec2 res; uniform float time; uniform float pulse; uniform float calm;
varying vec2 vUv;
float b2(vec2 a){a=floor(a);return fract(a.x/2.+a.y*a.y*.75);}
float b4(vec2 a){return b2(.5*a)*.25+b2(a);}
vec3 samp(vec2 uv){
  vec2 p=floor(uv*res); vec2 c=(p+.5)/res;
  vec3 col=texture2D(tScene,c).rgb;
  col=floor(col*10.+.5+(b4(p)-.5)*.95)/10.;
  vec4 h=texture2D(tHud,c); col=mix(col,h.rgb,step(.5,h.a));
  return clamp(col,0.,1.);
}
void main(){
  vec2 uv=vUv*2.-1.;
  float r2=dot(uv,uv);
  uv*=(1.+.05*r2+.018*r2*r2)*.945;
  uv=uv*.5+.5;
  if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.){gl_FragColor=vec4(0.,0.,0.,1.);return;}
  float ca=.0011+.0016*pulse*(1.-calm);
  vec3 col=vec3(samp(uv+vec2(ca,0.)).r,samp(uv).g,samp(uv-vec2(ca,0.)).b);
  vec2 px=1.8/res;
  vec3 g=(samp(uv+vec2(px.x,0.))+samp(uv-vec2(px.x,0.))+samp(uv+vec2(0.,px.y))+samp(uv-vec2(0.,px.y)))*.25;
  col+=g*g*.32;
  float s=sin(uv.y*res.y*6.28318)*.5+.5;
  col*=mix(.74,1.08,s);
  float m=mod(gl_FragCoord.x,3.);
  col*=vec3(m<1.?1.:.84,(m>=1.&&m<2.)?1.:.84,m>=2.?1.:.84)*1.12;
  col*=1.+.035*sin(uv.y*7.-time*1.6)*(1.-calm);
  col+=(fract(sin(dot(gl_FragCoord.xy+floor(time*30.)*17.,vec2(12.9898,78.233)))*43758.5453)-.5)*.045*(1.-.6*calm);
  vec2 v=uv*(1.-uv); col*=pow(clamp(v.x*v.y*16.,0.,1.),.22);
  col*=smoothstep(0.,.012,v.x)*smoothstep(0.,.012,v.y);
  gl_FragColor=vec4(col,1.);
}`});
  postScene=new THREE.Scene(); postCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),crt));

  addEventListener('resize',resize); resize(); applySettings();
  if(document.fonts&&document.fonts.load){
    document.fonts.load('8px "Press Start 2P"').then(()=>numOK=true,()=>{});
    document.fonts.load('bold 16px "Do Hyeon"','얼쑤좋다그렇지아이고줴이야르엄랄스껄신명접신중셋둘하나굿!달램장군신폭발긴천은끝까지꾹불말고바닥별표식류선령장성우김주온백진혁헤는밤시스템보정의기세해골물ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅎ').then(()=>{ koOK=true; texJobs.forEach(j=>j()); },()=>{});
  }
  // 입력
  addEventListener('keydown',e=>{
    if(state==='idle') return;
    const l=G.S.set.keys.indexOf(e.code);
    if(l>=0){ if(!e.repeat) press(l,e.timeStamp); e.preventDefault(); return; }
    if(e.code==='Escape'&&state==='play'){ pause(); e.preventDefault(); }
  });
  addEventListener('keyup',e=>{ const l=G.S.set.keys.indexOf(e.code); if(l>=0) held[l]=false; });
  addEventListener('blur',()=>{ for(let i=0;i<4;i++) held[i]=false; });
  const ptr=new Map(), laneHeld=l=>{ for(const v of ptr.values()) if(v===l) return true; return false; };
  canvas.addEventListener('pointerdown',e=>{ if(state!=='play') return; const r=canvas.getBoundingClientRect(); const l=Math.max(0,Math.min(3,Math.floor((e.clientX-r.left)/r.width*4))); ptr.set(e.pointerId,l); press(l,e.timeStamp); e.preventDefault(); });
  const pUp=e=>{ if(ptr.has(e.pointerId)){ const l=ptr.get(e.pointerId); ptr.delete(e.pointerId); if(!laneHeld(l)) held[l]=false; } };
  canvas.addEventListener('pointerup',pUp); canvas.addEventListener('pointercancel',pUp);
  document.addEventListener('visibilitychange',()=>{ if(document.hidden&&state==='play') pause(); });
  tint(null);
  ready=true; last=performance.now(); requestAnimationFrame(frame);
  return null;
}
let tmpV=null;
function proj(x,y,z,out){ tmpV.set(x,y,z).project(camera); out[0]=Math.round((tmpV.x*.5+.5)*W); out[1]=Math.round((1-(tmpV.y*.5+.5))*H); }
function resize(){
  const cw=canvas.clientWidth||innerWidth, ch=canvas.clientHeight||innerHeight, a=cw/ch;
  renderer.setSize(cw,ch,false);
  if(a>=1){ H=240; W=Math.round(240*a); } else { W=200; H=Math.round(200/a); }
  rt.setSize(W,H); hud.width=W; hud.height=H; crt.uniforms.res.value.set(W,H);
  camera.aspect=a; camera.fov=Math.min(104,Math.max(58,2*Math.atan(.5/a)*180/Math.PI));
  camera.position.set(0,3.4,6.2); camera.lookAt(0,.2,-9); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  for(let i=0;i<4;i++) proj(LX[i],0,1.5,labelPos[i]);
  proj(0,1.9,0,judgePos);
}
const skyCache={};
function skyTex(top,bot){ const k=top+bot; if(skyCache[k]) return skyCache[k]; const c=document.createElement('canvas'); c.width=2; c.height=256; const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,256); g.addColorStop(0,top); g.addColorStop(.44,bot); g.addColorStop(1,bot); x.fillStyle=g; x.fillRect(0,0,2,256); return skyCache[k]=new THREE.CanvasTexture(c); }
function tint(t){ const s=t?t.sky:SKY0; scene.background=skyTex(s[0],s[1]); scene.fog.color.set(s[1]); holoMats.forEach(m=>m.color.setHex(t?t.holo:HOLO)); }
function hint(s,dur){ flashText=s; flashAt=clock; flashDur=dur||.7; }
function applySettings(){ if(!lineSets.length) return; lineSets.forEach((g,i)=>g.visible=i===G.S.set.line); }
function burst(lane,n){
  for(let i=0;i<n;i++){ const p=parts[pI++%parts.length]; p.material=pMat[lane]; p.visible=true; p.position.set(LX[lane],.3,0);
    p.userData.v.set((Math.random()-.5)*7,3+Math.random()*6,(Math.random()-.6)*6); p.userData.life=.55; }
}
function clearNotes(){ while(noteGroup.children.length) noteGroup.remove(noteGroup.children[0]); }
function addMesh(geo,mat,x,y){ const m=new THREE.Mesh(geo,mat); m.visible=false; m.position.set(x,y,0); noteGroup.add(m); return m; }

/* ---------- 굿 한 판 ---------- */
// opts: {song, diff, mods, assist, label, onEnd(result), onPause()}
function start(opts){
  return Promise.resolve().then(()=>G.Audio.init()).then(()=>G.Audio.load(opts.song)).then(()=>{
    const ac=G.Audio.ctx(); G.Audio.newBus(); clearNotes();
    const sg=G.Audio.song(opts.song), notes=G.Audio.chart(opts.song,opts.diff), lanes=[[],[],[],[]]; let totalJ=0;
    for(const n of notes){
      const x=LX[n.lane]; totalJ+=n.len?2:1;
      if(n.kind==='l'){ n.body=addMesh(bodyGeo,bodyMat[n.lane],x,.2); n.tail=addMesh(tailGeo,noteMat[n.lane],x,.22); }
      if(n.kind==='g'){ n.mark=addMesh(markGeo,markMat[n.lane],x,.06); n.mesh=addMesh(flameGeo,flameMat,x,.34); }
      else n.mesh=addMesh(noteGeo,noteMat[n.lane],x,.34);
      lanes[n.lane].push(n);
    }
    const m=opts.mods||{win:1,score:1,shield:0,foresee:0}, wm=m.win*(opts.assist?1.5:1);
    run={opts, sg, notes, lanes, totalJ, evI:0, startAt:ac.currentTime+sg.pre, vt:-sg.pre, win:BASEWIN.map(w=>w*wm), speed:20+4*G.S.set.speed,
      scoreMul:m.score, shield:m.shield||0, foresee:m.foresee?.4:0, need:G.CLEAR[opts.diff],
      score:0, combo:0, maxCombo:0, cnt:[0,0,0,0], judged:0, accSum:0, fever:false, feverCount:0,
      tut:!!opts.tutorial, firstL:notes.find(n=>n.kind==='l'), firstG:notes.find(n=>n.kind==='g'), h1:false, h2:false};
    tint(G.SONGS[opts.song].tint); jAt=-9; flashAt=-9; state='play';
  });
}
function pause(){ if(state!=='play') return; state='pause'; G.Audio.ctx().suspend(); if(run.opts.onPause) run.opts.onPause(); }
function resume(){ if(state!=='pause') return; G.Audio.ctx().resume().then(()=>{ state='play'; }); }
function abort(){ if(state==='idle') return; tint(null); edgeMat.color.setHex(EDGE); const ac=G.Audio.ctx(); G.Audio.stopBus(); if(ac.state==='suspended') ac.resume(); clearNotes(); run=null; state='idle'; for(let i=0;i<4;i++) held[i]=false; }
function finish(){
  const r=run, acc=r.totalJ?r.accSum/r.totalJ:0;
  const rank=acc>=.95?0:acc>=.88?1:acc>=.75?2:acc>=.6?3:4;
  const res={score:r.score, acc, cnt:r.cnt, maxCombo:r.maxCombo, clear:acc>=r.need, rank, song:r.opts.song, diff:r.opts.diff};
  res.fevers=r.feverCount; tint(null); edgeMat.color.setHex(EDGE);
  G.Audio.stopBus(); clearNotes(); run=null; state='idle'; for(let i=0;i<4;i++) held[i]=false;
  r.opts.onEnd(res);
}
function hideNote(n){ n.mesh.visible=false; if(n.body) n.body.visible=false; if(n.tail) n.tail.visible=false; if(n.mark) n.mark.visible=false; }
function missLook(n){ n.miss=true; n.mesh.material=missMat; if(n.body) n.body.material=missMat; if(n.tail) n.tail.material=missMat; if(n.mark) n.mark.visible=false; }
function addJudge(j,lane){
  const r=run; let shielded=false;
  if(j===3 && r.shield>0){ r.shield--; j=2; shielded=true; hint('장군신!'); }
  r.judged++; r.cnt[j]++; r.accSum+=JA[j]; jText=(G.S.set.alpha?AJN:JN)[j]; jCol=JC[j]; jAt=clock;
  if(j===3){ r.combo=0; r.fever=false; if(!G.calm) shake=.18; }
  else { r.combo++; if(r.combo>r.maxCombo) r.maxCombo=r.combo;
    if(!r.fever&&r.combo>=30){ r.fever=true; r.feverCount++; hint(SIN()+' 폭발!',1.1); G.Audio.sfx('fever'); if(r.opts.onFever) r.opts.onFever(); }
    r.score+=Math.round(JS[j]*(1+Math.min(r.combo,100)/100)*r.scoreMul*(r.fever?1.2:1)); comboPop=1; if(!shielded) burst(lane,(j===0?8:5)+(r.fever?4:0)); }
  return shielded;
}
function press(lane,ts){
  glow[lane]=1; held[lane]=true;
  if(state!=='play') return;
  const r=run, q=r.lanes[lane], ac=G.Audio.ctx();
  // 입력 이벤트가 실제로 발생한 시각을 오디오 시계로 환산 (프레임이 밀려도 판정이 밀리지 않게)
  const pn=performance.now(), late=(ts>0&&ts<=pn+5)?Math.min(.12,Math.max(0,(pn-ts)/1000)):0;
  const aT=Math.min(ac.currentTime+.02,syncA+(pn-syncP)/1000)-late;
  const tNow=aT-r.startAt-Math.min(.2,ac.outputLatency||0)-G.S.set.offset/1000;
  for(let i=0;i<q.length;i++){ const n=q[i]; if(n.done||n.headDone) continue;
    const d=Math.abs(n.t-tNow);
    if(d<=r.win[2]){ const j=d<=r.win[0]?0:d<=r.win[1]?1:2; addJudge(j,lane); if(G.S.set.hit) G.Audio.sfx(j===0?'hit2':'hit');
      if(n.len){ n.headDone=true; n.holding=true; } else { n.done=true; hideNote(n); } }
    break; }
}
function updateJudging(dt){
  const r=run;
  for(const n of r.notes){
    if(n.done) continue;
    if(n.holding){
      if(r.vt>=n.tEnd-.03){ addJudge(0,n.lane); n.done=true; n.holding=false; hideNote(n); }
      else if(!held[n.lane]){ n.holding=false; n.done=true;
        if(r.vt>=n.tEnd-.16){ addJudge(1,n.lane); hideNote(n); } else if(addJudge(3,n.lane)) hideNote(n); else missLook(n); }
      else { glow[n.lane]=1; n.spark-=dt; if(n.spark<=0){ n.spark=.09; burst(n.lane,1); } }
    } else if(!n.headDone && r.vt-n.t>r.win[2]){
      const s1=addJudge(3,n.lane); let s2=true; if(n.len) s2=addJudge(3,n.lane);
      n.done=true; if(s1&&s2) hideNote(n); else missLook(n); }
  }
}

/* ---------- HUD ---------- */
function txt(s,x,y,c,size,align,ko){
  hc.font=(size||8)+'px '+(ko?(koOK?KOF:'sans-serif'):(numOK?NUMF:'monospace')); hc.textAlign=align||'left'; hc.textBaseline='top';
  hc.fillStyle='#000'; if(size>=16){ hc.fillText(s,x-1,y); hc.fillText(s,x+1,y); hc.fillText(s,x,y-1); hc.fillText(s,x,y+2); hc.fillText(s,x+1,y+1); } else hc.fillText(s,x+1,y+1);
  hc.fillStyle=c; hc.fillText(s,x,y);
}
function drawHud(st){
  hc.clearRect(0,0,W,H);
  if(state==='idle'||!run) return;
  const r=run, SPB=r.sg.SPB;
  hc.fillStyle='#1a1f40'; hc.fillRect(0,0,W,2);
  hc.fillStyle='#e63946'; hc.fillRect(0,0,Math.round(W*Math.max(0,Math.min(1,st/(r.sg.len-2.6)))),2);
  txt(String(r.score).padStart(7,'0'),8,7,'#f4f1e8');
  // 달램 게이지 (성공 기준선 표시)
  const acc=r.judged?r.accSum/r.judged:1, gw=Math.min(84,W-100), gx=W-30-gw;
  hc.fillStyle='#000'; hc.fillRect(gx-1,7,gw+2,8); hc.fillStyle='#1a1f40'; hc.fillRect(gx,8,gw,6);
  hc.fillStyle=acc>=r.need?'#39e6c8':'#ff5a66'; hc.fillRect(gx,8,Math.round(gw*acc),6);
  hc.fillStyle='#ffc72c'; hc.fillRect(gx+Math.round(gw*r.need),6,1,10);
  txt('달램 '+Math.round(acc*100)+'%',W-30,18,'#f4f1e8',16,'right',true);
  if(r.opts.label&&W>=300) txt(r.opts.label,8,21,'#9aa0b8',16,'left',true);
  const keys=G.S.set.keys;
  for(let i=0;i<4;i++) txt(G.keyName(keys[i]),labelPos[i][0]+1,Math.min(H-10,labelPos[i][1]),held[i]?'#ffffff':LCSS[i],8,'center');
  const cx=Math.round(W/2);
  // 곡 시작 전 대기: '접신 중' → 마지막 네 박에 셋·둘·하나·굿! (음원 곡은 첫 노트가 빨리 나오므로 곡 시작 전에 셈)
  if(st<-4*SPB){ if(Math.floor(clock*4)%2===0||G.calm) txt('접신 중',cx,judgePos[1]-26,'#39e6c8',16,'center',true); }
  else if(st<0) txt(['셋','둘','하나','굿!'][Math.max(0,Math.min(3,Math.floor((st+4*SPB)/SPB)))],cx,judgePos[1]-30,'#ffc72c',16,'center',true);
  const age=clock-jAt; if(age<.5&&st>=0) txt(jText,cx,judgePos[1]-4-Math.round(Math.min(age,.1)*30),jCol,11,'center',true);
  if(clock-flashAt<flashDur&&(flashDur<1||Math.floor(clock*6)%4!==3)) txt(flashText,cx,Math.round(H*.36),'#ffc72c',16,'center',true);
}

/* ---------- 루프 ---------- */
const sstep=(a,b,x)=>{ x=Math.max(0,Math.min(1,(x-a)/(b-a))); return x*x*(3-2*x); };
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.05,(now-last)/1000); last=now;
  if(covered&&state==='idle') return;                       // 대화 화면 뒤에서는 쉬어 둠
  const running=state!=='pause', inSong=state!=='idle'&&run;
  if(running) clock+=dt;
  let st=clock, SPB=60/138;
  if(inSong){
    const r=run, ac=G.Audio.ctx(); SPB=r.sg.SPB;
    st=ac.currentTime-r.startAt;
    if(state==='play'){ syncP=performance.now(); syncA=ac.currentTime;
      const ev=r.sg.ev;
      while(r.evI<ev.length&&ev[r.evI].t<st+.3){ const e=ev[r.evI++]; if(e.t>=st-.05) G.Audio.play(e,r.startAt+e.t); }
      r.vt=st-Math.min(.2,ac.outputLatency||0)-G.S.set.offset/1000;
      updateJudging(dt);
      if(r.tut){ if(!r.h1&&r.firstL&&r.vt>r.firstL.t-2.4){ r.h1=true; hint('긴 천은 끝까지 꾹!',2.6); }
        if(!r.h2&&r.firstG&&r.vt>r.firstG.t-2.6){ r.h2=true; hint('불 말고 바닥 별 표식!',2.8); } }
      if(st>r.sg.len){ finish(); return; }
    }
  }
  const beat=st/SPB, ph=beat-Math.floor(beat), pulse=(inSong&&st<-run.sg.pre)?0:Math.exp(-ph*5);
  if(running){
    scroll+=dt*SCROLL;
    grid.position.z=(scroll%4)-60;
    for(const m of movers){ m.position.z+=dt*SCROLL; if(m.position.z>14) m.position.z-=CYCLE; }
    for(const c of jamo){ c.position.y+=Math.sin(clock*c.userData.s*2+c.position.x)*dt*.4; }
    const ls=1+pulse*(G.calm?0:.18); for(const l of lanterns) l.scale.y=ls;
    holoTower.rotation.y+=dt*.12; warnMat.color.setHex(ph<.5?0xff3b4a:0x5a1018);
    edgeMat.color.setHex(inSong&&run.fever?LCOL[Math.floor(beat*2)%4]:EDGE);
    for(let i=0;i<260;i++){ const k=i*3; snowPos[k+1]-=dt*(3+(i%5)); snowPos[k]+=Math.sin(clock+i)*dt*.6; snowPos[k+2]+=dt*SCROLL*.5;
      if(snowPos[k+1]<-1.5||snowPos[k+2]>6){ snowPos[k+1]=30+Math.random()*8; snowPos[k+2]=-110+Math.random()*110; } }
    snow.geometry.attributes.position.needsUpdate=true;
    for(const p of parts){ if(!p.visible) continue; const u=p.userData; u.life-=dt; if(u.life<=0){p.visible=false;continue;}
      u.v.y-=18*dt; p.position.addScaledVector(u.v,dt); p.rotation.x+=dt*9; p.rotation.z+=dt*7; p.scale.setScalar(Math.max(.2,u.life/.55)); }
    for(let i=0;i<4;i++){
      glow[i]=held[i]?Math.max(glow[i],.7):Math.max(0,glow[i]-dt*5);
      recs[i].material.color.copy(baseCol[i]).multiplyScalar(.3+.7*glow[i]+.12*pulse);
      recs[i].scale.set(1+.12*glow[i],1+1.5*glow[i],1+.3*glow[i]);
      glows[i].material.opacity=glow[i]*.3;
    }
    comboPop=Math.max(0,comboPop-dt*8); shake=Math.max(0,shake-dt);
  }
  if(inSong){
    const r=run, t=r.vt, SP=r.speed;
    for(const n of r.notes){
      if(n.done&&!n.miss) continue;
      const zReal=-(n.t-t)*SP, zH=n.holding?0:zReal, m=n.mesh;
      if(zH<-72){ hideNote(n); continue; }
      if(n.len){
        const zT=Math.max(-75,-(n.tEnd-t)*SP);
        if(zT>7){ hideNote(n); continue; }
        const zh=Math.min(zH,7);
        n.body.visible=true; n.body.position.z=zh; n.body.scale.z=Math.max(.01,zh-zT);
        n.body.material=n.miss?missMat:n.holding?holdMat[n.lane]:bodyMat[n.lane];
        n.tail.visible=zT>-74; n.tail.position.z=zT;
        m.visible=zH<=7; m.position.z=zH; m.rotation.x=n.miss?0:st*3+n.t;
        if(n.holding){ const s=1.15+.15*Math.sin(st*30); m.scale.set(s,s,s); } else m.scale.set(1,1,1);
      } else {
        if(zH>7){ hideNote(n); continue; }
        m.visible=true; m.position.z=zH;
        if(n.kind==='g'){
          if(n.miss){ m.position.x=LX[n.lane]; m.position.y=.34; }
          else {
            const tau=n.t-t, k=1-sstep(.26+r.foresee,.5+r.foresee*1.4,tau);
            m.position.x=LX[n.lane]*k+Math.sin(tau*4.4+n.ph)*2.3*(1-k);
            m.position.y=.34+(1-k)*(.75+.18*Math.sin(st*9+n.ph));
            const fs=1+.18*Math.sin(st*23+n.ph); m.scale.set(fs,fs*1.25,fs); m.rotation.y=st*4;
            n.mark.visible=true; n.mark.position.z=zH; n.mark.rotation.y=st*2.2;
          }
        } else m.rotation.x=n.miss?0:st*3+n.t;
      }
    }
  }
  const tt=inSong?run.vt:st, SPv=inSong?run.speed:32, b0=Math.ceil(tt/SPB);
  for(let i=0;i<beatLines.length;i++){ const bl=beatLines[i], z=-((b0+i)*SPB-tt)*SPv; bl.position.set(0,.012,z); bl.visible=z>-74; bl.scale.y=((b0+i)%4===0)?2.4:1; }
  const sx=shake>0?(Math.random()-.5)*shake*.5:0;
  camera.position.set(sx,3.4+(G.calm?0:pulse*.05),6.2); camera.lookAt(sx*.5,.2,-9);
  crt.uniforms.time.value=clock; crt.uniforms.pulse.value=pulse*(inSong&&run.fever?1.8:1);
  drawHud(st); hudTex.needsUpdate=true;
  renderer.setRenderTarget(rt); renderer.render(scene,camera);
  renderer.setRenderTarget(null); renderer.render(postScene,postCam);
}
function setScale(s){ if(!renderer) return; renderer.setPixelRatio(Math.max(.5,Math.min(2,s*(devicePixelRatio||1)))); resize(); }
return {setScale, init, start, pause, resume, abort, applySettings, cover:b=>{covered=b;}, state:()=>state, dbg:()=>run, ok:()=>ready};
})();
