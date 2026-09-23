// Durumu değiştiren eylemler. Hepsi sonunda changed() çağırır (kaydet + çiz).
import {S,changed,defOf,defaultActive} from './durum.js';
import {E} from './katalog.js';
import {mergeCfg} from './sabitler.js';
import {dOnly,dayKey,dt,sameDay} from './yardimcilar.js';

/* ── kayıt ── */
export function addLog(id,v,r){S.logs.push({e:id,t:Date.now(),v,r});changed();}
export function undoLast(id){for(let i=S.logs.length-1;i>=0;i--){if(S.logs[i].e===id){S.logs.splice(i,1);break;}}changed();}
export function toggleActive(id){S.active.has(id)?S.active.delete(id):S.active.add(id);changed();}
export function removeCustom(id){S.custom=S.custom.filter(e=>e.id!==id);S.active.delete(id);delete S.overrides[id];S.schedLog=S.schedLog.filter(z=>z.e!==id);S.reindex();changed();}
export function addDay(id,d){const e=S.ex(id);if(!e)return;const def=defOf(e);if(!def.days.includes(d)){def.days=[...def.days,d].sort((a,b)=>a-b);}S.active.add(id);saveExercise(id,def);}
export function removeDay(id,d){const e=S.ex(id);if(!e)return;const def=defOf(e);def.days=def.days.filter(x=>x!==d);saveExercise(id,def);}
export function toggleSignal(key,area){const l=S.signals[key]||(S.signals[key]=[]);const i=l.indexOf(area);i>=0?l.splice(i,1):l.push(area);changed();}
export function addMetric(k,v){S.metrics.push({k,v,t:Date.now()});changed();}
export function setStart(d){S.start=dOnly(d);changed();}
export function setTestInterval(n){S.testInterval=n;changed();}
export function resetToday(){const t=dOnly(new Date());S.logs=S.logs.filter(l=>!sameDay(dt(l),t));delete S.signals[dayKey(t)];changed();}
export function resetAll(){S.logs=[];S.metrics=[];S.signals={};S.custom=[];S.overrides={};S.maxes=[];S.testInterval=28;S.schedLog=[];S.oneoff=[];S.pain={};S.painLog=[];S.painAction=[];S.cfg=mergeCfg();S.reindex();S.active=new Set(defaultActive());S.start=dOnly(new Date());changed();}
export function resetCfg(){S.cfg=mergeCfg();changed();}
/* ── egzersiz düzenleme ── */
export function logSched(id,oldD,newD){const now=Date.now(),o=new Set(oldD),n=new Set(newD);
  for(const d of n)if(!o.has(d))S.schedLog.push({e:id,d,op:'add',t:now});
  for(const d of o)if(!n.has(d))S.schedLog.push({e:id,d,op:'remove',t:now});}
export function saveExercise(id,def){
  const prevDays=id&&S.ex(id)?[...S.ex(id).days]:[];
  let sid=id;
  if(id&&S.ex(id)&&S.ex(id).custom){const c=S.custom.find(x=>x.id===id);Object.assign(c,{name:def.name,pattern:def.pattern,unit:def.unit,days:def.days,rpe:def.rpe,impact:def.impact,halfRec:def.halfRec,step:def.step,muscles:def.muscles,systems:def.systems,targets:def.targets,note:def.note,tempo:def.tempo||'',recovery:def.recovery||''});}
  else if(id){S.overrides[id]=def;}
  else{sid='c_'+Date.now();S.custom.push(E(sid,def.name,{pattern:def.pattern,unit:def.unit,grp:'Özel',custom:true,muscles:def.muscles,systems:def.systems,days:def.days,targets:def.targets,rpe:def.rpe,step:def.step,impact:def.impact,halfRec:def.halfRec,note:def.note,tempo:def.tempo||'',recovery:def.recovery||''}));S.active.add(sid);}
  logSched(sid,prevDays,def.days);
  S.reindex();changed();
}
export function resetExercise(id){delete S.overrides[id];S.schedLog=S.schedLog.filter(z=>z.e!==id);S.reindex();changed();}
export function addMax(id,v,t){S.maxes.push({e:id,v,t:t??Date.now()});changed();}
export function setPain(s,lvl){lvl=Math.max(0,Math.min(3,lvl|0));if((S.pain[s]||0)===lvl)return;S.pain[s]=lvl;S.painLog.push({s,level:lvl,t:Date.now()});changed();}
export function setPainAction(id,mode){const key=dayKey(dOnly(new Date()));S.painAction=S.painAction.filter(x=>!(x.e===id&&x.d===key));if(mode&&mode!=='clear')S.painAction.push({e:id,d:key,mode});changed();}
export function addOneoff(id,key){if(!S.oneoff.some(o=>o.e===id&&o.d===key))S.oneoff.push({e:id,d:key});changed();}
export function removeOneoff(id,key){S.oneoff=S.oneoff.filter(o=>!(o.e===id&&o.d===key));changed();}
export function setCfg(path,val){const p=path.split('.');let o=S.cfg;for(let i=0;i<p.length-1;i++)o=o[p[i]];o[p[p.length-1]]=val;changed();}
