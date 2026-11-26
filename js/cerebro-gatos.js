'use strict';
/* ---------- 6. CEREBRO DE LOS GATOS ----------
   Cada gato tiene una lista de tareas (caminar, comer, dormir...).
   Cuando se le acaban, "piensa" qué hacer según su hambre, su
   energía y su personalidad. */
const cats = CAT_DEFS.map(makeCat);
const MIAU_SUELTO = .12;   // probabilidad por segundo de que un gato quieto maúlle (más alto = más miaus)
const NEED_GROUND = new Set(['move','chase','flee','ball','laser','treat','zoom','pounceTo']);
const BUSY = new Set(['jump','wrestle','crouch','pet','hop','erizado']);

function addP(o){ parts.push(Object.assign({ life:1, max:1, vx:0, vy:0 }, o)); }
function dust(x, y, n){ for(let i=0;i<(n||1);i++) addP({type:'dust', x:x+rand(-6,6), y, vx:rand(-25,25), vy:rand(-18,-4), life:.5, max:.5, r:rand(3,6)*G}); }

function releaseRes(c){
  if(c.reserved && c.reserved.occ===c && c.spot!==c.reserved) c.reserved.occ = null;
  c.reserved = null;
  if(c.bowl){ if(c.bowl.user===c) c.bowl.user = null; c.bowl = null; }
}
function endTask(c){
  pararRonroneo(c);
  if(c.task && c.task.type==='wrestle') c.hidden = false;
  c.task = null;
}
function exitTask(c){
  const s = c.spot, k = escalaGato(), side = R()<.5 ? -1 : 1;
  const tx = clampX(s.x + side*rand(45,75)*k), ty = clampY((s.ay || s.y) + rand(4,22)*G);
  return { type:'jump', x:tx, y:ty, z:0, h:(s.kind==='box' ? 26 : 12)*k, dur:.4 + s.z/650, spot:null };
}
// mantener = true: el gato conserva su ticket (ej: pasa de perseguir a pelear)
function setTasks(c, list, mantener){
  endTask(c); releaseRes(c);
  if(!mantener) soltarTicket(c);
  salirDeFila(c);
  if(list.length && NEED_GROUND.has(list[0].type) && c.spot) list.unshift(exitTask(c));
  c.tasks = list;
}
function interruptible(o){ return o.task && !o.hidden && !BUSY.has(o.task.type); }
function freeForPlay(o, c){ return o!==c && !o.hidden && !o.spot && o.task && ['idle','move','groom','stretch','meow'].includes(o.task.type); }
// probabilidades de las actividades entre gatos (más alto = más seguido)
const PROB_CARINO = 1.6;      // juntarse a hacer corazoncitos
const PROB_PERSEGUIR = .2;    // perseguir (puede terminar en enfrentamiento)
const PROB_SALTAR_ENCIMA = .12;
function fleeing(o){ return (o.task && o.task.type==='flee') || o.tasks.some(t => t.type==='flee'); }
function freeSpot(kinds){ const l = spots.filter(s => kinds.includes(s.kind) && !s.occ && !s.off); return l.length ? pick(l) : null; }
function freeBowl(kind, c){
  const l = bowls.filter(b => b.kind===kind && !b.user && !b.off && !platoVacio(b));
  l.sort((a,b) => Math.hypot(a.x-c.x,a.y-c.y) - Math.hypot(b.x-c.x,b.y-c.y));
  return l[0] || null;
}
function bowlTasks(c, b){
  let side = c.x < b.x ? 1 : -1;
  const y = b.y - 3, k = escalaGato(), off = (c.geo.L*.5 + c.geo.hr*.55)*k;
  if(b.x - side*off < 34 || b.x - side*off > W-34) side = -side;
  b.user = c; c.bowl = b;
  return [{type:'move', x:b.x - side*off, y}, {type:b.kind==='water'?'drink':'eat', bowl:b, dir:side, dur:b.kind==='water'?rand(2.5,4):rand(6,10)}];
}
function climbTasks(c, s){
  const k = escalaGato(), side = c.x < s.x ? -1 : 1;
  s.occ = c; c.reserved = s;
  return [
    {type:'move', x:clampX(s.x + side*s.appr*k), y:clampY(s.ay)},
    {type:'crouch', dur:.35, tx:s.x},
    {type:'jump', x:s.x, y:s.y, z:s.z, h:(s.kind==='box' ? 26 : 30)*k, dur:.42 + s.z/650, spot:s}
  ];
}
function nearPoint(c, r){ return { x: clampX(c.x + rand(-r, r)*G), y: clampY(c.y + rand(-r*.45, r*.45)*G) }; }

