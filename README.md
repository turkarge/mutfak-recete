# Restoran Maliyet ve Reçete Yönetimi Uygulaması

Bu belge, Electron kullanarak geliştirilen restoran maliyet ve reçete yönetimi uygulamasının mevcut durumunu, mimarisini, veri modelini ve gelecek adımlarını detaylandırmaktadır.

## Uygulama Özellikleri

Uygulamanın temel işlevleri şunlardır:

1.  **Ürün/Hammadde Kaydı:** Restoranın kullandığı hammadde ve sattığı son ürünlerin temel bilgilerini kaydetme, listeleme ve silme.
2.  **Birim Yönetimi:** Ölçü birimlerini ve birbirleri arasındaki çevrim oranlarını tanımlama, listeleme ve ekleme.
3.  **Porsiyon Yönetimi:** Son ürünlerin farklı porsiyon veya varyantlarını tanımlama, listeleme ve ekleme.
4.  **Reçete Yönetimi:** Belirli bir porsiyon için reçeteleri tanımlama, reçetenin detaylarını (kullanılan hammaddeleri ve miktarlarını) ekleme ve silme.
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
*   **Modal Onay:** Tabler Modal Bileşeni
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
│ ├── birimler.js # Birim yönetimi sayfasının JavaScript kodları (Ekleme, Listeleme)
│ ├── porsiyonlar.js # Porsiyon yönetimi sayfasının JavaScript kodları (Dropdown doldurma, Ekleme, Listeleme)
│ └── receler.js # Reçete yönetimi sayfasının JavaScript kodları (Dropdown doldurma, Ekleme, Listeleme, Detay Görüntüleme, Detay Ekleme, Detay Silme)
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

Uygulamanın veri tabanı yapısı SQLite üzerinde kuruludur ve aşağıdaki tabloları içerecektir:

*   **`urunler`** (Temel Ürün/Hammadde Tanımlamaları)
    *   `id` INTEGER PRIMARY KEY AUTOINCREMENT
    *   `ad` TEXT NOT NULL UNIQUE COLLATE NOCASE
    *   `tur` TEXT NOT NULL CHECK (tur IN ('Hammadde', 'Son Ürün'))
