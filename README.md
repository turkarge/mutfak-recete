# Restoran Maliyet ve Reçete Yönetimi Uygulaması

Bu belge, Electron kullanarak geliştirilen restoran maliyet ve reçete yönetimi uygulamasının mevcut durumunu, mimarisini, veri modelini ve gelecek adımlarını detaylandırmaktadır.

## Uygulama Özellikleri

Uygulamanın temel işlevleri şunlardır:

1. **Ürün/Hammadde Kaydı:** Restoranın kullandığı hammadde ve sattığı son ürünlerin temel bilgilerini kaydetme, listeleme ve silme.
2. **Birim Yönetimi:** Ölçü birimlerini ve birbirleri arasındaki çevrim oranlarını tanımlama, listeleme ve ekleme.
3. **Porsiyon Yönetimi:** Son ürünlerin farklı porsiyon veya varyantlarını tanımlama, listeleme ve ekleme.
4.  **Reçete Oluşturma:** Her bir porsiyonun hangi hammaddeleri hangi miktarda içerdiğini belirleme.
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
*   **Paket Yönetimi:** npm (Node Package Manager)

## Proje Yapısı (Mevcut Durum)

RestoranMaliyetApp/
├── assets/ # Tema (Tabler), Toastr, jQuery, ikonlar vb. dosyaları
│ ├── css/
│ ├── js/
│ └── toastr/
├── main/ # Electron Ana Süreç Modülleri
│ ├── db.js # Veri tabanı bağlantısı ve temel CRUD fonksiyonları, DB initialize
│ └── ipcHandlers.js # Renderer'dan gelen IPC mesajlarını işleyen handler'lar (Ürünler, Birimler, Porsiyonlar)
├── renderer/ # Electron Renderer Süreci Modülleri
│ ├── birimler.js # Birim yönetimi sayfasının JavaScript kodları (Ekleme, Listeleme)
│ ├── porsiyonlar.js # Porsiyon yönetimi sayfasının JavaScript kodları (Dropdown doldurma, Ekleme, Listeleme)
│ └── urunler.js # Ürün yönetimi sayfasının JavaScript kodları (Ekleme, Listeleme, Silme)
├── views/ # Uygulama sayfalarının HTML şablonları
│ ├── birimler.html # Birim yönetimi sayfası HTML'i
│ ├── porsiyonlar.html# Porsiyon yönetimi sayfası HTML'i
│ └── urunler.html # Ürün yönetimi sayfası HTML'i
├── index.html # Uygulamanın ana HTML layout'u (menü, içerik alanı, genel JS/CSS/tema yüklemesi)
├── preload.js # Ana ve Renderer süreçleri arasında güvenli iletişim köprüsü (Güncel handler'lar)
├── style.css # Uygulamaya özel CSS stilleri
├── package.json # Proje meta bilgileri ve bağımlılıkları
├── package-lock.json # Bağımlılıkların kilit dosyası
└── node_modules/ # npm ile yüklenen kütüphaneler

## Veri Modeli (Güncel Plan)

Uygulamanın veri tabanı yapısı SQLite üzerinde kuruludur ve aşağıdaki tabloları içerecektir:

*   **`urunler`** (Temel Ürün/Hammadde Tanımlamaları)
    *   `id` INTEGER PRIMARY KEY AUTOINCREMENT
    *   `ad` TEXT NOT NULL UNIQUE COLLATE NOCASE
    *   `tur` TEXT NOT NULL CHECK (tur IN ('Hammadde', 'Son Ürün'))
