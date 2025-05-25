# Restoran Maliyet ve Reçete Yönetimi Uygulaması

Bu belge, Electron kullanarak geliştirilen restoran maliyet ve reçete yönetimi uygulamasının mevcut durumunu, mimarisini, veri modelini ve gelecek adımlarını detaylandırmaktadır.

## Uygulama Özellikleri

Uygulamanın temel işlevleri şunlardır:

1.  **Ürün/Hammadde Kaydı:** Restoranın kullandığı hammadde ve sattığı son ürünlerin temel bilgilerini kaydetme, listeleme ve silme.
2.  **Birim Yönetimi:** Ölçü birimlerini, birbirleri arasındaki çevrim oranlarını (`cevrimKatsayisi`) tanımlama, listeleme ve ekleme.
3.  **Porsiyon Yönetimi:** Son ürünlerin farklı porsiyon veya varyantlarını tanımlama, listeleme ve ekleme.
4.  **Reçete Yönetimi:**
    *   Belirli bir porsiyon için reçeteleri tanımlama, ana reçete bilgilerini düzenleme/silme.
    *   Reçetenin detaylarını (kullanılan hammaddeleri ve miktarlarını) ekleme, silme ve düzenleme.
    *   **Hammadde Maliyet Hesaplama:** Birim çevrimlerini dikkate alarak, en son alış fiyatlarına göre reçetedeki her bir hammaddenin ve reçetenin toplam maliyetini anlık olarak hesaplama ve gösterme.
    *   **Toplu Maliyet Güncelleme:** Tüm reçetelerin maliyetlerini tek seferde hesaplama, veritabanına kaydetme ve sonuçları Excel'e aktarma.
5.  **Alım Fişi Girişi:** Hammadde ve ürün alımlarının miktarlarını, birimlerini, alış fiyatlarını ve fiş numaralarını kaydetme.
6.  **Gider Girişi:** İşletmenin genel (kira, maaş, faturalar vb.) giderlerini kaydetme.
7.  **Satılan Ürün Kaydı:** Belirli bir dönemde satılan porsiyonların miktarlarını ve satış fiyatlarını kaydetme.
8.  **Kullanıcı Girişi ve Ayarlar:** Basit kullanıcı doğrulama ve şifre değiştirme.
9.  **Analiz ve Raporlama (Gelecekte):** Girilen verilere dayanarak ürün/porsiyon maliyetlerini, toplam alımları, giderleri, satış gelirlerini ve kâr/zararı analiz etme ve raporlama.
10. **Kullanıcı Yönetimi (Gelişmiş - Gelecekte):** Rol ve izin tabanlı erişim.

## Kullanılan Teknolojiler

*   **Platform:** Electron (Çoklu Platform Masaüstü Uygulaması)
*   **Programlama Dili:** JavaScript (Renderer Süreci: HTML, CSS, JavaScript)
*   **Ana Süreç Runtime:** Node.js
*   **Veri Tabanı:** SQLite (Dosya Tabanlı Veri Tabanı)
*   **Veri Tabanı Erişim:** `sqlite3` Node.js kütüphanesi
*   **Excel İşlemleri (Ana Süreç):** `xlsx` (SheetJS) kütüphanesi
*   **Kullanıcı Arayüzü Framework:** Temel HTML/CSS/JS + Tabler Tema
*   **Bildirimler:** Toastr JavaScript kütüphanesi
*   **JS Bağımlılığı:** jQuery (Toastr için)
*   **Modal Onay:** Tabler Modal Bileşeni (`index.html` içinde genel onay modalı)
*   **Paket Yönetimi:** npm (Node Package Manager)

## Proje Yapısı (Mevcut Durum)

