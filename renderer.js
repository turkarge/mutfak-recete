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
import { loadAlimlarPage } from './renderer/alimlar.js';
import { loadGiderlerPage } from './renderer/giderler.js';
import { loadSatislarPage } from './renderer/satislar.js';
import { loadAyarlarPage } from './renderer/ayarlar.js';
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
                    // Dropdown toggler dışındaki diğer li elementlerini pasif yap
                    // Dropdown toggler li'sinin active class'ı Tabler JS tarafından yönetilir.
                    // Sadece data-page attribute'u olan linklerin li'lerini yönetelim.
                    const itemLink = item.querySelector('.nav-link[data-page]');
                    if (itemLink && itemLink.dataset.page !== pageName) {
                        item.classList.remove('active');
                        itemLink.classList.remove('active');
                    }
                    // Dropdown içindeki a elementleri de aktiflik sınıfı almalı.
                    const dropdownItems = item.querySelectorAll('.dropdown-item');
                    dropdownItems.forEach(dropdownItem => {
                        if (dropdownItem.dataset.page === pageName) {
                            dropdownItem.classList.add('active');
                            // dropdown-item aktif olunca li dropdown-toggle de aktif olmalı
                            // Tabler JS bunu otomatik yapabilir veya manuel yapmamız gerekebilir.
                            // li elementinin kendisini de aktif yapıyoruz yukarıda.
                        } else {
                            dropdownItem.classList.remove('active');
                        }
                    });
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
                case 'receteler':
                    loadRecetelerPage(); // Reçete Yönetimi sayfası JS'ini çağır
                    break;
                case 'alimlar':
                    loadAlimlarPage();
                    break;
                case 'giderler':
                    loadGiderlerPage();
                    break;
                case 'satislar':
                    loadSatislarPage();
                    break;
                case 'ayarlar':
                    loadAyarlarPage();
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
    // Hem ana linkleri (.navbar-nav .nav-link) hem de dropdown içindeki linkleri (.dropdown-menu .dropdown-item) seçiyoruz
    const clickableNavElements = document.querySelectorAll('.navbar-nav .nav-link, .dropdown-menu .dropdown-item'); // <-- Seçici güncellendi

    // console.log("Tıklanabilir menü elementleri bulundu:", clickableNavElements); // Test için log ekleyebilirsiniz

    if (clickableNavElements.length > 0) {
        // data-page attribute'u olan elementler için olay dinleyicisi ekle
        clickableNavElements.forEach(element => { // <-- Değişken adını element olarak değiştirdim
            // data-page attribute'u var mı kontrol et
            if (element.dataset.page) { // <-- data-page attribute'u var mı kontrol et
                element.addEventListener('click', (event) => {
                    event.preventDefault();
                    const pageName = event.currentTarget.dataset.page; // event.currentTarget her zaman olayın dinlendiği elementtir

                    console.log(`Menüden "${pageName}" sayfasına gidiliyor.`);
                    // loadPage fonksiyonunu çağırıyoruz
                    loadPage(pageName);
                    // Eğer tıklanan element bir dropdown öğesiyse, dropdown'ı kapat
                    const dropdownMenu = element.closest('.dropdown-menu'); // Tıklanan linkin ebeveyn dropdown menüsünü bul
                    if (dropdownMenu) {
                        // Dropdown elementini bul (genellikle .dropdown sınıfına sahip li)
                        const dropdownElement = dropdownMenu.closest('.nav-item.dropdown');
                        if (dropdownElement) {
                            // Bootstrap/Tabler'ın dropdown instance'ını al
                            const dropdownInstance = bootstrap.Dropdown.getInstance(dropdownElement);
                            if (dropdownInstance) {
                                dropdownInstance.hide(); // Dropdown'ı gizle
                                console.log("Dropdown menü kapatıldı.");
                            } else {
                                console.warn("Dropdown instance bulunamadı, manuel kapatma başarısız.");
                                // Alternatif: CSS sınıfını kaldırarak kapatmayı dene
                                dropdownElement.classList.remove('show'); // li'den
                                const dropdownToggle = dropdownElement.querySelector('.dropdown-toggle');
                                if (dropdownToggle) dropdownToggle.classList.remove('show'); // a'dan
                                dropdownMenu.classList.remove('show'); // div.dropdown-menu'den
                            }
                        }
                    }
                    // TODO: Dropdown menü içindeki linke tıklanırsa dropdown'ı kapatma mantığı eklenebilir.

                });
            }
            // else { // data-page attribute'u olmayan elementler (örn: dropdown toggler) için log veya başka işlem yapılabilir
            //    console.log("data-page attribute'u olmayan menü elementi bulundu:", element);
            // }
        });

        // Varsayılan olarak ana sayfa yüklenecek (Örn: Ürünler veya Dashboard)
        loadPage('urunler'); // Varsayılan olarak Ürünler sayfasını yükle (dropdown içindeki 'urunler' linkine karşılık gelecek)


    } else {
        console.warn("Menü linkleri ve dropdown elementleri bulunamadı.");
        toastr.error("Uygulama layout hatası: Menü elementleri bulunamadı.");
    }

});