'use strict';

/* =========================================================
   AMOUR HOUSE · CATIO INTERACTIVO
   Todo se dibuja en <canvas> con código (sin imágenes).
   Secciones:
   1. Utilidades         5. Dibujo de gatos
   2. Gatos (datos)      6. Cerebro de los gatos (IA)
   3. Escenario          7. Interacción (herramientas)
   4. Objetos            8. Bucle principal
   ========================================================= */

/* ---------- 1. UTILIDADES ---------- */
const cv = document.getElementById('scene');
const ctx = cv.getContext('2d');
const bgC = document.createElement('canvas');
const bctx = bgC.getContext('2d');
const INK = '#2b211e';
const TAU = Math.PI * 2;
let W = 0, H = 0, DPR = 1, G = 1, floorTop = 0, floorBot = 0, walkTop = 0, time = 0;

const R = Math.random;
const rand = (a, b) => a + R() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[(R() * a.length) | 0];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function seeded(s){ return function(){ s|=0; s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hexRgb(h){ h=h.replace('#',''); if(h.length===3) h=h.split('').map(x=>x+x).join(''); const n=parseInt(h,16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function shade(h, a){ const [r,g,b]=hexRgb(h); const t=a<0?0:255, p=Math.abs(a); const f=v=>Math.round(v+(t-v)*p); return `rgb(${f(r)},${f(g)},${f(b)})`; }
function rgba(h, a){ const [r,g,b]=hexRgb(h); return `rgba(${r},${g},${b},${a})`; }
function lum(h){ const [r,g,b]=hexRgb(h); return (0.299*r+0.587*g+0.114*b)/255; }
function weighted(list){ let s=0; for(const [,w] of list) s+=Math.max(0,w); let r=R()*s; for(const [k,w] of list){ r-=Math.max(0,w); if(r<=0) return k; } return list[0][0]; }
function depth(y){ return 0.72 + 0.45 * clamp((y - floorTop) / (floorBot - floorTop), 0, 1); }
const clampX = x => clamp(x, 34, W - 34);
const clampY = y => clamp(y, walkTop, floorBot);
