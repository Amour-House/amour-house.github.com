'use strict';
/* ---------- SISTEMA DE TICKETS ----------
   Para que los gatos no hagan todos lo mismo al mismo tiempo, cada
   actividad tiene una cantidad de tickets (cupos). Un gato solo puede
   hacer la actividad si consigue un ticket, y lo devuelve al terminar.

   - cupos:     cuántos gatos pueden hacerla a la vez
   - descanso:  segundos que la actividad queda "cerrada" después de que
                alguien devuelve su ticket (para que no se encadenen)
   - fila:      si es true, los gatos interesados se sientan a esperar su
                turno mirando la actividad, en orden de llegada
   - porObjeto: los cupos se cuentan por cada objeto (cada premio tiene
                su propio ticket)

   Para ajustar el comportamiento basta con cambiar estos números. */
const TICKETS = {
  laser:   { cupos:1, descanso:.4, fila:true },   // un gato persigue el láser, los otros esperan
  pelota:  { cupos:1, descanso:1,  fila:true },   // un gato juega con la pelota
  premio:  { cupos:1, porObjeto:true },           // cada premio es para un solo gato
  jugar:   { cupos:2, descanso:5 },               // persecuciones y peleas de juego: una pareja a la vez
  zoomies: { cupos:1, descanso:12 },              // carreras locas: uno a la vez y no muy seguido
  maullar: { cupos:1, descanso:1.5 },             // que no maúllen en coro
};
const ESPERA_MAX = 9;   // segundos que un gato espera en la fila antes de aburrirse

const _tickets = {};   // actividad -> [{c, obj}]
const _libre = {};     // actividad -> momento desde el que vuelve a estar disponible
const _filas = {};     // actividad -> [gatos esperando]
for(const a in TICKETS){ _tickets[a] = []; _filas[a] = []; _libre[a] = 0; }

/* ¿Queda algún ticket libre para esta actividad (y este objeto)? */
function hayTicket(act, obj, cuantos){
  const T = TICKETS[act]; if(!T) return true;
  if(time < _libre[act]) return false;
  const usados = _tickets[act].filter(t => !T.porObjeto || t.obj === obj).length;
  return usados + (cuantos || 1) <= T.cupos;
}
/* El gato intenta tomar un ticket. Devuelve true si lo consiguió. */
function tomarTicket(c, act, obj){
  if(c.ticket && c.ticket.act === act && c.ticket.obj === obj) return true;
  soltarTicket(c);
  if(!hayTicket(act, obj)) return false;
  const t = { act, obj, c };
  _tickets[act].push(t); c.ticket = t;
  salirDeFila(c);
  return true;
}
/* Devuelve el ticket que tenga el gato (si tiene uno). */
function soltarTicket(c){
  const t = c.ticket; if(!t) return;
  const l = _tickets[t.act], i = l.indexOf(t);
  if(i >= 0){ l.splice(i, 1); _libre[t.act] = Math.max(_libre[t.act], time + (TICKETS[t.act].descanso || 0)); }
  c.ticket = null;
}
function tieneTicket(c, act){ return !!(c.ticket && c.ticket.act === act); }
function quienesTienen(act){ return _tickets[act].map(t => t.c); }

/* Filas de espera */
function ponerEnFila(c, act){
  const f = _filas[act];
  if(!f || f.includes(c) || tieneTicket(c, act)) return false;
  setTasks(c, [{type:'esperar', act, dur:ESPERA_MAX}]);
  f.push(c);
  return true;
}
function salirDeFila(c){
  for(const a in _filas){ const f = _filas[a], i = f.indexOf(c); if(i >= 0) f.splice(i, 1); }
}
function enFila(act){ return _filas[act] || []; }

/* Qué hace un gato cuando le toca su turno en la fila */
const AL_TOCAR_TURNO = {
  laser:  c => laser.on ? [{type:'laser', dur:rand(4,9)}] : null,
  pelota: c => [{type:'ball', n:randi(2,4)}],
};

/* Se llama una vez por cuadro: entrega los tickets libres a quien espera */
function actualizarTickets(){
  for(const act in _filas){
    const f = _filas[act];
    // se van de la fila los que ya no están esperando (los tomaron, se aburrieron...)
    for(let i = f.length - 1; i >= 0; i--){
      const c = f[i];
      if(!c.task || c.task.type !== 'esperar' || c.task.act !== act) f.splice(i, 1);
    }
    while(f.length && hayTicket(act)){
      const c = f.shift();
      const tareas = AL_TOCAR_TURNO[act] && AL_TOCAR_TURNO[act](c);
      if(!tareas){ f.length = 0; break; }   // la actividad terminó (ej: se apagó el láser)
      darTurno(c, act, tareas);
    }
  }
}

/* Asigna tareas a un gato junto con su ticket (si lo consigue). */
function darTurno(c, act, tareas, obj){
  setTasks(c, tareas);
  if(!tomarTicket(c, act, obj)){ c.tasks = [{type:'idle', dur:rand(1,2), pose:'sit'}]; return false; }
  return true;
}
