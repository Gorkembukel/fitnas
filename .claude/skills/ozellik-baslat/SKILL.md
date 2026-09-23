---
name: ozellik-baslat
description: Yeni bir iş/özellik başlatırken projenin git kurallarını uygular (önce commit+push, yeni branch, main'e dokunmama, force push yok, onaysız merge yok). Kod değişikliğine başlamadan önce kullan.
---

# Özellik başlatma (git akışı)

Kurallar: main/master'da doğrudan değişiklik yok, `git push -f`/`--force` asla yok, kullanıcı onayı olmadan merge yok. Site GitHub Pages'ten `main` üzerinden yayınlandığı için `main`'e giren her şey canlıya çıkar.

## Adımlar
1. `git status` ve `git branch --show-current` ile durumu gör.
2. **Mevcut durumu kaydet:** çalışma alanı kirliyse kullanıcıya neyin commit'leneceğini göster, sonra `git add -A && git commit -m "<açıklama>"` ve `git push` (upstream yoksa `git push -u origin <branch>`). Temizse push'un güncel olduğunu doğrula.
   - Kirli değişiklikler `main` üzerindeyse ve kullanıcı bunları `main`'e commit'lemek istemiyorsa, önce yeni branch'i aç (adım 3), commit'i orada yap.
3. **Yeni branch:** `git checkout -b <ozellik-adi>`. Kısa, Türkçe ya da camelCase bir ad seç (mevcut örnekler: `metronom`, `betterTendon`, `haftalık-edit`). Aynı adda branch varsa yeni bir ad seç.
4. **İşi yap.** Anlamlı adımlarda commit at. Her commit'ten önce `/dogrula` skill'ini çalıştır.
5. **Push:** `git push -u origin <ozellik-adi>` (asla `-f`).
6. **Dur ve raporla:** değişiklik özetini, doğrulama sonucunu (geçen/başarısız) ve branch adını ver. Sonra "Merge için onayını bekliyorum" de. PR açmak ya da merge etmek için kullanıcının açıkça onay vermesi gerekir.

## Yasaklar
- `git push -f`, `git push --force`, `--force-with-lease`
- `main`/`master` üzerinde commit
- Onaysız `git merge`, `gh pr merge`
- `git reset --hard` ve `git checkout -- .` gibi iş kaybettiren komutlar (kullanıcı açıkça istemedikçe)
