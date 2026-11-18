'use strict';
/* ---------- 3. ESCENARIO ---------- */
const tree = { x:0, y:0 };
const box = { x:0, y:0 };
const bed = { x:0, y:0 };
const ball = { x:0, y:0, vx:0, vy:0, rot:0 };
const bowls = [ {kind:'food', food:1, fx:.33, fy:.8, user:null}, {kind:'food', food:1, fx:.41, fy:.86, user:null}, {kind:'water', food:1, fx:.49, fy:.8, user:null} ];
const spots = [
  {kind:'tree', id:'t1', occ:null}, {kind:'tree', id:'t2', occ:null},
  {kind:'shelf', id:'s1', occ:null, fx:.2, zz:150}, {kind:'shelf', id:'s2', occ:null, fx:.6, zz:215},
  {kind:'box', id:'box', occ:null}, {kind:'bed', id:'bed', occ:null}
];
const spotById = id => spots.find(s => s.id === id);
let treats = [], parts = [], clouds = [];
const laser = { on:false, x:0, y:0 };
let firstLayout = true;

function layout(){
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = W*DPR; cv.height = H*DPR;
  G = clamp(Math.min(W/1250, H/780), .5, 1.4);
  floorTop = H*.5; floorBot = Math.min(H*.9, H-95); walkTop = floorTop + 16*G;
  const fy = f => floorTop + (floorBot-floorTop)*f;

  tree.x = W*.86; tree.y = fy(.36);
  const kt = G*depth(tree.y);
  Object.assign(spotById('t1'), {x:tree.x-34*kt, y:tree.y+1, z:100*kt, ay:tree.y+10, appr:65});
  Object.assign(spotById('t2'), {x:tree.x+24*kt, y:tree.y+1, z:185*kt, ay:tree.y+10, appr:65});
  for(const id of ['s1','s2']){
    const s = spotById(id), y = floorTop + 8, ks = G*depth(y);
    Object.assign(s, {x:W*s.fx, y, z:s.zz*ks, ay:floorTop+24*G, appr:42});
  }
  box.x = W*.11; box.y = fy(.7);
  Object.assign(spotById('box'), {x:box.x, y:box.y, z:8*G*depth(box.y), ay:box.y+2, appr:70});
  bed.x = W*.66; bed.y = fy(.3);
  Object.assign(spotById('bed'), {x:bed.x, y:bed.y, z:6*G*depth(bed.y), ay:bed.y, appr:0});
  for(const b of bowls){ b.x = W*b.fx; b.y = fy(b.fy); }
  if(firstLayout){ ball.x = W*.56; ball.y = fy(.6); }
  ball.x = clampX(ball.x); ball.y = clampY(ball.y);

  for(const c of cats){
    if(firstLayout){ c.x = rand(60, W-60); c.y = rand(walkTop, floorBot); }
    c.x = clampX(c.x); c.y = c.spot ? c.y : clampY(c.y);
  }
  firstLayout = false;
  drawBackground();
}

