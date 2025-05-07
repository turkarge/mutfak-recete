// renderer.js (Ana Renderer Giriş Noktası)
// Bu dosya, uygulamanın ana HTML sayfası (index.html) yüklendiğinde çalışır.
// Menü navigasyonu ve sayfa içeriği yükleme gibi işlemleri yönetir.

console.log('Ana Renderer süreci çalışıyor!');

// Preload script'i ile sağlanan API'ye buradan erişebiliriz: window.electronAPI

// Farklı sayfalara ait JavaScript modüllerini içeri aktaralım
import { loadUrunlerPage } from './renderer/urunler.js';
import { loadBirimlerPage } from './renderer/birimler.js';
import { loadPorsiyonlarPage } from './renderer/porsiyonlar.js';
// TODO: Diğer sayfalar için de benzer importlar eklenecek:
// import { loadPorsiyonlarPage } from './renderer/porsiyonlar.js';
// import { loadRecetePage } from './renderer/receler.js';
// import { loadAlimlarPage } from './renderer/alimlar.js';
// import { loadGiderlerPage } from './renderer/giderler.js';
// import { loadSatislarPage } from './renderer/satislar.js';
// import { loadAnalizPage } from './renderer/analiz.js';


// Ana içerik alanını seçelim
const mainContentArea = document.getElementById('main-content-area');


// Belirli bir sayfanın HTML içeriğini yükleyen fonksiyon
async function loadPage(pageName) {
    // Sayfa adı boş veya aynı ise bir şey yapma
    // Bu, gereksiz yüklemeleri önler.
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

            // Sayfa yüklendikten sonra ilgili JavaScript fonksiyonunu çalıştır.
            // Hangi sayfanın JS'inin çalışacağını belirlemek için switch kullanalım.
            switch (pageName) {
                case 'urunler':
                    loadUrunlerPage(); // Ürünler sayfası JS'ini çağır
                    break;
                case 'birimler':
                    loadBirimlerPage(); // Birimler sayfası JS'ini çağır
                    break;
                case 'porsiyonlar': // <-- Bu case bloğunu ekleyin
                    loadPorsiyonlarPage();
                    break;
                // TODO: Diğer sayfalar için case'ler eklenecek:
                // case 'porsiyonlar':
                //      loadPorsiyonlarPage();
                //      break;
                // case 'receler':
                //      loadRecetePage();
                //      break;
                // ... vb.
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

                    // Menüdeki aktif linki işaretle (isteğe bağlı, CSS ile yapılabilir)
                    navLinks.forEach(l => l.classList.remove('active'));
                    event.currentTarget.classList.add('active');
                } else {
                    console.warn("Tıklanan menü linkinde 'data-page' attribute'u bulunamadı.", event.currentTarget);
                }
            });
        });

        // Uygulama başladığında varsayılan olarak Ürünler sayfasını yükle
        // 'urunler' data-page'ine sahip linki bulup tıklama olayını tetikleyebiliriz VEYA
        // Direkt loadPage çağırıp sonra 'urunler' linkini aktif yapabiliriz.
        // Direkt loadPage çağırıp sonra linki aktif yapmak daha garantilidir.

        loadPage('urunler'); // <-- Uygulama başladığında varsayılan olarak urunler.html'i yükle

        // İlk yüklemede varsayılan linki (Ürünler) aktif yapalım
        const defaultLink = document.querySelector('.navbar-nav .nav-link[data-page="urunler"]'); // Varsayılan linki seç
        if (defaultLink) {
            defaultLink.classList.add('active');
        } else {
            console.warn("Varsayılan sayfa linki ('urunler') bulunamadı.");
        }


    } else {
        console.warn("Menü linkleri bulunamadı ('.navbar-nav .nav-link').");
    }


});

// TODO: Diğer menü linkleri tıklandığında loadPage fonksiyonunu ilgili sayfa adıyla çağıran
// olay dinleyicilerini buraya ekleyeceğiz.
// (Yukarıdaki olay dinleyicisi kodunu kopyalayıp yapıştırarak zaten bunu yaptık)