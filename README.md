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
8.  **Kullanıcı Girişi ve Ayarlar:** Basit kullanıcı doğrulama ve şifre değiştirme.
9.  **Analiz ve Raporlama:** Girilen verilere dayanarak ürün/porsiyon maliyetlerini, toplam alımları, giderleri, satış gelirlerini ve kâr/zararı analiz etme ve raporlama.
10. **Kullanıcı Yönetimi (Gelişmiş):** (Gelecekteki bir özellik) Rol ve izin tabanlı erişim.

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
│ ├── ayarlar.js # Ayarlar sayfası JS
│ └── dashboard.js # Dashboard sayfası JS
├── views/
│ ├── urunler.html
│ ├── birimler.html
│ ├── porsiyonlar.html
│ ├── receler.html
│ ├── alimlar.html
│ ├── giderler.html
│ ├── satislar.html
│ ├── ayarlar.html # Ayarlar sayfası HTML
│ └── dashboard.html # Dashboard sayfası HTML
├── index.html # Ana uygulama arayüzü HTML layout
├── login.html # Giriş ekranı HTML (Ana dizinde)
├── splash.html # Splash ekranı HTML (Ana dizinde)
├── login.js # Giriş ekranı JS (Ana dizinde)
├── preload.js
├── style.css
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
10. Menü Navigasyonu, Aktiflik Durumu ve İkon Güncellemeleri.
11. **Sayfa Düzenleri:** Tüm CRUD sayfaları için form solda, liste sağda, ayrı kartlarda olacak şekilde standart bir düzene geçildi.
12. **Buton Stilleri:** Tüm form ve tablo eylem butonları için standart ikonlu ve şık bir görünüme geçildi.
13. **Ürün/Hammadde Yönetimi:** CRUD işlevleri tamamlandı.
14. **Birim Yönetimi:** CRUD işlevleri tamamlandı.
15. **Porsiyon Yönetimi:** CRUD işlevleri ve ilgili dropdown'lar tamamlandı.
16. **Reçete Yönetimi:** Ana reçete ve reçete detayları için CRUD işlevleri, dropdown'lar ve görünüm düzenlemeleri tamamlandı.
17. **Alım Yönetimi:** CRUD işlevleri, dropdown'lar, otomatik toplam tutar ve Fiş No alanı tamamlandı. Menü linki eklendi.
18. **Gider Yönetimi:** CRUD işlevleri tamamlandı. Menü linki eklendi.
19. **Satış Yönetimi:** CRUD işlevleri, porsiyon dropdown'ı, varsayılan fiyat getirme ve otomatik toplam tutar hesaplaması tamamlandı. Menü linki eklendi.
20. **Ayarlar Sayfası:**
    *   `ayarlar` tablosuna varsayılan kullanıcı adı/şifre ekleme mantığı (`main/db.js`).
    *   `views/ayarlar.html` ve `renderer/ayarlar.js` oluşturuldu.
    *   Kullanıcı adı gösterme ve şifre değiştirme işlevi eklendi.
    *   İlgili IPC handler'ları (`getAyar`, `setAyar`) ve API'ler eklendi.
    *   Menüye "Ayarlar" linki eklendi.
21. **Splash Screen ve Giriş Ekranı Akışı:**
    *   Ana dizine `splash.html` ve `login.html` eklendi.
    *   `main.js` uygulama başlangıç akışını (Splash -> Login -> Ana Arayüz) yönetecek şekilde güncellendi.
    *   `login.js` (ana dizinde) oluşturuldu ve temel giriş mantığı eklendi.
    *   `checkLogin` IPC handler'ı ve `sendLoginSuccess` IPC mesajı eklendi/kullanıldı.
22. **Dashboard Sayfası:**
    *   `views/dashboard.html` ve `renderer/dashboard.js` (basit haliyle) oluşturuldu.
    *   Menüye "Dashboard" linki eklendi ve varsayılan açılış sayfası yapıldı.

## Gelecek Adımlar (Yapılacaklar)

Planlanan gelecek adımlar ve tamamlanacak özellikler sırasıyla (önceliklendirme tartışılabilir):

1.  ~~**Tablo Güncelleme ve Silme (Kalan Sayfalar):**~~ `✓ TAMAMLANDI` (Tüm temel CRUD sayfaları tamamlandı)
2.  **Birim çevrim mantığının** (Hammadde kullanım biriminden alış birimine çevirme) Reçete Maliyeti hesaplanırken kodda uygulanması.
3.  **Alım Fişi Girişi:** `✓ TAMAMLANDI`
4.  **Gider Girişi:** `✓ TAMAMLANDI`
5.  **Satılan Ürün Kaydı:** `✓ TAMAMLANDI`
6.  **Analiz ve Raporlama:**
    *   `views/analiz.html` sayfası oluşturma.
    *   `renderer/analiz.js` dosyası oluşturma.
    *   `main/ipcHandlers.js` dosyasına ilgili handler'ları ekleme.
    *   Maliyet, Alım, Gider, Satış ve Kâr/Zarar raporlarını oluşturma.
7.  **Uygulama Ayarları:** `✓ (Basit Kullanıcı Yönetimi ve Şifre Değiştirme Tamamlandı)`
    *   Genel uygulama ayarları (para birimi, tema vb.) için arayüz.
    *   Şifrelerin hash'lenerek güvenli bir şekilde saklanması.
8.  **Hata Yönetimi İyileştirme:** Daha kapsamlı hata yakalama ve loglama.
9.  **Uygulama İyileştirmeleri:** Kullanıcı arayüzü detayları, performans optimizasyonları vb.
10. **Dağıtım:** Uygulamayı farklı işletim sistemlerinde çalıştırılabilir hale getirme.
11. **Yedekleme/Geri Yükleme:** Veri tabanının yedeklenmesi ve geri yüklenmesi işlevi.
12. **Kullanıcı Yönetimi:** `✓ (Basit Tek Kullanıcı Doğrulaması Tamamlandı)`
    *   Rol ve izin tabanlı erişim kontrolü (Gelişmiş).
    *   Çoklu kullanıcı desteği.
13. **Splash Screen ve Giriş Ekranı:** `✓ TAMAMLANDI`