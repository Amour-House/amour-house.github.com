'use strict';
/* =========================================================
   DIBUJO CON PARTES (tus dibujos)
   ---------------------------------------------------------
   Arma al gato con imágenes separadas, como una marioneta:
   el torso se mueve e inclina, las patas giran desde el hombro
   y la cadera hacia donde tiene que ir el pie, la cabeza gira
   desde el cuello y la cola se corta en trozos que siguen una
   curva. Las animaciones (caminar, correr, comer, saltar...)
   son las mismas del gato hecho por código.

   Piezas: torso, cabeza, 2 orejas (se sacuden de vez en
   cuando), ojos (parpadean), boca (se abre al maullar),
   4 patas y cola. Ver js/partes-gatos.js.

   Las ANIMACIONES salen de js/animaciones.js (se editan con
   editor.html). Si a una animación le faltan claves, se usa el
   movimiento hecho por código de más abajo (poseDePie).

   Tecla D: muestra/oculta los puntos de unión (para revisar).
   ========================================================= */

const POSE_DE_PIE = { sit:'stand', meow:'stand', happy:'stand', groom:'stand', loaf:'lie', sleep:'lie' };
let verPuntos = false;
window.addEventListener('keydown', e => { if(e.key === 'd' || e.key === 'D') verPuntos = !verPuntos; });

/* ---------- animaciones ----------
   Se usan las de js/animaciones.js. Si en este computador hay un
   BORRADOR guardado por el editor (editor.html), se usa ese, y se
   actualiza en vivo mientras editas (aparece un aviso en pantalla). */
const CLAVE_BORRADOR = 'amourhouse_animaciones_borrador';
let ANIMS = {};
let usandoBorrador = false;
function leerBorrador(){
  try{
    const txt = localStorage.getItem(CLAVE_BORRADOR);
    if(txt){ ANIMS = normalizarTodas(JSON.parse(txt)); usandoBorrador = true; }
    else { ANIMS = normalizarTodas((typeof ANIMACIONES !== 'undefined') ? ANIMACIONES : {}); usandoBorrador = false; }
  }catch(e){ usandoBorrador = false; }
  let aviso = document.getElementById('avisoBorrador');
  if(usandoBorrador && !aviso){
    aviso = document.createElement('div'); aviso.id = 'avisoBorrador';
    aviso.textContent = '✏️ Usando el borrador del editor de animaciones';
    aviso.style.cssText = 'position:fixed;left:50%;top:10px;transform:translateX(-50%);background:#ffd56b;border:2.5px solid #2b211e;border-radius:10px;padding:4px 10px;font:600 13px Fredoka,system-ui,sans-serif;z-index:9;pointer-events:none';
    document.body.appendChild(aviso);
  } else if(!usandoBorrador && aviso) aviso.remove();
}
leerBorrador();
window.addEventListener('storage', e => { if(e.key === CLAVE_BORRADOR) leerBorrador(); });

function cargarPartes(){
  for(const c of cats){
    const sp = cargarPiezasGato(c.def.name, () => partesListas(c));
    if(sp) c.sprite = sp;
  }
}

function partesListas(c){
  const sp = c.sprite;
  // El "cerebro" usa estas medidas para acercarse a platos, premios, etc.
  c.geo.L = sp.img.torso.width*sp.S*.9;   // largo del gato = ancho del torso dibujado
  c.geo.legL = sp.lenD*.7;
  c.geo.hr = Math.hypot(sp.headOff[0], sp.headOff[1])*1.1 || c.geo.hr;
}

