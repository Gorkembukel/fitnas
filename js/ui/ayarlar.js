// Ayarlar ve "Analiz ve kurallar" ekranı.
import {S,changed} from '../durum.js';
import {resetAll,resetCfg,resetToday,setCfg,setStart,setTestInterval} from '../eylemler.js';
import {weekNo} from '../mantik/program.js';
import {SINFO,S_ORDER,kDayShort,kIntervals} from '../sabitler.js';
import {cloudStatusText,openCloud} from './bulut-ekrani.js';
import {sec} from './html.js';
import {closeOverlay,openDialog,openSheet,overlay} from './overlay.js';
import {cycleTheme,themeLabel} from './tema.js';
import {dayKey,dm,esc,fmt} from '../yardimcilar.js';

/* ── settings sheet ── */
export function openSettings(){
  const sv=`${dm(S.start)}.${S.start.getFullYear()}`;
  openSheet(`<div style="padding:0 12px">
    <div style="display:flex;align-items:center;gap:16px;padding:12px 4px"><div style="font-size:22px">📆</div>
      <div style="flex:1"><div style="font-weight:500">Program başlangıcı</div><div class="muted small">${sv} · şu an hafta ${weekNo(new Date())}</div></div>
      <input type="date" id="sdate" value="${dayKey(S.start)}" style="width:auto"></div>
    <hr class="d">
    <div style="display:flex;align-items:center;gap:16px;padding:12px 4px"><div style="font-size:22px">⏱️</div>
      <div style="flex:1"><div style="font-weight:500">Max test aralığı</div><div class="muted small">Rekorları ne sıklıkla yeniden test edersin</div></div>
      <select id="sint" style="width:auto">${kIntervals.map(o=>`<option value="${o}" ${S.testInterval===o?'selected':''}>${o} gün</option>`).join('')}</select></div>
    <hr class="d">
    <div style="display:flex;align-items:center;gap:16px;padding:12px 4px;cursor:pointer" id="scloud"><div style="font-size:22px">☁️</div>
      <div style="flex:1"><div style="font-weight:500">Bulut senkron</div><div class="muted small">${cloudStatusText()}</div></div>
      <span style="font-size:20px">›</span></div>
    <hr class="d">
    <div style="display:flex;align-items:center;gap:16px;padding:12px 4px;cursor:pointer" id="scfg"><div style="font-size:22px">🎛️</div>
      <div style="flex:1"><div style="font-weight:500">Analiz ve kurallar</div><div class="muted small">Toparlanma, eşikler, öneri ve denge hesabının tüm sabitleri</div></div>
      <span style="font-size:20px">›</span></div>
    <hr class="d">
    <div style="display:flex;align-items:center;gap:16px;padding:12px 4px;cursor:pointer" id="stheme"><div style="font-size:22px">🌓</div>
      <div style="flex:1"><div style="font-weight:500">Tema</div><div class="muted small">Sistem / Açık / Koyu</div></div>
      <span class="chip sel" id="sthemev">${themeLabel()}</span></div>
    <hr class="d">
    <div style="display:flex;align-items:center;gap:16px;padding:12px 4px;cursor:pointer" id="stoday"><div style="font-size:22px">↺</div>
      <div style="flex:1"><div style="font-weight:500">Bugünü sıfırla</div><div class="muted small">Sadece bugünkü set kayıtları ve işaretler silinir</div></div></div>
    <hr class="d">
    <div style="display:flex;align-items:center;gap:16px;padding:12px 4px;cursor:pointer" id="sreset"><div style="font-size:22px">🗑️</div>
      <div style="flex:1"><div style="font-weight:500">Tüm verileri sıfırla</div><div class="muted small">Kayıtlar, ölçümler, rekorlar, özel/düzenlenmiş egzersizler silinir</div></div></div>
  </div>`);
  overlay.querySelector('#stoday').onclick=()=>{
    openDialog(`<div class="title-md">Bugünkü veriler sıfırlansın mı?</div><div class="muted small" style="margin-top:8px">Bugün kaydettiğin setler ve sertlik/ağrı işaretleri silinir. Program, geçmiş, rekorlar ve ölçümler etkilenmez.</div>
      <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:18px"><button class="text" data-close>Vazgeç</button><button class="fill" id="tdo">Bugünü sıfırla</button></div>`);
    overlay.querySelector('#tdo').onclick=()=>{resetToday();closeOverlay();};};
  overlay.querySelector('#sdate').onchange=ev=>{if(ev.target.value){setStart(new Date(ev.target.value+'T00:00:00'));closeOverlay();}};
  overlay.querySelector('#sint').onchange=ev=>setTestInterval(+ev.target.value);
  overlay.querySelector('#stheme').onclick=()=>{cycleTheme();overlay.querySelector('#sthemev').textContent=themeLabel();};
  overlay.querySelector('#scloud').onclick=()=>openCloud();
  overlay.querySelector('#scfg').onclick=()=>openConfig();
  overlay.querySelector('#sreset').onclick=()=>{
    openDialog(`<div class="title-md">Tüm veriler silinsin mi?</div><div class="muted small" style="margin-top:8px">Bu işlem geri alınamaz.</div>
      <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:18px"><button class="text" data-close>Vazgeç</button><button class="fill" id="rdo">Sil</button></div>`);
    overlay.querySelector('#rdo').onclick=()=>{resetAll();closeOverlay();};};
}
export function openConfig(){
  const c=S.cfg;
  const num=(label,id,val,step)=>`<div style="display:flex;align-items:center;gap:10px;padding:5px 0"><div style="flex:1;font-size:13.5px">${label}</div><input type="number" inputmode="decimal" id="${id}" value="${fmt(val)}" step="${step||1}" style="width:84px;text-align:center;padding:8px"></div>`;
  let sys='';for(const s of S_ORDER)sys+=num(SINFO[s].icon+' '+esc(SINFO[s].label),'cf_rec_'+s,c.recovery[s],6);
  const dayChips=[1,2,3,4,5,6,7].map(d=>`<button type="button" class="chip ${c.halfDays.includes(d)?'sel':''}" data-hd="${d}">${kDayShort[d-1]}</button>`).join('');
  openSheet(`<div style="display:flex;align-items:center;gap:8px"><div class="title-lg" style="flex:1">🎛️ Analiz ve kurallar</div><button class="text" id="cfgreset">Varsayılan</button></div>
   <div class="muted small" style="margin:6px 0 2px">Öneri, denge ve toparlanma hesaplarının tamamı bu değerlere göre çalışır. Değişiklikler anında uygulanır ve buluta eşitlenir.</div>
   ${sec('Toparlanma süreleri (saat)','Sistemin toparlanma tabanı ve aşırı-yüklenme eşiği. Her egzersizin kendi iyileşme süresi editörde ayarlanır; boşsa sistemlerinden türetilir.')}${sys}
   ${num('Aşırı yüklenme eşiği çarpanı (eşik = sistem saati × çarpan)','cf_overloadMult',c.overloadMult,0.1)}
   ${num('Set katkısı (her set → iyileşme süresi × bu oran)','cf_setContrib',c.setContrib,0.05)}
   ${sec('Yük eşikleri (haftalık ağırlıklı set)')}
   ${num('“Açıkta”: bu değerin altı','cf_openBelow',c.openBelow,0.5)}
   ${num('“Düşük”: bu değerin altı','cf_lowBelow',c.lowBelow,1)}
   ${num('Analiz penceresi (gün)','cf_window',c.window,1)}
   ${sec('Öneri (boşluk) puanlama')}
   <div class="swrow"><label class="sw"><input type="checkbox" id="cf_gapAux" ${c.gapAux?'checked':''}><span class="tr"></span><span class="kn"></span></label><div>Yardımcı (0,5) katkıları da hesaba kat</div></div>
   ${num('Açıkta kalan hedefe puan','cf_gapOpen',c.gapOpen,1)}
   ${num('Düşük kalan hedefe puan','cf_gapLow',c.gapLow,1)}
   ${sec('Kalıp dengesi')}
   ${num('Dengesizlik oranı (küçük taraf < oran × büyük)','cf_balanceRatio',c.balanceRatio,0.05)}
   ${sec('Toparlanma modeli','RPE değerine göre süre çarpanı — 1 = tam toparlanma süresi')}
   ${num('RPE 8+ çarpanı','cf_rpe_f8',c.rpe.f8,0.05)}
   ${num('RPE 7 çarpanı','cf_rpe_f7',c.rpe.f7,0.05)}
   ${num('RPE 6 çarpanı','cf_rpe_f6',c.rpe.f6,0.05)}
   ${num('RPE 5 çarpanı','cf_rpe_f5',c.rpe.f5,0.05)}
   ${num('RPE 4 ve altı çarpanı','cf_rpe_f0',c.rpe.f0,0.05)}
   ${num('Darbe min çarpanı (tendon/kemik/reaktif)','cf_impactFactor',c.impactFactor,0.05)}
   ${num('Geriye bakış penceresi (saat)','cf_lookbackHours',c.lookbackHours,12)}
   ${sec('Diğer')}
   ${num('Ardışık gün uyarısı eşiği (saat)','cf_spaceMinHours',c.spaceMinHours,6)}
   ${num('GtG eşiği: RPE bu ve altı sık yayılabilir','cf_gtgRpe',c.gtgRpe,1)}
   <div style="font-size:12.5px;color:var(--onvar);margin:10px 2px 4px">Yarım hacim günleri — “Çar/Paz yarım hacim” açık egzersizlerde set yarıya iner</div>
   <div class="chipwrap" id="cf_halfDays">${dayChips}</div>
   ${sec('Ağrı / durum','Ağrı derecesi (1 hafif, 2 orta, 3 şiddetli) hangi aksiyona yol açar ve toparlanmaya kaç saat ekler')}
   ${num('Yarım yük eşiği (bu derece ve üstü)','cf_painHalfLevel',c.painHalfLevel,1)}
   ${num('Pasif (atla) eşiği (bu derece ve üstü)','cf_painSkipLevel',c.painSkipLevel,1)}
   ${num('Hafif (1) → toparlanmaya + saat','cf_painStrain1',c.painStrain[1],6)}
   ${num('Orta (2) → toparlanmaya + saat','cf_painStrain2',c.painStrain[2],6)}
   ${num('Şiddetli (3) → toparlanmaya + saat','cf_painStrain3',c.painStrain[3],6)}
   <div style="height:16px"></div>`);
  const nmap={cf_openBelow:'openBelow',cf_lowBelow:'lowBelow',cf_window:'window',cf_gapOpen:'gapOpen',cf_gapLow:'gapLow',cf_balanceRatio:'balanceRatio',cf_impactFactor:'impactFactor',cf_lookbackHours:'lookbackHours',cf_overloadMult:'overloadMult',cf_setContrib:'setContrib',cf_spaceMinHours:'spaceMinHours',cf_gtgRpe:'gtgRpe',cf_painHalfLevel:'painHalfLevel',cf_painSkipLevel:'painSkipLevel',cf_painStrain1:'painStrain.1',cf_painStrain2:'painStrain.2',cf_painStrain3:'painStrain.3',cf_rpe_f8:'rpe.f8',cf_rpe_f7:'rpe.f7',cf_rpe_f6:'rpe.f6',cf_rpe_f5:'rpe.f5',cf_rpe_f0:'rpe.f0'};
  for(const id in nmap){const el=overlay.querySelector('#'+id);if(el)el.onchange=()=>{const v=parseFloat((el.value||'').replace(',','.'));if(!isNaN(v))setCfg(nmap[id],v);};}
  for(const s of S_ORDER){const el=overlay.querySelector('#cf_rec_'+s);if(el)el.onchange=()=>{const v=parseFloat(el.value);if(!isNaN(v)&&v>0)setCfg('recovery.'+s,v);};}
  const ga=overlay.querySelector('#cf_gapAux');if(ga)ga.onchange=()=>{S.cfg.gapAux=ga.checked;changed();};
  overlay.querySelectorAll('#cf_halfDays [data-hd]').forEach(b=>b.onclick=()=>{const d=+b.dataset.hd,i=S.cfg.halfDays.indexOf(d);if(i>=0)S.cfg.halfDays.splice(i,1);else S.cfg.halfDays.push(d);b.classList.toggle('sel');changed();});
  overlay.querySelector('#cfgreset').onclick=()=>{resetCfg();openConfig();};
}
