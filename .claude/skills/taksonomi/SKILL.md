---
name: taksonomi
description: Kas (MINFO/M_ORDER) ya da sistem (SINFO/S_ORDER) anahtarı eklerken, yeniden adlandırırken veya bölerken izlenecek prosedür. Kayıtlı kullanıcı verisini bozmadan migrasyon, guard ve legacy fallback sağlar.
---

# Taksonomi değişikliği

Kullanıcıların kayıtlı verisinde eski anahtarlar var. `render()` çökerse ekranda **sadece header** görünür, uygulama kullanılamaz. Bu yüzden 4 adımın hepsi zorunlu.

## 1. Tanım
- `M_ORDER`/`MINFO` ya da `S_ORDER`/`SINFO` (~183–209): yeni anahtarı ekle (`label`, sistemse `desc`, `hours`, `color`, `icon`).
- Sistemse `CFG_DEFAULT.recovery`'ye saatini ekle (~234).
- Gerekiyorsa gruplara da ekle: `KAS`, `TENDONS`, `SYS_GROUPS`, `PAIN_AREAS` (~215–227).

## 2. Guard (bilinmeyen anahtar çökme yaratmamalı)
- `Grep "SINFO\[" ` ve `Grep "MINFO\["` ile tüm erişimleri bul.
- Her birini koru: `SINFO[s]&&…`, `.filter(s=>SINFO[s])` ya da `(SINFO[s]||{label:s,color:'var(--onvar)',icon:''})`.
- Örnek: `exTags` zaten `&&MINFO[m]` ile korunuyor. Bilinen korumasız yer: `libWeekly` (~1069).

## 3. Migrasyon (`applyState` içinde)
- Yeniden adlandırma/bölme için `migrateTendon()` (~325) örneğini izle: eski→yeni eşlemesi olan bir map ve bir fallback anahtar kullan. Hem `S.overrides[id].systems|muscles` hem `S.custom[i].systems|muscles` yeniden yazılmalı.
- Hedef anahtar zaten doluysa üzerine yazma (`if(obj[to]==null)`), eski anahtarı sil.
- `S.cfg.recovery` içinde eski anahtar varsa değerini yeni anahtar(lar)a taşı.
- `S.pain`/`S.painLog` sistem anahtarı kullanıyor. Ağrı bölgesi değiştiyse onları da taşı.
- Migrasyon `S.reindex()`'ten **önce** çalışmalı (`migrateTendon` konumuna bak).
- `migrateV1` yolu `migrateTendon` çağırmıyor. v1 verisinde de eski anahtar olabilir, bu yüzden legacy fallback (adım 4) şart.

## 4. Legacy fallback
- Eski anahtarı `SINFO`/`MINFO` içinde **bırak** (`kas`/`tendon` örneği gibi, `desc:'Eski … etiketi'`) ama `S_ORDER`/`M_ORDER`'a **ekleme**. Böylece gizli kalır ama lookup çökmez.

## Doğrulama
- `/dogrula` skill'ini çalıştır. `verify.mjs`'e eski anahtarı `overrides` ve `custom` içinde taşıyan bir senaryo ekle ve migrasyon sonrası anahtarın kalmadığını kontrol et (`v2 migrasyonu` check'ini örnek al).
- "Bilinmeyen anahtarlar" senaryosunun tüm render'ları geçmeli.
