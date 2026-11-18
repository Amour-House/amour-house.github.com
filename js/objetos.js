'use strict';
/* ---------- 4. OBJETOS ---------- */
function outlineFill(g, path, fill, lw){ g.fillStyle = fill; g.fill(path); g.strokeStyle = INK; g.lineWidth = lw || 2.5; g.stroke(path); }

function drawBowl(b){
  const k = G*depth(b.y), x = b.x, y = b.y;
  const g = ctx;
  g.fillStyle = 'rgba(60,35,20,.2)'; g.beginPath(); g.ellipse(x, y+2*k, 24*k, 6*k, 0, 0, TAU); g.fill();
  const body = new Path2D();
  body.moveTo(x-22*k, y-12*k); body.lineTo(x-17*k, y); body.ellipse(x, y, 17*k, 5*k, 0, Math.PI, 0, true); body.lineTo(x+22*k, y-12*k); body.closePath();
  outlineFill(g, body, b.kind==='water' ? '#5fa8d3' : '#e8616b');
  g.fillStyle = 'rgba(255,255,255,.5)'; g.font = `${11*k}px Fredoka, sans-serif`; g.textAlign = 'center'; g.fillText(b.kind==='water'?'💧':'🐾', x, y-2*k);
  const rim = new Path2D(); rim.ellipse(x, y-12*k, 22*k, 7*k, 0, 0, TAU);
  outlineFill(g, rim, b.kind==='water' ? '#88c4e6' : '#f28a92');
  const inner = new Path2D(); inner.ellipse(x, y-12*k, 17*k, 4.6*k, 0, 0, TAU);
  if(b.kind==='water'){
    g.fillStyle = '#bfe6fb'; g.fill(inner);
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x-4*k, y-13*k, 6*k, 1.5*k, 0, Math.PI, TAU); g.stroke();
  } else {
    g.fillStyle = '#7a3a3f'; g.fill(inner);
    if(b.food > 0.02){
      const h = (2 + 8*b.food)*k;
      g.fillStyle = '#b2733d'; g.beginPath(); g.ellipse(x, y-12*k, 16*k*Math.min(1,.5+b.food), h, 0, Math.PI, TAU); g.fill();
      g.strokeStyle = INK; g.lineWidth = 1.8; g.stroke();
      const rr = seeded(Math.round(b.x));
      g.fillStyle = '#8c5427';
      for(let i=0;i<Math.round(14*b.food)+2;i++){ const a = rr()*Math.PI, d2 = rr(); g.beginPath(); g.arc(x+Math.cos(a)*13*k*d2*Math.min(1,.5+b.food), y-12*k-Math.sin(a)*h*d2*.85, 1.8*k, 0, TAU); g.fill(); }
    }
  }
}

function drawTree(){
  const k = G*depth(tree.y), x = tree.x, y = tree.y, g = ctx;
  const t1 = spotById('t1'), t2 = spotById('t2');
  g.fillStyle = 'rgba(60,35,20,.22)'; g.beginPath(); g.ellipse(x, y+4*k, 66*k, 14*k, 0, 0, TAU); g.fill();
  const base = new Path2D(); base.ellipse(x, y, 60*k, 13*k, 0, 0, TAU);
  outlineFill(g, base, '#c7b7e8');
  const post = (px, y0, y1) => {
    const p = new Path2D(); p.rect(px-9*k, y1, 18*k, y0-y1);
    outlineFill(g, p, '#e6c48a');
    g.save(); g.clip(p); g.strokeStyle = 'rgba(120,80,30,.45)'; g.lineWidth = 1.3;
    for(let yy=y1; yy<y0+20*k; yy+=4*k){ g.beginPath(); g.moveTo(px-10*k, yy); g.lineTo(px+10*k, yy-5*k); g.stroke(); }
    g.restore();
  };
  post(x-8*k, y-2*k, y-t1.z);
  post(x+10*k, y-t1.z, y-t2.z);
  const plat = (s, w) => {
    const top = y - s.z;
    const side = new Path2D(); side.rect(s.x-w, top, w*2, 9*k);
    outlineFill(g, side, '#9d86d6');
    const p = new Path2D(); p.ellipse(s.x, top, w, 9*k, 0, 0, TAU);
    outlineFill(g, p, '#c7b7e8');
    const p2 = new Path2D(); p2.ellipse(s.x, top+9*k, w, 9*k, 0, 0, Math.PI);
    g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke(p2);
  };
  plat(t1, 50*k);
  // pompón colgante
  const ax = t1.x - 34*k, ay = y - t1.z + 8*k, ang = Math.sin(time*2.3)*.35;
  const bx = ax + Math.sin(ang)*30*k, by = ay + Math.cos(ang)*30*k;
  g.strokeStyle = INK; g.lineWidth = 1.5; g.beginPath(); g.moveTo(ax,ay); g.lineTo(bx,by); g.stroke();
  const pom = new Path2D(); blobPath(pom, bx, by, 6.5*k, 6.5*k, 0, 10, .18);
  outlineFill(g, pom, '#ff7aa8', 2);
  plat(t2, 46*k);
  // borde acolchado arriba
  const rim = new Path2D(); rim.ellipse(t2.x, y-t2.z-2*k, 40*k, 7*k, 0, Math.PI*1.05, Math.PI*1.95);
  g.strokeStyle = INK; g.lineWidth = 9*k+3; g.stroke(rim); g.strokeStyle = '#ffd56b'; g.lineWidth = 9*k; g.stroke(rim);
}

