// renderer/birimler.js

// Global scope'ta bir onay modalı referansı ve callback fonksiyonu
let confirmationModalInstance;
let confirmActionCallback;

// Form elementlerini global olarak tanımlayalım
let birimEkleForm, birimIdInput, birimAdiInput, kisaAdInput, anaBirimKisaAdInput;
let birimFormBaslik, birimFormSubmitButton, birimFormCancelButton;

// Bu fonksiyon, birimler.html içeriği ana sayfaya yüklendiğinde çağrılacak
export async function loadBirimlerPage() {
    console.log('Birimler sayfası JavaScript\'i yükleniyor...');

    // Form elementlerini DOM'dan seçelim
    birimEkleForm = document.querySelector('#birimEkleForm');
    birimIdInput = document.querySelector('#birimIdInput');
    birimAdiInput = document.querySelector('#birimAdi');
    kisaAdInput = document.querySelector('#kisaAd');
    anaBirimKisaAdInput = document.querySelector('#anaBirimKisaAd');
    birimFormBaslik = document.querySelector('#birimFormBaslik');
    birimFormSubmitButton = document.querySelector('#birimFormSubmitButton');
    birimFormCancelButton = document.querySelector('#birimFormCancelButton');

    // Onay modalını ve butonunu al
    const confirmationModalElement = document.getElementById('confirmationModal');
    if (confirmationModalElement) {
        if (!bootstrap.Modal.getInstance(confirmationModalElement)) {
            confirmationModalInstance = new bootstrap.Modal(confirmationModalElement);
        } else {
            confirmationModalInstance = bootstrap.Modal.getInstance(confirmationModalElement);
        }
        const confirmBtn = confirmationModalElement.querySelector('#confirmActionButton');
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                if (confirmActionCallback) {
                    confirmActionCallback();
                }
                if (confirmationModalInstance) {
                    confirmationModalInstance.hide();
                }
            };
        } else {
            console.error('Onay modalı içinde #confirmActionButton bulunamadı.');
        }
    } else {
        console.error('#confirmationModal bulunamadı. index.html dosyasını kontrol edin.');
    }

    // Formu Ekleme Moduna Ayarla
    function switchToAddMode() {
        if (!birimEkleForm) return;

        birimEkleForm.reset();
        if (birimIdInput) birimIdInput.value = '';
        if (birimFormBaslik) birimFormBaslik.textContent = 'Yeni Birim Ekle';
        if (birimFormSubmitButton) {
            const textSpan = birimFormSubmitButton.querySelector('span');
            if (textSpan) textSpan.textContent = 'Birim Ekle';

            birimFormSubmitButton.classList.remove('btn-success');
            birimFormSubmitButton.classList.add('btn-primary');
        }
        if (birimFormCancelButton) birimFormCancelButton.classList.add('d-none');
        if (birimAdiInput) birimAdiInput.focus();
    }


