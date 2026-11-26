'use strict';
/* =========================================================
   RIG DE PIEZAS (lo usan el catio y el editor de animaciones)
   ---------------------------------------------------------
   - Carga las piezas de un gato (js/partes-gatos.js).
   - Lee las animaciones (js/animaciones.js): cada animación es
     una lista de POSES CLAVE en el tiempo. Entre una pose y la
     siguiente el movimiento se calcula solo (interpolación).
   - Dibuja al gato en una pose.

   Cada animación tiene PISTAS: una por pieza, cada una con sus
   propias claves { t: segundos, v: valor }.
   Los valores dicen cuánto se mueve/gira cada pieza respecto del
   gato "armado" tal como está en Photoshop:
     raiz (gato completo): x, y, rot — mueve y gira TODO
     cuerpo (torso): x, y, rot — solo el torso
     cabeza: x, y, rot      cola: rot
     patas (pataDC, pataDL, pataTC, pataTL): rot y esc (estirar)
     orejas (orejaA, orejaB): rot
     ojos: 'abiertos' | 'cerrados'     boca: 'cerrada' | 'abierta'
   ========================================================= */

const RAD = Math.PI/180;

// Qué animación usa el catio para cada cosa que hace el gato
const ANIM_DE_POSE = {
  stand:'quieto', walk:'caminar', run:'correr', eat:'comer', stretch:'estirarse',
  crouch:'agacharse', bat:'manotazo', jump:'saltar', hop:'brinco', loaf:'echado',
  lie:'echado', sleep:'dormir', sit:'sentado', meow:'maullar', happy:'feliz', groom:'acicalarse',
  erizado:'erizado'
};
const ANIM_INFO = [
  ['quieto','Quieto (de pie)'], ['caminar','Caminar'], ['correr','Correr'], ['comer','Comer / tomar agua'],
  ['sentado','Sentado'], ['echado','Echado'], ['dormir','Dormir'], ['acicalarse','Acicalarse'],
  ['maullar','Maullar'], ['feliz','Feliz (lo acarician)'], ['estirarse','Estirarse'],
  ['agacharse','Agacharse (antes de saltar)'], ['saltar','Saltar (en el aire)'], ['brinco','Brinco (susto)'],
  ['manotazo','Manotazo (pelota)']
];
const PIEZAS_ANIM = [
  ['raiz','Gato completo'], ['cuerpo','Torso'], ['cabeza','Cabeza'], ['cola','Cola'],
  ['pataDC','Pata delantera (cerca)'], ['pataDL','Pata delantera (lejos)'],
  ['pataTC','Pata trasera (cerca)'], ['pataTL','Pata trasera (lejos)'],
  ['orejaA','Oreja de atrás'], ['orejaB','Oreja de adelante']
];

// Pistas de la línea de tiempo (cada pieza tiene sus propias claves)
const PISTAS = ['raiz','cuerpo','cabeza','cola','pataDC','pataDL','pataTC','pataTL','orejaA','orejaB','ojos','boca'];

function poseBase(){
  return { raiz:{x:0,y:0,rot:0}, cuerpo:{x:0,y:0,rot:0}, cabeza:{x:0,y:0,rot:0}, cola:{rot:0},
    pataDC:{rot:0,esc:1}, pataDL:{rot:0,esc:1}, pataTC:{rot:0,esc:1}, pataTL:{rot:0,esc:1},
    orejaA:{rot:0}, orejaB:{rot:0}, ojos:'abiertos', boca:'cerrada' };
}
function completarPose(p){
  const b = poseBase();
  if(!p) return b;
  for(const k in b){
    if(typeof b[k] === 'object') Object.assign(b[k], p[k] || {});
    else if(p[k] !== undefined) b[k] = p[k];
  }
  return b;
}

/* Valor de UNA pista en el segundo t (interpolando suavemente entre sus claves) */
function muestrearPista(keys, t, dur, loop){
  if(!keys || !keys.length) return undefined;
  if(keys.length === 1) return keys[0].v;
  dur = Math.max(.05, dur);
  const tt = loop ? ((t % dur) + dur) % dur : Math.min(Math.max(t, 0), dur);
  let i = keys.length - 1;
  for(let j=0; j<keys.length; j++){ if(keys[j].t > tt){ i = j - 1; break; } }
  let k0, k1, t0, t1;
  if(i < 0){
    if(!loop) return keys[0].v;
    k0 = keys[keys.length-1]; k1 = keys[0]; t0 = k0.t - dur; t1 = k1.t;
  } else if(i === keys.length - 1){
    if(!loop) return keys[i].v;
    k0 = keys[i]; k1 = keys[0]; t0 = k0.t; t1 = k1.t + dur;
  } else { k0 = keys[i]; k1 = keys[i+1]; t0 = k0.t; t1 = k1.t; }
  if(typeof k0.v !== 'object') return k0.v;          // ojos y boca cambian de golpe
  let u = t1 > t0 ? (tt - t0)/(t1 - t0) : 0;
  u = u*u*(3 - 2*u);                                   // suave al entrar y salir de cada clave
  const out = {};
  for(const f in k0.v) out[f] = k0.v[f] + ((k1.v[f] !== undefined ? k1.v[f] : k0.v[f]) - k0.v[f])*u;
  return out;
}

