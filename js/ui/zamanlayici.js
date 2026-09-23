// Saniye zamanlayıcısı ve tempo metronomu (Web Audio).
import {addLog,undoLast} from '../eylemler.js';
import {U} from './durum-ui.js';
import {openSheet,overlay,showToast} from './overlay.js';
import {esc} from '../yardimcilar.js';

export let soundOn=true,audioCtx=null,metroTickOn=true,metroEndVolIdx=2;
export const METRO_END_VOLS=[0,0.15,0.3,0.5],METRO_END_LBL=['Kapalı','Kısık','Normal','Yüksek'];
export function ensureAudio(){try{if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();}catch(e){}}
export function beep(freq,dur,vol){try{ensureAudio();if(!audioCtx)return;const t=audioCtx.currentTime;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=freq||660;g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol||0.2,t+0.005);g.gain.exponentialRampToValueAtTime(0.0001,t+(dur||0.08));o.connect(g).connect(audioCtx.destination);o.start(t);o.stop(t+(dur||0.08)+0.02);}catch(e){}}
export function vibrate(ms){try{if(navigator&&navigator.vibrate)navigator.vibrate(ms);}catch(e){}}
export function openTimer(e,secs){
  secs=Math.max(1,Math.round(secs||1));let rem=secs,running=false;
  openSheet(`<div class="title-lg" style="text-align:center">${esc(e.name)}</div>
    <div class="muted small" style="text-align:center;margin-top:2px">Hedef ${secs} sn · her saniye bip, bitince uzun bip ve titreşim</div>
    <div id="tmv" style="font-size:66px;font-weight:600;text-align:center;margin:16px 0;font-variant-numeric:tabular-nums">${secs}</div>
    <div style="display:flex;gap:12px;justify-content:center;align-items:center">
      <button class="roundbtn" id="tmreset" title="Sıfırla">⟲</button>
      <button class="fill" id="tmtoggle" style="min-width:140px">▶ Başlat</button>
      <button class="roundbtn" id="tmsound" title="Ses aç/kapa">${soundOn?'🔊':'🔇'}</button></div>
    <div id="tmmsg" class="muted small" style="text-align:center;margin-top:12px">&nbsp;</div>`);
  const tg=overlay.querySelector('#tmtoggle'),msg=overlay.querySelector('#tmmsg');
  const upd=()=>{const el=overlay.querySelector('#tmv');if(el)el.textContent=rem;};
  const stop=()=>{running=false;if(U.timerInt){clearInterval(U.timerInt);U.timerInt=null;}if(tg)tg.textContent=rem<secs&&rem>0?'▶ Devam':'▶ Başlat';};
  const finish=()=>{if(U.timerInt){clearInterval(U.timerInt);U.timerInt=null;}running=false;const el=overlay.querySelector('#tmv');if(el)el.textContent='0';if(soundOn)beep(1200,0.32,0.28);vibrate([120,60,120]);addLog(e.id,secs,e.rpe);if(msg)msg.textContent='✓ Set kaydedildi';if(tg)tg.textContent='▶ Tekrar';rem=secs;setTimeout(upd,700);showToast(`${e.name}: ${secs} sn kaydedildi`,()=>undoLast(e.id));};
  const tick=()=>{rem--;if(rem<=0){finish();return;}if(soundOn)beep(rem<=3?960:660,0.06,0.2);upd();};
  const start=()=>{if(rem<=0)rem=secs;running=true;if(tg)tg.textContent='⏸ Duraklat';ensureAudio();if(soundOn)beep(660,0.06,0.2);if(msg)msg.textContent='\u00a0';if(U.timerInt)clearInterval(U.timerInt);U.timerInt=setInterval(tick,1000);upd();};
  tg.onclick=()=>{running?stop():start();};
  overlay.querySelector('#tmreset').onclick=()=>{stop();rem=secs;upd();if(tg)tg.textContent='▶ Başlat';if(msg)msg.textContent='\u00a0';};
  const sBtn=overlay.querySelector('#tmsound');sBtn.onclick=()=>{soundOn=!soundOn;sBtn.textContent=soundOn?'🔊':'🔇';if(soundOn){ensureAudio();beep(880,0.06,0.2);}};
}
export function tempoArr(e){return String(e.tempo||'').split('-').map(x=>parseInt(x,10)).filter(x=>!isNaN(x)&&x>=0);}
export const PHASE_NAMES=['İniş','Alt bekleme','Çıkış','Üst bekleme'];
export function phaseName(i,n){return (n<=4&&PHASE_NAMES[i])?PHASE_NAMES[i]:'Faz '+(i+1);}
export function metroFinishSound(){const v=METRO_END_VOLS[metroEndVolIdx];if(v<=0)return;ensureAudio();beep(784,0.14,v);setTimeout(()=>beep(1047,0.2,v),150);setTimeout(()=>beep(1319,0.24,v),340);}
export function openMetro(e,reps){
  const cad=tempoArr(e).filter((d,i,a)=>true);let ph=cad.filter(d=>d>0).length?cad:[2,0,2,0];
  reps=Math.max(1,Math.round(reps||1));
  const seq=[];for(let r=0;r<reps;r++)ph.forEach((d,pi)=>{for(let s=0;s<d;s++)seq.push({accent:s===0,phase:pi,rep:r});});
  const N=seq.length,nph=ph.length;let i=0,running=false;
  const cadTxt=ph.join('-');
  openSheet(`<div class="title-lg" style="text-align:center">${esc(e.name)}</div>
    <div class="muted small" style="text-align:center;margin-top:2px">Tempo ${cadTxt} sn · ${reps} tekrar · faz başında vurgulu tık</div>
    <div id="mph" style="font-size:30px;font-weight:600;text-align:center;margin:14px 0 2px">Hazır</div>
    <div id="mrep" class="muted" style="text-align:center">Tekrar 0/${reps}</div>
    <div style="display:flex;gap:12px;justify-content:center;align-items:center;margin-top:16px">
      <button class="roundbtn" id="mreset" title="Sıfırla">⟲</button>
      <button class="fill" id="mtoggle" style="min-width:140px">▶ Başlat</button></div>
    <div style="display:flex;gap:10px;justify-content:center;margin-top:14px">
      <button class="out" id="mtick">${metroTickOn?'🔊':'🔇'} Tık sesi</button>
      <button class="out" id="mend">🏁 Bitiş: ${METRO_END_LBL[metroEndVolIdx]}</button></div>
    <div id="mmsg" class="muted small" style="text-align:center;margin-top:12px">&nbsp;</div>`);
  const tgl=overlay.querySelector('#mtoggle'),msg=overlay.querySelector('#mmsg');
  const showPh=()=>{const it=seq[Math.min(i,N-1)];const p=overlay.querySelector('#mph'),rp=overlay.querySelector('#mrep');
    if(p)p.textContent=it?phaseName(it.phase,nph):'—';if(rp)rp.textContent=`Tekrar ${it?it.rep+1:reps}/${reps}`;};
  const playTick=(it)=>{if(!metroTickOn)return;ensureAudio();beep(it.accent?960:620,it.accent?0.07:0.05,0.2);};
  const stop=()=>{running=false;if(U.timerInt){clearInterval(U.timerInt);U.timerInt=null;}if(tgl)tgl.textContent=i>0&&i<N?'▶ Devam':'▶ Başlat';};
  const finish=()=>{if(U.timerInt){clearInterval(U.timerInt);U.timerInt=null;}running=false;metroFinishSound();vibrate([140,70,140]);addLog(e.id,reps,e.rpe);if(msg)msg.textContent='✓ Set kaydedildi';if(tgl)tgl.textContent='▶ Tekrar';i=0;const p=overlay.querySelector('#mph');if(p)p.textContent='Bitti 🎉';showToast(`${e.name}: ${reps} tekrar (tempo) kaydedildi`,()=>undoLast(e.id));};
  const step=()=>{i++;if(i>=N){finish();return;}playTick(seq[i]);showPh();};
  const start=()=>{if(i>=N)i=0;running=true;if(tgl)tgl.textContent='⏸ Duraklat';if(msg)msg.textContent='\u00a0';ensureAudio();playTick(seq[i]);showPh();if(U.timerInt)clearInterval(U.timerInt);U.timerInt=setInterval(step,1000);};
  tgl.onclick=()=>{running?stop():start();};
  overlay.querySelector('#mreset').onclick=()=>{stop();i=0;if(tgl)tgl.textContent='▶ Başlat';const p=overlay.querySelector('#mph');if(p)p.textContent='Hazır';const rp=overlay.querySelector('#mrep');if(rp)rp.textContent=`Tekrar 0/${reps}`;if(msg)msg.textContent='\u00a0';};
  const tk=overlay.querySelector('#mtick');tk.onclick=()=>{metroTickOn=!metroTickOn;tk.textContent=(metroTickOn?'🔊':'🔇')+' Tık sesi';if(metroTickOn){ensureAudio();beep(880,0.06,0.2);}};
  const en=overlay.querySelector('#mend');en.onclick=()=>{metroEndVolIdx=(metroEndVolIdx+1)%METRO_END_VOLS.length;en.textContent='🏁 Bitiş: '+METRO_END_LBL[metroEndVolIdx];if(METRO_END_VOLS[metroEndVolIdx]>0){ensureAudio();beep(1047,0.14,METRO_END_VOLS[metroEndVolIdx]);}};
}
