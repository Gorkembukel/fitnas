---
name: yeni-egzersiz
description: Kullanıcı sohbette bir egzersiz tarif ettiğinde onu araştırıp (kas/sistem/hacim/tempo) hem js/yeni-egzersizler.js'e kod olarak ekleyip branch'e puşlamak hem de canlı GitHub Pages sayfasını açıp "Yeni egzersiz" formuyla aynı değerlerle eklemek için izlenecek prosedür. Kullanıcı bir egzersiz tarif ettiğinde / "şunu ekle" dediğinde kullan.
---

# Yeni egzersiz oluşturma mekanizması

Kullanıcı bir egzersizi tarif ettiğinde (isim yeterli, tarif detaylı da olabilir) bu prosedürü
sırayla uygula. Adım atlama; her adımı kullanıcıya kısaca raporla.

## 0) Şablon — araştırmadan önce doldurulacak alanlar

Koda dokunmadan önce aşağıdaki şablonu doldur (bir mesaj içinde kullanıcıya gösterebilirsin, dosyaya
yazman gerekmez). Kaynak: egzersiz ismini web'de araştır (biyomekanik/kullanılan kas anatomisi
kaynakları — ExRx, hipertrofi/güç antrenmanı literatürü, fizyoterapi kaynakları). Emin olmadığın
alan için en yakın karşılaştırılabilir egzersize bak (katalogtaki benzerine bak, `js/katalog.js`).

```
id:            kısa, benzersiz, camelCase, İngilizce harf (ör. "facepull") — kCatalog + custom + yeniEgzersizler'de TEKRARSIZ olmalı
name:          Türkçe görünen ad (ör. "Face pull (bant)")
pattern:       hareket kalıbı, serbest metin ama TUTARLI OLSUN — mevcut kalıplardan birini tekrar
               kullan eğer uyuyorsa (Program editöründeki datalist = kCatalog.map(e=>e.pattern) çıktısı,
               bak `js/katalog.js`), yoksa yeni kısa bir kalıp adı yaz.
unit:          'tekrar' | 'sn' | 'dk'
muscles:       {kas:1|0.5} — anahtarlar SADECE M_ORDER'daki 14 kas (js/sabitler.js):
               gogus, omuz, triseps, lat, ustSirt, biseps, onkol, kuadriseps, hamstring, gluteus,
               baldir, core, coreRot, kalcaYan. 1=ana, 0.5=yardımcı. En az bir ana kas ZORUNLU.
systems:       {sistem:1|0.5} — anahtarlar SADECE S_ORDER'daki (js/sabitler.js):
               sinir, kasItme, kasCekme, kasBacak, kasGovde, tendonKol, tendonItme, tendonDiz,
               tendonAsil, tendonKalca, kemik, mobilite, reaktif, aerobik, anaerobik.
               En az bir ana sistem ZORUNLU. Kılavuz: hareket koordinasyon/patlayıcılık istiyorsa
               sinir; hipertrofi/kuvvet odaklıysa ilgili kasItme/kasCekme/kasBacak/kasGovde; eklem
               altında yük taşıyan bağ dokusu varsa ilgili tendonX; sıçrama/darbe varsa kemik +
               genelde impact:true; germe-kısalma döngüsü (plyometrik) varsa reaktif; düşük şiddet
               uzun süre ise aerobik; yüksek şiddet kısa tekrar ise anaerobik; eklem açıklığı/esneme
               ise mobilite.
days:          haftanın hangi günleri (1=Pzt..7=Paz) — en az bir gün ZORUNLU. Kullanıcının mevcut
               programındaki boşluğa göre öner (S.active / haftalık plana bak) ya da kullanıcıya sor.
targets:       T([[set,değer],[set,değer],[set,değer],[set,değer]]) — Hafta1,Hafta2,Hafta3,Deload.
               Deload genelde Hafta1 ile aynı ya da biraz altı. Yeni/karmaşık hareketse muhafazakar
               başla (düşük RPE'ye denk gelecek hacim), var olan benzer harekete kıyasla ölçekle.
rpe:           1-10, hedef zorluk (GtG felsefesi: çoğunlukla 4-7 arası, teknik gerektiren
               kompleks/patlayıcı hareketlerde daha düşük başla).
impact:        true sadece darbe/sıçrama/koşu gibi tendon-kemik darbe yükü varsa.
halfRec:       Çar/Paz yarım hacim mantığına uysun mu (mevcut egzersizlerin çoğunda true).
step:          4 haftalık döngü sonunda değere eklenecek artış (opsiyonel, çoğunlukla 0-2).
tempo:         "iniş-bekle-çıkış-bekle" sn cinsinden, opsiyonel (ör. "3-1-1-0"). Sadece unit='tekrar'
               ve tempo kontrolü anlamlıysa doldur.
recovery:      saat cinsinden manuel toparlanma süresi override, opsiyonel — boş bırak (SINFO
               hours'tan türetilsin), sadece araştırma net bir şey söylüyorsa doldur.
note:          kısa Türkçe teknik notu (duruş, kontrol noktası, vb.), opsiyonel.
block/prereq:  varsayılan boş bırak (null / yok) — kullanıcı özellikle "kilit"li/ön koşullu bir
               ilerleme hedefi istemedikçe ekleme.
```

