---
name: taksonomi
description: Kas (MINFO/M_ORDER) ya da sistem (SINFO/S_ORDER) anahtarı eklerken, yeniden adlandırırken veya bölerken izlenecek prosedür. Kayıtlı kullanıcı verisini bozmadan migrasyon, guard ve legacy fallback sağlar.
---

# Taksonomi değişikliği

Kullanıcıların kayıtlı verisinde eski anahtarlar var. `render()` çökerse ekranda **sadece header** görünür ve uygulama kullanılamaz. Bu yüzden 4 adımın hepsi zorunlu.

## 1. Tanım (`js/sabitler.js`)
- `M_ORDER`/`MINFO` ya da `S_ORDER`/`SINFO`: yeni anahtarı ekle (`label`; sistemse `desc`, `hours`, `color`, `icon`).
- Sistemse `CFG_DEFAULT.recovery`'ye saatini ekle.
- Gerekiyorsa gruplara ekle: `KAS`, `TENDONS`, `SYS_GROUPS`, `PAIN_AREAS`.
- `sabitler.js` yaprak modüldür: buraya import ekleme.

## 2. Guard (bilinmeyen anahtar çökme yaratmamalı)
- `Grep "SINFO\["` ve `Grep "MINFO\["` ile `js/` altındaki tüm erişimleri bul.
- Her birini şu kalıplardan biriyle koru: `SINFO[s]&&…`, `.filter(s=>SINFO[s])` ya da `(SINFO[s]||{label:s,color:'var(--onvar)',icon:''})`.
- Doğru örnek: `exTags` (`js/ui/html.js`) zaten `&&MINFO[m]` ile korunuyor. Bilinen korumasız yer: `libWeekly` (`js/sayfalar/program.js`).

## 3. Migrasyon (`js/durum.js`, `applyState` içinde)
- `migrateTendon()` örneğini izle: eski→yeni bir eşleme ve fallback anahtar.
  - Hem `S.overrides[id].systems|muscles` hem `S.custom[i].systems|muscles` yeniden yazılmalı.
  - Hedef anahtar zaten doluysa üzerine yazma (`if(obj[to]==null)`), sonra eski anahtarı sil.
- `S.cfg.recovery` içinde eski anahtar varsa değerini yeni anahtar(lar)a taşı.
- `S.pain`/`S.painLog` sistem anahtarı kullanır. Ağrı bölgesi değiştiyse onları da taşı.
- Migrasyon `S.reindex()`'ten **önce** çalışmalı (`migrateTendon`'un yerine bak).
- `migrateV1` yolu `migrateTendon`'u çağırmıyor. v1 verisinde de eski anahtar olabileceği için legacy fallback (adım 4) şart.

## 4. Legacy fallback
- Eski anahtarı `SINFO`/`MINFO` içinde **bırak** (`kas`/`tendon` örneği gibi, `desc:'Eski … etiketi'`), ama `S_ORDER`/`M_ORDER`'a **ekleme**. Böylece gizli kalır, ama lookup çökmez.

## Doğrulama
- `/dogrula` çalıştır. `verify.mjs`'e eski anahtarı `overrides` ve `custom` içinde taşıyan bir senaryo ekle; migrasyondan sonra anahtarın kalmadığını kontrol et (`v2 migrasyonu` check'ini örnek al).
- "Bilinmeyen anahtarlar" senaryosunun tüm render'ları geçmeli.
