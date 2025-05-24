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
│ ├── birimler.js # Çevrim katsayısı yönetimi dahil
│ ├── porsiyonlar.js
│ ├── receler.js # Maliyet hesaplama mantığı dahil
│ ├── alimlar.js
│ ├── giderler.js
│ ├── satislar.js
│ ├── ayarlar.js
│ └── dashboard.js
├── views/
│ ├── urunler.html
│ ├── birimler.html # Çevrim katsayısı alanı eklendi
│ ├── porsiyonlar.html
│ ├── receler.html # Maliyet gösterim alanları eklendi
│ ├── alimlar.html
│ ├── giderler.html
│ ├── satislar.html
│ ├── ayarlar.html
│ └── dashboard.html
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

## Tamamlanan Adımlar (Güncel)

1.  Temel Electron Projesi Kurulumu.
2.  Temel Pencere Oluşturma ve Uygulama Başlatma.
3.  SQLite Veri Tabanı Entegrasyonu ve Tüm Tabloların Oluşturulması (`main/db.js`).
    *   `birimler` tablosuna `cevrimKatsayisi` sütunu eklendi.
    *   Varsayılan birimlere çevrim katsayıları eklendi.
4.  IPC Altyapısı Kurulumu (`preload.js`, `main/ipcHandlers.js`).
    *   `getLatestAlimInfoForUrun` handler'ı eklendi.
5.  Tabler Tema Entegrasyonu.
6.  Toastr Bildirimleri Entegrasyonu.
7.  Genel Onay Modalı Entegrasyonu.
8.  Ana Layout ve Menü Yapısı (`index.html`).
9.  Sayfa Yükleme Mekanizması (`renderer.js`).
10. Menü Navigasyonu, Aktiflik Durumu ve İkon Güncellemeleri.
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
21. **Splash Screen ve Giriş Ekranı Akışı:** Tamamlandı.
22. **Dashboard Sayfası:** Basit haliyle oluşturuldu.

## Gelecek Adımlar (Yapılacaklar)

Planlanan gelecek adımlar ve tamamlanacak özellikler sırasıyla (önceliklendirme tartışılabilir):

1.  ~~**Tablo Güncelleme ve Silme (Kalan Sayfalar):**~~ `✓ TAMAMLANDI`
2.  **Birim çevrim mantığının Reçete Maliyeti hesaplanırken kodda uygulanması:** `✓ TEMEL İŞLEVSELLİK TAMAMLANDI`
    *   (İleri Geliştirme: Daha karmaşık çapraz birim çevrimleri, yoğunluk bazlı çevrimler eklenebilir.)
    *   (İleri Geliştirme: Maliyet geçmişi takibi ve raporlaması.)
3.  **Alım Fişi Girişi:** `✓ TAMAMLANDI`
4.  **Gider Girişi:** `✓ TAMAMLANDI`
5.  **Satılan Ürün Kaydı:** `✓ TAMAMLANDI`
6.  **Analiz ve Raporlama:**
    *   Toplu Reçete Maliyeti Güncelleme sayfası/işlevi.
    *   `views/analiz.html` ve `renderer/analiz.js` oluşturma.
    *   Maliyet, Alım, Gider, Satış ve Kâr/Zarar raporlarını oluşturma.
7.  **Uygulama Ayarları:** `✓ (Basit Şifre Değiştirme Tamamlandı)`
    *   Şifrelerin hash'lenerek güvenli bir şekilde saklanması.
    *   Genel uygulama ayarları (para birimi, tema vb.) için arayüz.
8.  **Hata Yönetimi İyileştirme:** ...
9.  **Uygulama İyileştirmeleri:** ...
10. **Dağıtım:** ...
11. **Yedekleme/Geri Yükleme:** ...
12. **Kullanıcı Yönetimi:** `✓ (Basit Tek Kullanıcı Doğrulaması Tamamlandı)`
    *   Rol ve izin tabanlı erişim kontrolü (Gelişmiş).
    *   Çoklu kullanıcı desteği.
13. **Splash Screen ve Giriş Ekranı:** `✓ TAMAMLANDI`