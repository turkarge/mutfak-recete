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
│ └── ipcHandlers.js # Renderer'dan gelen IPC mesajlarını işleyen handler'lar
├── renderer/ # Electron Renderer Süreci Modülleri
│ ├── urunler.js # Ürün yönetimi (CRUD)
│ ├── birimler.js # Birim yönetimi (CRUD)
│ ├── porsiyonlar.js # Porsiyon yönetimi (CRUD, Dropdown)
│ ├── receler.js # Reçete yönetimi (Ana ve Detay CRUD, Dropdown)
│ ├── alimlar.js # Alım yönetimi (CRUD, Dropdown, Otomatik Hesaplama)
│ ├── giderler.js # Gider yönetimi (CRUD)
│ └── satislar.js # Satış yönetimi (CRUD, Dropdown, Otomatik Hesaplama)
├── views/ # Uygulama sayfalarının HTML şablonları
│ ├── urunler.html
│ ├── birimler.html
│ ├── porsiyonlar.html
│ ├── receler.html
│ ├── alimlar.html
│ ├── giderler.html
│ └── satislar.html
├── index.html # Ana HTML layout (menü, içerik alanı, genel JS/CSS, Modal)
├── preload.js # Güvenli IPC köprüsü
├── style.css # Uygulamaya özel CSS
├── package.json
├── package-lock.json
└── node_modules/

## Veri Modeli (Güncel Plan)

... (Veri modeli kısmı aynı kalıyor - Lütfen bu kısmı kendi projenizdeki güncel haliyle değiştirin veya olduğu gibi bırakın)

## Tamamlanan Adımlar (Güncel)

1.  Temel Electron Projesi Kurulumu.
2.  Temel Pencere Oluşturma ve Uygulama Başlatma.
3.  SQLite Veri Tabanı Entegrasyonu ve Tüm Tabloların Oluşturulması (`main/db.js`).
4.  IPC Altyapısı Kurulumu (`preload.js`, `main/ipcHandlers.js`).
5.  Tabler Tema Entegrasyonu.
6.  Toastr Bildirimleri Entegrasyonu.
7.  Genel Onay Modalı Entegrasyonu.
8.  Ana Layout ve Menü Yapısı (`index.html`).
9.  Sayfa Yükleme Mekanizması (`renderer.js`).
10. Menü Navigasyonu ve Aktiflik Yönetimi.
11. **Sayfa Düzenleri:** Tüm CRUD sayfaları için form solda, liste sağda, ayrı kartlarda olacak şekilde standart bir düzene geçildi.
12. **Buton Stilleri:** Tüm form ve tablo eylem butonları için standart ikonlu ve şık bir görünüme geçildi.
13. **Ürün/Hammadde Yönetimi:** CRUD işlevleri tamamlandı.
14. **Birim Yönetimi:** CRUD işlevleri tamamlandı.
15. **Porsiyon Yönetimi:** CRUD işlevleri ve ilgili dropdown'lar tamamlandı.
16. **Reçete Yönetimi:** Ana reçete ve reçete detayları için CRUD işlevleri, dropdown'lar ve görünüm düzenlemeleri tamamlandı.
17. **Alım Yönetimi:** CRUD işlevleri, dropdown'lar ve otomatik toplam tutar hesaplaması tamamlandı. Menü linki eklendi.
18. **Gider Yönetimi:** CRUD işlevleri tamamlandı. Menü linki eklendi.
19. **Satış Yönetimi:**
    *   Veritabanına `satislar` tablosu güncellendi (`toplamSatisTutari`, `aciklama` alanları eklendi).
    *   `views/satislar.html` ve `renderer/satislar.js` oluşturuldu.
    *   CRUD işlevleri (Ekleme, Listeleme, Düzenleme, Silme), porsiyon dropdown'ı, varsayılan fiyat getirme ve otomatik toplam tutar hesaplaması tamamlandı.
    *   İlgili IPC handler'ları ve API'ler eklendi.
    *   Menüye "Satışlar" linki eklendi.

## Gelecek Adımlar (Yapılacaklar)

Planlanan gelecek adımlar ve tamamlanacak özellikler sırasıyla (önceliklendirme tartışılabilir):

1.  **Tablo Güncelleme ve Silme (Kalan Sayfalar):**
    *   ~~Birimler için silme ve düzenleme işlevlerini ekleme.~~ `✓ TAMAMLANDI`
    *   ~~Porsiyonlar için silme ve düzenleme işlevlerini ekleme.~~ `✓ TAMAMLANDI`
    *   ~~Alımlar için düzenleme ve silme işlevlerini ekleme.~~ `✓ TAMAMLANDI`
    *   ~~Giderler için düzenleme ve silme işlevlerini ekleme.~~ `✓ TAMAMLANDI`
    *   ~~Satışlar için düzenleme ve silme işlevlerini ekleme.~~ `✓ TAMAMLANDI`
2.  **Birim çevrim mantığının** (Hammadde kullanım biriminden alış birimine çevirme) Reçete Maliyeti hesaplanırken kodda uygulanması.
3.  **Alım Fişi Girişi:** `✓ TAMAMLANDI`
4.  **Gider Girişi:** `✓ TAMAMLANDI`
5.  **Satılan Ürün Kaydı:** `✓ TAMAMLANDI`
    *   ~~`views/satislar.html` sayfası oluşturma.~~
    *   ~~`renderer/satislar.js` dosyası oluşturma.~~
    *   ~~`main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme.~~
    *   ~~Ekleme, Listeleme, Düzenleme, Silme işlevleri.~~
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