/* Calcula dónde va cada parte según la pose (gato mirando a la derecha, suelo en y = 0) */
function poseDePie(c){
  const sp = c.sprite, t = c.animT, L = c.geo.L;
  const pose = POSE_DE_PIE[c.pose] || c.pose;
  const legH = Math.min(sp.lenD, sp.lenT)*.96;
  let tilt = 0, wig = 0, ph = 0, stride = 0, lift = 0, drop = 0;
  let offs = [0, Math.PI, Math.PI, 0];   // delantera cerca, delantera lejos, trasera cerca, trasera lejos
  let tailMode = 'mid', headRot = 0, headDx = 0, headDy = 0, eyesClosed = false;

  switch(pose){
    case 'walk': ph = t*8; stride = L*.15; lift = 4; drop = -Math.abs(Math.sin(ph))*1.2; tailMode = 'up'; headDy = Math.sin(ph*2)*.8; break;
    case 'run': ph = t*15; stride = L*.28; lift = 8; offs = [0,.6,Math.PI,Math.PI+.6]; drop = 2 - Math.sin(ph*2)*2.2; tilt = Math.sin(ph)*.07; tailMode = 'back'; headRot = .12; break;
    case 'eat': tilt = .1; headRot = .8; headDx = 4; headDy = legH*.55; eyesClosed = true; headDy += Math.sin(t*9)*1.2; break;
    case 'stretch': tilt = .3; drop = 4; tailMode = 'up'; headRot = -.3; eyesClosed = true; break;
    case 'crouch': drop = legH*.45; tilt = .07; wig = Math.sin(t*24)*1.8; tailMode = 'low'; headRot = .2; headDy = 2; break;
    case 'bat': tilt = -.08; headRot = .2; break;
    case 'jump': tilt = c.jtilt; tailMode = 'back'; headRot = .1; break;
    case 'hop': tailMode = 'up'; drop = -3; break;
    case 'lie': drop = legH*.82; tailMode = 'ground'; headRot = c.pose === 'sleep' ? .35 : 0; headDy = c.pose === 'sleep' ? 5 : 0; eyesClosed = c.pose === 'sleep'; break;
    default: tailMode = c.def.p.playful > 1 ? 'up' : 'mid';
  }
  if(c.blink > 0 || c.pose === 'happy') eyesClosed = true;

  const co = Math.cos(tilt), si = Math.sin(tilt);
  const rot = p => [p[0]*co - p[1]*si, p[0]*si + p[1]*co];
  const hipR = rot(sp.a.cadera);
  const cx = wig, cy = -(legH - drop) - hipR[1];
  const at = p => { const r = rot(p); return [cx + r[0], cy + r[1]]; };
  const sh = at(sp.a.hombro), hp = at(sp.a.cadera), nk = at(sp.a.cuello), tb = at(sp.a.cola);

  const ft = (top, o, front, len) => {
    if(pose === 'jump') return front ? [top[0]+len*.55, top[1]+len*.75] : [top[0]-len*.7, top[1]+len*.65];
    if(pose === 'hop') return [top[0]+(front?2:-2), top[1]+len*.85];
    if(pose === 'stretch' && front) return [top[0]+L*.3, 0];
    if(pose === 'lie') return front ? [top[0]+len*.95, -2] : [top[0]+len*.55, -2];
    return [top[0] + Math.sin(ph+o)*stride, -Math.max(0, Math.cos(ph+o))*lift];
  };
  const shF = sp.a.hombroL ? at(sp.a.hombroL) : [sh[0]-3, sh[1]-1];
  const hpF = sp.a.caderaL ? at(sp.a.caderaL) : [hp[0]-3, hp[1]-1];
  const legs = {
    farFront: {top:shF, foot:ft(shF, offs[1], true, sp.lenD), front:true},
    farBack:  {top:hpF, foot:ft(hpF, offs[3], false, sp.lenT), front:false},
    nearBack: {top:hp, foot:ft(hp, offs[2], false, sp.lenT), front:false},
    nearFront:{top:sh, foot:ft(sh, offs[0], true, sp.lenD), front:true}
  };
  if(pose === 'bat'){ const sw = Math.sin(c.batT*14); legs.nearFront.foot = [sh[0]+L*.32+sw*3, sh[1]+sp.lenD*.15-Math.abs(sw)*7]; }

  // cola (curva)
  const tl = sp.colaLen, s = Math.sin(t*(pose === 'walk' ? 4 : 2.2) + c.seed), b0 = tb;
  let tc, te;
  if(tailMode === 'up'){ tc = [b0[0]-tl*.55, b0[1]-tl*.05]; te = [b0[0]-tl*.4+s*tl*.18, b0[1]-tl*.92]; }
  else if(tailMode === 'back'){ tc = [b0[0]-tl*.5, b0[1]-tl*.02]; te = [b0[0]-tl*.98, b0[1]-tl*.22+s*tl*.12]; }
  else if(tailMode === 'low'){ tc = [b0[0]-tl*.5, b0[1]+tl*.2]; te = [b0[0]-tl*.95, Math.min(-3, b0[1]+tl*.15)+Math.sin(t*14)*2]; }
  else if(tailMode === 'ground'){ tc = [b0[0]-tl*.45, -1]; te = [b0[0]-tl*.95, -3+s*2]; }
  else { tc = [b0[0]-tl*.5, b0[1]+tl*.15]; te = [b0[0]-tl*.85+s*tl*.08, b0[1]-tl*.3+s*tl*.05]; }

  // que la cabeza nunca atraviese el suelo (importante con cabezas grandes)
  let hX = nk[0]+headDx, hY = nk[1]+headDy;
  { const co2 = Math.cos(headRot), si2 = Math.sin(headRot);
    const cyH = hY + sp.headOff[0]*si2 + sp.headOff[1]*co2, rH = Math.hypot(sp.headOff[0], sp.headOff[1])*.95;
    if(cyH + rH > -1) hY -= cyH + rH + 1; }
  const mouthOpen = (c.pose === 'meow' && c.taskT < .8) || pose === 'stretch';
  const eyesWide = pose === 'crouch' || pose === 'hop' || pose === 'bat';
  const earLean = pose === 'run' || pose === 'jump' ? -.25 : pose === 'crouch' ? -.15 : 0;
  return { tailMode, sway:s, body:{x:cx, y:cy, rot:tilt}, legs, head:{x:hX, y:hY, rot:headRot}, tail:{a:b0, c:tc, b:te}, eyesClosed, eyesWide, mouthOpen, earLean, pts:{sh, hp, nk, tb} };
}