RestoranMaliyetApp/
├── assets/
│ ├── css/
│ ├── js/
│ └── toastr/
├── main/
│ ├── db.js
│ └── ipcHandlers.js
├── renderer/
│ ├── urunler.js
│ ├── birimler.js
│ ├── porsiyonlar.js
│ ├── receler.js
│ ├── alimlar.js
│ ├── giderler.js
│ ├── satislar.js
│ ├── ayarlar.js
│ ├── dashboard.js
│ └── toplu_maliyet.js # Toplu Maliyet Güncelleme sayfası JS
├── views/
│ ├── urunler.html
│ ├── birimler.html
│ ├── porsiyonlar.html
│ ├── receler.html
│ ├── alimlar.html
│ ├── giderler.html
│ ├── satislar.html
│ ├── ayarlar.html
│ ├── dashboard.html
│ └── toplu_maliyet.html # Toplu Maliyet Güncelleme sayfası HTML
├── index.html
├── login.html
├── splash.html
├── login.js
├── preload.js
├── style.css
├── package.json
├── package-lock.json
└── node_modules/

## Veri Modeli (Güncel Plan)

... (Veri modeli kısmı aynı kalıyor - Lütfen bu kısmı kendi projenizdeki güncel haliyle değiştirin veya olduğu gibi bırakın)
*   `receler` tablosuna `sonHesaplananMaliyet` ve `maliyetHesaplamaTarihi` sütunları eklendi.
*   `maliyet_log` tablosu (receteId, hesaplamaTarihi, hesaplananMaliyet) eklendi.

## Tamamlanan Adımlar (Güncel)

1.  Temel Electron Projesi Kurulumu.
2.  Temel Pencere Oluşturma ve Uygulama Başlatma.
3.  SQLite Veri Tabanı Entegrasyonu ve Tüm Tabloların Oluşturulması (`main/db.js`).
    *   `birimler` tablosuna `cevrimKatsayisi` sütunu eklendi.
    *   `receler` tablosuna maliyet takibi için `sonHesaplananMaliyet` ve `maliyetHesaplamaTarihi` sütunları eklendi.
    *   Geçmiş maliyetleri loglamak için `maliyet_log` tablosu oluşturuldu.
    *   Varsayılan birimlere çevrim katsayıları eklendi.
4.  IPC Altyapısı Kurulumu (`preload.js`, `main/ipcHandlers.js`).
    *   `getLatestAlimInfoForUrun`, `logAndUpdateReceteMaliyet`, `getPreviousMaliyetLog`, `exportMaliyetToExcel` handler'ları eklendi.
5.  Tabler Tema Entegrasyonu.
6.  Toastr Bildirimleri Entegrasyonu.
7.  Genel Onay Modalı Entegrasyonu.
8.  Ana Layout ve Menü Yapısı (`index.html`).
    *   Menü yapısı daha işlevsel gruplara ayrıldı (Tanımlar, Reçeteler, İşlemler vb.).
9.  Sayfa Yükleme Mekanizması (`renderer.js`).
10. Menü Navigasyonu, Aktiflik Durumu ve İkon Güncellemeleri (`<img>` ile SVG kullanımı).
11. **Sayfa Düzenleri:** Tüm CRUD sayfaları için form solda, liste sağda, ayrı kartlarda standart düzene geçildi.
12. **Buton Stilleri:** Tüm form ve tablo eylem butonları standart ikonlu görünüme kavuştu.
13. **Ürün/Hammadde Yönetimi:** CRUD işlevleri tamamlandı.
14. **Birim Yönetimi:** CRUD işlevleri ve `cevrimKatsayisi` yönetimi tamamlandı.
15. **Porsiyon Yönetimi:** CRUD işlevleri ve ilgili dropdown'lar tamamlandı.
16. **Reçete Yönetimi:**
    *   Ana reçete ve reçete detayları için CRUD işlevleri tamamlandı.
    *   **Birim Çevrim ve Maliyet Hesaplama:**
        *   Reçete detaylarındaki her hammadde için anlık maliyet hesaplama ve gösterme.
        *   Toplam reçete maliyetini anlık hesaplama ve gösterme.
        *   Ana reçete listesinde "Maliyeti Yenile" butonu ile anlık toplam maliyet sorgulama.
