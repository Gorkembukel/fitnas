// Modüller arasında paylaşılan, yeniden atanan UI durumu (kalıcı değildir, kaydedilmez).
export const U={
  tab:0,            // aktif alt sekme
  spreadOn:false,   // Bugün: güne yayılmış sıra
  balMode:0,        // Denge: 0 Analiz, 1 Durum
  progMode:0,panelMonth:null,calMonth:null, // Özet: segment ve ay gezinmesi
  libMode:0,filterS:null,filterM:null,      // Program: segment ve filtreler
  timerInt:null,    // zamanlayıcı / metronom setInterval
  cloudOpen:false,  // bulut ekranı açık mı
};