Şablonu doldururken emin olamadığın (kas/sistem ataması gibi) alanları kullanıcıya tek satırda
özetleyip onay iste; kritik değilse makul varsayımla devam et.

## 1) Kod: `js/yeni-egzersizler.js`

Bu dosya `js/katalog.js`'teki elle yazılmış temel listeden AYRI tutulur — tüm mekanizma-eklenen
egzersizler sadece burada durur. `yeniEgzersizler(E,T)` fonksiyonunun döndürdüğü diziye, doldurduğun
şablonla birebir aynı sözdizimiyle bir `E(id,name,{...})` satırı ekle (bkz. dosyadaki yorum örneği ve
`js/katalog.js`'teki üslup). `E`/`T` parametre olarak gelir, import ETME (döngüsel import'u önlemek
için — bkz. kök `CLAUDE.md`, "ES module rules that bite").

`id` çakışması olmadığından emin ol: `js/katalog.js` (kCatalog) + kullanıcının `S.custom`'ı ile
aynı id kullanılmamalı (id'ler kod tarafında görünmez ama aynı id iki taraftan da eklenirse editör
`saveExercise` üzerine yazabilir).

## 2) Doğrula

`node .claude/skills/dogrula/verify.mjs` çalıştır. Geçmeyen bir şey varsa (yeni eklediğin satırdan
kaynaklı) düzelt. "Bilinen durum" notunda listeli başarısızlık senden kaynaklı değildir, görmezden gel.

## 3) Git akışı

`/ozellik-baslat` kurallarına uy: main temizse ve zaten bir özellik branch'indeysen (bu mekanizma
için açılmış ortak bir branch olabilir) oradan devam et; değilse yeni branch aç (ör.
`egzersiz-<id>`). Commit at, `git push -u origin <branch>`. **Asla** `main`'e doğrudan yazma, asla
force push, asla kullanıcı onayı olmadan `git merge`/`gh pr merge` çalıştırma (merge'ü kullanıcı
kendisi yapar).

## 4) Canlı sayfaya da ekle (Chrome ile)

Kod PR'ı onay/merge bekleyeceği için, kullanıcının hemen kullanabilmesi adına AYNI değerleri canlı
sitede de "özel egzersiz" olarak ekle:

1. `claude-in-chrome` araçlarını yükle (deferred ise tek `ToolSearch` çağrısıyla).
2. `https://gorkembukel.github.io/fitnas/` adresini yeni bir sekmede aç (mevcut sekmeleri
   `tabs_context_mcp` ile kontrol et, kullanıcı zaten açık tutuyorsa onu kullanma — yeni sekme aç).
3. **Program** sekmesi → **Tüm egzersizler** segmenti → "+ Yeni egzersiz" ile editörü aç
   (`js/ui/editor.js`'teki `openEditor(null)` formu — Ad, Kalıp, Birim, Set/tekrar modu, Günler,
   Ana/Yardımcı kas grupları, Ana/Yardımcı sistemler, Darbeli, Yarım hacim, RPE, Tempo, İyileşme
   süresi, Not).
4. Şablondaki değerlerin BİREBİR aynısını doldur (targets için "Elle" modunu kullanıp 4 haftayı
   tek tek gir, ya da hepsi aynıysa "Sabit").
5. Kaydet. Bu, kullanıcının localStorage'ına (ve varsa Firebase'ine) `S.custom` olarak yazılır —
   canlıda hemen kullanılabilir olur; kod tarafındaki PR merge olunca kalıcı yerleşik hâle gelir
   (iki taraf da aynı egzersizi barındırır, çakışma yaratmaz — kullanıcı isterse kendi özel
   girdisini PR merge olduktan sonra silebilir).
6. Sekmeyi kapatmadan önce eklemenin göründüğünü (Bugün ya da Tüm egzersizler listesinde) teyit et.

## 5) Rapor

Kullanıcıya: hangi egzersizi hangi id ile eklediğini, hangi branch'e puşladığını, canlı sayfada
eklenip eklenmediğini ve varsa emin olamadığın alanları (kas/sistem ataması gibi) özetle. Merge için
onay istediğini belirt.
