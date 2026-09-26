// "Yeni egzersiz oluştur" mekanizmasıyla (bkz. /yeni-egzersiz skill'i) eklenen yerleşik egzersizler.
// katalog.js'teki elle yazılmış temel listeden bilinçli olarak ayrı tutulur: hepsi burada durur.
// Format katalog.js'teki E(id,name,opts) çağrısıyla birebir aynıdır; targets alanı T() ile
// [[set,değer],...] (Hafta1,Hafta2,Hafta3,Deload) biçiminde verilir.
// Bağımlılık döngüsü olmasın diye E/T burada import edilmez; katalog.js çağırırken parametre geçer.
export function yeniEgzersizler(E,T){
  return [
    // E('ornekId','Örnek egzersiz adı',{pattern:'Yatay itme',muscles:{gogus:1,triseps:.5},systems:{sinir:1,kasItme:.5},
    //   days:[1,4],targets:T([[3,10],[3,10],[3,11],[2,9]]),rpe:6,note:'...'}),
  ];
}