*   **`birimler`** (Ölçü Birimleri ve Birbirleri Arasındaki İlişkiler/Çevrim Mantığı Kodda Yönetilecek)
    *   `id` INTEGER PRIMARY KEY AUTOINCREMENT
    *   `birimAdi` TEXT NOT NULL UNIQUE
    *   `kisaAd` TEXT NOT NULL UNIQUE
    *   `anaBirimKisaAd` TEXT (Bu birimin ait olduğu ana birimin `kisaAd`'ı - FOREIGN KEY to `birimler.kisaAd` ?) - *SQLite'da FOREIGN KEY kendi kendine referans veremez, mantık kodda yönetilmeli veya bu alan sadece bir string olmalı.* Şimdilik sadece string.
*   **`porsiyonlar`** (Son Ürünlerin Farklı Porsiyon/Varyant Tanımları)
    *   `id` INTEGER PRIMARY KEY AUTOINCREMENT
    *   `sonUrunId` INTEGER NOT NULL (FOREIGN KEY to `urunler.id` where `tur` is 'Son Ürün')
    *   `porsiyonAdi` TEXT NOT NULL
    *   `satisBirimiKisaAd` TEXT NOT NULL (FOREIGN KEY to `birimler.kisaAd`)
    *   `varsayilanSatisFiyati` REAL
    *   UNIQUE(`sonUrunId`, `porsiyonAdi`)
*   **`receler`** (Porsiyonlara Bağlı Reçete Başlıkları - Bir Porsiyonun Birden Fazla Reçetesi Olabilirse)
    *   `id` INTEGER PRIMARY KEY AUTOINCREMENT
    *   `porsiyonId` INTEGER NOT NULL (FOREIGN KEY to `porsiyonlar.id`)
    *   `receteAdi` TEXT (Opsiyonel - Varsayılan reçete için null veya boş bırakılabilir)
    *   UNIQUE(`porsiyonId`, `receteAdi`) - *receteAdi null ise UNIQUE kısıtlaması farklı porsiyonlar için birden fazla null değere izin verebilir, bu durum yönetilmeli.*
*   **`receteDetaylari`** (Reçetede Kullanılan Hammaddeler ve Miktarları)
    *   `id` INTEGER PRIMARY KEY AUTOINCREMENT
    *   `receteId` INTEGER NOT NULL (FOREIGN KEY to `receler.id`)
    *   `hammaddeId` INTEGER NOT NULL (FOREIGN KEY to `urunler.id` where `tur` is 'Hammadde')
    *   `miktar` REAL NOT NULL
    *   `birimKisaAd` TEXT NOT NULL (FOREIGN KEY to `birimler.kisaAd` - reçetede kullanılan birim)
*   **`alimlar`** (Hammadde ve Ürün Alımlarının Kaydı)
    *   `id` INTEGER PRIMARY KEY AUTOINCREMENT
    *   `urunId` INTEGER NOT NULL (FOREIGN KEY to `urunler.id`)
    *   `tarih` TEXT NOT NULL ("YYYY-MM-DD" formatı)
    *   `miktar` REAL NOT NULL
    *   `birimKisaAd` TEXT NOT NULL (FOREIGN KEY to `birimler.kisaAd`)
    *   `birimFiyat` REAL NOT NULL
    *   `toplamFiyat` REAL NOT NULL (Miktar * Birim Fiyat - Bu alan hesaplanabilir, saklamak performans için iyi olabilir)
*   **`giderler`** (İşletme Giderlerinin Kaydı)
    *   `id` INTEGER PRIMARY KEY AUTOINCREMENT
    *   `tarih` TEXT NOT NULL ("YYYY-MM-DD" formatı)
    *   `giderKalemi` TEXT NOT NULL (Kira, Maaş, Elektrik vb.)
    *   `aciklama` TEXT (Opsiyonel)
    *   `tutar` REAL NOT NULL
*   **`satislar`** (Satılan Porsiyon/Varyantların Kaydı)
    *   `id` INTEGER PRIMARY KEY AUTOINCREMENT
    *   `porsiyonId` INTEGER NOT NULL (FOREIGN KEY to `porsiyonlar.id`)
    *   `tarih` TEXT NOT NULL ("YYYY-MM-DD HH:MM:SS" formatı daha iyi olabilir)
    *   `miktar` REAL NOT NULL (Kaç adet/porsiyon satıldı?)
    *   `satisFiyati` REAL NOT NULL (Satış başına elde edilen fiyat)
*   **`ayarlar`** (Genel Uygulama Ayarları - Opsiyonel)
    *   `anahtar` TEXT PRIMARY KEY
    *   `deger` TEXT

*Veri Modeli Notları:*
*   `birimler.anaBirimKisaAd` FOREIGN KEY kısıtlaması kendi kendine referans veremediği için kaldırıldı. Veri bütünlüğü kodda sağlanmalı.
*   `receler.receteAdi` null yönetimi dikkate alınmalı. Birden fazla null değeri UNIQUE kısıtlamasını ihlal etmeyebilir.

## Tamamlanan Adımlar

1.  Temel Electron Projesi Kurulumu (Node.js, npm, Electron, VS Code).
2.  Temel Pencere Oluşturma ve Uygulama Başlatma Mantığı.
3.  SQLite Veri Tabanı Entegrasyonu ve Tüm Tabloların Oluşturulması (`main/db.js`'deki `initializeDatabase`).
4.  IPC (Inter-Process Communication) Altyapısı Kurulumu (`preload.js` ve `main/ipcHandlers.js`).
5.  Kullanıcı Arayüzü için Tabler Tema Entegrasyonu.
6.  Bildirimler için Toastr Kütüphanesi Entegrasyonu.
7.  Ana Layout ve Menü Yapısı Oluşturma (`index.html`).
8.  HTML Dosyalarını Ana Süreç'ten Okuma ve Renderer'a Gönderme Mekanizması (`get-page-html` handler'ı).
9.  Renderer'da Sayfa Yükleme Mekanizması (`renderer.js`'deki `loadPage` fonksiyonu).
10. Menü Navigasyonu ve Aktiflik Durumu Yönetimi.
11. Ürün/Hammadde Yönetimi Sayfasının Oluşturulması (`views/urunler.html`, `renderer/urunler.js`).
12. Ürün Ekleme Formu ve Veri Tabanına Kayıt İşlevi (`add-urun` handler'ı).
13. Ürün Listeleme ve Tabloda Görüntüleme İşlevi (`get-urunler` handler'ı, `displayUrunler`).
14. **Ürün Silme İşlevi** (Butonlar, Onay, `deleteUrun` handler'ı).
15. Aynı Ürün Adının Tekrar Kaydedilmesini Engelleme (`UNIQUE COLLATE NOCASE`).
16. Birim Yönetimi Sayfasının Oluşturulması (`views/birimler.html`, `renderer/birimler.js`).
17. Birim Ekleme Formu ve Veri Tabanına Kayıt İşlevi (`add-birim` handler'ı).
18. Birim Listeleme ve Tabloda Görüntüleme İşlevi (`get-birimler` handler'ı, `displayBirimler`).
19. Porsiyon Yönetimi Sayfasının Oluşturulması (`views/porsiyonlar.html`, `renderer/porsiyonlar.js`).
20. Porsiyon Ekleme Formu ve Veri Tabanına Kayıt İşlevi (`addPorsiyon` handler'ı).
21. Porsiyon Listeleme ve Tabloda Görüntüleme İşlevi (`getPorsiyonlar` handler'ı, `displayPorsiyonlar` JOIN ile Son Ürün Adı getiriliyor).
22. Porsiyon Ekleme Formu için Son Ürünler Dropdown'ını Doldurma (`get-urunler-by-tur` handler'ı).
23. Porsiyon Ekleme Formu için Birimler Dropdown'ını Doldurma (`getBirimler` handler'ı).
24. Hata Yakalama ve Kullanıcıya Toastr ile Bildirim Verme.

## Gelecek Adımlar (Yapılacaklar)

Planlanan gelecek adımlar ve tamamlanacak özellikler sırasıyla (önceliklendirme tartışılabilir):

1.  **Reçete Yönetimi:**
    *   `views/receler.html` sayfası oluşturma (Porsiyonlara bağlı reçeteleri ve detaylarını gösterme/ekleme formu).
    *   `renderer/receler.js` dosyası oluşturma.
    *   `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme (`getRecetelerByPorsiyon`, `addRecete`, `addReceteDetay`, vb.).
    *   Bu ekranda Hammaddelerin seçilmesi gerekecek (dropdown doldurma).
    *   **Birim çevrim mantığının** (Hammadde kullanım biriminden alış birimine çevirme) Reçete Detayları girişi sırasında veya maliyet hesaplanırken kodda uygulanması.
2.  **Alım Fişi Girişi:**
    *   `views/alimlar.html` sayfası oluşturma.
    *   `renderer/alimlar.js` dosyası oluşturma.
    *   `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme.
3.  **Gider Girişi:**
    *   `views/giderler.html` sayfası oluşturma.
    *   `renderer/giderler.js` dosyası oluşturma.
    *   `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme.
4.  **Satılan Ürün Kaydı:**
    *   `views/satislar.html` sayfası oluşturma.
    *   `renderer/satislar.js` dosyası oluşturma.
    *   `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme.
5.  **Tablo Güncelleme ve Silme:**
    *   Birimler için düzenleme ve silme işlevlerini ekleme.
    *   Porsiyonlar için düzenleme ve silme işlevlerini ekleme.
    *   Reçete Yönetimi, Alımlar, Giderler, Satışlar için düzenleme ve silme işlevlerini ekleme.
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