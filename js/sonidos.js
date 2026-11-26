'use strict';
/* ---------- SONIDOS ----------
   - Canción de fondo (Sounds/Cats.mp3) en loop y bajita, con botón para silenciarla.
   - Cada gato tiene sus sonidos: 3 miaus, ronroneo, enojo y un easter egg
     que reemplaza al miau 1 de cada 100 veces.
   Los navegadores no dejan sonar nada hasta que la persona toca la página,
   así que todo empieza a sonar con el primer clic o toque. */

const MUSICA = { archivo:'Sounds/Cats.mp3', volumen:.18 };
const VOLUMEN_GATOS = .6;
const PROB_EASTER_EGG = 1/100;
const PAUSA_ENTRE_SONIDOS = .5;   // segundos mínimos entre sonidos de gatos (para que no se encimen)

// Los nombres de archivo van tal cual están en la carpeta (en GitHub importan las mayúsculas)
const SONIDOS_GATOS = {
  'Lechuga':     { carpeta:'Sounds/Lechuga/',    miaus:['miau1.wav','miau2.wav','miau3.wav'], ronroneo:'runrun.wav', enojo:'angry.wav', easter:'EasterEgg.wav' },
  'Dorito':      { carpeta:'Sounds/Dorito/',     miaus:['miau1.wav','miau2.wav','miau3.wav'], ronroneo:'runrun.wav', enojo:'Angry.wav', easter:'EasterEgg.wav' },
  'Billie Jean': { carpeta:'Sounds/BillieJean/', miaus:['Miau1.wav','miau2.wav','miau3.wav'], ronroneo:'runrun.wav', enojo:'angry.wav', easter:'EasterEgg.wav' },
};

/* ── Canción de fondo ── */
const musica = new Audio(MUSICA.archivo);
musica.loop = true; musica.volume = MUSICA.volumen;
let musicaSilenciada = false;
try { musicaSilenciada = localStorage.getItem('amourhouse_musica_off') === '1'; } catch(e){}
let audioDesbloqueado = false;

function actualizarBotonMusica(){
  const b = document.getElementById('btnMusica'); if(!b) return;
  b.textContent = musicaSilenciada ? '🔇' : '🔊';
  b.title = musicaSilenciada ? 'Activar la música' : 'Silenciar la música';
  b.setAttribute('aria-label', b.title);
}
function aplicarMusica(){
  if(musicaSilenciada || !audioDesbloqueado) musica.pause();
  else musica.play().catch(() => {});
}
function alternarMusica(){
  musicaSilenciada = !musicaSilenciada;
  try { localStorage.setItem('amourhouse_musica_off', musicaSilenciada ? '1' : '0'); } catch(e){}
  actualizarBotonMusica(); aplicarMusica();
}
// el primer clic/toque en la página "desbloquea" el audio
function desbloquearAudio(){
  if(audioDesbloqueado) return;
  audioDesbloqueado = true; aplicarMusica();
}
window.addEventListener('pointerdown', desbloquearAudio, true);
window.addEventListener('keydown', desbloquearAudio, true);
document.addEventListener('DOMContentLoaded', () => {
  const b = document.getElementById('btnMusica');
  if(b){ b.addEventListener('click', e => { e.stopPropagation(); alternarMusica(); }); actualizarBotonMusica(); }
});

/* ── Sonidos de los gatos ── */
let ultimoSonido = -99;

function _audioGato(c, archivo){
  const S = SONIDOS_GATOS[c.def.name]; if(!S || !archivo) return null;
  const a = new Audio(S.carpeta + archivo);
  a.volume = VOLUMEN_GATOS;
  return a;
}
function _tocar(a, forzar){
  if(!a || !audioDesbloqueado) return null;
  if(!forzar && time - ultimoSonido < PAUSA_ENTRE_SONIDOS) return null;
  ultimoSonido = time;
  a.play().catch(() => {});
  return a;
}
// miau al azar (o, de vez en cuando, el easter egg)
function sonidoMiau(c){
  const S = SONIDOS_GATOS[c.def.name]; if(!S) return;
  const archivo = (S.easter && Math.random() < PROB_EASTER_EGG) ? S.easter : pick(S.miaus);
  _tocar(_audioGato(c, archivo));
}
function sonidoEnojo(c, forzar){
  const S = SONIDOS_GATOS[c.def.name]; if(!S) return;
  _tocar(_audioGato(c, S.enojo), forzar);
}
// el ronroneo se repite mientras lo acarician, y se corta cuando termina
function empezarRonroneo(c, volumen){
  const S = SONIDOS_GATOS[c.def.name]; if(!S || c.ronroneo) return;
  const a = _audioGato(c, S.ronroneo); if(!a) return;
  a.loop = true; a.volume = VOLUMEN_GATOS*(volumen || .8);
  if(_tocar(a, true)) c.ronroneo = a;
}
function pararRonroneo(c){
  if(!c.ronroneo) return;
  c.ronroneo.pause(); c.ronroneo = null;
}
