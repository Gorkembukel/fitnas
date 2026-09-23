// Olay delegasyonu: data-act / data-nav tıklamaları.
import {S} from './durum.js';
import {addDay,addLog,addOneoff,removeCustom,removeDay,removeOneoff,resetExercise,resetToday,setCfg,setPain,setPainAction,toggleActive,toggleSignal,undoLast} from './eylemler.js';
import {oneoffTarget,target} from './mantik/program.js';
import {openLog,openPainMenu} from './sayfalar/bugun.js';
import {openGroupDetail} from './sayfalar/denge.js';
import {openDay,openMetric} from './sayfalar/ozet.js';
import {openDayPicker,openOneoffPicker} from './sayfalar/program.js';
import {openCalibInput,openInterval,openMax} from './sayfalar/rekor.js';
import {openSettings} from './ui/ayarlar.js';
import {U} from './ui/durum-ui.js';
import {openEditor} from './ui/editor.js';
import {closeOverlay,openDialog,overlay,showToast} from './ui/overlay.js';
import {render} from './ui/render.js';
import {openMetro,openTimer} from './ui/zamanlayici.js';
import {addMonths,dOnly,dayKey,fmt,monthStart} from './yardimcilar.js';

/* ══════════════ OLAYLAR ══════════════ */
document.body.addEventListener('click',ev=>{
  const el=ev.target.closest('[data-nav],[data-act]');if(!el)return;
  if(el.dataset.nav!==undefined){window._sc=0;U.tab=+el.dataset.nav;render();return;}
  const act=el.dataset.act,id=el.dataset.id;window._sc=document.getElementById('content').scrollTop;
  switch(act){
    case 'settings':openSettings();break;
    case 'resettoday':openDialog(`<div class="title-md">Bugünkü veriler sıfırlansın mı?</div><div class="muted small" style="margin-top:8px">Bugün kaydettiğin setler ve işaretler silinir. Program, geçmiş, rekorlar ve ölçümler etkilenmez.</div><div style="display:flex;justify-content:flex-end;gap:6px;margin-top:18px"><button class="text" data-close>Vazgeç</button><button class="fill" id="tdo2">Bugünü sıfırla</button></div>`);overlay.querySelector('#tdo2').onclick=()=>{resetToday();closeOverlay();};break;
    case 'sig':toggleSignal(dayKey(dOnly(new Date())),el.dataset.area);break;
    case 'addset':{const e=S.ex(id),t=target(e,dOnly(new Date()))||oneoffTarget(e,dOnly(new Date()));addLog(id,t.v,e.rpe);showToast(`${e.name}: ${fmt(t.v)} ${e.unit} kaydedildi`,()=>undoLast(id));break;}
    case 'undoset':{undoLast(id);const e=S.ex(id);showToast(`${e?e.name:'Set'}: son set geri alındı`);break;}
    case 'timer':{const e=S.ex(id),t=target(e,dOnly(new Date()))||oneoffTarget(e,dOnly(new Date()));openTimer(e,t.v);break;}
    case 'metro':{const e=S.ex(id),t=target(e,dOnly(new Date()))||oneoffTarget(e,dOnly(new Date()));openMetro(e,t.v);break;}
    case 'spread':U.spreadOn=!U.spreadOn;render();break;
    case 'addoneoff':openOneoffPicker();break;
    case 'painmenu':openPainMenu(S.ex(id));break;
    case 'setpain':setPainAction(id,el.dataset.mode);closeOverlay();break;
    case 'balmode':U.balMode=+el.dataset.v;render();break;
    case 'groupdetail':openGroupDetail(+el.dataset.g);break;
    case 'setpainlvl':setPain(el.dataset.sys,+el.dataset.lvl);break;
    case 'rmoneoff':removeOneoff(id,dayKey(dOnly(new Date())));break;
    case 'pickoneoff':addOneoff(id,dayKey(dOnly(new Date())));openOneoffPicker();break;
    case 'log':{const e=S.ex(id),t=target(e,dOnly(new Date()))||oneoffTarget(e,dOnly(new Date()));openLog(e,t.v);break;}
    case 'metric':openMetric();break;
    case 'progmode':U.progMode=+el.dataset.v;render();break;
    case 'panelprev':U.panelMonth=addMonths(U.panelMonth||monthStart(new Date()),-1);render();break;
    case 'panelnext':U.panelMonth=addMonths(U.panelMonth||monthStart(new Date()),1);render();break;
    case 'calprev':U.calMonth=addMonths(U.calMonth||monthStart(new Date()),-1);render();break;
    case 'calnext':U.calMonth=addMonths(U.calMonth||monthStart(new Date()),1);render();break;
    case 'dayopen':openDay(el.dataset.date);break;
    case 'addmax':openMax(null);break;
    case 'retest':openMax(id);break;
    case 'interval':openInterval();break;
    case 'calibopen':openCalibInput(id,+el.dataset.t);break;
    case 'calibapply':setCfg('recovery.'+el.dataset.s,+el.dataset.v);closeOverlay();showToast('Toparlanma süresi güncellendi');break;
    case 'libmode':U.libMode=+el.dataset.v;render();break;
    case 'addday':openDayPicker(+el.dataset.d);break;
    case 'rmday':removeDay(id,+el.dataset.d);break;
    case 'pickday':addDay(id,+el.dataset.d);openDayPicker(+el.dataset.d);break;
    case 'fs':U.filterS=el.dataset.v||null;render();break;
    case 'fm':U.filterM=el.dataset.v||null;render();break;
    case 'toggle':toggleActive(id);break;
    case 'delcustom':removeCustom(id);break;
    case 'addcustom':openEditor(null);break;
    case 'edit':openEditor(id);break;
    case 'resetex':resetExercise(id);break;
  }
});
document.body.addEventListener('change',ev=>{const el=ev.target.closest('[data-act="toggle-sw"]');
  if(el){window._sc=document.getElementById('content').scrollTop;toggleActive(el.dataset.id);}});
overlay.addEventListener('click',ev=>{if(ev.target.dataset.close!==undefined)closeOverlay();});
