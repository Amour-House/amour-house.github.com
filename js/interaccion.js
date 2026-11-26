'use strict';
/* ---------- 7. INTERACCIÓN ---------- */
let tool = 'info', selected = null, laserTimer = 0;
const card = document.getElementById('card');
const portrait = document.getElementById('portrait'), pctx = portrait.getContext('2d');

document.querySelectorAll('[data-tool]').forEach(btn => btn.addEventListener('click', () => {
  tool = btn.dataset.tool;
  document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('active', b === btn));
  if(tool !== 'laser') laser.on = false;
  cv.style.cursor = tool === 'laser' ? 'none' : (tool === 'pet' || tool === 'info') ? 'default' : 'crosshair';
}));
// Enlace del botón "Adoptar" (por ejemplo un formulario o WhatsApp). Si está vacío, solo muestra un mensaje.
const ENLACE_ADOPTAR = '';

function closeCard(){ selected = null; card.hidden = true; }
document.getElementById('cardClose').addEventListener('click', closeCard);
card.addEventListener('click', e => { if(e.target === card) closeCard(); });   // clic fuera del panel lo cierra
document.getElementById('cardAccion').addEventListener('click', () => {
  const btn = document.getElementById('cardAccion');
  if(!document.getElementById('paso1').hidden){
    // paso 1 → paso 2: se esconde la info y aparece la edad
    document.getElementById('paso1').hidden = true;
    document.getElementById('paso2').hidden = false;
    btn.textContent = 'Adoptar 💛'; btn.classList.add('adoptar');
  } else if(ENLACE_ADOPTAR){
    window.open(ENLACE_ADOPTAR, '_blank');
  } else {
    btn.textContent = '¡Gracias por tu interés! 💛';
  }
});
window.addEventListener('keydown', e => { if(e.key === 'Escape' && !card.hidden) closeCard(); });


function catKey(c){ return c.y + (c.spot && c.spot.kind === 'tree' ? .5 : 0); }
function hitCat(x, y){
  const list = cats.filter(c => !c.hidden).sort((a,b) => catKey(b) - catKey(a));
  for(const c of list){
    const k = escalaGato(), g = c.geo;
    const cx = c.x + c.dir*g.L*.1*k, top = c.y - c.z - (g.legL + g.H + g.hr*1.7)*k, bot = c.y - c.z + 4;
    const hw = (g.L*.55 + g.hr*.5)*k;
    if(x > cx - hw && x < cx + hw && y > top && y < bot) return c;
  }
  return null;
}
function floorPoint(x, y){ return { x: clampX(x), y: clampY(y) }; }

function openCard(c){
  selected = c; card.hidden = false;
  // al conocerlo, el gato te saluda con su miau (abre la boca si no está ocupado)
  desbloquearAudio();
  if(interruptible(c)) setTasks(c, [{type:'meow', forzar:true}]);
  else sonidoMiau(c, true);
  document.getElementById('cName').textContent = c.def.name;
  document.getElementById('cDesc').textContent = c.def.desc;
  document.getElementById('cTags').innerHTML = c.def.tags.map(t => `<span>${t}</span>`).join('');
  document.getElementById('cEdad').textContent = c.def.edad || 'Por confirmar';
  // foto real si la tiene; si no, el dibujo animado
  const foto = document.getElementById('cFoto');
  if(c.def.foto){ foto.src = c.def.foto; foto.alt = 'Foto de ' + c.def.name; foto.hidden = false; portrait.hidden = true; }
  else { foto.hidden = true; portrait.hidden = false; }
  // siempre parte en el paso 1
  document.getElementById('paso1').hidden = false;
  document.getElementById('paso2').hidden = true;
  const btn = document.getElementById('cardAccion');
  btn.textContent = 'Siguiente →'; btn.classList.remove('adoptar');
  updateCard();
}
function stateText(c){
  const t = c.task; if(!t) return 'Pensando...';
  const where = c.spot ? ({tree:' en el árbol', shelf:' en la repisa', box:' en la caja', bed:(fondoImg() ? ' en la cama colgante' : ' en su camita')})[c.spot.kind] : '';
  switch(t.type){
    case 'idle': return (t.pose === 'loaf' ? 'Haciendo de pancito' : t.pose === 'stand' ? 'Mirando alrededor' : t.pose === 'happy' ? 'Feliz' : 'Sentado, contemplando') + where;
    case 'move': return t.run ? 'Corriendo' : 'Paseando';
    case 'sleep': return 'Durmiendo 💤' + where;
    case 'eat': return 'Comiendo 🍽️'; case 'drink': return 'Tomando agua'; case 'munch': return 'Comiendo un premio';
    case 'groom': return 'Acicalándose' + where; case 'stretch': return 'Estirándose';
    case 'meow': return 'Maullando' + where; case 'pet': return 'Ronroneando ❤';
    case 'chase': return 'Persiguiendo a ' + t.target.def.name; case 'flee': return 'Huyendo de ' + t.from.def.name;
    case 'wrestle': return '¡Pelea de juego!'; case 'erizado': return 'Erizado frente a ' + t.target.def.name + ' 😾';
    case 'carino': return 'Haciéndose cariño con ' + t.target.def.name + ' 💕'; case 'ball': return 'Jugando con la pelota';
    case 'laser': return 'Cazando el láser'; case 'treat': return 'Yendo por un premio';
    case 'zoom': return '¡ZOOMIES!'; case 'jump': return 'Saltando'; case 'crouch': return 'Preparando el salto';
    case 'esperar': return 'Esperando su turno' + (t.act === 'laser' ? ' para el láser' : t.act === 'pelota' ? ' para la pelota' : '');
    case 'hop': return '¡Sorpresa!'; case 'sniffAt': return 'Haciéndose cariño con ' + t.target.def.name + ' 💕';
  }
  return 'Haciendo cosas de gato';
}
let cardT = 0;
function updateCard(){
  if(!selected) return;
  document.getElementById('cState').textContent = stateText(selected);
}
// Retrato grande y animado del gato en la ficha (hace lo mismo que en el catio)
function drawPortrait(){
  if(!selected || card.hidden || portrait.hidden) return;
  const w = portrait.clientWidth || 300, h = portrait.clientHeight || 300, css = Math.min(w, h);
  if(portrait.width !== Math.round(w*DPR) || portrait.height !== Math.round(h*DPR)){ portrait.width = Math.round(w*DPR); portrait.height = Math.round(h*DPR); }
  pctx.setTransform(DPR,0,0,DPR,0,0); pctx.clearRect(0,0,w,h);
  const c = selected, sp = c.sprite;
  // alto aproximado del gato en unidades del juego, para que llene el recuadro
  const alto = sp && sp.ready ? sp.alto + Math.hypot(sp.headOff[0], sp.headOff[1])*2.4 + 10 : (c.geo.legL + c.geo.H + c.geo.hr*2.6);
  const k = css*.62/alto;
  pctx.save(); pctx.translate(w*.5, h*.84);
  pctx.fillStyle = 'rgba(60,35,20,.18)'; pctx.beginPath(); pctx.ellipse(0, 2, css*.28, css*.04, 0, 0, TAU); pctx.fill();
  drawCat(pctx, c, k, 1, true);
  pctx.restore();
}

