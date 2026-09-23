// Toparlanma modeli: sistem başına birikmiş iyileşme borcu (saat) ve eşik.
import {S} from '../durum.js';
import {painNow} from './agri.js';
import {CFG_DEFAULT} from '../sabitler.js';
import {dayKey,dt} from '../yardimcilar.js';

export function recHours(s){return S.cfg.recovery[s]!=null?S.cfg.recovery[s]:CFG_DEFAULT.recovery[s];}
export function rpeFactor(r){const R=S.cfg.rpe;return r>=8?R.f8:r===7?R.f7:r===6?R.f6:r===5?R.f5:R.f0;}
export function exRecovery(e){const v=parseFloat(e.recovery);if(!isNaN(v)&&v>0)return v;let m=0;for(const sy in e.systems)if(e.systems[sy]>=1)m=Math.max(m,recHours(sy));return m||recHours('mobilite');}
export function sysThreshold(s){return recHours(s)*(S.cfg.overloadMult||1);}
// birikmiş: son antrenmanlardan gelen kalan iyileşmelerin toplamı (egzersiz-gün başına bir kez)
export function sysRecovery(s){const now=Date.now(),R=S.cfg,cap=Math.max(R.lookbackHours,30*24),groups={};
  for(let i=S.logs.length-1;i>=0;i--){const l=S.logs[i];const ageH=(now-l.t)/3600000;if(ageH>cap)break;
    const e=S.ex(l.e);if(!e)continue;const w=e.systems[s]||0;if(w<=0)continue;
    const key=l.e+'|'+dayKey(dt(l));const g=groups[key]||(groups[key]={t:0,r:0,e,w,n:0});if(l.t>g.t)g.t=l.t;if(l.r>g.r)g.r=l.r;g.n++;}
  let sum=0;for(const k in groups){const g=groups[k];let f=rpeFactor(g.r);
    if(g.e.impact&&(s.indexOf('tendon')===0||s==='kemik'||s==='reaktif'))f=Math.max(f,R.impactFactor);
    const setC=(R.setContrib!=null?R.setContrib:0.5);
    const rem=exRecovery(g.e)*g.w*f*setC*g.n-(now-g.t)/3600000;if(rem>0)sum+=rem;}
  const pl=painNow(s);if(pl>0)sum+=(R.painStrain[pl]||0);
  return sum;}