/* Pose completa de una animación en el segundo t */
function muestrear(anim, t){
  const a = normalizarAnim(anim), out = poseBase();
  for(const k of PISTAS){
    const v = muestrearPista(a.pistas[k], t, a.duracion, a.loop);
    if(v === undefined) continue;
    if(typeof out[k] === 'object') Object.assign(out[k], v); else out[k] = v;
  }
  return out;
}

/* Convierte el formato antiguo (claves con la pose entera) al nuevo (pistas por pieza).
   En el formato antiguo "cuerpo" movía todo el gato: ahora eso es "raiz". */
function normalizarAnim(a){
  if(!a) return { duracion:1, loop:true, pistas:{} };
  if(a.pistas) return a;
  const pistas = {};
  for(const k of PISTAS) pistas[k] = [];
  for(const c of (a.claves || [])){
    const viejo = c.pose || {};
    const p = completarPose(Object.assign({}, viejo, { raiz: viejo.cuerpo || {x:0,y:0,rot:0}, cuerpo:{x:0,y:0,rot:0} }));
    for(const k of PISTAS) pistas[k].push({ t:c.t, v: typeof p[k] === 'object' ? Object.assign({}, p[k]) : p[k] });
  }
  const base = poseBase();
  for(const k of PISTAS){
    const ks = pistas[k], igual = (x, y) => JSON.stringify(x) === JSON.stringify(y);
    if(ks.every(x => igual(x.v, base[k]))) pistas[k] = [];              // nunca se mueve
    else if(ks.every(x => igual(x.v, ks[0].v))) pistas[k] = [ks[0]];     // siempre igual
  }
  a.pistas = pistas; delete a.claves;
  return a;
}
function normalizarTodas(A){ for(const k in A) normalizarAnim(A[k]); return A; }
function animTieneClaves(a){ a = normalizarAnim(a); return PISTAS.some(k => a.pistas[k] && a.pistas[k].length); }

