// login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginErrorDiv = document.getElementById('loginError');

    // Toastr ayarları (isteğe bağlı, eğer genel bir yerde yapılmadıysa)
    if (typeof toastr !== 'undefined') {
        toastr.options = {
            "closeButton": true,
            "debug": false,
            "newestOnTop": false,
            "progressBar": true,
            "positionClass": "toast-top-right",
            "preventDuplicates": false,
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": "5000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };
    } else {
        console.warn("Toastr bulunamadı, bildirimler çalışmayabilir.");
    }


    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Formun normal submit olmasını engelle
            loginErrorDiv.style.display = 'none'; // Önceki hata mesajını temizle
            loginErrorDiv.textContent = '';

            const username = usernameInput.value.trim();
            const password = passwordInput.value; // Şifreyi trim etmeyelim

            if (!username || !password) {
                loginErrorDiv.textContent = 'Kullanıcı adı ve şifre boş bırakılamaz.';
                loginErrorDiv.style.display = 'block';
                if (toastr) toastr.warning('Kullanıcı adı ve şifre boş bırakılamaz.');
                return;
            }

            try {
                // electronAPI'nin varlığını kontrol et (preload script yüklendi mi?)
                if (window.electronAPI && typeof window.electronAPI.checkLogin === 'function') {
                    const loginSuccess = await window.electronAPI.checkLogin(username, password);

                    if (loginSuccess) {
                        if (toastr) toastr.success('Giriş başarılı! Yönlendiriliyorsunuz...');
                        console.log('Giriş başarılı, ana arayüze yönlendiriliyor.');
                        // Ana sürece başarılı giriş mesajı gönder
                        if (typeof window.electronAPI.sendLoginSuccess === 'function') {
                            window.electronAPI.sendLoginSuccess();
                            // Yönlendirme main.js tarafından yapılacak
                        } else {
                            console.error("sendLoginSuccess fonksiyonu electronAPI'de bulunamadı!");
                            loginErrorDiv.textContent = 'Giriş sonrası yönlendirme hatası.';
                            loginErrorDiv.style.display = 'block';
                        }
                    } else {
                        loginErrorDiv.textContent = 'Kullanıcı adı veya şifre hatalı!';
                        loginErrorDiv.style.display = 'block';
                        if (toastr) toastr.error('Kullanıcı adı veya şifre hatalı!');
                        passwordInput.value = ''; // Şifre alanını temizle
                        passwordInput.focus();
                    }
                } else {
                    console.error("electronAPI veya checkLogin fonksiyonu bulunamadı!");
                    loginErrorDiv.textContent = 'Uygulama iletişim hatası. Lütfen tekrar deneyin.';
                    loginErrorDiv.style.display = 'block';
                    if (toastr) toastr.error('Uygulama iletişim hatası.');
                }
            } catch (error) {
                console.error('Giriş işlemi sırasında hata:', error);
                loginErrorDiv.textContent = `Giriş sırasında bir hata oluştu: ${error.message}`;
                loginErrorDiv.style.display = 'block';
                if (toastr) toastr.error(`Giriş hatası: ${error.message}`);
            }
        });
    } else {
        console.error("Giriş formu (loginForm) bulunamadı.");
    }
});