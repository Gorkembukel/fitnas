// Alt sayfa (sheet), diyalog ve toast.
import {U} from './durum-ui.js';
import {esc} from '../yardimcilar.js';

/* ══════════════ SHEET / DIALOG ══════════════ */
export const overlay=document.getElementById('overlay');
export function openSheet(html){overlay.innerHTML=`<div class="scrim" data-close></div><div class="sheet"><div class="grab"></div>${html}</div>`;overlay.classList.add('show');}
export function openDialog(html){overlay.innerHTML=`<div class="scrim" data-close></div><div class="dialog">${html}</div>`;overlay.classList.add('show');}
export function closeOverlay(){overlay.classList.remove('show');overlay.innerHTML='';U.cloudOpen=false;if(U.timerInt){clearInterval(U.timerInt);U.timerInt=null;}}
/* ── toast ── */
export const toastEl=document.getElementById('toast');let toastT=null;
export function showToast(msg,undo){toastEl.innerHTML=`<span>${esc(msg)}</span>`+(undo?`<button id="tu">Geri al</button>`:'');
  toastEl.classList.add('show');if(undo)document.getElementById('tu').onclick=()=>{undo();hideToast();};
  clearTimeout(toastT);toastT=setTimeout(hideToast,3000);}
export function hideToast(){toastEl.classList.remove('show');}
