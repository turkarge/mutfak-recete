// renderer.js (Ana Renderer Giriş Noktası)
// Bu dosya, uygulamanın ana HTML sayfası (index.html) yüklendiğinde çalışır.
// Menü navigasyonunu ve sayfa içeriği yükleme gibi işlemleri yönetir.
// Splash screen veya Giriş Sayfası mantığı burada değildir.

console.log('Ana Renderer süreci çalışıyor!');

// Preload script'i ile sağlanan API'ye buradan erişebiliriz: window.electronAPI

// Farklı sayfalara ait JavaScript modülleri içeri aktaralım
import { loadUrunlerPage } from './renderer/urunler.js';
import { loadBirimlerPage } from './renderer/birimler.js';
import { loadPorsiyonlarPage } from './renderer/porsiyonlar.js';
import { loadRecetelerPage } from './renderer/receteler.js';
// loadLoginPage artık buradan import edilmeyecek
// TODO: Diğer sayfalar için de benzer importlar eklenecek:
// import { loadDashboardPage } from './renderer/dashboard.js';
// import { loadAlimlarPage } from './renderer/alimlar.js';
// import { loadGiderlerPage } from './renderer/giderler.js';
// import { loadSatislarPage } from './renderer/satislar.js';
// import { loadAnalizPage } from './renderer/analiz.js';


// Ana içerik alanı seçelim (index.html'de bu id'ye sahip bir div olmalı)
const mainContentArea = document.getElementById('main-content-area');

// login-container ve app-content-container gibi divlere gerek yok.


// Belirli bir sayfanın HTML içeriğini yükleyen fonksiyon
// Bu fonksiyon artık dışarıya export edilmeyecek
async function loadPage(pageName) {
    // Sayfa adı boş veya aynı ise bir şey yapma (isteğe bağlı, performans için)
    if (!pageName) {
        console.warn("Yüklenmek istenen sayfa adı boş.");
        return;
    }

    try {
        // views klasöründeki ilgili HTML dosyasını oku (Ana Süreç aracılığıyla)
        const pageHtml = await window.electronAPI.getPageHtml(pageName);

        // Ana içerik alanını temizle ve yeni HTML'i ekle
        if (mainContentArea) {
             mainContentArea.innerHTML = pageHtml;
             console.log(`${pageName}.html içeriği "${mainContentArea.id}" kapsayıcısına yüklendi.`);

             // --- Menüdeki aktif linki güncelle ---
             // Menüdeki tüm li elementlerini seçiyoruz
             const navItems = document.querySelectorAll('.navbar-nav .nav-item');
             console.log("Menü li elementleri bulundu:", navItems);
             console.log("Yüklenmek istenen sayfa:", pageName);

             navItems.forEach(item => {
                 const link = item.querySelector('.nav-link');
                 if (link && link.dataset.page === pageName) {
                     item.classList.add('active');
                     link.classList.add('active'); // Hem li hem a aktif
                     console.log(`"${pageName}" linki ve li elementleri aktif yapıldı.`);
                 } else {
                     item.classList.remove('active');
                     if (link) link.classList.remove('active');
                 }
             });
             // ------------------------------------


             // Sayfa yüklendikten sonra ilgili JavaScript fonksiyonunu çalıştır.
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
                 // 'login' case'i artık burada olmayacak
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

       // Varsayılan olarak ana sayfa yüklenecek (Örn: Ürünler veya Dashboard)
       // Giriş sayfası ayrı pencerede olacağı için burada login yüklemeyeceğiz.
       loadPage('urunler'); // <-- Varsayılan olarak Ürünler sayfasını yükle

   } else {
       console.warn("Menü linkleri bulunamadı ('.navbar-nav .nav-link').");
       toastr.error("Uygulama layout hatası: Menü linkleri bulunamadı.");
   }

});