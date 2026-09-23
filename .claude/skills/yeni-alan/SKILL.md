---
name: yeni-alan
description: Kalıcı yeni bir state alanı (S.xxx) ya da yeni ayarlanabilir sabit (S.cfg.xxx) eklerken izlenecek kontrol listesi. Kayıt/senkron sözleşmesini (S, serialize, applyState, migrateV1, resetAll, CFG_DEFAULT, mergeCfg) bozmamak için kullan.
---

# Yeni kalıcı alan / ayar ekleme

Bir yeri unutursan kayıt ya da Firebase senkronu bozulur. Adımları sırayla uygula ve her birini kullanıcıya raporla.

## A) Yeni state alanı (`S.yeniAlan`): `js/durum.js` + `js/eylemler.js`
1. **`S` objesi** (`js/durum.js`): varsayılan değeri ekle (`yeniAlan:[]` veya `{}`).
2. **`serialize()`** (`js/durum.js`): `yeniAlan:S.yeniAlan` ekle.
3. **`applyState(d)`** (`js/durum.js`): eski kayıtlarda alan olmayabilir, her zaman varsayılanla oku: `S.yeniAlan=d.yeniAlan||[];`.
4. **`migrateV1(d)`** (`js/durum.js`): v1'de bu alan yok, sıfırla: `S.yeniAlan=[];`.
5. **`resetAll()`** (`js/eylemler.js`): `S.yeniAlan=[];` ekle. Başka toplu sıfırlama noktası var mı diye `Grep "S.painAction="` ile kontrol et.
6. Firebase ayrıca bir şey gerektirmez; `serialize()` üzerinden otomatik senkronlanır. Alan çok büyüyebilecekse (log gibi) kullanıcıya belirt: Firestore doküman limiti 1 MB.
7. Alanı değiştiren fonksiyonu `js/eylemler.js`'e koy. Fonksiyon sonunda `changed()` çağırmalı (kaydet + çiz).
8. Alanı okuyan hesaplar `js/mantik/*` içine, gösterim `js/sayfalar/*` içine gider.

## B) Yeni ayar (`S.cfg.yeniAyar`): `js/sabitler.js` + `js/ui/ayarlar.js`
1. **`CFG_DEFAULT`** (`js/sabitler.js`): varsayılanı ekle.
2. **`mergeCfg(s)`** (`js/sabitler.js`): `yeniAyar:s.yeniAyar??CFG_DEFAULT.yeniAyar`.
   - Dizi için: `Array.isArray(...)?s.x.slice():CFG_DEFAULT.x.slice()`.
   - İç içe obje için: `Object.assign({},CFG_DEFAULT.x,s.x||{})`.
3. **Tüketen kod:** sabit değer yazma, `S.cfg.yeniAyar` oku.
4. **Ayarlar UI** (`openConfig`, `js/ui/ayarlar.js`): Türkçe etiketli bir `num(...)` satırı ekle ve `nmap`'e `cf_yeniAyar:'yeniAyar'` gir. Mevcut kalıbı kopyala.
5. `migrateV1` ve `resetCfg` zaten `mergeCfg()` çağırıyor, ek bir işlem gerekmez.

## Bitirirken
- `/dogrula` çalıştır. "Gerçekçi veri" senaryosuna yeni alanı ekle; round-trip ve `cfg` anahtar kontrolü bunu yakalar. Statik kontrol de eksik import'ları gösterir.
- Eski kayıtla açılışın çalıştığından emin ol (alan olmadan yüklenmeli).