cv.addEventListener('pointerdown', e => {
  const x = e.clientX, y = e.clientY;
  if(tool === 'info'){
    const c = hitCat(x, y);
    if(c){ openCard(c); return; }
  }
  if(tool === 'pet'){
    const c = hitCat(x, y);
    if(c){
      if(!c.task || !['jump','wrestle','erizado'].includes(c.task.type)) setTasks(c, [{type:'pet', dur:2.4}]);
      return;
    }
  }
  if(tool === 'treat'){ const p = floorPoint(x, y); dropTreat(p.x, p.y); }
  if(tool === 'ball'){ const p = floorPoint(x, y); kickBall(p.x, p.y); }
  if(tool === 'laser'){ setLaser(x, y); }
});
cv.addEventListener('pointermove', e => {
  if(tool === 'laser'){ setLaser(e.clientX, e.clientY); return; }
  if(tool === 'pet' || tool === 'info') cv.style.cursor = hitCat(e.clientX, e.clientY) ? 'pointer' : 'default';
});
cv.addEventListener('pointerleave', () => { laser.on = false; });
cv.addEventListener('pointerup', e => { if(e.pointerType !== 'mouse') laser.on = false; });

function setLaser(x, y){ const p = floorPoint(x, y); laser.on = true; laser.x = p.x; laser.y = p.y; }

function dropTreat(x, y){
  const tr = { x, y, z:60*G, vz:0, eaten:false };
  treats.push(tr);
  // un solo gato va por cada premio (ticket "premio")
  const cand = cats.filter(c => interruptible(c) && !c.ticket).map(c => ({ c, s: R() - (c.task.type === 'sleep' ? .5 : 0) })).sort((a,b) => b.s - a.s);
  if(cand.length) darTurno(cand[0].c, 'premio', [{type:'treat', treat:tr}], tr);
}
function kickBall(x, y){
  ball.vx = (x - ball.x)*1.6; ball.vy = (y - ball.y)*1.6;
  const v = Math.hypot(ball.vx, ball.vy), mx = 700*G; if(v > mx){ ball.vx *= mx/v; ball.vy *= mx/v; }
  // un gato juega con la pelota (ticket "pelota"); a veces otro se pone en la fila
  if(quienesTienen('pelota').length) return;
  const cand = cats.filter(c => interruptible(c) && !c.ticket && !['ball','sleep','esperar'].includes(c.task.type)).sort((a,b) => (b.def.p.playful + R()) - (a.def.p.playful + R()));
  if(!cand.length) return;
  if(hayTicket('pelota')) darTurno(cand[0], 'pelota', [{type:'ball', n:randi(2,4)}]);
  else ponerEnFila(cand[0], 'pelota');
  if(cand[1] && R() < .4) ponerEnFila(cand[1], 'pelota');
}
