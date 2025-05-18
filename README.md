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
│ └── receler.js # Reçete yönetimi sayfasının JavaScript kodları (Dropdown doldurma, Ekleme, Listeleme, Detay Görüntüleme, Detay Ekleme, Detay Silme, Detay Düzenleme)
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

... (Veri modeli kısmı aynı kalıyor)

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
15. **Ürün Düzenleme İşlevi** (Buton, Form Doldurma, Güncelleme Mantığı, `updateUrun` handler'ı) - **TAMAMLANDI**
16. Aynı Ürün Adının Tekrar Kaydedilmesini Engelleme (`UNIQUE COLLATE NOCASE`).
17. Birim Yönetimi Sayfasının Oluşturulması (`views/birimler.html`, `renderer/birimler.js`).
18. Birim Ekleme Formu ve Veri Tabanına Kayıt İşlevi (`add-birim` handler'ı).
19. Birim Listeleme ve Tabloda Görüntüleme İşlevi (`get-birimler` handler'ı, `displayBirimler`).
20. Porsiyon Yönetimi Sayfasının Oluşturulması (`views/porsiyonlar.html`, `renderer/porsiyonlar.js`).
21. Porsiyon Ekleme Formu ve Veri Tabanına Kayıt İşlevi (`addPorsiyon` handler'ı).
22. Porsiyon Listeleme ve Tabloda Görüntüleme İşlevi (`getPorsiyonlar` handler'ı, `displayPorsiyonlar` JOIN ile Son Ürün Adı getiriliyor).
23. Porsiyon Ekleme Formu için Son Ürünler Dropdown'ını Doldurma (`get-urunler-by-tur` handler'ı).
24. Porsiyon Ekleme Formu için Birimler Dropdown'ını Doldurma (`getBirimler` handler'ı).
25. Reçete Yönetimi Sayfasının Temel İşlevlerinin Oluşturulması (`views/receler.html`, `renderer/receler.js`)
    *   Reçete Listeleme (`getReceteler` handler'ı).
    *   Yeni Reçete Ekleme (`addRecete` handler'ı).
    *   Reçete Silme (`deleteRecete` handler'ı).
    *   Reçete Detaylarını Görüntüleme (`getReceteDetaylari` handler'ı).
    *   Reçete Detayları Ekleme (`addReceteDetay` handler'ı).
    *   Reçete Detayları Silme (`deleteReceteDetay` handler'ı).
    *   **Reçete Detayları Düzenleme** (Buton, Form Doldurma, Güncelleme Mantığı, `updateReceteDetay` handler'ı) - **TAMAMLANDI**
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
    *   Reçete Düzenleme (Buton, Form Doldurma, `updateRecete` handler'ı - Ana reçeteyi düzenleme).
2.  **Tablo Güncelleme ve Silme (Kalan Sayfalar):**
    *   Birimler için silme ve düzenleme işlevlerini ekleme.
    *   Porsiyonlar için silme ve düzenleme işlevlerini ekleme.
    *   Alımlar, Giderler, Satışlar için düzenleme ve silme işlevlerini ekleme.
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
14. **Splash Screen ve Giriş Ekranı:** Uygulama başlatma akışına splash screen ve giriş ekranı ekleme.