// Birimleri tabloya ekleyen fonksiyon
    function displayBirimler(birimler) {
        const tableBody = document.querySelector('#birimlerTable tbody');
        if (!tableBody) {
            console.error("Birimler tablosu body'si bulunamadı.");
            return;
        }
        tableBody.innerHTML = '';

        if (birimler && birimler.length > 0) {
            birimler.forEach(birim => {
                const row = tableBody.insertRow();

                row.insertCell(0).textContent = birim.id;
                row.insertCell(1).textContent = birim.birimAdi;
                row.insertCell(2).textContent = birim.kisaAd;
                row.insertCell(3).textContent = birim.anaBirimKisaAd || '';

                const eylemlerCell = row.insertCell(4);
                eylemlerCell.classList.add('text-end');

                // btn-group'u doğrudan eylemler hücresine ekleyebiliriz ya da bir div içinde tutabiliriz.
                // Şimdilik ayrı bir div kullanmaya devam edelim, daha fazla kontrol sağlayabilir.
                const buttonContainer = document.createElement('div');
                // buttonContainer.classList.add('btn-list'); // Alternatif: btn-group yerine btn-list (aralarında boşluk bırakır)
                                                            // Ancak btn-group daha yaygın.

                // Düzenle Butonu - btn-icon ile
                const duzenleButton = document.createElement('button');
                duzenleButton.type = 'button';
                // 'btn-icon' sınıfı ikonu ortalar ve butonu kare yapar.
                // 'btn-sm' ile daha küçük, sadece 'btn btn-icon' ile varsayılan boyutta olur.
                duzenleButton.classList.add('btn', 'btn-icon', 'btn-warning');
                // İkon boyutunu biraz küçültelim, btn-icon ile daha iyi durabilir.
                duzenleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>';
                duzenleButton.title = "Düzenle";
                // Explicit padding'i kaldıralım, btn ve btn-icon sınıfları halletsin.
                // duzenleButton.style.padding = "0.25rem 0.5rem"; // KALDIRILDI
                duzenleButton.addEventListener('click', () => handleEditBirimClick(birim));
                buttonContainer.appendChild(duzenleButton);

                // Sil Butonu - btn-icon ile ve arada boşluk
                const silButton = document.createElement('button');
                silButton.type = 'button';
                silButton.classList.add('btn', 'btn-icon', 'btn-danger', 'ms-1'); // 'ms-1' soldan margin ekler (butonlar arasında boşluk)
                silButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>';
                silButton.title = "Sil";
                // silButton.style.padding = "0.25rem 0.5rem"; // KALDIRILDI
                silButton.setAttribute('data-birim-id', birim.id);
                silButton.setAttribute('data-birim-adi', birim.birimAdi);
                silButton.addEventListener('click', handleDeleteBirimClick);
                buttonContainer.appendChild(silButton);

                eylemlerCell.appendChild(buttonContainer);
            });
        } else {
            // ... (liste boş mesajı aynı)
        }
    }

    // Düzenle butonuna tıklandığında formu doldurur
    function handleEditBirimClick(birim) {
        if (!birimEkleForm) return;

        birimIdInput.value = birim.id;
        birimAdiInput.value = birim.birimAdi;
        kisaAdInput.value = birim.kisaAd;
        anaBirimKisaAdInput.value = birim.anaBirimKisaAd || '';

        birimFormBaslik.textContent = `Birimi Düzenle: ${birim.birimAdi}`;
        if (birimFormSubmitButton) {
            const textSpan = birimFormSubmitButton.querySelector('span');
            if (textSpan) textSpan.textContent = 'Birimi Güncelle';

            birimFormSubmitButton.classList.remove('btn-primary');
            birimFormSubmitButton.classList.add('btn-success');
        }
        if (birimFormCancelButton) birimFormCancelButton.classList.remove('d-none');

        birimAdiInput.focus();
        window.scrollTo(0, 0);
    }

    // Silme işlemi için olay yöneticisi
    async function handleDeleteBirimClick(event) {
        const button = event.currentTarget;
        const birimId = button.getAttribute('data-birim-id');
        const birimAdi = button.getAttribute('data-birim-adi');

        if (!confirmationModalInstance) {
            console.error('Onay modalı örneği bulunamadı.');
            toastr.error('Onay modalı düzgün başlatılamadı.');
            return;
        }

        const modalTitle = confirmationModalElement.querySelector('.modal-title');
        const modalBody = confirmationModalElement.querySelector('#confirmationModalBody');
        if (modalTitle) modalTitle.textContent = 'Birim Silme Onayı';
        if (modalBody) modalBody.innerHTML = `<p><strong>"${birimAdi}"</strong> adlı birimi silmek istediğinizden emin misiniz?</p>
                                              <p class="text-danger small">Bu işlem geri alınamaz. Bu birim başka kayıtlarda kullanılıyorsa silinemeyebilir.</p>`;
        
        confirmActionCallback = async () => {
            try {
                const silindi = await window.electronAPI.deleteBirim(Number(birimId));
                if (silindi) {
                    toastr.success(`"${birimAdi}" adlı birim başarıyla silindi.`);
                    const guncelBirimler = await window.electronAPI.getBirimler();
                    displayBirimler(guncelBirimler);
                    if (birimIdInput.value === birimId) {
                        switchToAddMode();
                    }
                } else {
                    toastr.warning(`"${birimAdi}" adlı birim silinemedi. Kayıt bulunamadı veya başka bir sorun oluştu.`);
                }
            } catch (error) {
                console.error('Birim silinirken hata oluştu:', error);
                toastr.error(`Birim silinirken bir hata oluştu: ${error.message}`);
            }
        };
        confirmationModalInstance.show();
    }

    // Form submit olayını dinle
    if (birimEkleForm) {
        birimEkleForm.onsubmit = async (event) => {
            event.preventDefault();
            const birimData = {
                id: birimIdInput.value ? parseInt(birimIdInput.value) : null,
                birimAdi: birimAdiInput.value.trim(),
                kisaAd: kisaAdInput.value.trim(),
                anaBirimKisaAd: anaBirimKisaAdInput.value.trim() || null
            };

            if (!birimData.birimAdi || !birimData.kisaAd) {
                 toastr.warning('Birim Adı ve Kısa Ad boş bırakılamaz.');
                 return;
            }

            try {
                let islemYapildi = false;
                let mesaj = "";
                if (birimData.id) {
                    const guncellendi = await window.electronAPI.updateBirim(birimData);
                    if (guncellendi) {
                        mesaj = `"${birimData.birimAdi}" başarıyla güncellendi!`;
                        toastr.success(mesaj);
                        islemYapildi = true;
                    } else {
                        toastr.info(`"${birimData.birimAdi}" için herhangi bir değişiklik yapılmadı veya kayıt bulunamadı.`);
                    }
                } else {
                    await window.electronAPI.addBirim(birimData);
                    mesaj = `"${birimData.birimAdi}" başarıyla eklendi!`;
                    toastr.success(mesaj);
                    islemYapildi = true;
                }

                if (islemYapildi) {
                    switchToAddMode();
                    const guncelBirimler = await window.electronAPI.getBirimler();
                    displayBirimler(guncelBirimler);
                }
            } catch (error) {
                console.error('Genel Hata Yakalandı (Birim Ekle/Güncelle):', error);
                let displayMessage = 'İşlem sırasında beklenmeyen bir hata oluştu.';
                let toastrType = 'error';
                if (error.message.includes('UNIQUE constraint failed')) {
                     if (error.message.includes('birimler.birimAdi')) {
                          displayMessage = `"${birimData.birimAdi}" adında bir birim zaten mevcut.`;
                     } else if (error.message.includes('birimler.kisaAd')) {
                          displayMessage = `"${birimData.kisaAd}" kısa adında bir birim zaten mevcut.`;
                     } else {
                         displayMessage = error.message;
                     }
                     toastrType = 'warning';
                } else if (error.message.startsWith('"') && (error.message.endsWith('zaten mevcut.') || error.message.endsWith('kullanılıyor.'))) {
                    displayMessage = error.message;
                    toastrType = 'warning';
                } else {
                     displayMessage = 'İşlem sırasında bir hata oluştu: ' + error.message;
                }
                if (toastrType === 'warning') toastr.warning(displayMessage);
                else toastr.error(displayMessage);
            }
        };
    } else {
        console.error("Birim ekleme formu (birimEkleForm) bulunamadı.");
    }

    // İptal butonuna olay dinleyici ekle
    if (birimFormCancelButton) {
        birimFormCancelButton.onclick = () => {
            switchToAddMode();
        };
    }

    if (birimEkleForm) {
       switchToAddMode();
    }

     try {
        const birimler = await window.electronAPI.getBirimler();
        displayBirimler(birimler);
      } catch (error) {
        console.error('Birimleri alırken hata oluştu:', error);
        toastr.error('Birim listesi yüklenirken hata oluştu.');
      }
}