*   **`birimler`** (Ölçü Birimleri ve Birbirleri Arasındaki İlişkiler/Çevrim Mantığı Kodda Yönetilecek)
    *   `id` INTEGER PRIMARY KEY AUTOINCREMENT
    *   `birimAdi` TEXT NOT NULL UNIQUE
    *   `kisaAd` TEXT NOT NULL UNIQUE
    *   `anaBirimKisaAd` TEXT (Bu birimin ait olduğu ana birimin `kisaAd`'ı - *String, FOREIGN KEY değil*)
*   **`porsiyonlar`** (Son Ürünlerin Farklı Porsiyon/Varyant Tanımları)
    *   `id` INTEGER PRIMARY KEY AUTOINCREMENT
    *   `sonUrunId` INTEGER NOT NULL (FOREIGN KEY to `urunler.id` where `tur` is 'Son Ürün')
    *   `porsiyonAdi` TEXT NOT NULL
    *   `satisBirimiKisaAd` TEXT NOT NULL (FOREIGN KEY to `birimler.kisaAd`)
    *   `varsayilanSatisFiyati` REAL
    *   UNIQUE(`sonUrunId`, `porsiyonAdi`)
*   **`receler`** (Porsiyonlara Bağlı Reçete Başlıkları)
    *   `id` INTEGER PRIMARY KEY AUTOINCREMENT
    *   `porsiyonId` INTEGER NOT NULL (FOREIGN KEY to `porsiyonlar.id`)
    *   `receteAdi` TEXT (Opsiyonel)
    *   UNIQUE(`porsiyonId`, `receteAdi`) - *receteAdi null ise UNIQUE kısıtlaması farklı porsiyonlar için birden fazla null değere izin verebilir.*
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
    *   `toplamFiyat` REAL NOT NULL (Miktar * Birim Fiyat)
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
*   `birimler.anaBirimKisaAd` FOREIGN KEY kısıtlaması kaldırıldı. Veri bütünlüğü kodda sağlanmalı.
*   `receler.receteAdi` null yönetimi dikkate alınmalı.

## Tamamlanan Adımlar (Güncel)

1.  Temel Electron Projesi Kurulumu (Node.js, npm, Electron, VS Code).
2.  Temel Pencere Oluşturma ve Uygulama Başlatma Mantığı.
3.  SQLite Veri Tabanı Entegrasyonu ve Tüm Tabloların Oluşturulması (`main/db.js`'deki `initializeDatabase`).
4.  IPC (Inter-Process Communication) Altyapısı Kurulumu (`preload.js` ve `main/ipcHandlers.js`).
5.  Kullanıcı Arayüzü için Tabler Tema Entegrasyonu.
6.  Bildirimler için Toastr Kütüphanesi Entegrasyonu.
7.  Modal Onay Kutusu Entegrasyonu (Silme işlemleri için).
8.  Ana Layout ve Menü Yapısı Oluşturma (`index.html`).
9.  Renderer'da Sayfa Yükleme Mekanizması (`renderer.js`'deki `loadPage` fonksiyonu).
10. Menü Navigasyonu ve Aktiflik Durumu Yönetimi.
11. Ürün/Hammadde Yönetimi Sayfasının Oluşturulması (`views/urunler.html`, `renderer/urunler.js`).
12. Ürün Ekleme Formu ve Veri Tabanına Kayıt İşlevi (`add-urun` handler'ı).
13. Ürün Listeleme ve Tabloda Görüntüleme İşlevi (`get-urunler` handler'ı, `displayUrunler`).
14. **Ürün Silme İşlevi** (Butonlar, Modal Onay, `deleteUrun` handler'ı) - **TAMAMLANDI**
15. Aynı Ürün Adının Tekrar Kaydedilmesini Engelleme (`UNIQUE COLLATE NOCASE`).
16. Birim Yönetimi Sayfasının Oluşturulması (`views/birimler.html`, `renderer/birimler.js`).
17. Birim Ekleme Formu ve Veri Tabanına Kayıt İşlevi (`add-birim` handler'ı).
18. Birim Listeleme ve Tabloda Görüntüleme İşlevi (`get-birimler` handler'ı, `displayBirimler`).
19. Porsiyon Yönetimi Sayfasının Oluşturulması (`views/porsiyonlar.html`, `renderer/porsiyonlar.js`).
20. Porsiyon Ekleme Formu ve Veri Tabanına Kayıt İşlevi (`addPorsiyon` handler'ı).
21. Porsiyon Listeleme ve Tabloda Görüntüleme İşlevi (`getPorsiyonlar` handler'ı, `displayPorsiyonlar` JOIN ile Son Ürün Adı getiriliyor).
22. Porsiyon Ekleme Formu için Son Ürünler Dropdown'ını Doldurma (`get-urunler-by-tur` handler'ı).
23. Porsiyon Ekleme Formu için Birimler Dropdown'ını Doldurma (`getBirimler` handler'ı).
24. **Reçete Yönetimi Sayfasının Temel İşlevlerinin Oluşturulması** (`views/receler.html`, `renderer/receler.js`)
    *   Reçete Listeleme (`getReceteler` handler'ı).
    *   Yeni Reçete Ekleme (`addRecete` handler'ı).
    *   Reçete Detaylarını Görüntüleme (`getReceteDetaylari` handler'ı).
    *   Reçete Detayları Ekleme (`addReceteDetay` handler'ı).
    *   Reçete Detayları Silme (`deleteReceteDetay` handler'ı).
    *   Dropdownların Doldurulması (Porsiyonlar, Hammaddeler, Birimler).
    *   Görünüm Düzenlemeleri (Form/Liste Ayrımı, Detay Kartı Düzeni, Başlık Güncelleme, Card Başlık Rengi).
    *   Modal Onay Kutusu Entegrasyonu (Silme işlemleri için).
    *   Renderer tarafında `renderer/receler.js` kodunun yazılması.
    *   Main/IPC handler'larının yazılması.
    *   Preload güncellemeleri.
    *   Menü linki eklenmesi.

## Gelecek Adımlar (Yapılacaklar)

Planlanan gelecek adımlar ve tamamlanacak özellikler sırasıyla (önceliklendirme tartışılabilir):

1.  **Reçete Yönetimi İçin Kalan İşlevler:**
    *   Reçete Silme (Buton ve `deleteRecete` handler'ı - Şu an sadece detay silme var).
    *   Reçete Düzenleme (Form doldurma ve `updateRecete` handler'ı).
    *   Reçete Detayları Düzenleme (Buton, form doldurma ve `updateReceteDetay` handler'ı).
2.  **Tablo Güncelleme ve Silme (Kalan Sayfalar):**
    *   Birimler için düzenleme ve silme işlevlerini ekleme.
    *   Porsiyonlar için düzenleme ve silme işlevlerini ekleme.
    *   Reçete Yönetimi (ana reçeteyi silme ve düzenleme), Alımlar, Giderler, Satışlar için düzenleme ve silme işlevlerini ekleme.
3.  **Birim çevrim mantığının** (Hammadde kullanım biriminden alış birimine çevirme) Reçete Maliyeti hesaplanırken kodda uygulanması.
4.  **Alım Fişi Girişi:**
    *   `views/alimlar.html` sayfası oluşturma.
    *   `renderer/alimlar.js` dosyası oluşturma.
    *   `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme.
    *   Ekleme, Listeleme, Düzenleme, Silme işlevleri.
5.  **Gider Girişi:**
    *   `views/giderler.html` sayfası oluşturma.
    *   `renderer/giderler.js` dosyası oluşturma.
    *   `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme.
    *   Ekleme, Listeleme, Düzenleme, Silme işlevleri.
6.  **Satılan Ürün Kaydı:**
    *   `views/satislar.html` sayfası oluşturma.
    *   `renderer/satislar.js` dosyası oluşturma.
    *   `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme.
    *   Ekleme, Listeleme, Düzenleme, Silme işlevleri.
7.  **Analiz ve Raporlama:**
    *   `views/analiz.html` sayfası oluşturma.
    *   `renderer/analiz.js` dosyası oluşturma (Veri tabanından verileri çekip hesaplamaları yapma ve grafik/tablo şeklinde gösterme).
    *   `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme (Özel SQL sorguları gerektirecek).
    *   Maliyet, Alım, Gider, Satış ve Kâr/Zarar raporlarını oluşturma.
8.  **Uygulama Ayarları:** `ayarlar` tablosunu kullanarak genel ayarları yönetme arayüzü.
9.  **Hata Yönetimi İyileştirme:** Daha kapsamlı hata yakalama ve loglama.
10. **Uygulama İyileştirmeleri:** Kullanıcı arayüzü detayları, performans optimizasyonları vb.
11. **Dağıtım:** Uygulamayı farklı işletim sistemlerinde çalıştırılabilir hale getirme (Electron-builder gibi araçlarla).
12. **Yedekleme/Geri Yükleme:** Veri tabanının yedeklenmesi ve geri yüklenmesi işlevi.
13. **Kullanıcı Yönetimi:** Rol ve izin tabanlı erişim kontrolü.

Bu güncellenmiş README.md dosyasını projenizin kök klasörüne kaydedebilirsiniz.

Hazır olduğunuzda, bu listedeki ilk madde olan **Reçete Yönetimi İçin Kalan İşlevler** (Reçete Silme ve Düzenleme, Detay Düzenleme) ile devam edebiliriz. Bu, Reçete Yönetimi bölümünü tamamen tamamlamamızı sağlayacak.

Ne dersin, Reçete Yönetimi'nin kalan işlevlerine geçelim mi?