function drawBoxBack(){
  const k = G*depth(box.y), x = box.x, y = box.y, w = 50*k, h = 42*k, d = 14*k, g = ctx;
  g.fillStyle = 'rgba(60,35,20,.22)'; g.beginPath(); g.ellipse(x+6*k, y+3*k, 52*k, 10*k, 0, 0, TAU); g.fill();
  const flap = new Path2D(); flap.moveTo(x-w+d, y-h-d); flap.lineTo(x-w+d+6*k, y-h-d-22*k); flap.lineTo(x+w+d-4*k, y-h-d-20*k); flap.lineTo(x+w+d, y-h-d); flap.closePath();
  outlineFill(g, flap, '#c9935a');
  const inside = new Path2D(); inside.moveTo(x-w, y-h); inside.lineTo(x-w+d, y-h-d); inside.lineTo(x+w+d, y-h-d); inside.lineTo(x+w, y-h); inside.closePath();
  outlineFill(g, inside, '#7a4f2a');
}
function drawBoxFront(){
  const k = G*depth(box.y), x = box.x, y = box.y, w = 50*k, h = 42*k, d = 14*k, g = ctx;
  const side = new Path2D(); side.moveTo(x+w, y); side.lineTo(x+w+d, y-d); side.lineTo(x+w+d, y-h-d); side.lineTo(x+w, y-h); side.closePath();
  outlineFill(g, side, '#b98149');
  const front = new Path2D(); front.rect(x-w, y-h, w*2, h);
  outlineFill(g, front, '#dba567');
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x-6*k, y-h, 12*k, h*.45);
  g.fillStyle = '#8b5a2b'; g.font = `700 ${10*k}px Fredoka, sans-serif`; g.textAlign = 'center'; g.fillText('FRÁGIL ♥', x, y-h*.32);
  const lf = new Path2D(); lf.moveTo(x-w, y-h); lf.lineTo(x-w-14*k, y-h+16*k); lf.lineTo(x-w-12*k, y-h+28*k); lf.lineTo(x-w, y-h+8*k); lf.closePath();
  outlineFill(g, lf, '#c9935a', 2);
}

function drawBed(){
  const k = G*depth(bed.y), x = bed.x, y = bed.y, g = ctx;
  g.fillStyle = 'rgba(60,35,20,.22)'; g.beginPath(); g.ellipse(x, y+4*k, 58*k, 13*k, 0, 0, TAU); g.fill();
  const outer = new Path2D(); outer.ellipse(x, y-4*k, 52*k, 17*k, 0, 0, TAU);
  outlineFill(g, outer, '#7c6cc4');
  const inner = new Path2D(); inner.ellipse(x, y-6*k, 38*k, 10*k, 0, 0, TAU);
  outlineFill(g, inner, '#b9aef0', 2);
  g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(x-18*k, y-12*k, 14*k, 3*k, 0, 0, TAU); g.fill();
}
function drawBedFront(){
  const k = G*depth(bed.y), x = bed.x, y = bed.y, g = ctx;
  const p = new Path2D(); p.ellipse(x, y-4*k, 52*k, 17*k, 0, .15, Math.PI-.15);
  g.strokeStyle = INK; g.lineWidth = 12*k+3; g.stroke(p); g.strokeStyle = '#7c6cc4'; g.lineWidth = 12*k; g.stroke(p);
}

