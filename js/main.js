'use strict';
/* ---------- 8. BUCLE PRINCIPAL ---------- */
function update(dt){
  time += dt;
  for(const c of cats) updateCat(c, dt);

  // pelota
  ball.x += ball.vx*dt; ball.y += ball.vy*dt;
  const f = Math.exp(-1.6*dt); ball.vx *= f; ball.vy *= f;
  if(ball.x < 30){ ball.x = 30; ball.vx = Math.abs(ball.vx)*.7; } if(ball.x > W-30){ ball.x = W-30; ball.vx = -Math.abs(ball.vx)*.7; }
  if(ball.y < walkTop){ ball.y = walkTop; ball.vy = Math.abs(ball.vy)*.7; } if(ball.y > floorBot){ ball.y = floorBot; ball.vy = -Math.abs(ball.vy)*.7; }
  ball.rot += ball.vx*dt/(9*G);

  // premios cayendo
  for(const t of treats){ if(t.z > 0){ t.vz -= 900*G*dt; t.z = Math.max(0, t.z + t.vz*dt); if(t.z === 0 && t.vz < -60*G){ t.vz = -t.vz*.35; t.z = .01; } } }
  treats = treats.filter(t => !t.eaten);

  // el láser atrae gatos
  laserTimer -= dt;
  if(laser.on && laserTimer <= 0){
    laserTimer = .5;
    for(const c of cats){
      if(!interruptible(c) || c.task.type === 'laser') continue;
      const sleeping = c.task.type === 'sleep';
      if(R() < .16*c.def.p.playful*(sleeping ? .15 : 1)){ setTasks(c, [{type:'laser', dur:rand(4,11)}]); }
    }
  }

  for(const cl of clouds) cl.t += dt;
  clouds = clouds.filter(cl => cl.t < cl.dur);

  for(const p of parts){
    p.life -= dt; p.x += p.vx*dt; p.y += p.vy*dt;
    if(p.g) p.vy += 300*dt;
    if(p.type === 'z') p.x += Math.sin(p.life*4)*12*dt;
  }
  parts = parts.filter(p => p.life > 0);

  cardT -= dt; if(cardT <= 0){ cardT = .25; updateCard(); }
}

function heartPath(g, x, y, s){
  g.beginPath(); g.moveTo(x, y + 4*s);
  g.bezierCurveTo(x - 9*s, y - 3*s, x - 5*s, y - 10*s, x, y - 5*s);
  g.bezierCurveTo(x + 5*s, y - 10*s, x + 9*s, y - 3*s, x, y + 4*s);
  g.closePath();
}


function render(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.drawImage(bgC, 0, 0, W, H);

  const items = [];
  for(const c of cats) if(!c.hidden) items.push({ k: catKey(c), f: () => drawCatWorld(c) });
  items.push({ k: tree.y, f: drawTree });
  items.push({ k: box.y - .6, f: drawBoxBack }, { k: box.y + .6, f: drawBoxFront });
  items.push({ k: bed.y - 3, f: drawBed }, { k: bed.y + 3, f: drawBedFront });
  for(const b of bowls) items.push({ k: b.y, f: () => drawBowl(b) });
  items.push({ k: ball.y, f: drawBall });
  for(const t of treats) items.push({ k: t.y, f: () => drawTreat(t) });
  for(const cl of clouds) items.push({ k: cl.y, f: () => drawCloud(cl) });
  items.sort((a, b) => a.k - b.k).forEach(i => i.f());

  // láser
  if(laser.on){
    const r = 5*G;
    const gr = ctx.createRadialGradient(laser.x, laser.y, 0, laser.x, laser.y, r*4);
    gr.addColorStop(0, 'rgba(255,40,40,.9)'); gr.addColorStop(.3, 'rgba(255,40,40,.4)'); gr.addColorStop(1, 'rgba(255,40,40,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(laser.x, laser.y, r*4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(laser.x, laser.y, r*.6, 0, TAU); ctx.fill();
  }

  // partículas
  for(const p of parts){
    const a = clamp(p.life / p.max, 0, 1);
    ctx.globalAlpha = a;
    if(p.type === 'dust'){ ctx.fillStyle = '#f3e3c6'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r*(1.4 - a*.4), 0, TAU); ctx.fill(); }
    else if(p.type === 'dot'){ ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, 2*G, 0, TAU); ctx.fill(); }
    else if(p.type === 'heart'){ heartPath(ctx, p.x, p.y, 1.1*p.s); ctx.fillStyle = '#ff6f91'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.stroke(); }
    else if(p.type === 'z'){ ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.font = `700 ${Math.round((12 + (1-a)*8)*p.s)}px Fredoka, sans-serif`; ctx.textAlign = 'center'; ctx.strokeText('z', p.x, p.y); ctx.fillText('z', p.x, p.y); }
    else if(p.type === 'ring'){ ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(p.x, p.y, (1-a)*14*G + 3, ((1-a)*14*G + 3)*.3, 0, 0, TAU); ctx.stroke(); }
    else if(p.type === 'sparkle'){ ctx.fillStyle = '#ffd56b'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.font = `700 ${Math.round(20*G)}px Fredoka, sans-serif`; ctx.textAlign = 'center'; const yy = p.y - (1-a)*20*G; ctx.strokeText('✦', p.x - 12*G, yy); ctx.fillText('✦', p.x - 12*G, yy); ctx.strokeText('✦', p.x + 14*G, yy - 8*G); ctx.fillText('✦', p.x + 14*G, yy - 8*G); }
  }
  ctx.globalAlpha = 1;

  drawForeground();


  // anillo sobre el gato seleccionado
  if(selected && !selected.hidden){
    const k = escalaGato();
    ctx.fillStyle = '#ffd56b'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    const x = selected.hx, y = selected.hy - selected.geo.hr*k - 8 + Math.sin(time*4)*3;
    ctx.beginPath(); ctx.moveTo(x - 7, y - 10); ctx.lineTo(x + 7, y - 10); ctx.lineTo(x, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  drawPortrait();
}

let last = performance.now();
function frame(now){
  const dt = Math.min(.05, (now - last)/1000); last = now;
  update(dt); render();
  requestAnimationFrame(frame);
}
window.addEventListener('resize', layout);
layout();
cargarPartes();   // carga los dibujos de cada gato (si existen)
for(const c of cats){ c.tasks = [{type:'idle', dur:rand(.2,2.5), pose:pick(['sit','loaf','stand'])}]; }
if(document.fonts && document.fonts.ready) document.fonts.ready.then(() => drawBackground());
requestAnimationFrame(frame);
