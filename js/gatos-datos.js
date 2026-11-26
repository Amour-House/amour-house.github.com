'use strict';
/* ---------- 2. GATOS (DATOS) ----------
   Cada gato es distinto: color, patrón, ojos, orejas, cuerpo, cola,
   accesorio y personalidad (que cambia cómo se comporta). */
/* Tamaño de los gatos: es FIJO (no cambia al ir adelante o atrás en el catio).
   1 = normal · más grande: 1.2 · más chico: 0.8 */
const TAMANO_GATO = 2;
function escalaGato(){ return G*TAMANO_GATO; }

const CAT_DEFS = [
  { name:'Lechuga', desc:'Tricolor de ojos verdes enormes. Lo mira todo como si fuera la primera vez.',
    base:'#ffffff', pattern:'calico', c2:'#b0864a', c3:'#4a4238', eyes:['#c8dd6a','#c8dd6a'], ear:'pointy',
    size:1, head:1.15, leg:1,
    p:{energy:1.2,hunger:1,social:1.3,sleepy:.9,vocal:.8,playful:1.3},
    tags:['Tricolor','Ojos verdes'],
    edad:'2 años', foto:'Portraits/LechugaPortrait.png' },
  { name:'Dorito', desc:'Naranjo con blanco y siempre guiñando un ojo. Un coqueto de tomo y lomo.',
    base:'#ffffff', pattern:'bicolor', c2:'#f0913c', eyes:['#e8a33c','#e8a33c'], ear:'pointy',
    size:1, head:1.15, leg:1,
    p:{energy:1.3,hunger:1.1,social:1.3,sleepy:.9,vocal:1,playful:1.4},
    tags:['Naranjo','Guiñador'],
    edad:'3 años', foto:'Portraits/DoritoPortrait.png' },
  { name:'Billie Jean', desc:'Blanca y negra, con smoking de gala. Elegante y con ganas de bailar.',
    base:'#ffffff', pattern:'bicolor', c2:'#1c1c1c', eyes:['#8fd16a','#8fd16a'], ear:'pointy',
    size:1, head:1.15, leg:1,
    p:{energy:1.2,hunger:1,social:1.1,sleepy:1,vocal:1.8,playful:1.3},   // vocal: qué tan seguido maúlla (Billie Jean es conversadora)
    tags:['Blanco y negro','Elegante'],
    edad:'1 año', foto:'Portraits/BillieJeanPortrait.png' },
];

/* Forma de la cabeza y orejas (se calcula una vez por gato) */
function blobPath(p, cx, cy, rx, ry, rot, bumps, amp){
  const n = 90, co = Math.cos(rot), si = Math.sin(rot);
  for(let i=0;i<=n;i++){
    const a = i/n*TAU, m = 1 + amp*Math.abs(Math.sin(a*bumps/2));
    const x = Math.cos(a)*rx*m, y = Math.sin(a)*ry*m;
    const X = cx + x*co - y*si, Y = cy + x*si + y*co;
    i ? p.lineTo(X,Y) : p.moveTo(X,Y);
  }
  p.closePath();
}
function buildHead(c){
  const r = c.geo.hr, d = c.def;
  const head = new Path2D();
  if(d.fluff) blobPath(head, 0, 0, r, r, 0, 14, 0.09); else { head.moveTo(r,0); head.arc(0,0,r,0,TAU); }
  head.moveTo(r*0.66+r*0.42, r*0.3);
  head.ellipse(r*0.66, r*0.3, r*0.42, r*0.3, 0, 0, TAU); // hocico
  const ears = new Path2D(), inner = new Path2D();
  for(const a of [-2.05, -1.15]){
    let len=r*0.75, wid=r*0.85, bend=0;
    if(d.ear==='big'){ len=r*1.08; wid=r*1.0; }
    if(d.ear==='round'){ len=r*0.55; wid=r*0.8; }
    if(d.ear==='fold'){ len=r*0.42; wid=r*0.72; bend=1.0; }
    const bx=Math.cos(a)*r*0.78, by=Math.sin(a)*r*0.78;
    const ta=a+bend, tx=bx+Math.cos(ta)*len, ty=by+Math.sin(ta)*len;
    const pa=a+Math.PI/2, hx=Math.cos(pa)*wid/2, hy=Math.sin(pa)*wid/2;
    const shape = (p, s) => {
      const cx=bx+Math.cos(ta)*len*0.25, cy=by+Math.sin(ta)*len*0.25;
      const T=(x,y)=>[cx+(x-cx)*s, cy+(y-cy)*s];
      const b1=T(bx-hx,by-hy), b2=T(bx+hx,by+hy), tp=T(tx,ty);
      p.moveTo(b1[0],b1[1]);
      if(d.ear==='round'){
        const ex=Math.cos(ta)*len*1.25*s, ey=Math.sin(ta)*len*1.25*s;
        p.bezierCurveTo(b1[0]+ex,b1[1]+ey,b2[0]+ex,b2[1]+ey,b2[0],b2[1]);
      } else { p.lineTo(tp[0],tp[1]); p.lineTo(b2[0],b2[1]); }
      p.closePath();
    };
    shape(ears, 1); shape(inner, 0.55);
  }
  c.cache = { head, ears, inner };
}

