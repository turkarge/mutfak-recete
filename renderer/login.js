// renderer/login.js
// Bu dosya, Giriş Sayfası (views/login.html) ile ilgili JavaScript kodlarını içerir.

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
                const loginSuccess = await window.electronAPI.login(username, password); // TODO: login handler'ı Ana Süreç'te eklenecek

                if (loginSuccess) {
                    console.log(`Kullanıcı başarıyla giriş yaptı: ${username}`);
                    toastr.success('Giriş başarılı! Yönlendiriliyorsunuz...');

                    // Başarılı girişten sonra ana uygulama içeriğini yükle
                    // renderer.js dosyasındaki loadPage fonksiyonuna erişebilmeliyiz.
                    // LoadPage fonksiyonunu dış scope'ta tanımlayıp burada kullanabiliriz.
                    // Veya ana renderer.js'e "giriş başarılı" sinyali göndeririz.
                    // En temizi, loadPage fonksiyonunun renderer.js'de global (veya export edilmiş) olması.
                    // loadPage şu an export edilmedi, onu düzeltelim.
                     // Assuming loadPage is available in the global scope or imported
                    if (typeof loadPage === 'function') { // loadPage fonksiyonu var mı kontrol et
                        loadPage('urunler'); // TODO: Giriş başarılı olunca varsayılan sayfayı yükle (örn: 'dashboard' veya 'urunler')
                    } else {
                        console.error("loadPage fonksiyonu bulunamadı.");
                        // Belki Renderer'a sinyal gönderme IPC handler'ı kullanırız.
                    }


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