---
name: dogrula
description: index.html'i headless olarak doğrular (sözdizimi, tüm sekmelerin render'ı, serialize/applyState round-trip, sysRecovery/target/painStatus aralıkları, eski veri migrasyonu). index.html'de HER değişiklikten sonra ve commit'ten önce çalıştır.
---

# Doğrulama

## Çalıştır
```
node .claude/skills/dogrula/verify.mjs
```
Çıkış kodu 0 → hepsi geçti. 1 → en az bir ✗ var, commit'leme.

## Ne yapar
1. `index.html` içindeki inline `<script>`'i çıkarır ve derler (sözdizimi).
2. Script'i Node `vm` içinde sahte `document`/`localStorage`/`window` ile çalıştırır (Firebase yok = offline yol).
   Script sonuna bir köprü (`globalThis.__T={...}`) eklenir, böylece `let`/`const` değerlerine erişilir.
3. Her senaryoda gerçek açılışı çalıştırır (`applyTheme → load → render → cloudInit`), sonra:
   - Her sekmeyi ve alt segmenti render eder (Denge 0–1, Özet 0–2, Program 0–2). Görünür metinde `undefined`/`NaN` varsa hata verir.
   - `serialize → JSON → applyState → serialize` çıktısı aynı olmalı (`updatedAt` hariç).
   - `S.cfg`, `CFG_DEFAULT`'taki tüm anahtarları içermeli.
   - Tüm `S_ORDER` sistemlerinde `sysRecovery` sonlu ve ≥0, `sysThreshold` >0 olmalı.
   - Tüm aktif egzersizlerde `target` sonlu, `painStatus.mode` ∈ {normal, half, skip} olmalı.
4. Senaryolar: boş · gerçekçi veri (log+ağrı+ayar) · eski taksonomi (v2'de `kas`/`tendon`) · `antrenman_takip_v1` · bilinmeyen anahtarlar (guard testi).

## Değişikliğe özel test ekleme
Dokunduğun fonksiyon için `verify.mjs` dosyasına ekleme yap:
- Fonksiyonu `EXPORT` köprüsüne ekle (ör. `…,scheduledAt,painAt`).
- Senaryo döngüsünün içine bir `check('açıklama', () => { … throw new Error(...) })` ekle.
- Yeni bir kalıcı alan eklediysen "Gerçekçi veri" senaryosunun JSON'una o alanı koy, eski senaryolara koyma (böylece varsayılan değerler test edilir).
- Taksonomi değiştirdiysen eski anahtarı içeren bir senaryo ekle ve migrasyon sonrası anahtarın kalmadığını kontrol et.

## Sonucu yorumlama
- `açılış` başarısızsa: üst seviye koddan biri sahte DOM'da olmayan bir API kullanıyor. Önce `makeEl`/`makeContext`'e stub ekle. Uygulamayı bu yüzden değiştirme.
- `render …` başarısızsa: stack trace'teki `index.html<script>:N` satırı, dosyada yaklaşık **N+163**. satıra denk gelir.
- Kullanıcıya her zaman geçen/başarısız sayısını ve başarısız olanları olduğu gibi bildir.

## Bilinen durum (2026-09-23)
"Bilinmeyen anahtarlar → render Program #0" başarısız: `libWeekly` içinde `SINFO[s].label` guard'sız (index.html ~1069). Düzeltilene kadar bu ✗ beklenen bir sonuç. Düzeltilince bu notu sil.