function makeCat(def, i){
  const s = (def.size || 1)*1.3; // 1.3 = tamaño general de los gatos
  const geo = {
    L: 58*(def.len||1)*s, H: 30*(def.fat||1)*s, legL: 17*(def.leg||1)*s, hr: 16*(def.head||1)*s,
    tl: 42*(def.tail||1)*s, legW: 8.5*s*Math.min(def.fat||1, 1.15), tw: 7*(def.tailW||1)*s
  };
  const r = seeded(i*977+13);
  const pat = { patches:[], hp:[], dots:[] };
  if(def.pattern==='calico'){
    pat.patches=[{u:-.45,v:-.45,s:.8,col:def.c2,r:.2},{u:.3,v:-.6,s:.55,col:def.c3,r:-.3},{u:-.9,v:.1,s:.5,col:def.c3,r:0},{u:.65,v:-.05,s:.45,col:def.c2,r:.4}];
    pat.hp=[{u:-.1,v:-.5,s:.7,col:def.c2,r:0}];
  }
  if(def.pattern==='bicolor'){
    pat.patches=[{u:-.4,v:-.55,s:.9,col:def.c2,r:.1},{u:.55,v:-.75,s:.5,col:def.c2,r:0}];
    pat.hp=[{u:-.2,v:-.6,s:.7,col:def.c2,r:0}];
  }
  if(def.pattern==='spots'){ for(let k=0;k<16;k++) pat.dots.push({u:r()*1.8-.9, v:r()*1.5-1, s:2+r()*1.8}); }
  const dark = lum(def.base) < 0.3;
  const pawCol = def.pattern==='tuxedo'||def.pattern==='points' ? def.c2 : def.base;
  const c = {
    def, geo, pat, i, seed: r()*10,
    x: 0, y: 0, z: 0, dir: r()<.5?1:-1, pose: 'sit', animT: r()*10, taskT: 0,
    tasks: [], task: null, blink: 0, nextBlink: 1 + r()*4, spot: null, reserved: null, bowl: null,
    hidden: false, jtilt: 0, batT: 0, hx: 0, hy: 0,
    col: {
      far: shade(def.base, -.25), paw: pawCol, pawFar: shade(pawCol, -.22),
      ear: (def.pattern==='points'||def.pattern==='bicolor') ? def.c2 : def.base,
      inner: def.pattern==='sphynx' ? '#d98a86' : '#f2a7a7',
      c2far: def.c2 ? shade(def.c2, -.2) : null,
      faceInk: dark ? '#e9dccb' : INK,
      whisk: dark ? '#e9dccb' : '#6b5a50',
      nose: dark ? '#7a5050' : (def.pattern==='points' ? '#4a3330' : '#e88a8f'),
      tail: def.tailCol || (def.pattern==='points' ? def.c2 : def.base)
    }
  };
  buildHead(c);
  return c;
}
