// Sekmeler ve ana çizim.
import {renderToday} from '../sayfalar/bugun.js';
import {renderBalance} from '../sayfalar/denge.js';
import {renderProgress} from '../sayfalar/ozet.js';
import {renderLibrary} from '../sayfalar/program.js';
import {renderMax} from '../sayfalar/rekor.js';
import {U} from './durum-ui.js';

/* ══════════════ RENDER + NAV ══════════════ */
export const TABS=['Bugün','Denge','Özet','Rekor','Program'];
export const NAVIC=['📅','🎯','📊','🏅','🗓️'];
export const PAGES=[renderToday,renderBalance,renderProgress,renderMax,renderLibrary];
export function render(){
  document.getElementById('apptitle').textContent=TABS[U.tab];
  document.getElementById('content').innerHTML=PAGES[U.tab]();
  let nv='';for(let i=0;i<TABS.length;i++)nv+=`<button class="${i===U.tab?'on':''}" data-nav="${i}"><span class="ic">${NAVIC[i]}</span>${TABS[i]}</button>`;
  document.getElementById('nav').innerHTML=nv;
  document.getElementById('content').scrollTop=window._sc||0;
}
