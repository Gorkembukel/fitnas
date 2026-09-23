---
name: yeni-alan
description: Kalıcı yeni bir state alanı (S.xxx) ya da yeni ayarlanabilir sabit (S.cfg.xxx) eklerken izlenecek kontrol listesi. Kayıt/senkron sözleşmesini (S, serialize, applyState, migrateV1, CFG_DEFAULT, mergeCfg) bozmamak için kullan.
---

# Yeni kalıcı alan / ayar ekleme

Bir yeri unutursan kayıt ya da Firebase senkronu bozulur. Adımları sırayla uygula ve her birini kullanıcıya raporla.

## A) Yeni state alanı (`S.yeniAlan`)
1. **`S` objesi** (`const S={…}`, ~303): varsayılan değeri ekle (`yeniAlan:[]` veya `{}`).
2. **`serialize()`** (~322): `yeniAlan:S.yeniAlan` ekle.
3. **`applyState(d)`** (~332): eski kayıtlarda alan olmayabilir, bu yüzden her zaman varsayılanla oku: `S.yeniAlan=d.yeniAlan||[];`.
4. **`migrateV1(d)`** (~351): v1'de bu alan yok, sıfırla: `S.yeniAlan=[];`.
5. **Reset / sıfırlama akışları**: `S.` atamalarının toplu yapıldığı diğer yerleri bul (`Grep "S.painAction="` gibi) ve alanı oraya da ekle.
6. Firebase ayrıca bir şey gerektirmez, `serialize()` üzerinden otomatik senkronlanır. Alan çok büyüyebilecekse (log gibi) bunu kullanıcıya belirt, Firestore doküman limiti 1 MB.
7. Değiştiren her fonksiyon sonunda `changed()` çağırmalı (save + render).

## B) Yeni ayar (`S.cfg.yeniAyar`)
1. **`CFG_DEFAULT`** (~233): varsayılanı ekle.
2. **`mergeCfg(s)`** (~241): `yeniAyar:s.yeniAyar??CFG_DEFAULT.yeniAyar`. Dizi ise `Array.isArray(...)?s.x.slice():CFG_DEFAULT.x.slice()`, iç içe obje ise `Object.assign({},CFG_DEFAULT.x,s.x||{})` kullan.
3. **Tüketen kod**: sabit değer yazma, `S.cfg.yeniAyar` oku (gerekirse `??CFG_DEFAULT.yeniAyar` ile).
4. **Ayarlar UI**: "Analiz ve kurallar" bölümüne Türkçe etiket ve açıklamayla bir alan ekle (`Grep "Analiz ve kurallar"`). Mevcut input kalıbını kopyala.
5. `migrateV1` zaten `mergeCfg()` çağırıyor, ek bir işlem gerekmez.

## Bitirirken
- `/dogrula` skill'ini çalıştır. "Gerçekçi veri" senaryosuna yeni alanı ekle, round-trip ve `cfg` anahtar kontrolü bunu yakalar.
- Eski kayıtla açılışın çalıştığından emin ol (alan olmadan yüklenmeli).
