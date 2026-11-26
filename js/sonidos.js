'use strict';
/* ---------- SONIDOS ----------
   - Canción de fondo (Sounds/Cats.mp3) en loop y bajita.
   - Botón de volumen que abre un panel para ajustar la música y los gatos.
   - Cada gato tiene sus sonidos: 3 miaus, ronroneo, enojo y un easter egg
     que reemplaza al miau 1 de cada 100 veces.
   Los navegadores no dejan sonar nada hasta que la persona toca la página,
   así que todo empieza a sonar con el primer clic o toque. */

const MUSICA = { archivo:'Sounds/Cats.mp3', volumenMax:.45, barritaInicial:40 };   // barrita 100 = volumenMax
const GATOS_VOL = { volumenMax:.9, barritaInicial:65 };                              // barrita 100 = volumenMax
const PROB_EASTER_EGG = 1/100;
const PAUSA_ENTRE_SONIDOS = .5;   // segundos mínimos entre sonidos de gatos (para que no se encimen)

// Los nombres de archivo van tal cual están en la carpeta (en GitHub importan las mayúsculas)
const SONIDOS_GATOS = {
  'Lechuga':     { carpeta:'Sounds/Lechuga/',    miaus:['miau1.wav','miau2.wav','miau3.wav'], ronroneo:'runrun.wav', enojo:'angry.wav', easter:'EasterEgg.wav' },
  'Dorito':      { carpeta:'Sounds/Dorito/',     miaus:['miau1.wav','miau2.wav','miau3.wav'], ronroneo:'runrun.wav', enojo:'Angry.wav', easter:'EasterEgg.wav' },
  'Billie Jean': { carpeta:'Sounds/BillieJean/', miaus:['Miau1.wav','miau2.wav','miau3.wav'], ronroneo:'runrun.wav', enojo:'angry.wav', easter:'EasterEgg.wav' },
};

/* ── Volumen: botón que abre un panel con dos barritas (música y gatos) ── */
const musica = new Audio(MUSICA.archivo);
musica.loop = true;
let volMusica = MUSICA.barritaInicial, volGatos = GATOS_VOL.barritaInicial;   // 0 a 100
try {
  const m = localStorage.getItem('amourhouse_volumen'), g = localStorage.getItem('amourhouse_volumen_gatos');
  if(m !== null && !isNaN(+m)) volMusica = +m;
  if(g !== null && !isNaN(+g)) volGatos = +g;
} catch(e){}
let audioDesbloqueado = false;
const volumenGatos = () => GATOS_VOL.volumenMax * volGatos/100;

function guardarVolumen(){
  try { localStorage.setItem('amourhouse_volumen', String(volMusica)); localStorage.setItem('amourhouse_volumen_gatos', String(volGatos)); } catch(e){}
}
function pintarBarrita(r, v){ if(r){ r.value = v; r.style.setProperty('--lleno', v + '%'); } }
function actualizarPanelVolumen(){
  const b = document.getElementById('btnMusica');
  if(b) b.textContent = (volMusica === 0 && volGatos === 0) ? '🔇' : (volMusica + volGatos < 100 ? '🔉' : '🔊');
  pintarBarrita(document.getElementById('volMusica'), volMusica);
  pintarBarrita(document.getElementById('volGatos'), volGatos);
}
function aplicarMusica(){
  musica.volume = MUSICA.volumenMax * volMusica/100;
  if(volMusica === 0 || !audioDesbloqueado) musica.pause();
  else musica.play().catch(() => {});
}
function abrirPanelVolumen(abrir){
  const p = document.getElementById('panelVolumen'), b = document.getElementById('btnMusica'); if(!p) return;
  p.hidden = abrir === undefined ? !p.hidden : !abrir;
  if(b) b.setAttribute('aria-expanded', String(!p.hidden));
}
// el primer clic/toque en la página "desbloquea" el audio
function desbloquearAudio(){
  if(audioDesbloqueado) return;
  audioDesbloqueado = true; aplicarMusica();
}
window.addEventListener('pointerdown', desbloquearAudio, true);
window.addEventListener('keydown', desbloquearAudio, true);
document.addEventListener('DOMContentLoaded', () => {
  const caja = document.getElementById('volumen'), b = document.getElementById('btnMusica');
  const rm = document.getElementById('volMusica'), rg = document.getElementById('volGatos');
  if(b) b.addEventListener('click', e => { e.stopPropagation(); abrirPanelVolumen(); });
  if(rm) rm.addEventListener('input', () => { volMusica = Math.round(+rm.value); guardarVolumen(); actualizarPanelVolumen(); aplicarMusica(); });
  if(rg){
    rg.addEventListener('input', () => { volGatos = Math.round(+rg.value); guardarVolumen(); actualizarPanelVolumen(); });
    rg.addEventListener('change', () => { ultimoSonido = -99; if(cats.length) sonidoMiau(pick(cats), true); });   // un miau de prueba al soltar
  }
  if(caja) caja.addEventListener('pointerdown', e => e.stopPropagation());
  // tocar fuera del panel lo cierra
  document.addEventListener('pointerdown', e => { if(caja && !caja.contains(e.target)) abrirPanelVolumen(false); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') abrirPanelVolumen(false); });
  actualizarPanelVolumen(); musica.volume = MUSICA.volumenMax * volMusica/100;
});

/* ── Sonidos de los gatos ── */
let ultimoSonido = -99;

function _audioGato(c, archivo){
  const S = SONIDOS_GATOS[c.def.name]; if(!S || !archivo) return null;
  const a = new Audio(S.carpeta + archivo);
  a.volume = volumenGatos();
  return a;
}
function _tocar(a, forzar){
  if(!a || !audioDesbloqueado || volGatos === 0) return null;
  if(!forzar && time - ultimoSonido < PAUSA_ENTRE_SONIDOS) return null;
  ultimoSonido = time;
  a.play().catch(() => {});
  return a;
}
// miau al azar (o, de vez en cuando, el easter egg)
function sonidoMiau(c, forzar){
  const S = SONIDOS_GATOS[c.def.name]; if(!S) return;
  const archivo = (S.easter && Math.random() < PROB_EASTER_EGG) ? S.easter : pick(S.miaus);
  _tocar(_audioGato(c, archivo), forzar);
}
function sonidoEnojo(c, forzar){
  const S = SONIDOS_GATOS[c.def.name]; if(!S) return;
  _tocar(_audioGato(c, S.enojo), forzar);
}
// el ronroneo se repite mientras lo acarician, y se corta cuando termina
function empezarRonroneo(c, volumen){
  const S = SONIDOS_GATOS[c.def.name]; if(!S || c.ronroneo) return;
  const a = _audioGato(c, S.ronroneo); if(!a) return;
  a.loop = true; a.volume = volumenGatos()*(volumen || .8);
  if(_tocar(a, true)) c.ronroneo = a;
}
function pararRonroneo(c){
  if(!c.ronroneo) return;
  c.ronroneo.pause(); c.ronroneo = null;
}
