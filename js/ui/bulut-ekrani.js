// Bulut senkron ekranı.
import {Cloud,cloudAuth,cloudByo,cloudConfigure,cloudForget,cloudGetCfg,cloudLibReady,cloudSignOut,cloudUsingEmbedded} from '../bulut.js';
import {HAS_EMBEDDED} from '../firebase-ayar.js';
import {U} from './durum-ui.js';
import {noteBox} from './html.js';
import {openSheet,overlay} from './overlay.js';
import {dm,esc,pad} from '../yardimcilar.js';

export function cloudStatusText(){
  if(!cloudLibReady()&&!cloudGetCfg())return 'Kapalı · GitHub Pages\'te aç';
  switch(Cloud.status){
    case 'synced':case 'syncing':return Cloud.user?('Açık · '+Cloud.user.email):'Bağlı';
    case 'signedout':return 'Bağlı · giriş yapılmadı';
    case 'noconfig':return 'Firebase bağlanmadı';
    case 'nolib':return 'Kütüphane yüklenmedi (önizlemede çalışmaz)';
    case 'error':return 'Hata';
    default:return 'Kapalı';
  }
}
export function cloudCfgFooter(){
  if(cloudUsingEmbedded())return `<div style="text-align:center;margin-top:14px"><button class="text" id="cadv" style="color:var(--onvar)">Gelişmiş: kendi Firebase projeni kullan</button></div>
    <div id="cadvbox" style="display:none;margin-top:8px">
      <label class="fld">Kendi Firebase config'in (bu cihazda geçerli olur)</label>
      <textarea id="ccfg" style="min-height:110px" placeholder='{ "apiKey": "...", "projectId": "..." }'></textarea>
      <div class="errmsg" id="cerr2" style="display:none"></div>
      <button class="fill block" id="csave" style="margin-top:8px">Bu projeyi kullan</button></div>`;
  if(cloudByo())return `<div style="text-align:center;margin-top:14px"><button class="text" id="cforget" style="color:var(--red)">${HAS_EMBEDDED?'Ortak projeye dön':'Firebase bağlantısını bu cihazdan kaldır'}</button></div>`;
  return '';
}
export function openCloud(){
  U.cloudOpen=true;
  const lib=cloudLibReady(),cfg=cloudGetCfg();
  let body='';
  if(!lib){
    body=noteBox('Firebase kütüphanesi bu ortamda yüklenemedi. Bu, claude.ai önizlemesinde ve çevrimdışıyken beklenen bir durum. Dosyayı GitHub Pages\'e yükleyip oradan açtığında bulut senkronu çalışır.',{color:'var(--orange)',icon:'⚠️'});
    if(cloudByo())body+=`<div style="text-align:center;margin-top:8px"><button class="text" id="cforget" style="color:var(--red)">${HAS_EMBEDDED?'Ortak projeye dön':'Firebase bağlantısını kaldır'}</button></div>`;
  } else if(!cfg){
    body=noteBox('Bulut senkronu için bir Firebase projesi gerekli. Kendi ücretsiz projenin config bilgisini yapıştır (bu bilgi gizli değildir; güvenlik Firestore kuralları ve girişinle sağlanır).',{icon:'☁️'})
      +`<label class="fld">Firebase config (konsoldan kopyaladığın nesne)</label>
        <textarea id="ccfg" style="min-height:120px" placeholder='{\n  "apiKey": "...",\n  "authDomain": "...",\n  "projectId": "...",\n  "appId": "..."\n}'></textarea>
        <div class="errmsg" id="cerr" style="display:${Cloud.err?'block':'none'}">${esc(Cloud.err)}</div>
        <div style="height:10px"></div><button class="fill block" id="csave">Firebase\'i bağla</button>`;
  } else if(!Cloud.user){
    body=noteBox('Cihazlar arası senkron için e-posta ve şifreyle giriş yap. İlk kez kullanıyorsan önce “Kayıt ol”. Verilerin yalnızca sana özel; kimse başkasının verisini göremez.',{icon:'🔐'})
      +`<label class="fld">E-posta</label><input type="text" id="cem" inputmode="email" autocomplete="username">
        <div style="height:10px"></div><label class="fld">Şifre (en az 6 karakter)</label><input type="text" id="cpw" autocomplete="current-password" style="-webkit-text-security:disc">
        <div class="errmsg" id="cerr" style="display:${Cloud.err?'block':'none'}">${esc(Cloud.err)}</div>
        <div style="display:flex;gap:8px;margin-top:12px"><button class="out" id="cin" style="flex:1">Giriş yap</button><button class="fill" id="cup" style="flex:1">Kayıt ol</button></div>`
      +cloudCfgFooter();
  } else {
    const ok=Cloud.status==='synced';
    body=`<div class="card tight" style="margin:0 0 10px"><div style="display:flex;align-items:center;gap:12px">
        <div style="font-size:24px">${ok?'✅':'🔄'}</div><div style="flex:1">
        <div style="font-weight:600">${ok?'Senkron açık':'Bağlanıyor…'}</div>
        <div class="muted small">${esc(Cloud.user.email)}${Cloud.lastSync?' · son eşitleme '+dm(new Date(Cloud.lastSync))+' '+pad(new Date(Cloud.lastSync).getHours())+':'+pad(new Date(Cloud.lastSync).getMinutes()):''}</div></div></div></div>`
      +noteBox('Bu cihazdaki her değişiklik otomatik buluta yazılır; aynı hesapla girdiğin diğer cihazlar anında güncellenir. Çakışmada en son kaydeden kazanır.',{color:'var(--green)',icon:'ℹ️'})
      +(Cloud.err?`<div class="errmsg">${esc(Cloud.err)}</div>`:'')
      +`<div style="margin-top:6px"><button class="out block" id="cout">Çıkış yap</button></div>`
      +cloudCfgFooter();
  }
  openSheet(`<div class="title-lg">☁️ Bulut senkron</div><div style="height:12px"></div>${body}`);
  const q=s=>overlay.querySelector(s);
  const showErr=()=>{const e=q('#cerr');if(e){e.textContent=Cloud.err;e.style.display=Cloud.err?'block':'none';}};
  const saveCfg=()=>{Cloud.err='';const box=q('#ccfg');if(cloudConfigure(box?box.value:'')){openCloud();}else{const e2=q('#cerr2')||q('#cerr');if(e2){e2.textContent=Cloud.err;e2.style.display='block';}}};
  if(q('#cadv'))q('#cadv').onclick=()=>{const b=q('#cadvbox');if(b)b.style.display=b.style.display==='none'?'block':'none';};
  if(q('#csave'))q('#csave').onclick=saveCfg;
  if(q('#cforget'))q('#cforget').onclick=()=>{if(confirm(HAS_EMBEDDED?'Bu cihazda ortak projeye dönülsün mü? Yerel verilerin silinmez.':'Firebase bağlantısı bu cihazdan kaldırılsın mı? Yerel verilerin silinmez.'))cloudForget();};
  if(q('#cin'))q('#cin').onclick=()=>{Cloud.err='';cloudAuth('in',q('#cem').value.trim(),q('#cpw').value,e=>{if(e){Cloud.err=e;showErr();}else openCloud();});};
  if(q('#cup'))q('#cup').onclick=()=>{Cloud.err='';cloudAuth('up',q('#cem').value.trim(),q('#cpw').value,e=>{if(e){Cloud.err=e;showErr();}else openCloud();});};
  if(q('#cout'))q('#cout').onclick=()=>{cloudSignOut();Cloud.err='';openCloud();};
}
