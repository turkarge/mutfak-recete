// renderer/birimler.js
// Bu dosya, Birim Yönetimi sayfası (views/birimler.html) ile ilgili JavaScript kodlarını içerir.

// Bu fonksiyon, birimler.html içeriği ana sayfaya yüklendiğinde çağrılacak
export async function loadBirimlerPage() {
    console.log('Birimler sayfası JavaScript\'i yükleniyor...');

    // !!! DİKKAT: Buradaki kodlar, birimler.html yüklendikten sonra çalışacaktır.
    // DOM elementlerine (form, tablo vb.) bu fonksiyon içinden erişin.

    // Birimleri tabloya ekleyen fonksiyon (displayBirimler)
    function displayBirimler(birimler) {
        const tableBody = document.querySelector('#birimlerTable tbody'); // Tablonun tbody elementini seç

        // Tablonun mevcut içeriğini tamamen temizle
        tableBody.innerHTML = '';

        if (birimler && birimler.length > 0) {
            birimler.forEach(birim => {
                const row = tableBody.insertRow(); // Yeni bir satır oluştur

                // Her satıra 4 hücre (sütun) ekle: ID, Birim Adı, Kısa Ad, Ana Birim
                row.insertCell(0).textContent = birim.id;
                row.insertCell(1).textContent = birim.birimAdi;
                row.insertCell(2).textContent = birim.kisaAd;
                row.insertCell(3).textContent = birim.anaBirimKisaAd || ''; // Ana birim yoksa boş göster
            });

        } else {
            // Eğer birim yoksa bilgilendirici bir mesaj göster
            const row = tableBody.insertRow();
            const cell = row.insertCell(0);
            // views/birimler.html'deki tablo başlık sayısı kadar colSpan (ID, Birim Adı, Kısa Ad, Ana Birim = 4 sütun)
            cell.colSpan = 4;
            cell.textContent = 'Henüz kayıtlı birim bulunamadı.';
            cell.style.textAlign = 'center';
        }
    }

    // Formu seç ve submit olayını dinle
    const birimEkleForm = document.querySelector('#birimEkleForm');

    // Formun sayfada var olup olmadığını kontrol et (önemli!)
    if (birimEkleForm) {
        birimEkleForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Formun normal submit davranışını engelle

            // Form alanlarından değerleri al
            const birimAdiInput = document.querySelector('#birimAdi');
            const kisaAdInput = document.querySelector('#kisaAd');
            const anaBirimKisaAdInput = document.querySelector('#anaBirimKisaAd');

            const yeniBirim = {
                birimAdi: birimAdiInput.value.trim(),
                kisaAd: kisaAdInput.value.trim(),
                anaBirimKisaAd: anaBirimKisaAdInput.value.trim() || null // Boşsa null kaydet
            };

            // Zorunlu alanların boş olup olmadığını kontrol et
            if (!yeniBirim.birimAdi || !yeniBirim.kisaAd) {
                 toastr.warning('Birim Adı ve Kısa Ad boş bırakılamaz.');
                 return;
            }
            // Ana birim girilmişse, ana birimin de birimler tablosunda varlığını kontrol etmek iyi bir uygulama olur, ama şimdilik atlıyoruz.

            // Ana Süreç'e birim ekleme isteği gönder
            try {
                const eklenenBirimId = await window.electronAPI.addBirim(yeniBirim); // TODO: addBirim handler'ı Ana Süreç'te eklenecek
                console.log('Birim başarıyla eklendi, ID:', eklenenBirimId);
                toastr.success(`"${yeniBirim.birimAdi}" başarıyla eklendi!`); // Başarı bildirimi

                // Formu temizle
                birimAdiInput.value = '';
                kisaAdInput.value = '';
                anaBirimKisaAdInput.value = '';

                // Birim listesini yenile
                const guncelBirimler = await window.electronAPI.getBirimler(); // TODO: getBirimler handler'ı Ana Süreç'te eklenecek
                displayBirimler(guncelBirimler);

            } catch (error) {
                console.error('Genel Hata Yakalandı (Birim Ekle):', error);
                console.log('Hata mesajı:', error.message);

                let displayMessage = 'Birim eklenirken beklenmeyen bir hata oluştu.';
                let toastrType = 'error';

                if (error.message && error.message.includes('UNIQUE constraint failed')) {
                     console.warn('Benzersizlik kısıtlaması hatası yakalandı.');
                     // Hata mesajından hangi sütunun tekil olduğunu bulup daha spesifik mesaj verebiliriz
                     if (error.message.includes('birimler.birimAdi')) {
                          displayMessage = `"${yeniBirim.birimAdi}" adında bir birim zaten mevcut.`;
                     } else if (error.message.includes('birimler.kisaAd')) {
                          displayMessage = `"${yeniBirim.kisaAd}" kısa adında bir birim zaten mevcut.`;
                     } else {
                         displayMessage = 'Eklemeye çalıştığınız birim zaten mevcut (Ad veya Kısa Ad).';
                     }
                     toastrType = 'warning';
                }
                // TODO: Yabancı anahtar hatasını da yakalayabiliriz (ana birim bulunamadığında)
                // if (error.message && error.message.includes('FOREIGN KEY constraint failed')) { ... }
                else {
                     displayMessage = 'Birim eklenirken bir hata oluştu: ' + error.message;
                     toastrType = 'error';
                }

                if (toastrType === 'warning') {
                    toastr.warning(displayMessage);
                } else {
                    toastr.error(displayMessage);
                }
            }
        });
    } else {
        console.error("Birim ekleme formu (birimEkleForm) bulunamadı. birimler.html yüklü mü?");
    }


    // Sayfa yüklendiğinde birimleri çek ve göster (loadBirimlerPage çağrıldığında)
     try {
        const birimler = await window.electronAPI.getBirimler(); // TODO: getBirimler handler'ı Ana Süreç'te eklenecek
        console.log('Ana Süreçten gelen birimler:', birimler);
        displayBirimler(birimler);
      } catch (error) {
        console.error('Birimleri alırken hata oluştu:', error);
        toastr.error('Birim listesi yüklenirken hata oluştu.');
      }
} // loadBirimlerPage fonksiyonunun sonu