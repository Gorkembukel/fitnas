---
name: dogrula
description: js/ modüllerini doğrular. Statik kontroller (eksik import, import'a atama, yaprak modül kuralı, index.html referansları) ve headless test yapar (gerçek modüller sahte DOM ile yüklenir, tüm sekmeler render edilir, serialize/applyState round-trip, sysRecovery/target/painStatus aralıkları, eski veri migrasyonu). HER değişiklikten sonra ve commit'ten önce çalıştır.
---

# Doğrulama

## Çalıştır
```
node .claude/skills/dogrula/verify.mjs
```
Çıkış kodu 0 → hepsi geçti. 1 → en az bir ✗ var, commit'leme.

## Ne yapar
**Statik (ana süreç):**
- Export adları benzersiz mi?
- Bir modül başka modülün export'unu kullanıp import etmeyi unuttu mu? Tarayıcıda bu `ReferenceError` olarak ortaya çıkar, ama ancak o kod çalışınca.
- Import edilen bir bağlamaya atama var mı (`tab=1` gibi)? Modüllerde bu `TypeError` verir. Paylaşılan UI durumu için `U.x` kullan.
- Yaprak modüller (`sabitler`, `yardimcilar`, `firebase-ayar`, `ui/durum-ui`) import içeriyor mu?
- `index.html`'deki `css/…` ve `js/…` dosyaları mevcut mu?
- Tarama `lexer.mjs` ile yapılır: string, template ve yorum içerikleri kod sayılmaz.

**Senaryolar (her biri ayrı Node sürecinde, modüller temiz yüklenir):**
- Sahte `document`/`localStorage`/`window` kurulur, sonra gerçek `js/main.js` import edilir (Firebase yok = offline yol).
- Her sekme ve alt segment render edilir (`U.balMode` 0–1, `U.progMode` 0–2, `U.libMode` 0–2). Görünür metinde `undefined`/`NaN` olursa hata.
- `serialize → JSON → applyState → serialize` aynı çıktıyı vermeli (`updatedAt` hariç).
- `S.cfg`, `CFG_DEFAULT`'taki tüm anahtarları içermeli.
- `sysRecovery` sonlu ve ≥0, `sysThreshold` >0; `target` sonlu; `painStatus.mode` ∈ {normal, half, skip, flag}.
- Senaryolar: boş · gerçekçi veri · eski taksonomi (v2'de `kas`/`tendon`) · `antrenman_takip_v1` · bilinmeyen anahtarlar (guard testi).

## Değişikliğe özel test ekleme
`verify.mjs` içinde `--senaryo` bloğunda:
- Gereken fonksiyonu import et: `const { scheduledAt } = await imp('mantik/program.js');`
- `check('açıklama', () => { … throw new Error(...) })` ekle.
- Yeni kalıcı alan eklediysen "Gerçekçi veri" senaryosunun JSON'una o alanı koy; eski senaryolara koyma, böylece varsayılan değerler de test edilir.
- Taksonomi değiştirdiysen eski anahtarı taşıyan bir senaryo ekle ve migrasyon sonrası anahtarın kalmadığını kontrol et.

## Sonucu yorumlama
- **"kullanılıp import edilmemiş ad":** Mesaj, adın hangi dosyada tanımlı olduğunu gösterir. O dosyadan import et. Yerel bir değişken aynı adı gölgeliyorsa bu yanlış alarmdır; yerel adı değiştir.
- **`açılış` başarısızsa:**
  - "Cannot access X before initialization" döngüsel import sorunudur. Üst seviyede başka modülün `const`'unu kullanma; bir yaprak modüle import ekleme.
  - Diğer hatalarda sahte DOM'da eksik bir API olabilir; `makeEl`/`installDom`'a stub ekle.
- **`render …` başarısızsa:** Stack trace doğrudan `js/...:satır` gösterir.
- Kullanıcıya her zaman geçen/başarısız sayısını ve başarısız olanları olduğu gibi bildir.
- Bu test tarayıcıyı birebir taklit etmez. Büyük UI değişikliklerinde `npx serve .` ile gerçek tarayıcıda da bak.

## Bilinen durum (2026-09-23)
"Bilinmeyen anahtarlar → render Program #0" başarısız: `libWeekly` içinde `SINFO[s].label` guard'sız (`js/sayfalar/program.js`, `daySystems` sonucu). Düzeltilene kadar bu ✗ beklenen bir sonuç. Düzeltilince bu notu sil.
