'use strict';
/* =========================================================
   PIEZAS DIBUJADAS DE CADA GATO  (sistema tipo "Catgen")
   ---------------------------------------------------------
   Cada gato se arma con piezas separadas, como una marioneta:
     torso · cabeza · 2 orejas · ojos · boca · 4 patas · cola
   Las piezas YA vienen con sus colores (no se recolorean).

   Para agregar un gato basta con:
     'Nombre': { carpeta: 'gatos/nombre/' }
   El nombre tiene que ser igual al de js/gatos-datos.js.

   Si dibujan sobre las plantillas (gatos/_plantilla) no hay que
   tocar ningún número. Si alguna pieza de un gato necesita otro
   punto de unión, se cambia SOLO ese dato en su bloque (ver
   ejemplo de Medianoche). Las coordenadas son en píxeles de la
   imagen (x a la derecha, y hacia abajo). Gatos mirando a la DERECHA.
   ========================================================= */

/* Medidas de las plantillas (valen para todos los gatos) */
const PLANTILLA = {
  escala: 0.25,   // 1 px de imagen = 0.25 del juego (se dibuja a 4x para que se vea nítido)

  torso:  { archivo:'torso.png', centro:[180,110], hombro:[262,140], cadera:[98,140], cuello:[282,78], cola:[62,92] },

  cabeza: { archivo:'cabeza.png',
            cuello:[56,150],          // gira desde aquí (se une al cuello del torso)
            centro:[100,95],          // centro de la cara (globos y corazones)
            orejaAtras:[50,34], orejaAdelante:[124,22],   // donde va la base de cada oreja
            ojoCerca:[128,90], ojoLejos:[168,88],          // centro de cada ojo
            boca:[187,126] },         // centro de la boca

  orejaAtras:    { archivo:'oreja-atras.png',    base:[40,82], angulo:-0.3 },
  orejaAdelante: { archivo:'oreja-adelante.png', base:[40,82], angulo:0.22 },

  ojo:  { archivo:'ojo.png', cerrado:'ojo-cerrado.png',  // el cerrado es opcional
          centro:[25,25], escalaLejos:0.65 },             // el ojo lejano se ve más angosto

  boca: { archivo:'boca.png', abierta:'boca-abierta.png', // la abierta es opcional
          centro:[30,16] },

  // 4 patas; las "lejos" son opcionales (si no están, se usa la cercana más oscura)
  patas: { delanteraCerca:'pata-delantera.png', delanteraLejos:'pata-delantera-lejos.png',
           traseraCerca:'pata-trasera.png',     traseraLejos:'pata-trasera-lejos.png',
           arriba:[40,26], pie:[40,152] },

  cola: { archivo:'cola.png', base:[226,30] }   // dibujada estirada apuntando a la IZQUIERDA
};

/* Los gatos que ya tienen piezas dibujadas */
/* ── Bocas compartidas (carpeta gatos/Bocas/) ──
   Cada gato elige una con  boca:{ estilo:'Boca01' }.
   Para agregar otra: dibújala en el lienzo de 2500 en el mismo lugar,
   expórtala como BocaXXCerrada.png y BocaXXAbierta.png, y pide recortarla. */
const BOCAS = {
  'Boca01': { cerrada:'Boca01-cerrada.png', abierta:'Boca01-abierta.png', centro:[15, 13] },
  'Boca02': { cerrada:'Boca02-cerrada.png', abierta:'Boca02-abierta.png', centro:[21, 13] },
};
const CARPETA_BOCAS = 'gatos/Bocas/';

const PIEZAS_GATOS = {
  // Lechuga: dibujada en Procreate (lienzo 2500x2500). Las 4 patas van detrás del torso.
  // Los dos ojos vienen en una sola capa (ojo.png con "unico") y la boca en otra.
  'Lechuga': { carpeta:'gatos/Lechuga/', tamano:0.78, patasDetras:true, 
    torso:  { centro:[132, 78], hombro:[149, 124], cadera:[121, 120], 
              hombroLejos:[222, 111], caderaLejos:[37, 106], cuello:[188, 46], cola:[35, 50] }, 
    cabeza: { cuello:[57, 148], centro:[97, 89], orejaAtras:[48, 75], orejaAdelante:[149, 86], 
              ojoCerca:[103, 88], ojoLejos:[103, 88], boca:[107, 129] }, 
    orejaAtras:    { base:[47, 133], angulo:0 }, 
    orejaAdelante: { base:[52, 138], angulo:0 }, 
    ojo:  { centro:[77, 38], unico:true, cerrado:'ojo-cerrado.png' }, 
    boca: { estilo:'Boca01' }, 
    patas:{ arriba:[36, 20], pie:[36, 133] }, 
    cola: { base:[93, 162], rigida:true }
  }, 

  // Dorito: dibujado en Procreate (lienzo 2500x2500), misma escala que Lechuga.
  // Sus ojos (uno abierto y uno cerrado, guiñando) vienen en una sola capa.
  'Dorito': { carpeta:'gatos/Dorito/', tamano:0.78, patasDetras:true, 
    torso:  { centro:[133, 80], hombro:[149, 125], cadera:[121, 121], 
              hombroLejos:[222, 112], caderaLejos:[37, 107], cuello:[177, 46], cola:[38, 44] }, 
    cabeza: { cuello:[66, 146], centro:[116, 91], orejaAtras:[62, 77], orejaAdelante:[170, 86], 
              ojoCerca:[127, 88], ojoLejos:[127, 88], boca:[129, 127] }, 
    orejaAtras:    { base:[47, 133], angulo:0 }, 
    orejaAdelante: { base:[52, 138], angulo:0 }, 
    ojo:  { centro:[74, 38], unico:true, cerrado:'ojo-cerrado.png' }, 
    boca: { estilo:'Boca02' }, 
    patas:{ arriba:[36, 20], pie:[36, 133] }, 
    cola: { base:[112, 164], rigida:true }
  },

  // Billie Jean: misma plantilla y escala que Lechuga.
  'Billie Jean': { carpeta:'gatos/Billie Jean/', tamano:0.78, patasDetras:true,
    torso:  { centro:[132, 78], hombro:[149, 124], cadera:[121, 120],
              hombroLejos:[222, 111], caderaLejos:[37, 106], cuello:[188, 46], cola:[35, 50] },
    cabeza: { cuello:[57, 148], centro:[97, 89], orejaAtras:[48, 75], orejaAdelante:[149, 86],
              ojoCerca:[103, 88], ojoLejos:[103, 88], boca:[108, 127] },
    orejaAtras:    { base:[47, 133], angulo:0 },
    orejaAdelante: { base:[52, 138], angulo:0 },
    ojo:  { centro:[77, 38], unico:true, cerrado:'ojo-cerrado.png' },
    boca: { estilo:'Boca02' },
    patas:{ arriba:[36, 20], pie:[36, 133] },
    cola: { base:[93, 162], rigida:true }
  }, 

  // 'Calcetin':  { carpeta:'gatos/calcetin/' },
};
