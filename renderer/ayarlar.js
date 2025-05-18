// renderer/ayarlar.js

// Form elementleri
let ayarKullaniciAdiInput, sifreDegistirForm, ayarMevcutSifreInput, ayarYeniSifreInput, ayarYeniSifreTekrarInput;

// Sayfa yüklendiğinde çalışacak ana fonksiyon
export async function loadAyarlarPage() {
    console.log('Ayarlar sayfası JavaScript\'i yükleniyor...');

    // DOM Elementlerini Seçme
    ayarKullaniciAdiInput = document.querySelector('#ayarKullaniciAdi');
    sifreDegistirForm = document.querySelector('#sifreDegistirForm');
    ayarMevcutSifreInput = document.querySelector('#ayarMevcutSifre');
    ayarYeniSifreInput = document.querySelector('#ayarYeniSifre');
    ayarYeniSifreTekrarInput = document.querySelector('#ayarYeniSifreTekrar');

    // Kullanıcı adını yükle
    async function loadKullaniciAdi() {
        if (ayarKullaniciAdiInput) {
            try {
                const kullaniciAdi = await window.electronAPI.getAyar('kullaniciAdi');
                if (kullaniciAdi) {
                    ayarKullaniciAdiInput.value = kullaniciAdi;
                } else {
                    ayarKullaniciAdiInput.value = 'Bulunamadı';
                    toastr.warning('Kullanıcı adı ayarı bulunamadı.');
                }
            } catch (error) {
                console.error("Kullanıcı adı getirilirken hata:", error);
                toastr.error("Kullanıcı adı yüklenemedi.");
                ayarKullaniciAdiInput.value = 'Hata!';
            }
        }
    }

    // Şifre Değiştirme Formu Submit Olayı
    if (sifreDegistirForm) {
        sifreDegistirForm.onsubmit = async (event) => {
            event.preventDefault();

            const mevcutSifre = ayarMevcutSifreInput.value;
            const yeniSifre = ayarYeniSifreInput.value;
            const yeniSifreTekrar = ayarYeniSifreTekrarInput.value;

            if (!mevcutSifre || !yeniSifre || !yeniSifreTekrar) {
                toastr.warning('Lütfen tüm şifre alanlarını doldurun.');
                return;
            }

            if (yeniSifre.length < 6) { // Örnek bir minimum uzunluk kontrolü
                toastr.warning('Yeni şifre en az 6 karakter olmalıdır.');
                return;
            }

            if (yeniSifre !== yeniSifreTekrar) {
                toastr.error('Yeni şifreler eşleşmiyor!');
                ayarYeniSifreInput.value = '';
                ayarYeniSifreTekrarInput.value = '';
                ayarYeniSifreInput.focus();
                return;
            }

            try {
                // 1. Mevcut şifreyi kontrol et
                const kayitliSifre = await window.electronAPI.getAyar('sifre');
                if (mevcutSifre !== kayitliSifre) {
                    toastr.error('Mevcut şifreniz yanlış!');
                    ayarMevcutSifreInput.value = '';
                    ayarMevcutSifreInput.focus();
                    return;
                }

                // 2. Yeni şifreyi kaydet (Şimdilik düz metin, sonra hash'lenecek!)
                await window.electronAPI.setAyar('sifre', yeniSifre);
                toastr.success('Şifreniz başarıyla güncellendi!');
                sifreDegistirForm.reset(); // Formu temizle

            } catch (error) {
                console.error("Şifre değiştirme hatası:", error);
                toastr.error(`Şifre güncellenirken bir hata oluştu: ${error.message}`);
            }
        };
    }

    // --- Sayfa Yüklendiğinde Çalışacaklar ---
    await loadKullaniciAdi();
}