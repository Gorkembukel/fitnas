// Firebase bulut senkronu (opsiyonel katman; localStorage asıl kaynaktır).
import {S,applyState,saveLocal,serialize} from './durum.js';
import {EMBEDDED_FB_CONFIG,HAS_EMBEDDED} from './firebase-ayar.js';
import {openCloud} from './ui/bulut-ekrani.js';
import {U} from './ui/durum-ui.js';
import {overlay} from './ui/overlay.js';
import {render} from './ui/render.js';

/* ══════════════ BULUT SENKRON (Firebase) ══════════════ */
export const CFGKEY='fb_config';
export const Cloud={cfg:null,app:null,auth:null,db:null,user:null,unsub:null,applying:false,status:'off',err:'',pushT:null,lastSync:0};
export function cloudByo(){try{const s=localStorage.getItem(CFGKEY);if(s)return JSON.parse(s);}catch(e){}return null;}
export function cloudGetCfg(){const byo=cloudByo();if(byo)return byo;if(HAS_EMBEDDED)return EMBEDDED_FB_CONFIG;return null;}
export function cloudUsingEmbedded(){return HAS_EMBEDDED&&!cloudByo();}
export function cloudLibReady(){return typeof window!=='undefined'&&window.firebase&&firebase.auth&&firebase.firestore;}
export function parseCfg(txt){let s=(txt||'').trim();const a=s.indexOf('{'),b=s.lastIndexOf('}');if(a>=0&&b>a)s=s.slice(a,b+1);
  try{return JSON.parse(s);}catch(e){}try{return Function('return ('+s+')')();}catch(e){}return null;}
export function cloudInit(){
  const cfg=cloudGetCfg();
  if(!cfg){Cloud.status='noconfig';return;}
  if(!cloudLibReady()){Cloud.status='nolib';return;}
  if(Cloud.app){return;}
  try{
    Cloud.app=firebase.initializeApp(cfg);
    Cloud.auth=firebase.auth();Cloud.db=firebase.firestore();
    Cloud.status='signedout';
    Cloud.auth.onAuthStateChanged(u=>{
      Cloud.user=u;
      if(Cloud.unsub){Cloud.unsub();Cloud.unsub=null;}
      if(u){Cloud.status='syncing';cloudSubscribe();}
      else{Cloud.status='signedout';}
      renderIfSettings();
    });
  }catch(e){Cloud.status='error';Cloud.err=e.message;}
}
export function cloudSubscribe(){
  if(!Cloud.user)return;
  const ref=Cloud.db.collection('users').doc(Cloud.user.uid);
  Cloud.unsub=ref.onSnapshot(snap=>{
    if(!snap.exists){cloudPush(true);Cloud.status='synced';renderIfSettings();return;}
    const d=snap.data();
    if(d&&typeof d.updatedAt==='number'&&d.updatedAt>(S._updatedAt||0)){
      Cloud.applying=true;
      try{applyState(d);saveLocal();render();}catch(e){}
      Cloud.applying=false;
    }
    Cloud.status='synced';Cloud.lastSync=Date.now();renderIfSettings();
  },err=>{Cloud.status='error';Cloud.err=err.message;renderIfSettings();});
}
export function cloudPush(immediate){
  if(!Cloud.user||!Cloud.db||Cloud.applying)return;
  clearTimeout(Cloud.pushT);
  const doPush=()=>{try{Cloud.db.collection('users').doc(Cloud.user.uid).set(serialize())
    .then(()=>{Cloud.lastSync=Date.now();}).catch(e=>{Cloud.status='error';Cloud.err=e.message;renderIfSettings();});}catch(e){}};
  if(immediate)doPush();else Cloud.pushT=setTimeout(doPush,900);
}
export function cloudConfigure(txt){const cfg=parseCfg(txt);
  if(!cfg||!cfg.apiKey||!cfg.projectId){Cloud.err='Config okunamadı. apiKey ve projectId içeren nesneyi yapıştır.';return false;}
  try{localStorage.setItem(CFGKEY,JSON.stringify(cfg));}catch(e){}
  location.reload();return true;}
export function cloudForget(){try{localStorage.removeItem(CFGKEY);}catch(e){}location.reload();}
export function cloudAuth(mode,email,pw,cb){
  if(!Cloud.auth){cb('Önce Firebase bağlanmalı');return;}
  const p=mode==='up'?Cloud.auth.createUserWithEmailAndPassword(email,pw):Cloud.auth.signInWithEmailAndPassword(email,pw);
  p.then(()=>cb(null)).catch(e=>cb(fbErr(e)));
}
export function cloudSignOut(){if(Cloud.auth)Cloud.auth.signOut();}
export function fbErr(e){const c=(e&&e.code)||'';
  if(c.includes('email-already-in-use'))return 'Bu e-posta zaten kayıtlı. Giriş yap.';
  if(c.includes('invalid-email'))return 'Geçersiz e-posta.';
  if(c.includes('weak-password'))return 'Şifre en az 6 karakter olmalı.';
  if(c.includes('wrong-password')||c.includes('invalid-credential'))return 'E-posta veya şifre hatalı.';
  if(c.includes('user-not-found'))return 'Kullanıcı bulunamadı. Önce kayıt ol.';
  if(c.includes('network'))return 'Ağ hatası. İnternet bağlantısını kontrol et.';
  if(c.includes('operation-not-allowed'))return 'Firebase konsolunda E-posta/Şifre girişini etkinleştir.';
  if(c.includes('unauthorized-domain')||c.includes('auth/unauthorized-domain'))return 'Bu alan adı Firebase Authentication → Ayarlar → Yetkili alan adlarına eklenmemiş.';
  return (e&&e.message)||'Hata';}
export function renderIfSettings(){if(U.cloudOpen&&overlay.classList.contains('show'))openCloud();}