function plan(c){
  const p = c.def.p;
  if(c.spot){
    const w = [['stay',2], ['sleep',1.4*p.sleepy + (c.spot.kind==='bed'?2.5:0)], ['groom',.8], ['leave',1.8]];
    if(hayTicket('maullar')) w.push(['meow',2*p.vocal]);
    switch(weighted(w)){
      case 'stay':  c.tasks = [{type:'idle', dur:rand(3,8), pose:pick(['sit','loaf','loaf'])}]; break;
      case 'sleep': c.tasks = [{type:'sleep', dur:rand(10,22)}]; break;
      case 'groom': c.tasks = [{type:'groom', dur:rand(2,4)}]; break;
      case 'meow':  c.tasks = [{type:'meow'}]; tomarTicket(c, 'maullar'); break;
      default:      c.tasks = [exitTask(c), {type:'idle', dur:rand(.4,1.2), pose:'stand'}];
    }
    return;
  }
  const others = cats.filter(o => freeForPlay(o, c));
  const food = freeBowl('food', c), water = freeBowl('water', c);
  const treat = treats.find(t => !t.eaten && hayTicket('premio', t));
  const opts = [
    ['wander', 1.3], ['sit', .9], ['loaf', .5], ['groom', .6], ['stretch', .3],
    ['sleep', .7*p.sleepy]
  ];
  // actividades con ticket: solo se ofrecen si queda cupo
  if(hayTicket('maullar')) opts.push(['meow', 2.2*p.vocal]);   // maúllan seguido (antes .35)
  if(hayTicket('pelota'))  opts.push(['ball', .55*p.playful]);
  if(hayTicket('zoomies')) opts.push(['zoom', .1*p.playful]);
  if(food) opts.push(['eat', .8*p.hunger]);
  if(water) opts.push(['drink', .3]);
  if(treat) opts.push(['treat', 3]);
  if(others.length){
    opts.push(['sniff', PROB_CARINO*p.social]);
    if(hayTicket('jugar', null, 2)) opts.push(['chase', PROB_PERSEGUIR*p.playful*p.social], ['pounce', PROB_SALTAR_ENCIMA*p.playful]);
  }
  if(freeSpot(['tree','shelf'])) opts.push(['climb', (.5*p.energy + .2)*(c.def.climber ? 2.5 : 1)]);
  if(freeSpot(['box'])) opts.push(['box', .35]);

  const k = escalaGato();
  switch(weighted(opts)){
    case 'eat': c.tasks = [...bowlTasks(c, food), {type:'idle', pose:'sit', dur:rand(.8,1.6)}, {type:'groom', dur:rand(1.5,3)}]; break;
    case 'drink': c.tasks = [...bowlTasks(c, water), {type:'idle', pose:'sit', dur:1}]; break;
    case 'treat': c.tasks = [{type:'treat', treat}]; tomarTicket(c, 'premio', treat); break;
    case 'wander': { const pt = R()<.6 ? nearPoint(c, 260) : {x:rand(40,W-40), y:rand(walkTop,floorBot)}; c.tasks = [{type:'move', x:pt.x, y:pt.y}, {type:'idle', dur:rand(1,4), pose:pick(['sit','stand','sit','loaf'])}]; break; }
    case 'sit': c.tasks = [{type:'idle', dur:rand(3,7), pose:'sit'}]; break;
    case 'loaf': c.tasks = [{type:'idle', dur:rand(4,9), pose:'loaf'}]; break;
    case 'groom': c.tasks = [{type:'idle', dur:.4, pose:'sit'}, {type:'groom', dur:rand(2,4.5)}]; break;
    case 'stretch': c.tasks = [{type:'stretch', dur:1.9}, {type:'idle', dur:.5, pose:'stand'}]; break;
    case 'meow': c.tasks = [{type:'meow'}, {type:'idle', dur:rand(1,2), pose:'sit'}]; tomarTicket(c, 'maullar'); break;
    case 'sleep': {
      const o = [['floor',1]], bd = freeSpot(['bed']), tr = spotById('t2'), bx = freeSpot(['box']), sh = freeSpot(['shelf']);
      if(bd) o.push(['bed',3]); if(!tr.occ) o.push(['tree',1.2]); if(bx) o.push(['box',1]); if(sh) o.push(['shelf',.8]);
      const ch = weighted(o);
      if(ch==='bed' && bd.z > 20) c.tasks = [...climbTasks(c, bd), {type:'idle', dur:.8, pose:'loaf'}, {type:'sleep', dur:rand(12,25)}];   // cama colgante: hay que saltar
      else if(ch==='bed'){ bd.occ = c; c.reserved = bd; c.tasks = [{type:'move', x:bd.x, y:bd.y}, {type:'occupy', spot:bd}, {type:'idle', dur:.8, pose:'loaf'}, {type:'sleep', dur:rand(12,25)}]; }
      else if(ch==='tree') c.tasks = [...climbTasks(c, tr), {type:'sleep', dur:rand(12,25)}];
      else if(ch==='box') c.tasks = [...climbTasks(c, bx), {type:'sleep', dur:rand(10,20)}];
      else if(ch==='shelf') c.tasks = [...climbTasks(c, sh), {type:'sleep', dur:rand(10,20)}];
      else c.tasks = [{type:'idle', dur:1.5, pose:'loaf'}, {type:'sleep', dur:rand(8,16)}];
      break; }
    case 'chase': {
      const o = pick(others);
      setTasks(o, [{type:'flee', from:c, dur:rand(2.5,4.5)}]);
      tomarTicket(o, 'jugar'); tomarTicket(c, 'jugar');
      c.tasks = [{type:'chase', target:o, dur:rand(3,5)}];
      break; }
    case 'pounce': {
      const o = pick(others), side = c.x < o.x ? 1 : -1;
      c.tasks = [{type:'move', x:clampX(o.x - side*95*k), y:o.y}, {type:'crouch', dur:rand(.8,1.4), target:o}, {type:'pounceTo', target:o}];
      tomarTicket(c, 'jugar');
      break; }
    case 'sniff': {
      const o = pick(others), side = c.x < o.x ? 1 : -1;
      c.tasks = [{type:'move', x:clampX(o.x - side*(c.geo.L*.5 + o.geo.L*.5 + c.geo.hr*1.2)*k), y:o.y}, {type:'sniffAt', target:o, dur:rand(3,4.5)}, {type:'idle', pose:'sit', dur:rand(1,2)}];
      break; }
    case 'ball': c.tasks = [{type:'ball', n:randi(2,4)}]; tomarTicket(c, 'pelota'); break;
    case 'zoom': c.tasks = [{type:'zoom'}, {type:'idle', dur:rand(1,2), pose:'loaf'}]; tomarTicket(c, 'zoomies'); break;
    case 'climb': { const s = freeSpot(['tree','shelf']); c.tasks = [...climbTasks(c, s), {type:'idle', dur:rand(3,7), pose:pick(['sit','loaf'])}]; break; }
    case 'box': { const s = freeSpot(['box']); c.tasks = [...climbTasks(c, s), {type:'idle', dur:rand(4,9), pose:pick(['sit','loaf'])}]; break; }
  }
  if(!c.tasks.length) c.tasks = [{type:'idle', dur:2, pose:'sit'}];
}