function drawLeg(g, sp, img, cfg, baseAng, len, L){
  const vx = L.foot[0]-L.top[0], vy = L.foot[1]-L.top[1];
  const ang = Math.atan2(-vx, vy);
  const sy = clamp(Math.hypot(vx, vy)/len, .55, 1.12);
  g.save(); g.translate(L.top[0], L.top[1]); g.rotate(ang - baseAng); g.scale(sp.S, sp.S*sy);
  g.drawImage(img, -cfg.arriba[0], -cfg.arriba[1]);
  g.restore();
}

function quadPt(a, c, b, t){ const u = 1-t; return [u*u*a[0] + 2*u*t*c[0] + t*t*b[0], u*u*a[1] + 2*u*t*c[1] + t*t*b[1]]; }

// La cola se corta en trozos y cada trozo sigue la curva
function drawTail(g, sp, T){
  const img = sp.img.cola, base = sp.cfg.cola.base, N = 8;
  const seg = base[0]/N, ov = 3, h = img.height;
  let prev = T.a;
  for(let i=1; i<=N; i++){
    const pt = quadPt(T.a, T.c, T.b, i/N);
    const ang = Math.atan2(pt[1]-prev[1], pt[0]-prev[0]);
    const d = Math.hypot(pt[0]-prev[0], pt[1]-prev[1]);
    const sx0 = Math.max(0, base[0] - i*seg - ov);
    const sw = base[0] - (i-1)*seg - sx0;
    g.save(); g.translate(prev[0], prev[1]); g.rotate(ang + Math.PI);
    g.scale(d/seg, sp.S);
    g.drawImage(img, sx0, 0, sw, h, -sw, -base[1], sw, h);
    g.restore();
    prev = pt;
  }
}

// Cabeza completa: orejas detrás, cabeza, ojos y boca encima
function drawHead(g, c, sp, P){
  const cf = sp.cfg, H = cf.cabeza, t = c.animT;
  // movimiento de orejas: de vez en cuando una se sacude
  if(c.earNext === undefined || c.earNext < t - 10) c.earNext = t + rand(2, 6);
  if(t > c.earNext){ c.earStart = t; c.earWhich = R() < .5 ? 0 : 1; c.earNext = t + rand(3, 8); }
  const tw = (c.earStart !== undefined && t - c.earStart < .3) ? Math.sin(Math.PI*(t - c.earStart)/.3)*.45 : 0;

  g.save(); g.translate(P.head.x, P.head.y); g.rotate(P.head.rot); g.scale(sp.S, sp.S);
  g.translate(-H.cuello[0], -H.cuello[1]);   // desde aquí todo está en píxeles de la imagen de la cabeza

  const oreja = (img, o, pt, extra) => { g.save(); g.translate(pt[0], pt[1]); g.rotate(o.angulo + P.earLean + extra); g.drawImage(img, -o.base[0], -o.base[1]); g.restore(); };
  oreja(sp.img.orejaA, cf.orejaAtras, H.orejaAtras, c.earWhich === 0 ? -tw : 0);
  oreja(sp.img.orejaB, cf.orejaAdelante, H.orejaAdelante, c.earWhich === 1 ? tw : 0);

  g.drawImage(sp.img.cabeza, 0, 0);

  const O = cf.ojo;
  const closed = P.eyesClosed;
  const eyeImg = closed && sp.img.ojoC ? sp.img.ojoC : sp.img.ojo;
  const sy = closed && !sp.img.ojoC ? .12 : P.eyesWide ? 1.12 : 1;   // sin dibujo de ojo cerrado: se "aplasta"
  if(eyeImg) for(const [pt, sx] of (O.unico ? [[H.ojoCerca, 1]] : [[H.ojoLejos, O.escalaLejos], [H.ojoCerca, 1]])){
    g.save(); g.translate(pt[0], pt[1]); g.scale(sx*(P.eyesWide ? 1.12 : 1), sy);
    g.drawImage(eyeImg, -O.centro[0], -O.centro[1]); g.restore();
  }

  const B = cf.boca;
  const open = P.mouthOpen;
  const mouthImg = open && sp.img.bocaA ? sp.img.bocaA : sp.img.boca;
  if(mouthImg){ g.save(); g.translate(H.boca[0], H.boca[1]); if(open && !sp.img.bocaA) g.scale(1.1, 1.6);
  g.drawImage(mouthImg, -B.centro[0], -B.centro[1]); g.restore(); }

  g.restore();
}

