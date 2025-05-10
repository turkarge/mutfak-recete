// renderer.js (Ana Renderer Giriş Noktası)
// Bu dosya, uygulamanın ana HTML sayfası (index.html) yüklendiğinde çalışır.
// Menü navigasyonu ve sayfa içeriği yükleme gibi işlemleri yönetir.
// Uygulama başlangıcında Giriş Sayfasını yükler ve başarılı giriş sonrası ana içeriği gösterir.

console.log('Ana Renderer süreci çalışıyor!');

// Preload script'i ile sağlanan API'ye buradan erişebiliriz: window.electronAPI

// Farklı sayfalara ait JavaScript modülleri içeri aktaralım
import { loadUrunlerPage } from './renderer/urunler.js';
import { loadBirimlerPage } from './renderer/birimler.js';
import { loadPorsiyonlarPage } from './renderer/porsiyonlar.js';
import { loadRecetelerPage } from './renderer/receler.js';
import { loadLoginPage } from './renderer/login.js'; // Giriş Sayfası JS'i
// TODO: Diğer sayfalar için de benzer importlar eklenecek:
// import { loadDashboardPage } from './renderer/dashboard.js'; // Dashboard sayfası JS'i
// import { loadAlimlarPage } from './renderer/alimlar.js';
// import { loadGiderlerPage } from './renderer/giderler.js';
// import { loadSatislarPage } from './renderer/satislar.js';
// import { loadAnalizPage } from './renderer/analiz.js';


// Ana içerik alanı ve ana uygulama kapsayıcısını seçelim
const mainContentArea = document.getElementById('main-content-area');
const appContentContainer = document.getElementById('app-content-container'); // Ana uygulama içeriği kapsayıcısı


// Belirli bir sayfanın HTML içeriğini yükleyen fonksiyon
// Bu fonksiyonu dışarıdan (login.js gibi) çağırabilmek için export ediyoruz
export async function loadPage(pageName) {
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

             // --- Menüdeki aktif linki güncelle (Bu kısım sadece ana içerik görünürken çalışmalı) ---
             // Eğer ana içerik kapsayıcısı görünürse menü linklerini güncelle
             if (appContentContainer && appContentContainer.style.display !== 'none') {
                 const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
                 console.log("Menü linkleri bulundu:", navLinks);
                 console.log("Yüklenmek istenen sayfa:", pageName);

                 // Önce mevcut tüm aktif sınıfları kaldır
                 navLinks.forEach(link => {
                      // li elementini de kontrol et
                     const liItem = link.closest('.nav-item');
                     if (liItem) liItem.classList.remove('active');
                     link.classList.remove('active');
                 });

                 // Sonra, sadece yüklenen sayfaya ait linki bul ve aktif yap
                 const activeLink = document.querySelector(`.navbar-nav .nav-link[data-page="${pageName}"]`);
                 if (activeLink) {
                      // li elementini de aktif yap
                     const activeLiItem = activeLink.closest('.nav-item');
                     if (activeLiItem) activeLiItem.classList.add('active');
                     activeLink.classList.add('active');
                     console.log(`"${pageName}" linki ve li elementleri aktif yapıldı.`);
                 } else {
                     console.warn(`"${pageName}" sayfasına ait menü linki bulunamadı.`);
                 }
             }
             // ----------------------------------------------------------------------------


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
                 case 'receler':
                      loadRecetelerPage(); // Reçete Yönetimi sayfası JS'ini çağır
                      break;
                 case 'login': // Giriş sayfası yüklenirse ilgili JS'ini çağır
                      loadLoginPage();
                      break;
                 // TODO: Diğer sayfalar için case'ler eklenecek:
                 // case 'dashboard':
                 //      loadDashboardPage();
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
   // Menü linkleri sadece app-content-container görünürken kullanılacak.
   // Olay dinleyicilerini burada ekleyebiliriz, click olduğunda sadece loadPage çağıracaklar.
   // loadPage, app-content-container gizliyse menü aktifliğini güncellemeyecek.
   const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

   if (navLinks.length > 0) {
        navLinks.forEach(link => {
             link.addEventListener('click', (event) => {
                 event.preventDefault();
                 const pageName = event.currentTarget.dataset.page;

                 if (pageName) {
                     console.log(`Menüden "${pageName}" sayfasına gidiliyor.`);
                     // Menü tıklamasında loadPage fonksiyonunu çağırıyoruz
                     loadPage(pageName);
                 } else {
                     console.warn("Tıklanan menü linkinde 'data-page' attribute'u bulunamadı.", event.currentTarget);
                 }
             });
        });

   } else {
       console.warn("Menü linkleri bulunamadı ('.navbar-nav .nav-link').");
       toastr.error("Uygulama layout hatası: Menü linkleri bulunamadı.");
   }

   // Uygulama başladığında (index.html yüklendiğinde) ilk gösterilecek sayfa giriş sayfası olmalı.
   // Ana uygulama içeriği (menü dahil) başlangıçta gizlidir.
   loadPage('login'); // <-- Varsayılan olarak Giriş Sayfasını yükle

});

// Not: login.js dosyasında, başarılı giriş sonrası,
// import { loadPage } from '../renderer.js';
// ... loadPage('urunler'); ...
// çağrısı yapılacaktır. loadPage fonksiyonu bu çağrı geldiğinde,
// appContentContainer.style.display = 'block'; yaparak ana içeriği görünür yapacaktır.