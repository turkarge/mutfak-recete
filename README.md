# Restoran Maliyet ve Reçete Yönetimi Uygulaması

Bu belge, Electron kullanarak geliştirilen restoran maliyet ve reçete yönetimi uygulamasının mevcut durumunu, mimarisini, veri modelini ve gelecek adımlarını detaylandırmaktadır.

## Uygulama Özellikleri

Uygulamanın temel işlevleri şunlardır:

1.  **Ürün/Hammadde Kaydı:** Restoranın kullandığı hammadde ve sattığı son ürünlerin temel bilgilerini kaydetme, listeleme ve silme.
2.  **Birim Yönetimi:** Ölçü birimlerini ve birbirleri arasındaki çevrim oranlarını tanımlama, listeleme ve ekleme.
3.  **Porsiyon Yönetimi:** Son ürünlerin farklı porsiyon veya varyantlarını tanımlama, listeleme ve ekleme.
4.  **Reçete Yönetimi:** Belirli bir porsiyon için reçeteleri tanımlama, reçetenin detaylarını (kullanılan hammaddeleri ve miktarlarını) ekleme, silme ve düzenleme.
5.  **Alım Fişi Girişi:** Hammadde ve ürün alımlarının miktarlarını, birimlerini ve fiyatlarını kaydetme.
6.  **Gider Girişi:** İşletmenin genel (kira, maaş, faturalar vb.) giderlerini kaydetme.
7.  **Satılan Ürün Kaydı:** Belirli bir dönemde satılan porsiyonların miktarlarını ve satış fiyatlarını kaydetme.
8.  **Analiz ve Raporlama:** Girilen verilere dayanarak ürün/porsiyon maliyetlerini, toplam alımları, giderleri, satış gelirlerini ve kâr/zararı analiz etme ve raporlama.
9.  **Kullanıcı Yönetimi:** (Gelecekteki bir özellik olabilir) Kullanıcıların sisteme erişimini yönetme.

## Kullanılan Teknolojiler

*   **Platform:** Electron (Çoklu Platform Masaüstü Uygulaması)
*   **Programlama Dili:** JavaScript (Renderer Süreci: HTML, CSS, JavaScript)
*   **Ana Süreç Runtime:** Node.js
*   **Veri Tabanı:** SQLite (Dosya Tabanlı Veri Tabanı)
*   **Veri Tabanı Erişim:** `sqlite3` Node.js kütüphanesi
*   **Kullanıcı Arayüzü Framework:** Temel HTML/CSS/JS + Tabler Tema
*   **Bildirimler:** Toastr JavaScript kütüphanesi
*   **JS Bağımlılığı:** jQuery (Toastr için)
*   **Modal Onay:** Tabler Modal Bileşeni (`index.html` içinde genel onay modalı)
*   **Paket Yönetimi:** npm (Node Package Manager)

## Proje Yapısı (Mevcut Durum)

RestoranMaliyetApp/
├── assets/ # Tema (Tabler), Toastr, jQuery, ikonlar vb. dosyaları
│ ├── css/
│ ├── js/
│ └── toastr/
├── main/ # Electron Ana Süreç Modülleri
│ ├── db.js # Veri tabanı bağlantısı ve temel CRUD fonksiyonları, DB initialize
│ └── ipcHandlers.js # Renderer'dan gelen IPC mesajlarını işleyen handler'lar (Ürünler, Birimler, Porsiyonlar, Reçeteler, Reçete Detayları)
├── renderer/ # Electron Renderer Süreci Modülleri
│ ├── birimler.js # Birim yönetimi sayfasının JavaScript kodları (Ekleme, Listeleme, Düzenleme, Silme)
│ ├── porsiyonlar.js # Porsiyon yönetimi sayfasının JavaScript kodları (Dropdown doldurma, Ekleme, Listeleme, Düzenleme, Silme)
│ └── receler.js # Reçete yönetimi sayfasının JavaScript kodları (Dropdown doldurma, Ekleme, Listeleme, Ana Reçete Düzenleme/Silme, Detay Görüntüleme, Detay Ekleme, Detay Silme, Detay Düzenleme)
├── views/ # Uygulama sayfalarının HTML şablonları
│ ├── birimler.html # Birim yönetimi sayfası HTML'i
│ ├── porsiyonlar.html# Porsiyon yönetimi sayfası HTML'i
│ └── receler.html # Reçete yönetimi sayfası HTML'i
├── index.html # Uygulamanın ana HTML layout'u (menü, içerik alanı, genel JS/CSS/tema yüklemesi, Modal yapıları)
├── preload.js # Ana ve Renderer süreçleri arasında güvenli iletişim köprüsü (Güncel handler'lar)
├── style.css # Uygulamaya özel CSS stilleri
├── package.json # Proje meta bilgileri ve bağımlılıkları
├── package-lock.json # Bağımlılıkların kilit dosyası
└── node_modules/ # npm ile yüklenen kütüphaneler