17. **Alım Yönetimi:** CRUD işlevleri, Fiş No alanı ve otomatik toplam tutar tamamlandı.
18. **Gider Yönetimi:** CRUD işlevleri tamamlandı.
19. **Satış Yönetimi:** CRUD işlevleri, varsayılan fiyat getirme ve otomatik toplam tutar tamamlandı.
20. **Ayarlar Sayfası:** Basit kullanıcı adı gösterme ve şifre değiştirme işlevi tamamlandı.
21. **Splash Screen ve Giriş Ekranı Akışı:** Çerçevesiz splash, çerçeveli login ve maksimize ana uygulama akışı tamamlandı.
22. **Dashboard Sayfası:** Basit haliyle oluşturuldu ve varsayılan açılış sayfası yapıldı.
23. **Toplu Reçete Maliyeti Güncelleme:**
    *   `views/toplu_maliyet.html` ve `renderer/toplu_maliyet.js` oluşturuldu.
    *   Tüm reçetelerin maliyetlerini hesaplayıp `receler` tablosunu ve `maliyet_log` tablosunu güncelleme işlevi.
    *   Sonuçları "Eski/Yeni Maliyet ve Değişim %" formatında tabloda gösterme.
    *   Hesaplanan maliyet raporunu Excel'e aktarma (`xlsx` kütüphanesi ile).
    *   Menüye "Toplu Maliyet Güncelleme" linki eklendi.

## Gelecek Adımlar (Yapılacaklar)

Planlanan gelecek adımlar ve tamamlanacak özellikler sırasıyla (önceliklendirme tartışılabilir):

1.  ~~**Tablo Güncelleme ve Silme (Kalan Sayfalar):**~~ `✓ TAMAMLANDI`
2.  **Birim çevrim mantığının Reçete Maliyeti hesaplanırken kodda uygulanması:** `✓ TEMEL İŞLEVSELLİK TAMAMLANDI`
    *   (İleri Geliştirme: Daha karmaşık çapraz birim çevrimleri, yoğunluk bazlı çevrimler eklenebilir.)
3.  **Alım Fişi Girişi:** `✓ TAMAMLANDI`
4.  **Gider Girişi:** `✓ TAMAMLANDI`
5.  **Satılan Ürün Kaydı:** `✓ TAMAMLANDI`
6.  **Analiz ve Raporlama:**
    *   ~~Toplu Reçete Maliyeti Güncelleme sayfası/işlevi.~~ `✓ TAMAMLANDI` (Excel'e aktarma dahil)
    *   Maliyet Geçmişi Raporu (`maliyet_log` tablosundan detaylı analiz).
    *   `views/analiz.html` ve `renderer/analiz.js` oluşturma (Genel Kâr/Zarar, Detaylı Maliyet Raporları vb.).
7.  **Uygulama Ayarları:** `✓ (Basit Şifre Değiştirme Tamamlandı)`
    *   **Şifrelerin hash'lenerek güvenli bir şekilde saklanması.** (ÖNCELİKLİ)
    *   Genel uygulama ayarları (para birimi sembolü, firma bilgileri vb.) için arayüz.
8.  **Hata Yönetimi İyileştirme:** Daha kapsamlı hata yakalama ve kullanıcı dostu mesajlar, loglama.
9.  **Uygulama İyileştirmeleri:**
    *   Tablolarda sıralama, filtreleme, arama özellikleri.
    *   Sayfalandırma (çok fazla kayıt olduğunda).
    *   Kullanıcı arayüzü detayları, performans optimizasyonları.
10. **Dağıtım:** Uygulamayı farklı işletim sistemlerinde çalıştırılabilir hale getirme.
11. **Yedekleme/Geri Yükleme:** Veri tabanının yedeklenmesi ve geri yüklenmesi işlevi.
12. **Kullanıcı Yönetimi:** `✓ (Basit Tek Kullanıcı Doğrulaması Tamamlandı)`
    *   Rol ve izin tabanlı erişim kontrolü (Gelişmiş).
    *   Çoklu kullanıcı desteği.
13. **Splash Screen ve Giriş Ekranı:** `✓ TAMAMLANDI`
14. **Lisans Yönetimi:** (YENİ)
    *   Lisans anahtarı doğrulama mekanizması.
    *   Deneme sürümü / süre kısıtlaması özellikleri.
    *   Aktivasyon ve lisans durumu yönetimi.