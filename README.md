# Restoran Maliyet ve Reçete Yönetimi Uygulaması

Bu belge, Electron kullanarak geliştirilen restoran maliyet ve reçete yönetimi uygulamasının mevcut durumunu, mimarisini, veri modelini ve gelecek adımlarını detaylandırmaktadır.

## Uygulama Özellikleri

Uygulamanın temel işlevleri şunlardır:

1. **Ürün/Hammadde Kaydı:** Restoranın kullandığı hammadde ve sattığı son ürünlerin temel bilgilerini kaydetme.
2. **Birim Yönetimi:** Ölçü birimlerini ve birbirleri arasındaki çevrim oranlarını tanımlama.
3. **Porsiyon Yönetimi:** Son ürünlerin farklı porsiyon veya varyantlarını tanımlama.
4. **Reçete Oluşturma:** Her bir porsiyonun hangi hammaddeleri hangi miktarda içerdiğini belirleme.
5. **Alım Fişi Girişi:** Hammadde ve ürün alımlarının miktarlarını, birimlerini ve fiyatlarını kaydetme.
6. **Gider Girişi:** İşletmenin genel (kira, maaş, faturalar vb.) giderlerini kaydetme.
7. **Satılan Ürün Kaydı:** Belirli bir dönemde satılan porsiyonların miktarlarını ve satış fiyatlarını kaydetme.
8. **Analiz ve Raporlama:** Girilen verilere dayanarak ürün/porsiyon maliyetlerini, toplam alımları, giderleri, satış gelirlerini ve kâr/zararı analiz etme ve raporlama.
9. **Kullanıcı Yönetimi:** (Gelecekteki bir özellik olabilir) Kullanıcıların sisteme erişimini yönetme.

## Kullanılan Teknolojiler

* **Platform:** Electron (Çoklu Platform Masaüstü Uygulaması)
* **Programlama Dili:** JavaScript (Renderer Süreci: HTML, CSS, JavaScript)
* **Ana Süreç Runtime:** Node.js
* **Veri Tabanı:** SQLite (Dosya Tabanlı Veri Tabanı)
* **Veri Tabanı Erişim:** `sqlite3` Node.js kütüphanesi
* **Kullanıcı Arayüzü Framework:** Temel HTML/CSS/JS + Tabler Tema
* **Bildirimler:** Toastr JavaScript kütüphanesi
* **Paket Yönetimi:** npm (Node Package Manager)

## Proje Yapısı (Mevcut Durum)

RestoranMaliyetApp/
├── assets/ # Tema (Tabler), Toastr, jQuery, ikonlar vb. dosyaları
│ ├── css/
│ ├── js/
│ └── toastr/
├── main/ # Electron Ana Süreç Modülleri
│ ├── db.js # Veri tabanı bağlantısı ve temel CRUD fonksiyonları
│ └── ipcHandlers.js # Renderer'dan gelen IPC mesajlarını işleyen handler'lar
├── renderer/ # Electron Renderer Süreci Modülleri
│ └── urunler.js # Ürün yönetimi sayfasının JavaScript kodları
├── views/ # Uygulama sayfalarının HTML şablonları
│ └── urunler.html # Ürün yönetimi sayfası HTML'i
├── index.html # Uygulamanın ana HTML layout'u (menü, içerik alanı)
├── preload.js # Ana ve Renderer süreçleri arasında güvenli iletişim köprüsü
├── style.css # Uygulamaya özel CSS stilleri
├── package.json # Proje meta bilgileri ve bağımlılıkları
├── package-lock.json # Bağımlılıkların kilit dosyası
└── node_modules/ # npm ile yüklenen kütüphaneler

## Veri Modeli (Mevcut ve Planlanan)

Uygulamanın veri tabanı yapısı SQLite üzerinde kuruludur ve aşağıdaki tabloları içerecektir:

* **`urunler`** (Temel Ürün/Hammadde Tanımlamaları)
  * `id` INTEGER PRIMARY KEY AUTOINCREMENT
  * `ad` TEXT NOT NULL UNIQUE COLLATE NOCASE
  * `tur` TEXT NOT NULL CHECK (tur IN ('Hammadde', 'Son Ürün'))