function drawBackground(){
  bgC.width = W*DPR; bgC.height = H*DPR;
  const b = bctx; b.setTransform(DPR,0,0,DPR,0,0);
  b.lineCap = 'round'; b.lineJoin = 'round';
  const rr = seeded(7);
  const beamH = Math.max(26, H*.05);
  const wallTop = floorTop - 78*G;

  // cielo
  let gr = b.createLinearGradient(0,0,0,floorTop);
  gr.addColorStop(0,'#9fd6ec'); gr.addColorStop(.75,'#f3e7c9'); gr.addColorStop(1,'#f7dcae');
  b.fillStyle = gr; b.fillRect(0,0,W,floorTop);
  // sol
  const sx = W*.74, sy = H*.16;
  gr = b.createRadialGradient(sx,sy,0,sx,sy,140*G); gr.addColorStop(0,'rgba(255,240,190,.9)'); gr.addColorStop(1,'rgba(255,240,190,0)');
  b.fillStyle = gr; b.fillRect(sx-150*G, sy-150*G, 300*G, 300*G);
  b.fillStyle = '#fff2c4'; b.beginPath(); b.arc(sx,sy,38*G,0,TAU); b.fill();
  // nubes
  b.fillStyle = 'rgba(255,255,255,.85)';
  for(const [cx,cy,s] of [[.2,.14,1],[.45,.1,.8],[.92,.24,.7]]){
    for(const [dx,dy,r] of [[-30,6,20],[0,0,28],[30,6,20],[12,10,18]]){ b.beginPath(); b.arc(W*cx+dx*G*s, H*cy+dy*G*s, r*G*s, 0, TAU); b.fill(); }
  }
  // colinas y árboles lejanos
  b.fillStyle = '#a9cf95';
  b.beginPath(); b.moveTo(0, wallTop);
  for(let x=0;x<=W;x+=20){ b.lineTo(x, wallTop - 70*G - Math.sin(x*.004)*30*G - Math.sin(x*.011)*12*G); }
  b.lineTo(W, wallTop); b.closePath(); b.fill();
  for(let i=0;i<14;i++){
    const tx = rr()*W, ty = wallTop - 30*G - rr()*50*G, tr = (24+rr()*26)*G;
    b.fillStyle = rr()<.5 ? '#7fb36f' : '#6aa05e';
    b.beginPath(); b.arc(tx,ty,tr,0,TAU); b.arc(tx+tr*.7,ty+tr*.3,tr*.8,0,TAU); b.arc(tx-tr*.7,ty+tr*.35,tr*.75,0,TAU); b.fill();
  }

  // malla (rejilla) del catio
  b.save(); b.beginPath(); b.rect(0, beamH, W, wallTop-beamH); b.clip();
  b.strokeStyle = 'rgba(70,55,45,.22)'; b.lineWidth = 1.2;
  const sp = 22*G;
  for(let x=-H; x<W+H; x+=sp){ b.beginPath(); b.moveTo(x,beamH); b.lineTo(x+(wallTop-beamH),wallTop); b.stroke(); b.beginPath(); b.moveTo(x,wallTop); b.lineTo(x+(wallTop-beamH),beamH); b.stroke(); }
  b.restore();

  // muro bajo de tablas
  for(let x=0, i=0; x<W; x+=26*G, i++){
    b.fillStyle = i%2 ? '#c98b55' : '#c28250';
    b.fillRect(x, wallTop, 26*G, floorTop-wallTop);
    b.strokeStyle = 'rgba(43,33,30,.35)'; b.lineWidth = 1.5; b.beginPath(); b.moveTo(x, wallTop); b.lineTo(x, floorTop); b.stroke();
    b.fillStyle = 'rgba(43,33,30,.25)'; b.beginPath(); b.arc(x+13*G, wallTop+10*G, 1.6*G, 0, TAU); b.fill();
  }
  b.fillStyle = '#a8693c'; b.fillRect(0, wallTop-8*G, W, 10*G);
  b.strokeStyle = INK; b.lineWidth = 2.5; b.strokeRect(-5, wallTop-8*G, W+10, 10*G);

  // postes y viga
  for(const fx of [.015,.26,.51,.76,.985]){
    const x = W*fx - 10*G;
    b.fillStyle = '#a8693c'; b.fillRect(x, 0, 20*G, floorTop);
    b.fillStyle = 'rgba(255,255,255,.12)'; b.fillRect(x+3*G, 0, 4*G, floorTop);
    b.strokeStyle = INK; b.lineWidth = 2.5; b.strokeRect(x, -5, 20*G, floorTop+5);
  }
  b.fillStyle = '#93582f'; b.fillRect(0,0,W,beamH);
  b.strokeStyle = INK; b.lineWidth = 3; b.strokeRect(-5,-5,W+10,beamH+5);

  // guirnalda de luces
  b.strokeStyle = INK; b.lineWidth = 1.5;
  const lights = [];
  b.beginPath();
  for(let seg=0; seg<4; seg++){
    const x0 = W*seg/4, x1 = W*(seg+1)/4, y0 = beamH+4;
    b.moveTo(x0,y0); b.quadraticCurveTo((x0+x1)/2, y0+46*G, x1, y0);
    for(let t=.12; t<1; t+=.19){ const x=lerp(x0,x1,t), y=y0+(4*t*(1-t))*23*G; lights.push([x,y]); }
  }
  b.stroke();
  const lc = ['#ffd56b','#ff8fa3','#8fd3ff','#b6f09c'];
  lights.forEach(([x,y],i)=>{
    const g2 = b.createRadialGradient(x,y+6*G,0,x,y+6*G,16*G); g2.addColorStop(0,'rgba(255,240,180,.55)'); g2.addColorStop(1,'rgba(255,240,180,0)');
    b.fillStyle = g2; b.beginPath(); b.arc(x,y+6*G,16*G,0,TAU); b.fill();
    b.fillStyle = lc[i%4]; b.beginPath(); b.ellipse(x,y+6*G,4*G,6*G,0,0,TAU); b.fill(); b.stroke();
  });

  // planta colgante
  const hx = W*.38, hy = beamH + 70*G;
  b.strokeStyle = INK; b.lineWidth = 1.5; b.beginPath(); b.moveTo(hx-14*G,hy-14*G); b.lineTo(hx,beamH); b.lineTo(hx+14*G,hy-14*G); b.stroke();
  for(let i=0;i<7;i++){
    const vx = hx + (i-3)*7*G, len = (40+rr()*50)*G;
    b.strokeStyle = '#4f8a45'; b.lineWidth = 2.2; b.beginPath(); b.moveTo(vx,hy); b.quadraticCurveTo(vx+(rr()-.5)*30*G, hy+len*.5, vx+(rr()-.5)*20*G, hy+len); b.stroke();
    for(let j=1;j<5;j++){ b.fillStyle = j%2?'#6fb35f':'#5a9e4d'; b.beginPath(); b.ellipse(vx+(rr()-.5)*14*G, hy+len*j/5, 5*G, 3.2*G, rr()*3, 0, TAU); b.fill(); }
  }
  b.fillStyle = '#d96c4f'; b.beginPath(); b.moveTo(hx-18*G,hy-16*G); b.lineTo(hx+18*G,hy-16*G); b.lineTo(hx+13*G,hy+4*G); b.lineTo(hx-13*G,hy+4*G); b.closePath(); b.fill();
  b.strokeStyle = INK; b.lineWidth = 2.5; b.stroke();

  // repisas en la pared
  for(const id of ['s1','s2']){
    const s = spotById(id), k = G*depth(s.y), top = s.y - s.z, w = 115*k;
    b.fillStyle = '#8a5530';
    for(const sx2 of [-1,1]){ b.beginPath(); b.moveTo(s.x+sx2*w*.32, top+8*k); b.lineTo(s.x+sx2*w*.32, top+30*k); b.lineTo(s.x+sx2*w*.32 - sx2*3*k, top+8*k); b.closePath(); b.fill(); b.strokeStyle = INK; b.lineWidth = 2; b.stroke(); }
    b.fillStyle = '#e0aa6e'; b.fillRect(s.x-w/2, top-4*k, w, 7*k);
    b.fillStyle = '#b97f48'; b.fillRect(s.x-w/2, top+3*k, w, 7*k);
    b.strokeStyle = INK; b.lineWidth = 2.5; b.strokeRect(s.x-w/2, top-4*k, w, 14*k);
    b.fillStyle = '#e7d3f0'; b.beginPath(); b.ellipse(s.x, top-3*k, w*.38, 3.5*k, 0, 0, TAU); b.fill(); b.lineWidth = 1.6; b.stroke();
  }

  // piso de madera
  gr = b.createLinearGradient(0,floorTop,0,H);
  gr.addColorStop(0,'#c58a50'); gr.addColorStop(.25,'#d9a165'); gr.addColorStop(1,'#e2ae72');
  b.fillStyle = gr; b.fillRect(0,floorTop,W,H-floorTop);
  const rows = 11;
  for(let i=0;i<=rows;i++){
    const t = i/rows, y = floorTop + (H-floorTop)*Math.pow(t,1.35);
    const y2 = floorTop + (H-floorTop)*Math.pow((i+1)/rows,1.35);
    b.strokeStyle = 'rgba(80,45,20,.28)'; b.lineWidth = 1.5; b.beginPath(); b.moveTo(0,y); b.lineTo(W,y); b.stroke();
    let x = rr()*200*G;
    while(x < W){ b.beginPath(); b.moveTo(x,y); b.lineTo(x,y2); b.stroke(); x += (180+rr()*220)*G; }
  }
  gr = b.createLinearGradient(0,floorTop,0,floorTop+30*G); gr.addColorStop(0,'rgba(60,30,10,.35)'); gr.addColorStop(1,'rgba(60,30,10,0)');
  b.fillStyle = gr; b.fillRect(0,floorTop,W,30*G);
  b.strokeStyle = INK; b.lineWidth = 3; b.beginPath(); b.moveTo(0,floorTop); b.lineTo(W,floorTop); b.stroke();

  // alfombra
  const rx = W*.2, ry = (floorBot-floorTop)*.2, rcx = W*.5, rcy = floorTop + (floorBot-floorTop)*.58;
  b.strokeStyle = '#f6e3c0'; b.lineWidth = 2;
  for(let a=0;a<TAU;a+=.06){ b.beginPath(); b.moveTo(rcx+Math.cos(a)*rx, rcy+Math.sin(a)*ry); b.lineTo(rcx+Math.cos(a)*(rx+9*G), rcy+Math.sin(a)*(ry+5*G)); b.stroke(); }
  const ringCols = ['#e8616b','#f6d6a8','#7aa6c2','#f6d6a8','#e8616b','#ffe9c7'];
  ringCols.forEach((col,i)=>{ const s = 1 - i*.16; b.fillStyle = col; b.beginPath(); b.ellipse(rcx,rcy,rx*s,ry*s,0,0,TAU); b.fill(); });
  b.strokeStyle = INK; b.lineWidth = 2.5; b.beginPath(); b.ellipse(rcx,rcy,rx,ry,0,0,TAU); b.stroke();

  // plantas en maceta junto al muro
  const pot = (x, y, s, kind) => {
    const k = s*G;
    if(kind===0){
      for(let i=0;i<7;i++){ const a = -Math.PI/2 + (i-3)*.32; b.fillStyle = i%2?'#5fa651':'#4c9142'; b.beginPath(); b.ellipse(x+Math.cos(a)*34*k, y-30*k+Math.sin(a)*34*k, 9*k, 26*k, a+Math.PI/2, 0, TAU); b.fill(); b.strokeStyle = INK; b.lineWidth = 2; b.stroke(); }
    } else {
      for(let i=0;i<5;i++){ const lx = x+(i-2)*9*k, lh = (50+((i*37)%30))*k; b.fillStyle = '#6aa85b'; b.beginPath(); b.moveTo(lx-5*k,y-20*k); b.quadraticCurveTo(lx-6*k,y-20*k-lh*.6,lx,y-20*k-lh); b.quadraticCurveTo(lx+6*k,y-20*k-lh*.6,lx+5*k,y-20*k); b.closePath(); b.fill(); b.strokeStyle = INK; b.lineWidth = 2; b.stroke(); }
    }
    b.fillStyle = '#d9714f'; b.beginPath(); b.moveTo(x-22*k,y-26*k); b.lineTo(x+22*k,y-26*k); b.lineTo(x+16*k,y); b.lineTo(x-16*k,y); b.closePath(); b.fill(); b.strokeStyle = INK; b.lineWidth = 2.5; b.stroke();
    b.fillStyle = '#c05f40'; b.fillRect(x-24*k,y-30*k,48*k,8*k); b.strokeRect(x-24*k,y-30*k,48*k,8*k);
  };
  pot(W*.045, floorTop+12*G, .9, 0);
  pot(W*.31, floorTop+10*G, .7, 1);
  pot(W*.72, floorTop+10*G, .75, 0);
}
