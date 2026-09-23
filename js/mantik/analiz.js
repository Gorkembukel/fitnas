// Yük ve denge analizi: kas/sistem yükü, kalıp sayımı, boşluk puanı, aylık özet.
import {S,load} from '../durum.js';
import {doneSetsOn,plannedSets} from './program.js';
import {M_ORDER,S_ORDER} from '../sabitler.js';
import {dOnly,dayKey,dt} from '../yardimcilar.js';

export function status(v){const c=S.cfg;return v<c.openBelow?{t:'Açıkta',c:'var(--red)'}:v<c.lowBelow?{t:'Düşük',c:'var(--orange)'}:{t:'İyi',c:'var(--green)'};}
export function muscleLoad(days){days=days??S.cfg.window;const from=Date.now()-days*86400000;const r={};for(const m of M_ORDER)r[m]=0;
  for(const l of S.logs){if(l.t<from)continue;const e=S.ex(l.e);if(!e)continue;for(const m in e.muscles)r[m]+=e.muscles[m];}return r;}
export function systemLoad(days){days=days??S.cfg.window;const from=Date.now()-days*86400000;const r={};for(const s of S_ORDER)r[s]=0;
  for(const l of S.logs){if(l.t<from)continue;const e=S.ex(l.e);if(!e)continue;for(const s in e.systems)r[s]+=e.systems[s];}return r;}
export function patternSets(key,days){days=days??S.cfg.window;const from=Date.now()-days*86400000;let n=0;
  for(const l of S.logs){if(l.t<from)continue;const e=S.ex(l.e);if(e&&e.pattern.includes(key))n++;}return n;}
export function gapScore(e,ml,sl){const R=S.cfg;
  const sc=(load,w)=>{const pts=load<R.openBelow?R.gapOpen:load<R.lowBelow?R.gapLow:0;return R.gapAux?pts*w:(w>=1?pts:0);};
  let g=0;for(const m in e.muscles)g+=sc(ml[m],e.muscles[m]);for(const s in e.systems)g+=sc(sl[s],e.systems[s]);return g;}
export function monthAgg(y,mo){
  const logs=S.logs.filter(l=>{const d=dt(l);return d.getFullYear()===y&&d.getMonth()===mo;});
  const days=new Set(logs.map(l=>dayKey(dt(l))));
  const ex=new Set(logs.map(l=>l.e));
  const reps=logs.reduce((a,l)=>a+(l.v||0),0);
  const avgRpe=logs.length?logs.reduce((a,l)=>a+l.r,0)/logs.length:0;
  const ml={};for(const m of M_ORDER)ml[m]=0;const sl={};for(const s of S_ORDER)sl[s]=0;
  for(const l of logs){const e=S.ex(l.e);if(!e)continue;for(const m in e.muscles)ml[m]+=e.muscles[m];for(const s in e.systems)sl[s]+=e.systems[s];}
  // uyum: gün gün planlanan vs yapılan (bugüne kadar)
  const today=dOnly(new Date());let plan=0,done=0;
  const dim=new Date(y,mo+1,0).getDate();
  for(let dn=1;dn<=dim;dn++){const dd=new Date(y,mo,dn);if(dd>today)break;const p=plannedSets(dd);plan+=p;done+=Math.min(p,doneSetsOn(dd));}
  return {logs,daysTrained:days.size,sets:logs.length,ex:ex.size,reps,avgRpe,ml,sl,plan,done};
}
