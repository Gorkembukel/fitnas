// Uygulama durumu (S) ve kalıcılık sözleşmesi: serialize / applyState / migrasyonlar / kaydet.
// Yeni kalıcı alan: S + serialize + applyState + migrateV1 + eylemler.js/resetAll (bkz. /yeni-alan).
import {Cloud,cloudPush} from './bulut.js';
import {E,kCatalog} from './katalog.js';
import {mergeCfg} from './sabitler.js';
import {render} from './ui/render.js';
import {dOnly} from './yardimcilar.js';

/* ══════════════ DURUM ══════════════ */
export const KEY='antrenman_takip_v2';
export const S={
  start:dOnly(new Date()), active:new Set(), logs:[], custom:[], signals:{}, metrics:[],
  overrides:{}, maxes:[], testInterval:28, schedLog:[], oneoff:[], pain:{}, painLog:[], painAction:[], cfg:mergeCfg(), _idx:{},
  all(){return [...kCatalog.map(b=>this._idx[b.id]), ...this.custom.map(c=>this._idx[c.id])];},
  ex(id){return this._idx[id];},
  reindex(){this._idx={};for(const b of kCatalog)this._idx[b.id]=effective(b);for(const c of this.custom)this._idx[c.id]=c;},
};
export function effective(base){
  const ov=S.overrides[base.id]; if(!ov)return base;
  return Object.assign({},base,{name:ov.name,note:ov.note,pattern:ov.pattern,unit:ov.unit,days:ov.days,
    rpe:ov.rpe,impact:ov.impact,halfRec:ov.halfRec,step:ov.step,muscles:ov.muscles,systems:ov.systems,targets:ov.targets,tempo:ov.tempo!=null?ov.tempo:base.tempo,recovery:ov.recovery!=null?ov.recovery:base.recovery});
}
export function defaultActive(){return kCatalog.filter(e=>e.block===null).map(e=>e.id);}
export function defOf(e){return {name:e.name,note:e.note,pattern:e.pattern,unit:e.unit,days:[...e.days],rpe:e.rpe,
  impact:e.impact,halfRec:e.halfRec,step:e.step,tempo:e.tempo||'',recovery:e.recovery||'',muscles:{...e.muscles},systems:{...e.systems},
  targets:e.targets.map(t=>({sets:t.sets,v:t.v}))};}
export function customToJ(e){return {id:e.id,def:defOf(e)};}
export function customFromJ(j){const d=j.def;return E(j.id,d.name,{pattern:d.pattern,unit:d.unit,grp:'Özel',custom:true,
  muscles:d.muscles,systems:d.systems,days:d.days,targets:d.targets,rpe:d.rpe,step:d.step,impact:d.impact,halfRec:d.halfRec,note:d.note,tempo:d.tempo||'',recovery:d.recovery||''});}
export function serialize(){return {start:S.start.toISOString(),active:[...S.active],logs:S.logs,metrics:S.metrics,
  signals:S.signals,overrides:S.overrides,maxes:S.maxes,testInterval:S.testInterval,schedLog:S.schedLog,oneoff:S.oneoff,pain:S.pain,painLog:S.painLog,painAction:S.painAction,cfg:S.cfg,custom:S.custom.map(customToJ),
  updatedAt:S._updatedAt||Date.now()};}
export function migrateTendon(){
  const tmap={squat:'tendonDiz',wallsit:'tendonDiz',wallpush:'tendonItme',chin:'tendonKol',pullNeg:'tendonKol',hang:'tendonKol',rdl1:'tendonKalca',sideplank:'tendonItme',wallhard:'tendonItme',bulgar:'tendonDiz',cossack:'tendonDiz',run:'tendonAsil',rope:'tendonAsil',nordic:'tendonKalca',pogo:'tendonAsil',archer:'tendonItme',clap:'tendonItme',carry:'tendonKol',pullup:'tendonKol'};
  const kmap={push:'kasItme',squat:'kasBacak',wallsit:'kasBacak',wallpush:'kasItme',chin:'kasCekme',pullNeg:'kasCekme',row1:'kasCekme',rdl1:'kasBacak',bridge1:'kasBacak',deadbug:'kasGovde',sideplank:'kasGovde',wallhard:'kasItme',bulgar:'kasBacak',cossack:'kasBacak',nordic:'kasBacak',archer:'kasItme',clap:'kasItme',carry:'kasCekme',pullup:'kasCekme',pallof:'kasGovde',shadow:'kasGovde',sprint:'kasBacak'};
  const fix=(sysObj,id,oldKey,map,fallback)=>{if(sysObj&&sysObj[oldKey]!=null){const to=map[id]||fallback;if(sysObj[to]==null)sysObj[to]=sysObj[oldKey];delete sysObj[oldKey];}};
  for(const id in S.overrides){if(S.overrides[id]){fix(S.overrides[id].systems,id,'tendon',tmap,'tendonKalca');fix(S.overrides[id].systems,id,'kas',kmap,'kasGovde');}}
  for(const c of S.custom){fix(c.systems,c.id,'tendon',tmap,'tendonKalca');fix(c.systems,c.id,'kas',kmap,'kasGovde');}
}
export function applyState(d){
  S.start=d.start?dOnly(new Date(d.start)):dOnly(new Date());
  S.overrides=d.overrides||{};
  S.custom=(d.custom||[]).map(customFromJ);
  migrateTendon();
  S.reindex();
  S.active=new Set(d.active&&d.active.length?d.active:defaultActive());
  S.logs=d.logs||[];S.metrics=d.metrics||[];S.signals=d.signals||{};
  S.maxes=d.maxes||[];S.testInterval=d.testInterval||28;S.schedLog=d.schedLog||[];S.oneoff=d.oneoff||[];S.pain=d.pain||{};S.painLog=d.painLog||[];S.painAction=d.painAction||[];S.cfg=mergeCfg(d.cfg);
  S._updatedAt=d.updatedAt||Date.now();
}
export function load(){
  let raw=null; try{raw=localStorage.getItem(KEY);}catch(e){}
  if(!raw){let v1=null;try{v1=localStorage.getItem('antrenman_takip_v1');}catch(e){}
    if(v1){try{migrateV1(JSON.parse(v1));save();return;}catch(e){}}
    S.active=new Set(defaultActive());S.reindex();save();return;}
  try{applyState(JSON.parse(raw));}
  catch(e){S.active=new Set(defaultActive());S.reindex();}
}
export function migrateV1(d){
  S.start=d.start?dOnly(new Date(d.start)):dOnly(new Date());
  S.logs=d.logs||[];S.metrics=d.metrics||[];S.signals=d.signals||{};
  S.overrides={};S.maxes=[];S.testInterval=28;S.schedLog=[];S.oneoff=[];S.pain={};S.painLog=[];S.painAction=[];S.cfg=mergeCfg();
  S.custom=(d.custom||[]).map(j=>{const muscles={},systems={};for(const n of (j.m||[]))muscles[n]=1;for(const n of (j.s||[]))systems[n]=1;
    const t={sets:j.sets,v:j.v};return E(j.id,j.name,{pattern:j.pattern||'Özel',unit:j.unit,grp:'Özel',custom:true,muscles,systems,days:j.days,targets:[t,{...t},{...t},{...t}],rpe:j.rpe});});
  S.reindex();
  S.active=new Set(d.active&&d.active.length?d.active:defaultActive());
}
export function saveLocal(){try{localStorage.setItem(KEY,JSON.stringify(serialize()));}catch(e){}}
export function save(){if(!Cloud.applying)S._updatedAt=Date.now();saveLocal();if(!Cloud.applying)cloudPush();}
export function changed(){save();render();}
