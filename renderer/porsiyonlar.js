// renderer/porsiyonlar.js
// Bu dosya, Porsiyon Yönetimi sayfası (views/porsiyonlar.html) ile ilgili JavaScript kodlarını içerir.

// Bu fonksiyon, porsiyonlar.html içeriği ana sayfaya yüklendiğinde çağrılacak
export async function loadPorsiyonlarPage() {
    console.log('Porsiyonlar sayfası JavaScript\'i yükleniyor...');

    // !!! DİKKAT: Buradaki kodlar, porsiyonlar.html yüklendikten sonra çalışacaktır.
    // DOM elementlerine (form, tablo vb.) bu fonksiyon içinden erişin.

    const sonUrunSelect = document.querySelector('#sonUrunId');
    const satisBirimiSelect = document.querySelector('#satisBirimiKisaAd');
    const porsiyonEkleForm = document.querySelector('#porsiyonEkleForm');
    const porsiyonlarTableBody = document.querySelector('#porsiyonlarTable tbody');

    // Formdaki Son Ürünler ve Birimler dropdown'larını dolduran yardımcı fonksiyon
    async function populateDropdowns() {
        try {
             // Ana Süreç'ten sadece Son Ürün türündeki ürünleri çek
             const sonUrunler = await window.electronAPI.getUrunlerByTur('Son Ürün'); // TODO: getUrunlerByTur handler'ı eklenecek
             console.log('Son Ürünler dropdown için:', sonUrunler);
             sonUrunSelect.innerHTML = '<option value="">-- Son Ürün Seçiniz --</option>'; // Temizle ve varsayılanı ekle
             sonUrunler.forEach(urun => {
                const option = document.createElement('option');
                option.value = urun.id;
                option.textContent = urun.ad;
                sonUrunSelect.appendChild(option);
             });

             // Ana Süreç'ten tüm birimleri çek
             const birimler = await window.electronAPI.getBirimler(); // getBirimler handler'ı mevcut
             console.log('Birimler dropdown için:', birimler);
             satisBirimiSelect.innerHTML = '<option value="">-- Satış Birimi Seçiniz --</option>'; // Temizle ve varsayılanı ekle
              birimler.forEach(birim => {
                const option = document.createElement('option');
                option.value = birim.kisaAd;
                option.textContent = `${birim.birimAdi} (${birim.kisaAd})`;
                satisBirimiSelect.appendChild(option);
             });

        } catch (error) {
             console.error('Dropdownlar doldurulurken hata oluştu:', error);
             toastr.error('Dropdownlar yüklenirken bir hata oluştu.');
        }
    }


    // Porsiyonları tabloya ekleyen fonksiyon (displayPorsiyonlar)
    function displayPorsiyonlar(porsiyonlar) {
        porsiyonlarTableBody.innerHTML = ''; // Tablonun mevcut içeriğini tamamen temizle

        if (porsiyonlar && porsiyonlar.length > 0) {
            porsiyonlar.forEach(porsiyon => {
                const row = porsiyonlarTableBody.insertRow(); // Yeni bir satır oluştur

                // Her satıra 5 hücre (sütun) ekle (views/porsiyonlar.html'e göre)
                row.insertCell(0).textContent = porsiyon.id;
                // Son Ürünün Adını göstermek için porsiyon objesinde 'sonUrunAdi' alanı olmalı
                row.insertCell(1).textContent = porsiyon.sonUrunAdi || 'Bilinmiyor';
                row.insertCell(2).textContent = porsiyon.porsiyonAdi;
                // Satış Biriminin Kısa Adını göstermek için porsiyon objesinde 'satisBirimiKisaAd' alanı olmalı
                row.insertCell(3).textContent = porsiyon.satisBirimiKisaAd || 'Bilinmiyor';
                row.insertCell(4).textContent = porsiyon.varsayilanSatisFiyati ? porsiyon.varsayilanSatisFiyati.toFixed(2) : '0.00';
            });

        } else {
            // Eğer porsiyon yoksa bilgilendirici bir mesaj göster
            const row = porsiyonlarTableBody.insertRow();
            const cell = row.insertCell(0);
            // views/porsiyonlar.html'deki tablo başlık sayısı kadar colSpan (5 sütun)
            cell.colSpan = 5;
            cell.textContent = 'Henüz kayıtlı porsiyon bulunamadı.';
            cell.style.textAlign = 'center';
        }
    }

    // Formun sayfada var olup olmadığını kontrol et (önemli!)
    if (porsiyonEkleForm) {
        porsiyonEkleForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Formun normal submit davranışını engelle

            // Form alanlarından değerleri al
            const sonUrunId = sonUrunSelect.value;
            const porsiyonAdi = document.querySelector('#porsiyonAdi').value.trim();
            const satisBirimiKisaAd = satisBirimiSelect.value;
            const varsayilanSatisFiyati = document.querySelector('#varsayilanSatisFiyati').value; // string olarak gelir

            const yeniPorsiyon = {
                sonUrunId: parseInt(sonUrunId), // Sayı olarak kaydet
                porsiyonAdi: porsiyonAdi,
                satisBirimiKisaAd: satisBirimiKisaAd,
                // Fiyatı sayıya çevir, boşsa null yap
                varsayilanSatisFiyati: varsayilanSatisFiyati ? parseFloat(varsayilanSatisFiyati) : null
            };

            // Zorunlu alanların boş olup olmadığını kontrol et
            if (!yeniPorsiyon.sonUrunId || !yeniPorsiyon.porsiyonAdi || !yeniPorsiyon.satisBirimiKisaAd) {
                 toastr.warning('Son Ürün, Porsiyon Adı ve Satış Birimi boş bırakılamaz.');
                 return;
            }

            // Ana Süreç'e porsiyon ekleme isteği gönder
            try {
                const eklenenPorsiyonId = await window.electronAPI.addPorsiyon(yeniPorsiyon); // TODO: addPorsiyon handler'ı Ana Süreç'te eklenecek
                console.log('Porsiyon başarıyla eklendi, ID:', eklenenPorsiyonId);
                toastr.success(`"${yeniPorsiyon.porsiyonAdi}" başarıyla eklendi!`); // Başarı bildirimi

                // Formu temizle
                porsiyonEkleForm.reset(); // Formu sıfırla

                // Porsiyon listesini yenile
                const guncelPorsiyonlar = await window.electronAPI.getPorsiyonlar(); // TODO: getPorsiyonlar handler'ı Ana Süreç'te eklenecek
                displayPorsiyonlar(guncelPorsiyonlar);

            } catch (error) {
                console.error('Genel Hata Yakalandı (Porsiyon Ekle):', error);
                console.log('Hata mesajı:', error.message);

                let displayMessage = 'Porsiyon eklenirken beklenmeyen bir hata oluştu.';
                let toastrType = 'error';

                if (error.message && error.message.includes('UNIQUE constraint failed')) {
                     console.warn('Benzersizlik kısıtlaması hatası yakalandı.');
                     // Hata mesajından hangi sütunların tekil olduğunu bulup daha spesifik mesaj verebiliriz
                     if (error.message.includes('porsiyonlar.sonUrunId, porsiyonlar.porsiyonAdi')) {
                          // Hatanın kaynağı UNIQUE(sonUrunId, porsiyonAdi) kısıtlaması
                          // Hangi son ürüne ait olduğunu bulup mesajı özelleştirelim
                          const selectedUrunAdi = sonUrunSelect.options[sonUrunSelect.selectedIndex].text;
                          displayMessage = `"${selectedUrunAdi}" ürünü için "${yeniPorsiyon.porsiyonAdi}" adında bir porsiyon zaten mevcut.`;
                     } else {
                         displayMessage = 'Eklemeye çalıştığınız porsiyon zaten mevcut (Aynı Ürün ve Porsiyon Adı).';
                     }
                     toastrType = 'warning';
                }
                // TODO: Yabancı anahtar hatalarını da yakalayabiliriz (Son Ürün veya Satış Birimi bulunamadığında)
                // if (error.message && error.message.includes('FOREIGN KEY constraint failed')) { ... }
                else {
                     displayMessage = 'Porsiyon eklenirken bir hata oluştu: ' + error.message;
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
        console.error("Porsiyon ekleme formu (porsiyonEkleForm) bulunamadı. porsiyonlar.html yüklü mü?");
    }

    // Sayfa yüklendiğinde yapılacaklar: Dropdownları doldur ve porsiyonları çekip göster
    await populateDropdowns(); // Dropdownları doldur

    try {
        const porsiyonlar = await window.electronAPI.getPorsiyonlar(); // TODO: getPorsiyonlar handler'ı eklenecek
        console.log('Ana Süreçten gelen porsiyonlar:', porsiyonlar);
        displayPorsiyonlar(porsiyonlar); // Porsiyonları tabloya göster
      } catch (error) {
        console.error('Porsiyonları alırken hata oluştu:', error);
        toastr.error('Porsiyon listesi yüklenirken hata oluştu.');
      }
} // loadPorsiyonlarPage fonksiyonunun sonu