// renderer.js (Ana Renderer Giriş Noktası)
// Bu dosya, uygulamanın ana HTML sayfası (index.html) yüklendiğinde çalışır.
// Menü navigasyonu ve sayfa içeriği yükleme gibi işlemleri yönetir.

console.log('Ana Renderer süreci çalışıyor!');

// Preload script'i ile sağlanan API'ye buradan erişebiliriz: window.electronAPI

// Farklı sayfalara ait JavaScript modüllerini içeri aktaralım
import { loadUrunlerPage } from './renderer/urunler.js';
import { loadBirimlerPage } from './renderer/birimler.js';
import { loadPorsiyonlarPage } from './renderer/porsiyonlar.js';
import { loadRecetelerPage } from './renderer/receteler.js';
import { loadLoginPage } from './renderer/login.js';
// TODO: Diğer sayfalar için de benzer importlar eklenecek:
// import { loadRecetePage } from './renderer/receler.js';
// import { loadAlimlarPage } from './renderer/alimlar.js';
// import { loadGiderlerPage } from './renderer/giderler.js';
// import { loadSatislarPage } from './renderer/satislar.js';
// import { loadAnalizPage } from './renderer/analiz.js';


// Ana içerik alanını seçelim (index.html'de bu id'ye sahip bir div olmalı)
const mainContentArea = document.getElementById('main-content-area');


// Belirli bir sayfanın HTML içeriğini yükleyen fonksiyon
async function loadPage(pageName) {
    // Sayfa adı boş veya aynı ise bir şey yapma (isteğe bağlı, performans için)
    // Şimdilik sadece boş kontrolü yapalım
    if (!pageName) {
        console.warn("Yüklenmek istenen sayfa adı boş.");
        return;
    }

    try {
        // views klasöründeki ilgili HTML dosyasını oku (Ana Süreç aracılığıyla)
        const pageHtml = await window.electronAPI.getPageHtml(pageName);

        // Ana içerik alanını temizle ve yeni HTML'i ekle
        if (mainContentArea) {
            // İçeriği temizlemeden önce, önceki sayfaya ait event listenerları kaldırmak iyi bir uygulama olabilir.
            // Karmaşık senaryolarda bu önem kazanır. Şimdilik basit tutalım.
            mainContentArea.innerHTML = pageHtml;
            console.log(`${pageName}.html içeriği yüklendi.`);

            // Menüdeki tüm linkleri seçiyoruz
            const navItems = document.querySelectorAll('.navbar-nav .nav-item'); // li elementlerini seçiyoruz
            console.log("Menü li elementleri bulundu:", navItems);
            console.log("Yüklenmek istenen sayfa:", pageName);

            // Önce mevcut tüm aktif sınıfları kaldır
            navItems.forEach(item => {
                // li elementinin içindeki a elementini bul
                const link = item.querySelector('.nav-link');
                if (link && link.dataset.page === pageName) {
                    // Eğer bu li'nin içindeki a elementi yüklenen sayfaya aitse
                    item.classList.add('active'); // li elementini aktif yap
                    link.classList.add('active'); // a elementini de aktif yap (bazı temalar ikisini de isteyebilir)
                    console.log(`"${pageName}" linki ve li elementleri aktif yapıldı.`);
                } else {
                    // Diğer li ve a elementlerini pasif yap
                    item.classList.remove('active');
                    if (link) {
                        link.classList.remove('active');
                    }
                }
            });
            // ---------------------------------------------------------


            // Sayfa yüklendikten sonra ilgili JavaScript fonksiyonunu çalıştır.
            // Hangi sayfanın JS'inin çalışacağını belirlemek için switch kullanalım.
            switch (pageName) {
                case 'urunler':
                    loadUrunlerPage(); // Ürünler sayfası JS'ini çağır
                    break;
                case 'birimler':
                    loadBirimlerPage(); // Birimler sayfası JS'ini çağır
                    break;
                case 'porsiyonlar':
                    loadPorsiyonlarPage(); // Porsiyonlar sayfası JS'ini çağır
                    break;
                case 'receler': // <-- Bu case bloğunu ekleyin
                    loadRecetelerPage();
                    break;
                    case 'login': // <-- Bu case bloğunu ekleyin
                  loadLoginPage();
                // TODO: Diğer sayfalar için case'ler eklenecek:
                // case 'receler':
                //      loadRecetePage();
                //      break;
                // case 'alimlar':
                //      loadAlimlarPage();
                //      break;
                // case 'giderler':
                //      loadGiderlerPage();
                //      break;
                // case 'satislar':
                //      loadSatislarPage();
                //      break;
                // case 'analiz':
                //      loadAnalizPage();
                //      break;
                default:
                    console.warn(`"${pageName}" sayfası için yüklenecek JavaScript fonksiyonu tanımlanmadı.`);
            }

        } else {
            console.error("Ana içerik alanı ('main-content-area') bulunamadı.");
            toastr.error("Uygulama layout hatası: İçerik alanı bulunamadı.");
        }

    } catch (error) {
        console.error(`"${pageName}" sayfası yüklenirken hata oluştu:`, error);
        toastr.error(`"${pageName}" sayfası yüklenirken bir hata oluştu.`);
    }
}


// Uygulama yüklendiğinde (index.html DOM hazır olduğunda)
window.addEventListener('DOMContentLoaded', () => {
    // Menü linklerine olay dinleyicileri ekle
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link'); // Menü linklerini seç

    if (navLinks.length > 0) {
        navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Linkin varsayılan davranışını (sayfa yenileme) engelle
                // event.currentTarget kullanıyoruz, çünkü click olayı linkin içindeki span/icon'a da tetiklenebilir
                const pageName = event.currentTarget.dataset.page; // data-page attribute'undan sayfa adını al

                if (pageName) {
                    console.log(`Menüden "${pageName}" sayfasına gidiliyor.`);
                    loadPage(pageName); // loadPage fonksiyonunu çağır

                    // Menüdeki aktiflik güncelleme mantığı loadPage fonksiyonuna taşındı.
                    // Buradan silinmeli veya yorum satırı yapılmalı.
                    // navLinks.forEach(l => l.classList.remove('active'));
                    // event.currentTarget.classList.add('active');

                } else {
                    console.warn("Tıklanan menü linkinde 'data-page' attribute'u bulunamadı.", event.currentTarget);
                }
            });
        });

        // Uygulama başladığında varsayılan olarak Ürünler sayfasını yükle
        // loadPage fonksiyonunu çağırıyoruz, o da menü aktifliğini ayarlayacak.
        loadPage('urunler'); // <-- Uygulama başladığında varsayılan olarak urunler.html'i yükle

        // Varsayılan linki (Ürünler) manuel aktif yapmaya gerek yok,
        // loadPage fonksiyonu bunu halledecek.
        // Aşağıdaki kodlar buradan silinmeli veya yorum satırı yapılmalı:
        // const defaultLink = document.querySelector('.navbar-nav .nav-link[data-page="urunler"]');
        // if (defaultLink) {
        //     defaultLink.classList.add('active');
        // } else {
        //      console.warn("Varsayılan sayfa linki ('urunler') bulunamadı.");
        // }


    } else {
        console.warn("Menü linkleri bulunamadı ('.navbar-nav .nav-link').");
        toastr.error("Uygulama layout hatası: Menü linkleri bulunamadı.");
    }


});