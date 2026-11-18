'use strict';
/* ---------- 5. DIBUJO DE GATOS ----------
   Cada pose calcula dónde van cuerpo, cabeza, patas y cola.
   Luego se pinta en dos capas (contorno grueso + relleno) para
   lograr el estilo de línea gruesa tipo "dibujo animado". */
function poseParts(c){
  const g = c.geo, t = c.animT, L = g.L, B = g.H, lg = g.legL, hr = g.hr, tl = g.tl;
  const P = { far:[], near:[], paws:[], haunch:null, neck:null, arm:null, tail:null, tailFront:false, eyes:'open', mouth:'' };
  const pose = c.pose;

  if(pose==='sit' || pose==='meow' || pose==='groom' || pose==='happy'){
    const rot = -1.2, rx = L*.34, ry = B*.45, bx = L*.04, by = -(B*.45 + L*.22);
    const ax = Math.cos(rot), ay = Math.sin(rot), px = -ay, py = ax;
    P.body = {x:bx, y:by, rx, ry, rot};
    P.haunch = {x:-L*.12, y:-B*.44, rx:L*.3, ry:B*.44, rot:0};
    const nb = [bx+ax*rx*.72, by+ay*rx*.72];
    let hx = nb[0]+hr*.35, hy = nb[1]-hr*.55, ht = Math.sin(t*.7+c.seed)*.06;
    const sh = [bx+ax*rx*.15+px*ry*.5, by+ay*rx*.15+py*ry*.5];
    P.far.push({a:[sh[0]-3, sh[1]], b:[sh[0]-2.5, 0]});
    P.paws.push({x:-L*.12+L*.24, y:-g.legW*.4, rx:g.legW*.75, ry:g.legW*.45});
    if(pose==='groom'){
      const lk = Math.sin(t*9);
      hx += hr*.1; hy += hr*.12; ht = .28 + lk*.07;
      P.eyes = 'closed'; P.mouth = 'tongue';
      P.arm = {a:sh, b:[hx+hr*.75, hy+hr*.55+lk*2]};
    } else P.near.push({a:sh, b:[sh[0]+1.5, 0]});
    if(pose==='meow'){ ht = -.28; P.mouth = c.taskT < .8 ? 'open' : ''; }
    if(pose==='happy'){ P.eyes = 'happy'; ht = Math.sin(t*3)*.1; }
    P.head = {x:hx, y:hy, tilt:ht};
    P.neck = {a:nb, b:[hx,hy], w:Math.min(hr*1.1, B*.85)};
    if(pose==='happy'){
      const b0 = [-L*.36, -B*.35], s = Math.sin(t*3);
      P.tail = {a:b0, c:[b0[0]-tl*.35, b0[1]-tl*.2], b:[b0[0]-tl*.15+s*tl*.15, b0[1]-tl*.95]};
    } else {
      const b0 = [-L*.36, -B*.16];
      P.tail = {a:b0, c:[b0[0]-tl*.15, 1], b:[b0[0]+Math.min(tl*1.25, L*.9)+Math.sin(t*1.6)*3, -3]};
      P.tailFront = true;
    }
    return P;
  }

  if(pose==='loaf'){
    P.body = {x:0, y:-B*.5, rx:L*.52, ry:B*.52, rot:0};
    const nb = [L*.33, -B*.62], hx = L*.47, hy = -B*.9 - hr*.25;
    P.head = {x:hx, y:hy, tilt:Math.sin(t*.6+c.seed)*.05};
    P.neck = {a:nb, b:[hx,hy], w:Math.min(hr*1.1, B*.85)};
    P.paws.push({x:L*.47, y:-g.legW*.42, rx:g.legW*.8, ry:g.legW*.45});
    const b0 = [-L*.48, -B*.28];
    P.tail = {a:b0, c:[b0[0]-tl*.12, 2], b:[b0[0]+Math.min(tl*1.15, L*.85)+Math.sin(t*1.3)*2, -2.5]};
    P.tailFront = true;
    if(Math.sin(t*.35+c.seed) > .55) P.eyes = 'closed';
    return P;
  }

  if(pose==='sleep'){
    const br = 1 + Math.sin(t*1.8)*.035;
    P.body = {x:0, y:-B*.48*br, rx:L*.47, ry:B*.5*br, rot:0};
    P.head = {x:L*.36, y:-hr*.78, tilt:.3};
    P.paws.push({x:L*.52, y:-g.legW*.4, rx:g.legW*.8, ry:g.legW*.45});
    const b0 = [-L*.42, -B*.25];
    P.tail = {a:b0, c:[b0[0]+tl*.2, 6], b:[b0[0]+Math.min(tl*1.55, L*.95), -3]};
    P.tailFront = true; P.eyes = 'sleep';
    return P;
  }

  // ---- poses de pie (caminar, correr, comer, estirarse, agacharse, saltar...)
  let by = -(lg + B*.42), tilt = 0, wig = 0, ph = 0, stride = 0, lift = 0;
  let offs = [0, Math.PI, Math.PI, 0]; // delantera cerca, delantera lejos, trasera cerca, trasera lejos
  let tailMode = 'mid', headMode = 'n';
  switch(pose){
    case 'walk': ph = t*8; stride = L*.15; lift = 4; by -= Math.abs(Math.sin(ph))*1.4; tailMode = 'up'; break;
    case 'run': ph = t*15; stride = L*.28; lift = 8; offs = [0,.6,Math.PI,Math.PI+.6]; by += Math.sin(ph*2)*2.2 - 2; tilt = Math.sin(ph)*.07; tailMode = 'back'; headMode = 'run'; break;
    case 'eat': tilt = .1; headMode = 'eat'; break;
    case 'stretch': tilt = .3; by += 4; tailMode = 'up'; headMode = 'yawn'; break;
    case 'crouch': by += lg*.55; tilt = .07; wig = Math.sin(t*24)*1.8; tailMode = 'low'; headMode = 'low'; P.eyes = 'wide'; break;
    case 'bat': tilt = -.08; headMode = 'low'; P.eyes = 'wide'; break;
    case 'jump': tilt = c.jtilt; tailMode = 'back'; headMode = 'run'; break;
    case 'hop': tailMode = 'up'; P.eyes = 'wide'; break;
    default: tailMode = c.def.p.playful > 1 ? 'up' : 'mid';
  }
  const co = Math.cos(tilt), si = Math.sin(tilt);
  const ro = (x, y) => [wig + x*co - y*si, by + x*si + y*co];
  P.body = {x:wig, y:by, rx:L/2, ry:B/2, rot:tilt};
  const sh = ro(L*.29, B*.15), hp = ro(-L*.29, B*.15);
  const ft = (top, o, front) => {
    if(pose==='jump') return front ? [top[0]+L*.22, top[1]+lg*.8] : [top[0]-L*.28, top[1]+lg*.75];
    if(pose==='hop') return [top[0]+(front?2:-2), top[1]+lg*.85];
    if(pose==='stretch' && front) return [top[0]+L*.3, 0];
    return [top[0] + Math.sin(ph+o)*stride, -Math.max(0, Math.cos(ph+o))*lift];
  };
  const shF = [sh[0]-3, sh[1]], hpF = [hp[0]-3, hp[1]];
  P.far.push({a:shF, b:ft(shF, offs[1], true)});
  P.far.push({a:hpF, b:ft(hpF, offs[3], false), hind:true});
  if(pose==='bat'){
    const sw = Math.sin(c.batT*14);
    P.arm = {a:sh, b:[sh[0]+L*.32+sw*3, sh[1]+lg*.15-Math.abs(sw)*7]};
  } else P.near.push({a:sh, b:ft(sh, offs[0], true)});
  P.near.push({a:hp, b:ft(hp, offs[2], false), hind:true});

  const nb = ro(L*.36, -B*.18);
  let hx = nb[0]+hr*.5, hy = nb[1]-hr*.72, ht = 0;
  if(headMode==='eat'){ hx = L*.5+hr*.55; hy = -hr*.95 + Math.sin(t*9)*1.3; ht = .35; P.eyes = 'closed'; }
  else if(headMode==='yawn'){ hx = nb[0]+hr*.85; hy = nb[1]-hr*.2; ht = -.3; P.eyes = 'closed'; P.mouth = 'open'; }
  else if(headMode==='low'){ hx = nb[0]+hr*.8; hy = nb[1]-hr*.25; }
  else if(headMode==='run'){ hx = nb[0]+hr*.75; hy = nb[1]-hr*.45; }
  else if(pose==='walk'){ hy += Math.sin(ph*2)*.8; }
  P.head = {x:hx, y:hy, tilt:ht};
  P.neck = {a:nb, b:[hx,hy], w:Math.min(hr*1.1, B*.85)};

  const b0 = ro(-L*.46, -B*.12), s = Math.sin(t*(pose==='walk'?4:2.2) + c.seed);
  let tc, tb;
  if(tailMode==='up'){ tc = [b0[0]-tl*.55, b0[1]-tl*.05]; tb = [b0[0]-tl*.4+s*tl*.18, b0[1]-tl*.92]; }
  else if(tailMode==='back'){ tc = [b0[0]-tl*.5, b0[1]-tl*.02]; tb = [b0[0]-tl*.98, b0[1]-tl*.22+s*tl*.12]; }
  else if(tailMode==='low'){ tc = [b0[0]-tl*.5, b0[1]+tl*.2]; tb = [b0[0]-tl*.95, Math.min(-3, b0[1]+tl*.15)+Math.sin(t*14)*2]; }
  else { tc = [b0[0]-tl*.5, b0[1]+tl*.15]; tb = [b0[0]-tl*.85+s*tl*.08, b0[1]-tl*.3+s*tl*.05]; }
  P.tail = {a:b0, c:tc, b:tb};
  return P;
}