// Cola rígida (por ejemplo, una cola ya dibujada curva): gira entera desde su base
const ANGULO_COLA = { up:0, mid:-.45, back:-.85, low:-1.15, ground:-1.45 };
function drawTailRigid(g, sp, P){
  const C = sp.cfg.cola, ang = (ANGULO_COLA[P.tailMode] || 0) + P.sway*.12;
  g.save(); g.translate(P.tail.a[0], P.tail.a[1]); g.rotate(ang); g.scale(sp.S, sp.S);
  g.drawImage(sp.img.cola, -C.base[0], -C.base[1]); g.restore();
}

// Sacudida de orejas de vez en cuando (se suma encima de cualquier animación)
function sacudidaOrejas(c){
  const t = c.animT;
  if(c.earNext === undefined || c.earNext < t - 10) c.earNext = t + rand(2, 6);
  if(t > c.earNext){ c.earStart = t; c.earWhich = R() < .5 ? 0 : 1; c.earNext = t + rand(3, 8); }
  return (c.earStart !== undefined && t - c.earStart < .3) ? Math.sin(Math.PI*(t - c.earStart)/.3)*.45 : 0;
}

function drawCatSprite(g, c, k, dirO, portrait){
  const anim = ANIMS[ANIM_DE_POSE[c.pose]];
  if(anim && animTieneClaves(anim)) return drawCatAnimado(g, c, k, dirO, portrait, anim);
  const sp = c.sprite, cf = sp.cfg, P = poseDePie(c), dir = dirO || c.dir;
  g.save(); g.scale(dir*k, k);

  if(cf.cola.rigida) drawTailRigid(g, sp, P); else drawTail(g, sp, P.tail);
  drawLeg(g, sp, sp.img.pataDL, cf.patas, sp.angD, sp.lenD, P.legs.farFront);
  drawLeg(g, sp, sp.img.pataTL, cf.patas, sp.angT, sp.lenT, P.legs.farBack);
  const patasCerca = () => { drawLeg(g, sp, sp.img.pataTC, cf.patas, sp.angT, sp.lenT, P.legs.nearBack); drawLeg(g, sp, sp.img.pataDC, cf.patas, sp.angD, sp.lenD, P.legs.nearFront); };
  if(cf.patasDetras) patasCerca();

  g.save(); g.translate(P.body.x, P.body.y); g.rotate(P.body.rot); g.scale(sp.S, sp.S);
  g.drawImage(sp.img.torso, -cf.torso.centro[0], -cf.torso.centro[1]);
  g.restore();

  if(!cf.patasDetras) patasCerca();

  drawHead(g, c, sp, P);

  if(verPuntos && !portrait){
    g.fillStyle = '#ff2d55';
    for(const p of [P.pts.sh, P.pts.hp, P.pts.nk, P.pts.tb, [P.body.x, P.body.y], P.legs.nearFront.foot, P.legs.nearBack.foot]){
      g.beginPath(); g.arc(p[0], p[1], 2.2, 0, TAU); g.fill();
    }
  }
  g.restore();

  if(!portrait){
    const co = Math.cos(P.head.rot), si = Math.sin(P.head.rot);
    const hx = P.head.x + sp.headOff[0]*co - sp.headOff[1]*si, hy = P.head.y + sp.headOff[0]*si + sp.headOff[1]*co;
    c.hx = c.x + dir*hx*k; c.hy = c.y - c.z + hy*k;
  }
}

/* Gato dibujado con las animaciones del editor */
function drawCatAnimado(g, c, k, dirO, portrait, anim){
  const sp = c.sprite, dir = dirO || c.dir;
  if(c._poseAnim !== c.pose){ c._poseAnim = c.pose; c._poseT0 = c.animT; }
  const t = anim.loop ? c.animT + (c.seed || 0) : c.animT - c._poseT0;
  const pose = muestrear(anim, t);
  const tw = sacudidaOrejas(c);
  g.save(); g.scale(dir*k, k);
  const r = rigDibujar(g, sp, pose, { parpadeo: c.blink > 0, twA: c.earWhich === 0 ? -tw : 0, twB: c.earWhich === 1 ? tw : 0, puntos: verPuntos && !portrait });
  g.restore();
  if(!portrait){ c.hx = c.x + dir*r.headCenter[0]*k; c.hy = c.y - c.z + r.headCenter[1]*k; }
}