function drawBall(){
  const k = G*depth(ball.y), r = 9*k, g = ctx;
  g.fillStyle = 'rgba(60,35,20,.22)'; g.beginPath(); g.ellipse(ball.x, ball.y+1, r*1.1, r*.35, 0, 0, TAU); g.fill();
  const p = new Path2D(); p.arc(ball.x, ball.y-r, r, 0, TAU);
  outlineFill(g, p, '#e86a8f', 2.2);
  g.save(); g.clip(p); g.translate(ball.x, ball.y-r); g.rotate(ball.rot);
  g.strokeStyle = '#ffb3c8'; g.lineWidth = 1.6;
  for(let i=-2;i<=2;i++){ g.beginPath(); g.ellipse(i*3.4*k, 0, r*.5, r*1.2, .5, 0, TAU); g.stroke(); }
  g.restore();
  g.strokeStyle = '#e86a8f'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(ball.x+r*.6, ball.y-r*.3); g.quadraticCurveTo(ball.x+r*1.8, ball.y, ball.x+r*2.4, ball.y-1); g.stroke();
}

function drawTreat(t){
  const k = G*depth(t.y), x = t.x, y = t.y - t.z, g = ctx;
  g.fillStyle = 'rgba(60,35,20,.2)'; g.beginPath(); g.ellipse(t.x, t.y+1, 9*k, 3*k, 0, 0, TAU); g.fill();
  const p = new Path2D(); p.ellipse(x, y-5*k, 8*k, 4.6*k, 0, 0, TAU);
  p.moveTo(x-6*k, y-5*k); p.lineTo(x-13*k, y-10*k); p.lineTo(x-13*k, y); p.closePath();
  outlineFill(g, p, '#d98b45', 2);
  g.fillStyle = INK; g.beginPath(); g.arc(x+4*k, y-6*k, 1.2*k, 0, TAU); g.fill();
}

function drawCloud(cl){
  const k = G*depth(cl.y), g = ctx, x = cl.x, y = cl.y - 22*k;
  const p = new Path2D();
  for(let i=0;i<8;i++){
    const a = i/8*TAU + time*6, r = (15 + Math.sin(time*17+i*2)*3)*k;
    const cx = x + Math.cos(a)*20*k, cy = y + Math.sin(a)*11*k;
    p.moveTo(cx+r, cy); p.arc(cx, cy, r, 0, TAU);
  }
  g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = 5; g.fill(p); g.stroke(p);
  // patitas y colas que asoman
  const cols = [cl.a.def.base, cl.b.def.base];
  for(let i=0;i<4;i++){
    const a = Math.sin(time*9+i*1.7)*Math.PI + i*1.6, l = (30+Math.sin(time*13+i)*8)*k;
    const ex = x + Math.cos(a)*l, ey = y + Math.sin(a)*l*.7;
    g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 10*k+4; g.beginPath(); g.moveTo(x,y); g.lineTo(ex,ey); g.stroke();
    g.strokeStyle = cols[i%2]; g.lineWidth = 10*k; g.stroke();
  }
  g.fillStyle = '#f5eee2'; g.fill(p);
  g.fillStyle = '#ffd56b'; g.font = `700 ${16*k}px Fredoka, sans-serif`; g.textAlign = 'center';
  for(let i=0;i<3;i++){ const a = time*4 + i*2.1; g.fillText('✦', x + Math.cos(a)*36*k, y - 18*k + Math.sin(a)*10*k); }
  g.fillStyle = INK; g.font = `700 ${14*k}px Fredoka, sans-serif`; g.fillText(pick(['¡!','#@!','¡Pff!','¡!']), x, y+5*k);
}

function drawForeground(){
  const g = ctx, k = G;
  const x = W - 10*k, y = H + 10*k;
  for(let i=0;i<6;i++){
    const a = -Math.PI*.55 - i*.2 + Math.sin(time*.8+i)*.03, l = (110 + (i%3)*30)*k;
    const leaf = new Path2D();
    const ex = x + Math.cos(a)*l, ey = y + Math.sin(a)*l;
    leaf.moveTo(x,y); leaf.quadraticCurveTo(x+Math.cos(a-.35)*l*.7, y+Math.sin(a-.35)*l*.7, ex, ey); leaf.quadraticCurveTo(x+Math.cos(a+.35)*l*.7, y+Math.sin(a+.35)*l*.7, x, y);
    outlineFill(g, leaf, i%2 ? '#4f9445' : '#5fa651');
    g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x,y); g.lineTo(lerp(x,ex,.85), lerp(y,ey,.85)); g.stroke();
  }
}