function ellPath(e, fluff){
  const p = new Path2D();
  if(fluff) blobPath(p, e.x, e.y, e.rx, e.ry, e.rot, 16, .08);
  else { p.ellipse(e.x, e.y, e.rx, e.ry, e.rot, 0, TAU); }
  return p;
}
function reOut(g, path, O){ g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = O*1.2; g.fill(path); g.stroke(path); }

function bodyPattern(g, c, e, isHaunch){
  const d = c.def, co = Math.cos(e.rot), si = Math.sin(e.rot);
  const P = (u, v) => [e.x + u*e.rx*co - v*e.ry*si, e.y + u*e.rx*si + v*e.ry*co];
  switch(d.pattern){
    case 'tabby':
      g.strokeStyle = d.c2; g.lineWidth = 3.6;
      if(isHaunch){ for(const s of [.78,.48]){ g.beginPath(); g.ellipse(e.x, e.y, e.rx*s, e.ry*s, 0, Math.PI*1.05, Math.PI*1.95); g.stroke(); } }
      else for(const u of [-.72,-.42,-.12,.18,.48]){ const a = P(u,-1.1), m = P(u+.14,-.45), b = P(u-.04,.2); g.beginPath(); g.moveTo(a[0],a[1]); g.quadraticCurveTo(m[0],m[1],b[0],b[1]); g.stroke(); }
      break;
    case 'tuxedo':
      if(!isHaunch){ const p = P(.42,.62); g.fillStyle = d.c2; g.beginPath(); g.ellipse(p[0], p[1], e.rx*.48, e.ry*.62, e.rot, 0, TAU); g.fill(); }
      break;
    case 'calico': case 'bicolor':
      for(const q of (isHaunch ? c.pat.hp : c.pat.patches)){ const p = P(q.u,q.v); g.fillStyle = q.col; g.beginPath(); g.ellipse(p[0], p[1], q.s*e.ry*1.45, q.s*e.ry, e.rot+q.r, 0, TAU); g.fill(); }
      break;
    case 'spots':
      g.fillStyle = d.c2;
      for(const q of c.pat.dots){ const p = P(q.u, q.v); g.beginPath(); g.ellipse(p[0], p[1], q.s*1.2, q.s, e.rot, 0, TAU); g.fill(); }
      break;
    case 'sphynx':
      g.strokeStyle = d.c2; g.lineWidth = 1.4;
      for(const u of [.55,.68]){ const a = P(u,-.9), b = P(u+.05,-.2); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
      break;
  }
  if(d.acc==='sweater' && !isHaunch){
    const q = [P(-.42,-1.4), P(1.4,-1.4), P(1.4,1.4), P(-.42,1.4)];
    g.fillStyle = d.accColor; g.beginPath(); q.forEach((p,i)=> i ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1])); g.closePath(); g.fill();
    g.strokeStyle = '#f6e7d0'; g.lineWidth = 3.4;
    for(const u of [-.05,.35,.75]){ const a = P(u,-1.4), b = P(u,1.4); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
    g.strokeStyle = INK; g.lineWidth = 1.6; g.beginPath(); g.moveTo(q[0][0],q[0][1]); g.lineTo(q[3][0],q[3][1]); g.stroke();
  }
}

