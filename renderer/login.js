// renderer/login.js
// Bu dosya, Giriş Sayfası (views/login.html) ile ilgili JavaScript kodlarını içerir.
// Giriş formunu işler ve başarılı giriş sonrası Ana Süreç'e sinyal gönderir.

// loadPage fonksiyonunu buradan import etmeyeceğiz.
// Başarılı giriş sonrası Ana Süreç'e haber vereceğiz.


export async function loadLoginPage() { // Bu fonksiyon hala Ana Süreç tarafından çağrılacak
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

                    // --- Başarılı girişten sonra Ana Süreç'e sinyal gönder ---
                    // Ana Süreç, Giriş Penceresini kapatacak ve Ana Pencereyi gösterecek.
                    window.electronAPI.loginSuccess(); // TODO: loginSuccess handler'ı Ana Süreç'te eklenecek
                    // ----------------------------------------------------------


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