/* Enfrentamiento: los dos gatos quedan frente a frente, erizados,
   y hacen su sonido de molestos al mismo tiempo. Después uno se va. */
function startWrestle(a, b){
  const k = escalaGato(), dist = (a.geo.L*.5 + b.geo.L*.5 + a.geo.hr*1.6)*k*1.9;   // distancia entre los dos
  const lado = a.x <= b.x ? -1 : 1;                       // a queda a la izquierda o derecha de b
  a.x = clampX(b.x + lado*dist); a.y = b.y;
  const dur = rand(2.2, 3);
  setTasks(a, [{type:'erizado', target:b, dur}, {type:'idle', pose:'stand', dur:.4}, {type:'move', x:clampX(a.x + lado*rand(120,200)*G), y:clampY(a.y + rand(-30,30)*G)}, {type:'groom', dur:2}], true);
  setTasks(b, [{type:'erizado', target:a, dur}, {type:'idle', pose:'sit', dur:1.2}, {type:'groom', dur:1.5}], true);
  sonidoEnojo(a, true); sonidoEnojo(b, true);
}

function startTask(c, t){
  t.t = 0; c.taskT = 0;
  switch(t.type){
    case 'pounceTo': {
      const o = t.target;
      t.type = 'jump'; t.x = clampX(o.x - (o.x > c.x ? 1 : -1)*8*G); t.y = o.y; t.z = 0; t.h = 26*G; t.dur = .5;
      t.onLand = cc => {
        // el otro gato también necesita su ticket de "jugar" para seguirle el juego
        if(!o.hidden && !o.spot && Math.hypot(o.x-cc.x, o.y-cc.y) < 70*G && interruptible(o) && tomarTicket(o, 'jugar')){
          if(R() < .5) startWrestle(cc, o);
          else { setTasks(o, [{type:'hop'}, {type:'flee', from:cc, dur:rand(2,3.5)}], true); cc.tasks = [{type:'chase', target:o, dur:rand(2.5,4)}]; }
        }
      };
      initJump(c, t); break; }
    case 'jump': initJump(c, t); break;
    case 'meow': if(t.enojo) sonidoEnojo(c); else sonidoMiau(c); break;
    case 'pet': empezarRonroneo(c); break;
    case 'flee': if(R() < .5) sonidoEnojo(c); break;
    case 'hop': t.z0 = c.z; break;
    case 'eat': case 'drink': c.dir = t.dir; break;
    case 'occupy': c.spot = t.spot; t.spot.occ = c; c.reserved = null; c.z = t.spot.z; c.x = t.spot.x; c.y = t.spot.y; break;
    case 'zoom': t.pts = Array.from({length:randi(3,5)}, () => ({x:rand(40,W-40), y:rand(walkTop,floorBot)})); t.i = 0; break;
    case 'wrestle': c.hidden = true; c.x = t.cloud.x + (c===t.cloud.a ? -14 : 14)*G; c.y = t.cloud.y; c.z = 0; break;
    case 'sniffAt': {
      const o = t.target;
      // se juntan a hacerse cariño: los dos se miran y salen corazoncitos
      if(freeForPlay(o, c)) setTasks(o, [{type:'carino', target:c, dur:t.dur}, {type:'idle', pose:'sit', dur:rand(1,2)}]);
      c.dir = o.x > c.x ? 1 : -1;
      empezarRonroneo(c, .45);
      break; }
    case 'ball': t.sub = 'go'; break;
    case 'treat': break;
  }
}
function initJump(c, t){
  t.x0 = c.x; t.y0 = c.y; t.z0 = c.z;
  if(c.spot && c.spot !== t.spot){ if(c.spot.occ===c) c.spot.occ = null; c.spot = null; }
  if(Math.abs(t.x - c.x) > 2) c.dir = t.x > c.x ? 1 : -1;
}