* **`birimler`** (Ölçü Birimleri ve Çevrim Oranları)
  * `id` INTEGER PRIMARY KEY AUTOINCREMENT
  * `birimAdi` TEXT NOT NULL UNIQUE
  * `kisaAd` TEXT NOT NULL UNIQUE
  * `anaBirimKisaAd` TEXT (Bu birimin ait olduğu ana birimin `kisaAd`'ı)
* **`porsiyonlar`** (Son Ürünlerin Farklı Porsiyon/Varyant Tanımları)
  * `id` INTEGER PRIMARY KEY AUTOINCREMENT
  * `sonUrunId` INTEGER NOT NULL (FOREIGN KEY to `urunler.id`)
  * `porsiyonAdi` TEXT NOT NULL
  * `satisBirimiKisaAd` TEXT NOT NULL (FOREIGN KEY to `birimler.kisaAd`)
  * `varsayilanSatisFiyati` REAL
  * UNIQUE(`sonUrunId`, `porsiyonAdi`)
* **`receler`** (Porsiyonlara Bağlı Reçete Başlıkları)
  * `id` INTEGER PRIMARY KEY AUTOINCREMENT
  * `porsiyonId` INTEGER NOT NULL (FOREIGN KEY to `porsiyonlar.id`)
  * `receteAdi` TEXT (Opsiyonel)
  * UNIQUE(`porsiyonId`, `receteAdi`)
* **`receteDetaylari`** (Reçetede Kullanılan Hammaddeler ve Miktarları)
  * `id` INTEGER PRIMARY KEY AUTOINCREMENT
  * `receteId` INTEGER NOT NULL (FOREIGN KEY to `receler.id`)
  * `hammaddeId` INTEGER NOT NULL (FOREIGN KEY to `urunler.id` - türü 'Hammadde' olmalı)
  * `miktar` REAL NOT NULL
  * `birimKisaAd` TEXT NOT NULL (FOREIGN KEY to `birimler.kisaAd` - reçetede kullanılan birim)
* **`alimlar`** (Hammadde ve Ürün Alımlarının Kaydı)
  * `id` INTEGER PRIMARY KEY AUTOINCREMENT
  * `urunId` INTEGER NOT NULL (FOREIGN KEY to `urunler.id`)
  * `tarih` TEXT NOT NULL ("YYYY-MM-DD" formatı)
  * `miktar` REAL NOT NULL
  * `birimKisaAd` TEXT NOT NULL (FOREIGN KEY to `birimler.kisaAd`)
  * `birimFiyat` REAL NOT NULL
  * `toplamFiyat` REAL NOT NULL (Miktar * Birim Fiyat)
* **`giderler`** (İşletme Giderlerinin Kaydı)
  * `id` INTEGER PRIMARY KEY AUTOINCREMENT
  * `tarih` TEXT NOT NULL ("YYYY-MM-DD" formatı)
  * `giderKalemi` TEXT NOT NULL (Kira, Maaş, Elektrik vb.)
  * `aciklama` TEXT (Opsiyonel)
  * `tutar` REAL NOT NULL
* **`satislar`** (Satılan Porsiyon/Varyantların Kaydı)
  * `id` INTEGER PRIMARY KEY AUTOINCREMENT
  * `porsiyonId` INTEGER NOT NULL (FOREIGN KEY to `porsiyonlar.id`)
  * `tarih` TEXT NOT NULL ("YYYY-MM-DD HH:MM:SS" formatı daha iyi olabilir)
  * `miktar` REAL NOT NULL (Kaç adet/porsiyon satıldı?)
  * `satisFiyati` REAL NOT NULL (Satış başına elde edilen fiyat)
* **`ayarlar`** (Genel Uygulama Ayarları - Opsiyonel)
  * `anahtar` TEXT PRIMARY KEY
  * `deger` TEXT

## Tamamlanan Adımlar

1. Temel Electron Projesi Kurulumu (Node.js, npm, Electron, VS Code).
2. Temel Pencere Oluşturma ve Uygulama Başlatma Mantığı.
3. SQLite Veri Tabanı Entegrasyonu ve Tüm Tabloların Oluşturulması (`main/db.js` taşındı).
4. IPC (Inter-Process Communication) Altyapısı Kurulumu (`preload.js` ve `main/ipcHandlers.js`).
5. Kullanıcı Arayüzü için Tabler Tema Entegrasyonu.
6. Bildirimler için Toastr Kütüphanesi Entegrasyonu.
7. Ana Layout ve Menü Yapısı Oluşturma (`index.html`).
8. HTML Dosyalarını Ana Süreç'ten Okuma ve Renderer'a Gönderme Mekanizması (`get-page-html` handler'ı).
9. Renderer'da Sayfa Yükleme Mekanizması (`renderer.js`'deki `loadPage` fonksiyonu).
10. Ürün/Hammadde Yönetimi Sayfasının Oluşturulması (`views/urunler.html`, `renderer/urunler.js`).
11. Ürün Ekleme Formu ve Veri Tabanına Kayıt İşlevi (`add-urun` handler'ı).
12. Ürün Listeleme ve Tabloda Görüntüleme İşlevi (`get-urunler` handler'ı, `displayUrunler` fonksiyonu).
13. Aynı Ürün Adının Tekrar Kaydedilmesini Engelleme (Veri tabanında `UNIQUE COLLATE NOCASE` kısıtlaması).
14. Hata Yakalama ve Kullanıcıya Toastr ile Bildirim Verme.

## Gelecek Adımlar (Yapılacaklar)

Planlanan gelecek adımlar ve tamamlanacak özellikler sırasıyla (önceliklendirme tartışılabilir):

1. **Birim Yönetimi:**
    * `views/birimler.html` sayfası oluşturma (Birimleri listeleme, yeni birim ekleme formu).
    * `renderer/birimler.js` dosyası oluşturma (Form submit, tablo güncelleme, birim listeleme mantığı).
    * `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme (`get-birimler`, `add-birim`).
    * `renderer.js`'deki `loadPage` fonksiyonunu ve menü olay dinleyicilerini Birimler sayfası için güncelleme.
2. **Porsiyon Yönetimi:**
    * `views/porsiyonlar.html` sayfası oluşturma (Porsiyonları listeleme, yeni porsiyon ekleme formu).
    * `renderer/porsiyonlar.js` dosyası oluşturma.
    * `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme.
    * Bu ekranda Son Ürünlerin seçilmesi gerekecek (ilişkili veri).
3. **Reçete Yönetimi:**
    * `views/receler.html` sayfası oluşturma (Porsiyonlara bağlı reçeteleri ve detaylarını gösterme/ekleme).
    * `renderer/receler.js` dosyası oluşturma.
    * `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme.
    * Bu ekranda Hammaddelerin seçilmesi ve birim çevrim mantığının uygulanması gerekecek.
4. **Alım Fişi Girişi:**
    * `views/alimlar.html` sayfası oluşturma.
    * `renderer/alimlar.js` dosyası oluşturma.
    * `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme.
5. **Gider Girişi:**
    * `views/giderler.html` sayfası oluşturma.
    * `renderer/giderler.js` dosyası oluşturma.
    * `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme.
6. **Satılan Ürün Kaydı:**
    * `views/satislar.html` sayfası oluşturma.
    * `renderer/satislar.js` dosyası oluşturma.
    * `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme.
7. **Analiz ve Raporlama:**
    * `views/analiz.html` sayfası oluşturma.
    * `renderer/analiz.js` dosyası oluşturma (Veri tabanından verileri çekip hesaplamaları yapma ve grafik/tablo şeklinde gösterme).
    * `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme (Özel SQL sorguları gerektirecek).
    * Birim çevrim mantığının maliyet hesaplarında kullanılması.
8. **Menü Navigasyonunun Tamamlanması:** `index.html`'deki menü linklerine tıklama olaylarını ekleyerek `renderer.js`'deki `loadPage` fonksiyonunu çağırma.
9. **Tablo Güncelleme ve Silme:** Mevcut yönetim sayfalarına (Ürünler, Birimler vb.) veri düzenleme ve silme işlevlerini ekleme.
10. **Veri Validasyonu ve Kullanıcı Geri Bildirimi:** Formlarda daha iyi doğrulama (validation) ve kullanıcıya daha anlaşılır geri bildirimler sunma.
11. **Hata Yönetimi İyileştirme:** Daha kapsamlı hata yakalama ve loglama.
12. **Uygulama Ayarları:** `ayarlar` tablosunu kullanarak genel ayarları yönetme arayüzü.
13. **Dağıtım:** Uygulamayı farklı işletim sistemlerinde çalıştırılabilir hale getirme (Electron-builder gibi araçlarla).
14. **Yedekleme/Geri Yükleme:** Veri tabanının yedeklenmesi ve geri yüklenmesi işlevi.
15. **Kullanıcı Arayüzü İyileştirmeleri:** Tema, layout ve bileşenleri daha aktif kullanma.