/* ---------- carga de piezas ---------- */
function mezclarCfg(base, extra){
  const out = {};
  for(const k of Object.keys(base)) out[k] = (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) ? Object.assign({}, base[k], extra[k] || {}) : base[k];
  for(const k of Object.keys(extra)) if(!(k in out)) out[k] = extra[k];
  return out;
}
function oscurecerImg(im){
  const cvs = document.createElement('canvas'); cvs.width = im.width; cvs.height = im.height;
  const g = cvs.getContext('2d');
  g.drawImage(im, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(30,15,10,.25)'; g.fillRect(0, 0, cvs.width, cvs.height);
  return cvs;
}
function cargarPiezasGato(nombre, alListo){
  const propio = PIEZAS_GATOS[nombre];
  if(!propio) return null;
  const cfg = mezclarCfg(PLANTILLA, propio);
  // boca del catálogo compartido (gatos/Bocas/)
  let bocaRuta = cfg.carpeta;
  if(cfg.boca.estilo && typeof BOCAS !== 'undefined' && BOCAS[cfg.boca.estilo]){
    const E = BOCAS[cfg.boca.estilo];
    cfg.boca.archivo = E.cerrada; cfg.boca.abierta = E.abierta; cfg.boca.centro = E.centro;
    bocaRuta = CARPETA_BOCAS;
  }
  const sp = { nombre, cfg, img:{}, ready:false, pending:0, failed:false };
  const P = cfg.patas;
  const lista = [
    ['torso', cfg.torso.archivo], ['cabeza', cfg.cabeza.archivo],
    ['orejaA', cfg.orejaAtras.archivo], ['orejaB', cfg.orejaAdelante.archivo],
    ['ojo', cfg.ojo.archivo], ['ojoC', cfg.ojo.cerrado, true],      // ojos y boca: si vienen dibujados
    ['boca', cfg.boca.archivo], ['bocaA', cfg.boca.abierta, true],    // en la cabeza, se ponen en null
    ['pataDC', P.delanteraCerca], ['pataDL', P.delanteraLejos, true],
    ['pataTC', P.traseraCerca], ['pataTL', P.traseraLejos, true],
    ['cola', cfg.cola.archivo]
  ];
  for(const [key, file, opcional] of lista){
    if(!file) continue;
    const ruta = (key === 'boca' || key === 'bocaA') ? bocaRuta : cfg.carpeta;
    sp.pending++;
    const im = new Image();
    const fin = () => { if(--sp.pending === 0 && !sp.failed){ prepararRig(sp); sp.ready = true; if(alListo) alListo(sp); } };
    im.onload = () => { sp.img[key] = im; fin(); };
    im.onerror = () => {
      if(opcional){ fin(); return; }
      sp.failed = true;
      console.warn(`No encontré "${ruta + file}". ${nombre} se dibuja con el estilo de código.`);
    };
    im.src = ruta + file;
  }
  return sp;
}

/* Medidas que se calculan una vez con las piezas cargadas */
function prepararRig(sp){
  const cf = sp.cfg, S = cf.escala*(cf.tamano || 1), T = cf.torso;
  if(!sp.img.pataDL) sp.img.pataDL = oscurecerImg(sp.img.pataDC);
  if(!sp.img.pataTL) sp.img.pataTL = oscurecerImg(sp.img.pataTC);
  const rel = p => [(p[0]-T.centro[0])*S, (p[1]-T.centro[1])*S];
  sp.S = S;
  sp.a = { hombro:rel(T.hombro), cadera:rel(T.cadera), cuello:rel(T.cuello), cola:rel(T.cola),
           hombroL: T.hombroLejos ? rel(T.hombroLejos) : null, caderaL: T.caderaLejos ? rel(T.caderaLejos) : null };
  const P = cf.patas;
  sp.patVec = [(P.pie[0]-P.arriba[0])*S, (P.pie[1]-P.arriba[1])*S];
  sp.lenD = sp.lenT = Math.hypot(sp.patVec[0], sp.patVec[1]);
  sp.angD = sp.angT = Math.atan2(-sp.patVec[0], sp.patVec[1]);
  sp.colaLen = cf.cola.rigida ? 40 : cf.cola.base[0]*S;
  const H = cf.cabeza;
  sp.headOff = [(H.centro[0]-H.cuello[0])*S, (H.centro[1]-H.cuello[1])*S];
  // "Alto" del gato armado: del centro del torso hasta el pie más bajo (ahí está el suelo)
  const tops = [sp.a.hombro, sp.a.cadera, sp.a.hombroL || sp.a.hombro, sp.a.caderaL || sp.a.cadera];
  sp.alto = Math.max(...tops.map(p => p[1] + sp.patVec[1]));
}

/* ---------- dibujo ----------
   Dibuja al gato en "pose" con el suelo en y = 0, mirando a la derecha.
   ex (opcional): { parpadeo, twA, twB (sacudida de orejas), puntos, alpha }
   Devuelve las matrices de cada pieza (para el editor) y el centro de la cara. */
function rigDibujar(g, sp, pose, ex){
  ex = ex || {};
  const cf = sp.cfg, S = sp.S, T = cf.torso, H = cf.cabeza, PT = cf.patas;
  const rz = pose.raiz;
  // "Gato completo": mueve y gira todo (gira alrededor del centro del torso)
  const R = new DOMMatrix().translateSelf(rz.x, rz.y - sp.alto).rotateSelf(rz.rot);
  const Rp = (x, y) => { const p = R.transformPoint(new DOMPoint(x, y)); return [p.x, p.y]; };
  const mat = (x, y, rotDeg, sx, sy, px, py) => R.multiply(new DOMMatrix().translateSelf(x, y).rotateSelf(rotDeg).scaleSelf(sx, sy).translateSelf(-px, -py));
  // las piezas se unen al gato en sus puntos originales (no siguen al torso)
  const sh = sp.a.hombro, hp = sp.a.cadera, nk = sp.a.cuello, tb = sp.a.cola;
  const shL = sp.a.hombroL || [sh[0]-3, sh[1]-1], hpL = sp.a.caderaL || [hp[0]-3, hp[1]-1];
  const M = {}, piv = {};
  const dib = (key, img, m) => { g.save(); g.transform(m.a, m.b, m.c, m.d, m.e, m.f); g.drawImage(img, 0, 0); g.restore(); M[key] = { m, w:img.width, h:img.height }; };

  if(ex.alpha !== undefined){ g.save(); g.globalAlpha = ex.alpha; }

  if(cf.cola.rigida) dib('cola', sp.img.cola, mat(tb[0], tb[1], pose.cola.rot, S, S, cf.cola.base[0], cf.cola.base[1]));
  else colaDoblada(g, sp, R.multiply(new DOMMatrix().translateSelf(tb[0], tb[1]).scaleSelf(S, S)), pose.cola.rot*RAD, M);
  piv.cola = Rp(tb[0], tb[1]);

  const pata = (key, img, top) => { const p = pose[key]; dib(key, img, mat(top[0], top[1], p.rot, S, S*p.esc, PT.arriba[0], PT.arriba[1])); piv[key] = Rp(top[0], top[1]); };
  pata('pataDL', sp.img.pataDL, shL);
  pata('pataTL', sp.img.pataTL, hpL);
  // patasDetras: las 4 patas quedan detrás del torso
  if(cf.patasDetras){ pata('pataTC', sp.img.pataTC, hp); pata('pataDC', sp.img.pataDC, sh); }
  const cu = pose.cuerpo;
  dib('cuerpo', sp.img.torso, mat(cu.x, cu.y, cu.rot, S, S, T.centro[0], T.centro[1])); piv.cuerpo = Rp(cu.x, cu.y);
  if(!cf.patasDetras){ pata('pataTC', sp.img.pataTC, hp); pata('pataDC', sp.img.pataDC, sh); }

  // cabeza: orejas detrás, cabeza, ojos y boca
  const hx = nk[0] + pose.cabeza.x, hy = nk[1] + pose.cabeza.y;
  const mH = mat(hx, hy, pose.cabeza.rot, S, S, H.cuello[0], H.cuello[1]);
  piv.cabeza = Rp(hx, hy);
  const oreja = (key, img, o, pt, extra) => {
    const m = mH.multiply(new DOMMatrix().translateSelf(pt[0], pt[1]).rotateSelf((o.angulo + pose[key].rot*RAD + (extra || 0))/RAD).translateSelf(-o.base[0], -o.base[1]));
    dib(key, img, m);
    const p = mH.transformPoint(new DOMPoint(pt[0], pt[1])); piv[key] = [p.x, p.y];
  };
  oreja('orejaA', sp.img.orejaA, cf.orejaAtras, H.orejaAtras, ex.twA);
  oreja('orejaB', sp.img.orejaB, cf.orejaAdelante, H.orejaAdelante, ex.twB);
  dib('cabeza', sp.img.cabeza, mH);

  g.save(); g.transform(mH.a, mH.b, mH.c, mH.d, mH.e, mH.f);
  const O = cf.ojo;
  const cerrados = pose.ojos === 'cerrados' || ex.parpadeo;
  const eyeImg = cerrados && sp.img.ojoC ? sp.img.ojoC : sp.img.ojo;
  const sy = cerrados && !sp.img.ojoC ? .12 : 1;   // sin ojo cerrado dibujado: se "aplasta"
  const ojos = O.unico ? [[H.ojoCerca, 1]] : [[H.ojoLejos, O.escalaLejos], [H.ojoCerca, 1]];   // unico: los dos ojos en una sola imagen
  if(eyeImg) for(const [pt, sx] of ojos){
    g.save(); g.translate(pt[0], pt[1]); g.scale(sx, sy); g.drawImage(eyeImg, -O.centro[0], -O.centro[1]); g.restore();
  }
  const B = cf.boca, abierta = pose.boca === 'abierta';
  const mouthImg = abierta && sp.img.bocaA ? sp.img.bocaA : sp.img.boca;
  if(mouthImg){ g.save(); g.translate(H.boca[0], H.boca[1]); if(abierta && !sp.img.bocaA) g.scale(1.1, 1.6);
  g.drawImage(mouthImg, -B.centro[0], -B.centro[1]); g.restore(); }
  g.restore();

  if(ex.alpha !== undefined) g.restore();

  piv.raiz = [rz.x, rz.y];                 // controlador del gato completo (en el suelo)
  piv.raizCentro = Rp(0, 0);               // desde aquí gira el gato completo
  if(ex.puntos){
    g.fillStyle = '#ff2d55';
    for(const k in piv){ if(k.startsWith('raiz')) continue; const p = piv[k]; g.beginPath(); g.arc(p[0], p[1], ex.radioPunto || 1.6, 0, Math.PI*2); g.fill(); }
  }
  const hc = mH.transformPoint(new DOMPoint(H.centro[0], H.centro[1]));
  return { M, piv, R, headCenter:[hc.x, hc.y] };
}

// Cola sin "rigida": se corta en 8 trozos y se dobla (rot = cuánto se curva)
function colaDoblada(g, sp, m0, bend, M){
  const img = sp.img.cola, base = sp.cfg.cola.base, N = 8, seg = base[0]/N, ov = 3, h = img.height;
  let m = m0;
  M.cola = { m: m.translate(-base[0], -base[1]), w: img.width, h: img.height };
  for(let i=0; i<N; i++){
    const sx0 = Math.max(0, base[0] - (i+1)*seg - ov), sw = base[0] - i*seg - sx0;
    g.save(); g.transform(m.a, m.b, m.c, m.d, m.e, m.f);
    g.drawImage(img, sx0, 0, sw, h, -sw, -base[1], sw, h);
    g.restore();
    m = m.translate(-seg, 0).rotate(bend/RAD/N);
  }
}