function moveToward(c, tx, ty, speed, dt){
  const dx = tx - c.x, dy = ty - c.y, dd = Math.hypot(dx, dy);
  if(dd < 2) return true;
  const st = Math.min(dd, speed*dt);
  c.x += dx/dd*st; c.y += dy/dd*st;
  if(Math.abs(dx) > 1) c.dir = dx > 0 ? 1 : -1;
  return false;
}

function runTask(c, t, dt){
  const sp = G*(c.def.speed || 1);
  switch(t.type){
    case 'move': {
      c.pose = t.run ? 'run' : 'walk';
      if(t.run && R() < dt*8) dust(c.x - c.dir*10*G, c.y);
      if(moveToward(c, t.x, t.y, (t.run ? 150 : 46)*sp, dt)){ c.pose = 'stand'; return true; }
      return false;
    }
    case 'idle':
      c.pose = t.pose || 'sit';
      if(t.face) c.dir = t.face.x > c.x ? 1 : -1;
      return c.taskT > t.dur;
    case 'sleep':
      c.pose = 'sleep';
      t.zt = (t.zt || 0) + dt;
      if(t.zt > 1.3){ t.zt = 0; const k = escalaGato(); addP({type:'z', x:c.hx + c.dir*6*k, y:c.hy - 10*k, vx:rand(4,12)*c.dir, vy:-18, life:2.2, max:2.2, s:k}); }
      return c.taskT > t.dur;
    case 'eat': {
      const b = t.bowl; c.pose = 'eat'; c.dir = t.dir;
      if(R() < dt*2.5) addP({type:'dot', x:b.x + rand(-10,10)*G, y:b.y - 12*G, vx:rand(-30,30), vy:rand(-50,-20), life:.5, max:.5, col:'#8c5427', g:true});
      return c.taskT > t.dur;
    }
    case 'drink':
      c.pose = 'eat'; c.dir = t.dir;
      if(R() < dt*2) addP({type:'ring', x:t.bowl.x, y:t.bowl.y - 12*G, life:.7, max:.7});
      return c.taskT > t.dur;
    case 'munch':
      c.pose = 'eat';
      if(R() < dt*4) addP({type:'dot', x:c.hx, y:c.hy + 8*G, vx:rand(-30,30), vy:rand(-40,-10), life:.4, max:.4, col:'#d98b45', g:true});
      return c.taskT > t.dur;
    case 'groom': c.pose = 'groom'; return c.taskT > t.dur;
    case 'stretch': c.pose = 'stretch'; return c.taskT > t.dur;
    case 'meow': c.pose = 'meow'; return c.taskT > 1.5;
    case 'pet':
      c.pose = 'happy';
      t.h = (t.h || 0) + dt;
      if(t.h > .32){ t.h = 0; const k = escalaGato(); addP({type:'heart', x:c.hx + rand(-8,8)*k, y:c.hy - 14*k, vx:rand(-15,15), vy:-45, life:1.2, max:1.2, s:k*rand(.8,1.2)}); }
      return c.taskT > t.dur;
    case 'crouch':
      c.pose = 'crouch';
      if(t.target) c.dir = t.target.x > c.x ? 1 : -1; else if(t.tx !== undefined && Math.abs(t.tx - c.x) > 2) c.dir = t.tx > c.x ? 1 : -1;
      return c.taskT > t.dur;
    case 'jump': {
      const p = Math.min(1, c.taskT / t.dur);
      c.x = lerp(t.x0, t.x, p); c.y = lerp(t.y0, t.y, p); c.z = lerp(t.z0, t.z, p) + t.h*4*p*(1-p);
      c.jtilt = clamp((t.z - t.z0)*-.002, -.35, .35)*(p < .5 ? 1 : -.6) + (p < .5 ? -.12 : .15);
      c.pose = 'jump';
      if(p >= 1){
        c.z = t.z;
        if(t.spot){ c.spot = t.spot; t.spot.occ = c; c.reserved = null; }
        dust(c.x, c.y - c.z, 3);
        if(t.onLand) t.onLand(c);
        c.pose = 'stand';
        return true;
      }
      return false;
    }
    case 'hop': {
      const p = Math.min(1, c.taskT / .45);
      c.z = (t.z0 || 0) + 16*G*Math.sin(Math.PI*p); c.pose = 'hop';
      if(p >= 1){ c.z = t.z0 || 0; return true; }
      return false;
    }
    case 'chase': {
      const o = t.target;
      if(!o || o.hidden || !fleeing(o) || c.taskT > t.dur){ c.pose = 'stand'; return true; }
      c.pose = 'run';
      if(R() < dt*8) dust(c.x - c.dir*10*G, c.y);
      moveToward(c, o.x, o.y, 165*sp, dt);
      if(Math.hypot(o.x - c.x, o.y - c.y) < 18*G && c.taskT > .8){ startWrestle(c, o); return true; }
      return false;
    }
    case 'flee': {
      if(c.taskT > t.dur) return true;
      const f = t.from;
      if(!t.wp || Math.hypot(t.wp.x - c.x, t.wp.y - c.y) < 10){
        let vx = c.x - f.x, vy = c.y - f.y; const l = Math.hypot(vx, vy) || 1;
        let wx = clampX(c.x + vx/l*170*G + rand(-60,60)*G), wy = clampY(c.y + vy/l*80*G + rand(-50,50)*G);
        if(Math.hypot(wx - c.x, wy - c.y) < 50*G){ wx = rand(40, W-40); wy = rand(walkTop, floorBot); }
        t.wp = {x:wx, y:wy};
      }
      c.pose = 'run';
      if(R() < dt*8) dust(c.x - c.dir*10*G, c.y);
      moveToward(c, t.wp.x, t.wp.y, 150*sp, dt);
      return false;
    }
    case 'wrestle':
      c.pose = 'sit';
      if(c.taskT > t.cloud.dur){ c.hidden = false; c.x = clampX(t.cloud.x + (c===t.cloud.a ? -26 : 26)*G); c.dir = c===t.cloud.a ? -1 : 1; return true; }
      return false;
    case 'sniffAt': {
      // cariño: el que se acercó lanza corazoncitos entre los dos
      const o = t.target, k = escalaGato();
      c.pose = c.taskT > .6 ? 'happy' : 'stand';
      c.dir = o.x > c.x ? 1 : -1;
      t.h = (t.h || 0) + dt;
      if(c.taskT > .5 && t.h > .45){ t.h = 0; addP({type:'heart', x:(c.hx + o.hx)/2 + rand(-10,10)*k, y:Math.min(c.hy, o.hy) - 10*k, vx:rand(-12,12), vy:-32, life:1.4, max:1.4, s:k*rand(.8,1.15)}); }
      return c.taskT > t.dur;
    }
    case 'carino':
      c.pose = c.taskT > .6 ? 'happy' : 'stand';
      c.dir = t.target.x > c.x ? 1 : -1;
      return c.taskT > t.dur;
    case 'erizado':
      c.pose = 'erizado';
      c.dir = t.target.x > c.x ? 1 : -1;
      return c.taskT > t.dur;
    case 'ball': {
      if(c.taskT > 14) return true;
      if(t.sub === 'go'){
        const k = escalaGato(), side = c.x < ball.x ? 1 : -1;
        const tx = ball.x - side*c.geo.L*.62*k, ty = ball.y - 1;
        const far = Math.hypot(tx - c.x, ty - c.y) > 70*G;
        c.pose = far ? 'run' : 'walk';
        if(moveToward(c, tx, ty, (far ? 150 : 60)*sp, dt)){ t.sub = 'bat'; t.bt = 0; t.hit = false; c.dir = side; }
      } else {
        c.pose = 'bat'; t.bt += dt; c.batT = t.bt;
        if(t.bt > .25 && !t.hit){ t.hit = true; ball.vx = c.dir*rand(140,260)*G; ball.vy = rand(-60,60)*G; }
        if(t.bt > .5){ t.n--; t.sub = 'go'; if(t.n <= 0) return true; }
      }
      return false;
    }
    case 'laser': {
      if(!laser.on || c.taskT > t.dur){ c.z = 0; return true; }
      if(t.sub === 'crouch'){
        c.pose = 'crouch'; c.dir = laser.x > c.x ? 1 : -1; t.st += dt;
        if(t.st > .35){ t.sub = 'leap'; t.st = 0; t.x0 = c.x; t.y0 = c.y; t.x1 = laser.x; t.y1 = laser.y; }
        return false;
      }
      if(t.sub === 'leap'){
        t.st += dt; const p = Math.min(1, t.st / .38);
        c.x = lerp(t.x0, t.x1, p); c.y = lerp(t.y0, t.y1, p); c.z = 22*G*4*p*(1-p);
        c.jtilt = p < .5 ? -.15 : .2; c.pose = 'jump';
        if(p >= 1){ t.sub = null; c.z = 0; dust(c.x, c.y, 3); }
        return false;
      }
      const dd = Math.hypot(laser.x - c.x, laser.y - c.y);
      if(dd < 45*G && R() < dt*3){ t.sub = 'crouch'; t.st = 0; return false; }
      if(dd > 8){
        const fast = dd > 60*G; c.pose = fast ? 'run' : 'walk';
        if(fast && R() < dt*8) dust(c.x - c.dir*10*G, c.y);
        moveToward(c, laser.x, laser.y, (fast ? 175 : 70)*sp, dt);
      } else c.pose = 'crouch';
      return false;
    }
    case 'treat': {
      const tr = t.treat;
      if(tr.eaten){ c.tasks.unshift({type:'meow', enojo:true}); return true; }   // otro se comió su premio
      const k = escalaGato(), side = c.x < tr.x ? 1 : -1;
      const tx = tr.x - side*(c.geo.L*.5 + c.geo.hr*.55)*k, ty = tr.y - 2;
      c.pose = 'run';
      if(R() < dt*8) dust(c.x - c.dir*10*G, c.y);
      if(moveToward(c, tx, ty, 160*sp, dt) && tr.z <= 0){
        tr.eaten = true; c.dir = side;
       
        c.tasks.unshift({type:'munch', dur:1.4}, {type:'idle', pose:'happy', dur:1});
        return true;
      }
      return false;
    }
    case 'zoom': {
      const pt = t.pts[t.i];
      c.pose = 'run';
      if(R() < dt*12) dust(c.x - c.dir*10*G, c.y);
      if(moveToward(c, pt.x, pt.y, 240*sp, dt)){ t.i++; if(t.i >= t.pts.length) return true; }
      return false;
    }
    case 'esperar': {
      // sentado esperando su turno, mirando la actividad
      c.pose = 'sit';
      const mira = t.act === 'laser' ? laser : t.act === 'pelota' ? ball : null;
      if(mira && Math.abs(mira.x - c.x) > 4) c.dir = mira.x > c.x ? 1 : -1;
      if(t.act === 'laser' && !laser.on) return true;
      return c.taskT > t.dur;
    }
    case 'occupy': return true;
  }
  return true;
}

