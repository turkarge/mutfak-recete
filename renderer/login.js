// renderer/login.js
// Bu dosya, Giriş Sayfası (views/login.html) ile ilgili JavaScript kodlarını içerir.
// Giriş formunu işler ve başarılı giriş sonrası ana uygulama içeriğini yükler.

// renderer.js dosyasından loadPage fonksiyonunu import edelim
import { loadPage } from '../renderer.js'; // <-- loadPage fonksiyonunu import ediyoruz

// Bu fonksiyon, login.html içeriği ana sayfaya yüklendiğinde çağrılacak
export async function loadLoginPage() {
    console.log('Giriş Sayfası JavaScript\'i yükleniyor...');

    // !!! DİKKAT: Buradaki kodlar, login.html yüklendikten sonra çalışacaktır.
    // DOM elementlerine bu fonksiyon içinden erişin.

    // --- DOM Elementlerini Seçme ---
    const loginForm = document.querySelector('#loginForm'); // Giriş formu
    const usernameInput = document.querySelector('#username'); // Kullanıcı adı alanı
    const passwordInput = document.querySelector('#password'); // Şifre alanı

    // --- Olay Dinleyicileri ve İşlem Fonksiyonları ---

    // Giriş Formu Submit Olayı
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Formun normal submit davranışını engelle

            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            // Alanların boş olup olmadığını kontrol et (HTML required olsa da JS ile kontrol iyi)
            if (!username || !password) {
                toastr.warning('Kullanıcı Adı ve Şifre boş bırakılamaz.');
                return;
            }

            // Ana Süreç'e giriş isteği gönder
            try {
                const loginSuccess = await window.electronAPI.login(username, password); // login handler'ı mevcut

                if (loginSuccess) {
                    console.log(`Kullanıcı başarıyla giriş yaptı: ${username}`);
                    toastr.success('Giriş başarılı! Yönlendiriliyorsunuz...');

                    // --- Başarılı girişten sonra ana uygulama içeriğini yükle ---
                    // 1. Ana uygulama içeriği kapsayıcısını görünür yap
                     const appContentContainer = document.getElementById('app-content-container'); // <-- Elementi burada tekrar seç
                     if (appContentContainer) {
                          appContentContainer.style.display = 'block'; // <-- Görünür yap
                          console.log("Ana uygulama içeriği görünür yapıldı.");
                     } else {
                          console.error("Ana uygulama içeriği kapsayıcısı (app-content-container) bulunamadı.");
                     }

                    // 2. Ana uygulama içeriğinin varsayılan sayfasını yükle
                    // loadPage fonksiyonunu import ettik, şimdi çağırabiliriz.
                     if (typeof loadPage === 'function') {
                        // loadPage fonksiyonu çağrıldığında, menü aktifliğini de ayarlayacaktır.
                        loadPage('urunler'); // Varsayılan sayfa: Ürünler (veya 'dashboard' gibi başka bir sayfa)
                     } else {
                        console.error("loadPage fonksiyonu bulunamadı (import edilemedi).");
                     }
                    // ------------------------------------------------------------


                } else {
                    console.warn(`Giriş başarısız. Kullanıcı adı: ${username}`);
                    toastr.error('Giriş başarısız. Kullanıcı adı veya şifre hatalı.');
                    // Şifre alanını temizleyebiliriz
                    passwordInput.value = '';
                }

            } catch (error) {
                console.error('Genel Hata Yakalandı (Giriş):', error);
                toastr.error('Giriş işlemi sırasında bir hata oluştu: ' + error.message);
                 passwordInput.value = ''; // Hata olsa da şifreyi temizle
            }
        });
    } else {
        console.error("Giriş formu (loginForm) bulunamadı.");
    }

    // TODO: Kayıt ol, Şifremi unuttum gibi linkler için olay dinleyicileri eklenebilir.

} // loadLoginPage fonksiyonunun sonu