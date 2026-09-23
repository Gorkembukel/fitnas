/* ╔══════════════════════════════════════════════════════════════╗
   ║  FIREBASE — TEK ORTAK PROJE (buraya kendi config'ini yapıştır)  ║
   ║  Firebase Console → Proje Ayarları → Web uygulaması → SDK       ║
   ║  Doldurunca siteye giren herkes yalnızca e-posta ile giriş/kayıt║
   ║  yapar; config sormaz. Boş bırakırsan uygulama "kendi config'ini║
   ║  yapıştır" akışına düşer (hiçbir şey kırılmaz).                 ║
   ╚══════════════════════════════════════════════════════════════╝ */
export const EMBEDDED_FB_CONFIG={
  apiKey:"",
  authDomain:"",
  projectId:"",
  storageBucket:"",
  messagingSenderId:"",
  appId:""
};
export const HAS_EMBEDDED=!!(EMBEDDED_FB_CONFIG&&EMBEDDED_FB_CONFIG.apiKey&&EMBEDDED_FB_CONFIG.projectId);