function headPattern(g, c, r){
  const d = c.def;
  const line = (x1,y1,x2,y2) => { g.beginPath(); g.moveTo(x1*r,y1*r); g.lineTo(x2*r,y2*r); g.stroke(); };
  switch(d.pattern){
    case 'tabby':
      g.strokeStyle = d.c2; g.lineWidth = 2.6;
      line(-.12,-1,-.02,-.62); line(.14,-1.02,.17,-.64); line(.38,-.95,.33,-.6);
      line(-.15,.12,-.68,.02); line(-.1,.34,-.62,.38);
      break;
    case 'tuxedo':
      g.fillStyle = d.c2;
      g.beginPath(); g.ellipse(r*.66, r*.32, r*.44, r*.32, 0, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(r*.46, r*.12); g.lineTo(r*.62, -r*.58); g.lineTo(r*.8, r*.1); g.closePath(); g.fill();
      g.beginPath(); g.ellipse(r*.45, r*.72, r*.38, r*.22, 0, 0, TAU); g.fill();
      break;
    case 'calico':
      g.fillStyle = d.c2; g.beginPath(); g.ellipse(-r*.35, -r*.45, r*.62, r*.55, .3, 0, TAU); g.fill();
      g.fillStyle = d.c3; g.beginPath(); g.ellipse(r*.62, -r*.72, r*.36, r*.3, 0, 0, TAU); g.fill();
      break;
    case 'bicolor':
      g.fillStyle = d.c2; g.beginPath(); g.ellipse(-r*.25, -r*.72, r*.78, r*.55, 0, 0, TAU); g.fill();
      break;
    case 'spots':
      g.fillStyle = d.c2; for(const [x,y] of [[-.3,-.5],[.1,-.72],[-.6,-.1],[-.45,.35]]){ g.beginPath(); g.arc(x*r, y*r, 2.4, 0, TAU); g.fill(); }
      break;
    case 'points': {
      const gr = g.createRadialGradient(r*.68, r*.25, 0, r*.68, r*.25, r*1.05);
      gr.addColorStop(0, d.c2); gr.addColorStop(.5, rgba(d.c2,.8)); gr.addColorStop(1, rgba(d.c2,0));
      g.fillStyle = gr; g.fillRect(-r*1.5, -r*1.5, r*3, r*3);
      break; }
    case 'sphynx':
      g.strokeStyle = d.c2; g.lineWidth = 1.5;
      for(const [y,w] of [[-.62,.28],[-.48,.32],[-.34,.24]]){ g.beginPath(); g.ellipse(r*.25, y*r+r*.25, w*r, r*.2, 0, Math.PI*1.2, Math.PI*1.8); g.stroke(); }
      break;
  }
}

function drawFace(g, c, P){
  const r = c.geo.hr, d = c.def, es = r*.23*(d.eyeSize||1), fi = c.col.faceInk;
  let mode = P.eyes; if(mode==='open' && c.blink > 0) mode = 'closed';
  const eyes = [[r*.36, -r*.06, 1, d.eyes[0]], [r*.82, -r*.09, .6, d.eyes[1]]];
  for(const [ex,ey,sx,col] of eyes){
    g.save(); g.translate(ex,ey); g.scale(sx,1);
    if(mode==='open' || mode==='wide'){
      g.fillStyle = INK; g.beginPath(); g.arc(0,0,es+1.4,0,TAU); g.fill();
      g.fillStyle = col; g.beginPath(); g.arc(0,0,es,0,TAU); g.fill();
      g.fillStyle = INK; g.beginPath(); g.ellipse(.5, 0, mode==='wide'?es*.66:es*.3, es*(mode==='wide'?.72:.78), 0, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(-es*.3, -es*.35, es*.28, 0, TAU); g.fill();
    } else {
      g.strokeStyle = fi; g.lineWidth = 2;
      g.beginPath();
      if(mode==='happy') g.arc(0, es*.45, es*.85, Math.PI*1.15, Math.PI*1.85);
      else g.arc(0, -es*.3, es*.9, Math.PI*.15, Math.PI*.85);
      g.stroke();
    }
    g.restore();
  }
  // nariz y boca
  g.fillStyle = c.col.nose; g.beginPath(); g.moveTo(r*.92, r*.04); g.lineTo(r*1.08, r*.04); g.lineTo(r*1.0, r*.15); g.closePath(); g.fill();
  g.strokeStyle = fi; g.lineWidth = 1.5;
  if(P.mouth==='open'){
    g.fillStyle = '#7a2b2b'; g.beginPath(); g.ellipse(r*.93, r*.36, r*.13, r*.18, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#f08a96'; g.beginPath(); g.ellipse(r*.93, r*.46, r*.08, r*.06, 0, 0, TAU); g.fill();
  } else {
    g.beginPath(); g.moveTo(r*1.0, r*.15); g.lineTo(r*.99, r*.24); g.quadraticCurveTo(r*.93, r*.32, r*.84, r*.27); g.stroke();
    if(P.mouth==='tongue'){ g.fillStyle = '#f08a96'; g.beginPath(); g.ellipse(r*1.0, r*.32, r*.08, r*.1, 0, 0, TAU); g.fill(); }
  }
  // bigotes
  g.strokeStyle = c.col.whisk; g.lineWidth = 1.1;
  const n = d.pattern==='sphynx' ? 2 : 3;
  for(let i=0;i<n;i++){ g.beginPath(); g.moveTo(r*.85, r*(.2+i*.08)); g.lineTo(r*1.6, r*(.08+i*.16)); g.stroke(); }
}

function drawAcc(g, c){
  const d = c.def, r = c.geo.hr;
  if(d.acc==='collar' || d.acc==='sweater'){
    const sweater = d.acc==='sweater';
    g.beginPath(); g.ellipse(-r*.05, r*.72, r*.66, r*.26, 0, Math.PI*.05, Math.PI*.95);
    g.strokeStyle = INK; g.lineWidth = sweater ? 8 : 5.5; g.stroke();
    g.strokeStyle = sweater ? shade(d.accColor,-.15) : d.accColor; g.lineWidth = sweater ? 6 : 3.2; g.stroke();
    if(d.bell){ g.fillStyle = '#f2c94c'; g.beginPath(); g.arc(r*.3, r*1.0, 3.4, 0, TAU); g.fill(); g.strokeStyle = INK; g.lineWidth = 1.5; g.stroke(); }
  }
  if(d.acc==='bow'){
    g.save(); g.translate(-r*.38, -r*.8); g.rotate(-.4);
    g.beginPath(); g.moveTo(0,0); g.lineTo(-8,-5.5); g.lineTo(-8,5.5); g.closePath(); g.moveTo(0,0); g.lineTo(8,-5.5); g.lineTo(8,5.5); g.closePath();
    g.fillStyle = d.accColor; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.6; g.stroke();
    g.beginPath(); g.arc(0,0,2.6,0,TAU); g.fill(); g.stroke();
    g.restore();
  }
  if(d.acc==='bandana'){
    g.beginPath(); g.moveTo(-r*.5, r*.6); g.lineTo(r*.6, r*.72); g.lineTo(-r*.02, r*1.32); g.closePath();
    g.fillStyle = d.accColor; g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#fff'; for(const [x,y] of [[-.15,.78],[.25,.82],[.02,1.05]]){ g.beginPath(); g.arc(x*r, y*r, 1.4, 0, TAU); g.fill(); }
  }
}

function legDetail(g, c, l, path, far){
  const d = c.def, w = c.geo.legW;
  if(d.pattern==='tabby'){ g.setLineDash([2.6,4.4]); g.strokeStyle = far ? c.col.c2far : d.c2; g.lineWidth = w; g.stroke(path); g.setLineDash([]); }
  if(d.pattern==='tuxedo' || d.pattern==='points'){
    const f = d.pattern==='tuxedo' ? .68 : .42;
    g.strokeStyle = far ? c.col.pawFar : c.col.paw; g.lineWidth = w;
    g.beginPath(); g.moveTo(lerp(l.a[0],l.b[0],f), lerp(l.a[1],l.b[1],f)); g.lineTo(l.b[0], l.b[1]); g.stroke();
  }
}
function tailDetail(g, c, path){
  if(c.def.pattern==='tabby'){ g.setLineDash([3,5]); g.strokeStyle = c.def.c2; g.lineWidth = c.geo.tw; g.stroke(path); g.setLineDash([]); }
}

function drawCat(g, c, k, dirO, portrait){
  if(c.sprite && c.sprite.ready) return drawCatSprite(g, c, k, dirO, portrait); // usa tus dibujos si existen
  const P = poseParts(c), gm = c.geo, d = c.def, O = 2.4;
  const dir = dirO || c.dir, base = d.base;
  g.save(); g.scale(dir*k, k); g.lineCap = 'round'; g.lineJoin = 'round';
  const limb = l => { const p = new Path2D(); p.moveTo(l.a[0], l.a[1]); const mx = (l.a[0]+l.b[0])/2 + (l.hind ? -gm.L*.08 : gm.L*.015), my = (l.a[1]+l.b[1])/2; p.quadraticCurveTo(mx, my, l.b[0], l.b[1]); return p; };
  const tailP = P.tail ? (() => { const p = new Path2D(); p.moveTo(P.tail.a[0], P.tail.a[1]); p.quadraticCurveTo(P.tail.c[0], P.tail.c[1], P.tail.b[0], P.tail.b[1]); return p; })() : null;

  // --- capa trasera: patas lejanas + cola
  const farP = P.far.map(limb);
  g.strokeStyle = INK;
  farP.forEach(p => { g.lineWidth = gm.legW + O*2; g.stroke(p); });
  if(tailP && !P.tailFront){ g.lineWidth = gm.tw + O*2; g.stroke(tailP); g.strokeStyle = c.col.tail; g.lineWidth = gm.tw; g.stroke(tailP); tailDetail(g, c, tailP); }
  P.far.forEach((l,i) => { g.strokeStyle = c.col.far; g.lineWidth = gm.legW; g.stroke(farP[i]); legDetail(g, c, l, farP[i], true); });

  // --- capa principal
  const bodyP = ellPath(P.body, d.fluff), hauP = P.haunch ? ellPath(P.haunch, d.fluff) : null;
  const M = new DOMMatrix().translateSelf(P.head.x, P.head.y).rotateSelf(P.head.tilt*57.29578);
  const headW = new Path2D(); headW.addPath(c.cache.head, M);
  const earsW = new Path2D(); earsW.addPath(c.cache.ears, M);
  const pawsP = new Path2D(); P.paws.forEach(q => { pawsP.moveTo(q.x+q.rx, q.y); pawsP.ellipse(q.x, q.y, q.rx, q.ry, 0, 0, TAU); });
  const nearP = P.near.map(limb), armP = P.arm ? limb(P.arm) : null;
  let neckP = null; if(P.neck){ neckP = new Path2D(); neckP.moveTo(P.neck.a[0], P.neck.a[1]); neckP.lineTo(P.neck.b[0], P.neck.b[1]); }

  // contorno grueso exterior
  g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = O*2;
  for(const s of [bodyP, hauP, headW, earsW, P.paws.length ? pawsP : null]) if(s){ g.fill(s); g.stroke(s); }
  if(neckP){ g.lineWidth = P.neck.w + O*2; g.stroke(neckP); }
  nearP.forEach(p => { g.lineWidth = gm.legW + O*2; g.stroke(p); });
  if(armP){ g.lineWidth = gm.legW + O*2; g.stroke(armP); }
  if(tailP && P.tailFront){ g.lineWidth = gm.tw + O*2; g.stroke(tailP); }

  // rellenos
  g.fillStyle = base; g.fill(bodyP);
  g.save(); g.clip(bodyP); bodyPattern(g, c, P.body, false); g.restore();
  if(hauP){ reOut(g, hauP, O); g.fillStyle = base; g.fill(hauP); g.save(); g.clip(hauP); bodyPattern(g, c, P.haunch, true); g.restore(); }
  P.near.forEach((l,i) => {
    g.strokeStyle = INK; g.lineWidth = gm.legW + O*1.2; g.stroke(nearP[i]);
    g.strokeStyle = base; g.lineWidth = gm.legW; g.stroke(nearP[i]); legDetail(g, c, l, nearP[i], false);
  });
  if(P.paws.length){ reOut(g, pawsP, O); g.fillStyle = c.col.paw; g.fill(pawsP); }
  if(neckP){ g.strokeStyle = base; g.lineWidth = P.neck.w; g.stroke(neckP); }

  // cabeza
  reOut(g, earsW, O); reOut(g, headW, O);
  g.fillStyle = c.col.ear; g.fill(earsW);
  g.save(); g.translate(P.head.x, P.head.y); g.rotate(P.head.tilt);
  g.fillStyle = c.col.inner; g.fill(c.cache.inner);
  g.fillStyle = base; g.fill(c.cache.head);
  g.save(); g.clip(c.cache.head); headPattern(g, c, gm.hr); g.restore();
  drawFace(g, c, P);
  drawAcc(g, c);
  g.restore();

  if(armP){
    g.strokeStyle = INK; g.lineWidth = gm.legW + O*1.2; g.stroke(armP);
    g.strokeStyle = base; g.lineWidth = gm.legW; g.stroke(armP); legDetail(g, c, P.arm, armP, false);
  }
  if(tailP && P.tailFront){
    g.strokeStyle = INK; g.lineWidth = gm.tw + O*1.2; g.stroke(tailP);
    g.strokeStyle = c.col.tail; g.lineWidth = gm.tw; g.stroke(tailP); tailDetail(g, c, tailP);
  }
  g.restore();
  if(!portrait){ c.hx = c.x + dir*P.head.x*k; c.hy = c.y - c.z + P.head.y*k; }
}

function drawCatWorld(c){
  const k = escalaGato();
  const sy = c.spot ? c.y - c.z : c.y;
  const lying = c.pose==='sleep' || c.pose==='loaf';
  const shrink = c.spot ? 1 : Math.max(.4, 1 - c.z/(120*G));
  if(!(c.spot && c.spot.kind==='box')){
    ctx.fillStyle = 'rgba(60,35,20,.22)';
    ctx.beginPath(); ctx.ellipse(c.x, sy+1, c.geo.L*(lying?.6:.5)*k*shrink, 5*k*shrink, 0, 0, TAU); ctx.fill();
  }
  ctx.save(); ctx.translate(c.x, c.y - c.z); drawCat(ctx, c, k); ctx.restore();
}