function updateCat(c, dt){
  c.animT += dt;
  const p = c.def.p;
  c.nextBlink -= dt; if(c.nextBlink <= 0){ c.blink = .13; c.nextBlink = rand(2,6); }
  if(c.blink > 0) c.blink -= dt;

  if(!c.task){
    if(!c.tasks.length){ soltarTicket(c); plan(c); }   // terminó lo que hacía: devuelve su ticket
    c.task = c.tasks.shift();
    startTask(c, c.task);
  }
  c.taskT += dt;
  const t = c.task;
  if(runTask(c, t, dt) && c.task === t){
    if(t.type==='eat' && c.bowl) comerDelPlato(c.bowl);
    if((t.type==='eat' || t.type==='drink') && c.bowl){ if(c.bowl.user === c) c.bowl.user = null; c.bowl = null; }
    if(t.type==='wrestle') c.hidden = false;
    if(t.type==='pet' || t.type==='sniffAt') pararRonroneo(c);
    c.task = null;
  }
  // miau suelto: un gato sentado o mirando a veces maúlla y sigue en lo suyo
  if(c.task && c.task.type === 'idle' && !c.task.face && R() < dt*MIAU_SUELTO && hayTicket('maullar')){
    c.tasks.unshift({type:'meow'}, {type:'idle', pose:c.task.pose, dur:Math.max(.5, c.task.dur - c.taskT)});
    c.task = null;
  }
  if(c.spot && (!c.task || c.task.type !== 'jump')){ c.x = c.spot.x; c.y = c.spot.y; c.z = c.spot.z; }
  else if(!c.spot && c.z > 0 && !(c.task && ['jump','hop','laser'].includes(c.task.type))) c.z = Math.max(0, c.z - dt*500);
}