## Veri Modeli (Güncel Plan)

... (Veri modeli kısmı aynı kalıyor - Lütfen bu kısmı kendi projenizdeki güncel haliyle değiştirin veya olduğu gibi bırakın)

## Tamamlanan Adımlar (Güncel)

1.  Temel Electron Projesi Kurulumu (Node.js, npm, Electron, VS Code).
2.  Temel Pencere Oluşturma ve Uygulama Başlatma Mantığı.
3.  SQLite Veri Tabanı Entegrasyonu ve Tüm Tabloların Oluşturulması (`main/db.js`'deki `initializeDatabase`).
4.  IPC (Inter-Process Communication) Altyapısı Kurulumu (`preload.js` ve `main/ipcHandlers.js`).
5.  Kullanıcı Arayüzü için Tabler Tema Entegrasyonu.
6.  Bildirimler için Toastr Kütüphanesi Entegrasyonu.
7.  Modal Onay Kutusu Entegrasyonu (Silme işlemleri için, `index.html`'de genel modal).
8.  Ana Layout ve Menü Yapısı Oluşturma (`index.html`).
9.  Renderer'da Sayfa Yükleme Mekanizması (`renderer.js`'deki `loadPage` fonksiyonu).
10. Menü Navigasyonu ve Aktiflik Durumu Yönetimi.
11. **Ürün/Hammadde Yönetimi:**
    *   Sayfa Oluşturma (`views/urunler.html`, `renderer/urunler.js`).
    *   Ürün Ekleme (`add-urun` handler'ı).
    *   Ürün Listeleme (`get-urunler` handler'ı, `displayUrunler`).
    *   Ürün Silme (`deleteUrun` handler'ı, modal onay).
    *   Ürün Düzenleme (`updateUrun` handler'ı, form doldurma).
    *   Aynı Ürün Adının Tekrar Kaydedilmesini Engelleme (`UNIQUE COLLATE NOCASE`).
12. **Birim Yönetimi:**
    *   Sayfa Oluşturma (`views/birimler.html`, `renderer/birimler.js`).
    *   Birim Ekleme (`add-birim` handler'ı).
    *   Birim Listeleme (`get-birimler` handler'ı, `displayBirimler`).
    *   Birim Silme (`deleteBirim` handler'ı, modal onay, FOREIGN KEY kontrolü).
    *   Birim Düzenleme (`updateBirim` handler'ı, form doldurma, UNIQUE kontrolü).
13. **Porsiyon Yönetimi:**
    *   Sayfa Oluşturma (`views/porsiyonlar.html`, `renderer/porsiyonlar.js`).
    *   Porsiyon Ekleme (`addPorsiyon` handler'ı).
    *   Porsiyon Listeleme (`getPorsiyonlar` handler'ı, `displayPorsiyonlar` JOIN ile Son Ürün Adı).
    *   Dropdown Doldurma (Son Ürünler, Birimler).
    *   Porsiyon Silme (`deletePorsiyon` handler'ı, modal onay, reçetede kullanım kontrolü).
    *   Porsiyon Düzenleme (`updatePorsiyon` handler'ı, form doldurma, UNIQUE kontrolü).
14. **Reçete Yönetimi:**
    *   Sayfa Oluşturma (`views/receler.html`, `renderer/receler.js`).
    *   Reçete Listeleme (`getReceteler` handler'ı).
    *   Yeni Reçete Ekleme (`addRecete` handler'ı, boş reçete adı için "Varsayılan" atama).
    *   Reçete Silme (`deleteRecete` handler'ı, modal onay).
    *   **Ana Reçete Düzenleme** (`updateRecete` handler'ı, form doldurma, UNIQUE kontrolü).
    *   Reçete Detaylarını Görüntüleme (`getReceteDetaylari` handler'ı).
    *   Reçete Detayları Ekleme (`addReceteDetay` handler'ı).
    *   Reçete Detayları Silme (`deleteReceteDetay` handler'ı, modal onay).
    *   Reçete Detayları Düzenleme (`updateReceteDetay` handler'ı, form doldurma).
    *   Dropdownların Doldurulması (Porsiyonlar, Hammaddeler, Birimler).
    *   Görünüm Düzenlemeleri (Form/Liste Ayrımı, Detay Kartı Düzeni, Başlık Güncelleme).
15. **Alım Yönetimi:**
    *   Veritabanına `alimlar` tablosu eklendi (`fisNo` alanı dahil).
    *   `views/alimlar.html` sayfası oluşturuldu (Form solda, liste sağda, ayrı kartlarda).
    *   Form butonları ve tablo eylem butonları standart stile getirildi.
    *   `renderer/alimlar.js` dosyası oluşturuldu:
        *   Dropdown'ların (Ürünler, Birimler) doldurulması.
        *   Toplam tutarın otomatik hesaplanması.
        *   Alım ekleme, listeleme, düzenleme ve silme işlevleri.
        *   Onay modalı kullanımı.
    *   `main/ipcHandlers.js` ve `preload.js` dosyalarına `addAlim`, `getAlimlar`, `updateAlim`, `deleteAlim` handler'ları/API'leri eklendi.
    *   Menüye "Alımlar" linki eklendi ve sayfa yükleme mantığı entegre edildi.

## Gelecek Adımlar (Yapılacaklar)

Planlanan gelecek adımlar ve tamamlanacak özellikler sırasıyla (önceliklendirme tartışılabilir):

1.  **Tablo Güncelleme ve Silme (Kalan Sayfalar):**
    *   ~~Birimler için silme ve düzenleme işlevlerini ekleme.~~ `✓ TAMAMLANDI`
    *   ~~Porsiyonlar için silme ve düzenleme işlevlerini ekleme.~~ `✓ TAMAMLANDI`
    *   Alımlar, Giderler, Satışlar için düzenleme ve silme işlevlerini ekleme.
2.  **Birim çevrim mantığının** (Hammadde kullanım biriminden alış birimine çevirme) Reçete Maliyeti hesaplanırken kodda uygulanması.
3.  **Alım Fişi Girişi:**
    *   `views/alimlar.html` sayfası oluşturma.
    *   `renderer/alimlar.js` dosyası oluşturma.
    *   `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme.
    *   Ekleme, Listeleme, Düzenleme, Silme işlevleri.
4.  **Gider Girişi:**
    *   `views/giderler.html` sayfası oluşturma.
    *   `renderer/giderler.js` dosyası oluşturma.
    *   `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme.
    *   Ekleme, Listeleme, Düzenleme, Silme işlevleri.
5.  **Satılan Ürün Kaydı:**
    *   `views/satislar.html` sayfası oluşturma.
    *   `renderer/satislar.js` dosyası oluşturma.
    *   `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme.
    *   Ekleme, Listeleme, Düzenleme, Silme işlevleri.
6.  **Analiz ve Raporlama:**
    *   `views/analiz.html` sayfası oluşturma.
    *   `renderer/analiz.js` dosyası oluşturma (Veri tabanından verileri çekip hesaplamaları yapma ve grafik/tablo şeklinde gösterme).
    *   `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme (Özel SQL sorguları gerektirecek).
    *   Maliyet, Alım, Gider, Satış ve Kâr/Zarar raporlarını oluşturma.
7.  **Uygulama Ayarları:** `ayarlar` tablosunu kullanarak genel ayarları yönetme arayüzü.
8.  **Hata Yönetimi İyileştirme:** Daha kapsamlı hata yakalama ve loglama.
9.  **Uygulama İyileştirmeleri:** Kullanıcı arayüzü detayları, performans optimizasyonları vb.
10. **Dağıtım:** Uygulamayı farklı işletim sistemlerinde çalıştırılabilir hale getirme (Electron-builder gibi araçlarla).
11. **Yedekleme/Geri Yükleme:** Veri tabanının yedeklenmesi ve geri yüklenmesi işlevi.
12. **Kullanıcı Yönetimi:** Rol ve izin tabanlı erişim kontrolü.
13. **Splash Screen ve Giriş Ekranı:** Uygulama başlatma akışına splash screen ve giriş ekranı ekleme.