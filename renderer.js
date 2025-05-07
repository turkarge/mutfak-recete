// renderer.js (Ana Renderer Giriş Noktası)
// Bu dosya, uygulamanın ana HTML sayfası (index.html) yüklendiğinde çalışır.
// Menü navigasyonu ve sayfa içeriği yükleme gibi işlemleri yönetir.

console.log('Ana Renderer süreci çalışıyor!');

// Preload script'i ile sağlanan API'ye buradan erişebiliriz: window.electronAPI

// Farklı sayfalara ait JavaScript modüllerini içeri aktaralım (şimdilik sadece urunler.js)
import { loadUrunlerPage } from './renderer/urunler.js';
import { loadBirimlerPage } from './renderer/birimler.js';
// TODO: Diğer sayfalar için de benzer importlar eklenecek:
// import { loadBirimlerPage } from './renderer/birimler.js';
// import { loadPorsiyonlarPage } from './renderer/porsiyonlar.js';
// ... vb.

// Ana içerik alanını seçelim
const mainContentArea = document.getElementById('main-content-area');
// Not: index.html'e bu id'ye sahip bir div ekleyeceğiz.

// Belirli bir sayfanın HTML içeriğini yükleyen fonksiyon
async function loadPage(pageName) {
    try {
        const pageHtml = await window.electronAPI.getPageHtml(pageName);

        if (mainContentArea) {
             mainContentArea.innerHTML = pageHtml;
             console.log(`${pageName}.html içeriği yüklendi.`);

             // Sayfa yüklendikten sonra ilgili JavaScript fonksiyonunu çalıştır.
             switch (pageName) {
                 case 'urunler':
                     loadUrunlerPage();
                     break;
                 case 'birimler': // <-- Bu case bloğunu ekleyin
                      loadBirimlerPage();
                      break;
                 // TODO: Diğer sayfalar için case'ler eklenecek
                 default:
                     console.warn(`"${pageName}" sayfası için yüklenecek JavaScript fonksiyonu tanımlanmadı.`);
             }

        } else {
             console.error("Ana içerik alanı ('main-content-area') bulunamadı.");
        }

    } catch (error) {
        console.error(`"${pageName}" sayfası yüklenirken hata oluştu:`, error);
        toastr.error(`"${pageName}" sayfası yüklenirken bir hata oluştu.`);
    }
}

// Uygulama yüklendiğinde (index.html DOM hazır olduğunda)
window.addEventListener('DOMContentLoaded', () => {
   // Menü linklerine olay dinleyicileri ekle (ileride)
   // İlk yüklenecek sayfayı belirle (örneğin ürünler sayfası)
   loadPage('urunler'); // <-- Uygulama başladığında urunler.html'i yükle
   const urunlerLink = document.querySelector('.navbar-nav .nav-link[data-page="urunler"]');
   if (urunlerLink) {
       urunlerLink.classList.add('active');
   }
});

// TODO: Menü linkleri tıklandığında loadPage fonksiyonunu ilgili sayfa adıyla çağıran
// olay dinleyicilerini buraya ekleyeceğiz.