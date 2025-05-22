// renderer/birimler.js

// Form elementleri ve tablo body'si için global değişkenler
let birimEkleForm, birimIdInput, birimAdiInput, kisaAdInput, anaBirimKisaAdInput, cevrimKatsayisiInput;
let birimFormBaslik, birimFormSubmitButton, birimFormCancelButton;
let birimlerTableBody;

// Onay Modalı Fonksiyonu
function showConfirmationModal(message, actionButtonText = 'Tamam', actionButtonClass = 'btn-primary') {
    return new Promise((resolve) => {
        const confirmationModalElement = document.getElementById('confirmationModal');
        const confirmationModalBodyElement = document.getElementById('confirmationModalBody');
        const confirmActionButtonElement = document.getElementById('confirmActionButton');
        if (!confirmationModalElement || !confirmationModalBodyElement || !confirmActionButtonElement) {
            console.error("Onay modal elementleri bulunamadı!");
            toastr.error("Uygulama hatası: Onay modalı için gerekli HTML elementleri eksik.");
            resolve(false); return;
        }
        if (typeof bootstrap === 'undefined' || typeof bootstrap.Modal === 'undefined') {
           console.error("Bootstrap Modal JS yüklenmedi veya bootstrap objesi tanımsız.");
            toastr.error("Uygulama hatası: Bootstrap Modal yüklenemedi.");
            resolve(false); return;
        }
        confirmationModalBodyElement.textContent = message;
        confirmActionButtonElement.textContent = actionButtonText;
        confirmActionButtonElement.className = 'btn';
        confirmActionButtonElement.classList.add(actionButtonClass);
        const modalInstance = bootstrap.Modal.getInstance(confirmationModalElement) || new bootstrap.Modal(confirmationModalElement);
        let confirmed = false;
        const handleConfirm = () => { confirmed = true; modalInstance.hide(); };
        const handleDismissOrHide = () => {
            confirmActionButtonElement.removeEventListener('click', handleConfirm);
            confirmationModalElement.removeEventListener('hidden.bs.modal', handleDismissOrHide);
            resolve(confirmed);
        };
        confirmActionButtonElement.removeEventListener('click', handleConfirm);
        confirmationModalElement.removeEventListener('hidden.bs.modal', handleDismissOrHide);
        confirmActionButtonElement.addEventListener('click', handleConfirm);
        confirmationModalElement.addEventListener('hidden.bs.modal', handleDismissOrHide, { once: true });
        modalInstance.show();
    });
}

// Sayfa yüklendiğinde çalışacak ana fonksiyon
export async function loadBirimlerPage() {
    console.log('Birimler sayfası JavaScript\'i yükleniyor...');

    // DOM Elementlerini Seçme
    birimEkleForm = document.querySelector('#birimEkleForm');
    birimIdInput = document.querySelector('#birimIdInput');
    birimAdiInput = document.querySelector('#birimAdi');
    kisaAdInput = document.querySelector('#kisaAd');
    anaBirimKisaAdInput = document.querySelector('#anaBirimKisaAd');
    cevrimKatsayisiInput = document.querySelector('#cevrimKatsayisi'); // Yeni input
    birimFormBaslik = document.querySelector('#birimFormBaslik');
    birimFormSubmitButton = document.querySelector('#birimFormSubmitButton');
    birimFormCancelButton = document.querySelector('#birimFormCancelButton');
    birimlerTableBody = document.querySelector('#birimlerTable tbody');

    // Formu Ekleme Moduna Ayarla
    function switchToAddMode() {
        if (!birimEkleForm) return;
        birimEkleForm.reset();
        if (birimIdInput) birimIdInput.value = '';
        if (cevrimKatsayisiInput) cevrimKatsayisiInput.value = '1'; // Varsayılan katsayı
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

    // Birimleri Tabloya Ekleme
    function displayBirimler(birimler) {
        if (!birimlerTableBody) return;
        birimlerTableBody.innerHTML = '';

        if (birimler && birimler.length > 0) {
            birimler.forEach(birim => {
                const row = birimlerTableBody.insertRow();
                row.insertCell(0).textContent = birim.id;
                row.insertCell(1).textContent = birim.birimAdi;
                row.insertCell(2).textContent = birim.kisaAd;
                row.insertCell(3).textContent = birim.anaBirimKisaAd || '-';
                const katsayiCell = row.insertCell(4);
                katsayiCell.textContent = birim.cevrimKatsayisi; // cevrimKatsayisi gösteriliyor
                katsayiCell.classList.add('text-end');

                const eylemlerCell = row.insertCell(5); // Eylemler 6. sütun (index 5)
                eylemlerCell.classList.add('text-end');
                const buttonContainer = document.createElement('div');

                const duzenleButton = document.createElement('button');
                duzenleButton.type = 'button';
                duzenleButton.classList.add('btn', 'btn-icon', 'btn-warning');
                duzenleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>';
                duzenleButton.title = "Düzenle";
                duzenleButton.addEventListener('click', () => handleEditBirimClick(birim));
                buttonContainer.appendChild(duzenleButton);

                const silButton = document.createElement('button');
                silButton.type = 'button';
                silButton.classList.add('btn', 'btn-icon', 'btn-danger', 'ms-1');
                silButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>';
                silButton.title = "Sil";
                silButton.setAttribute('data-birim-id', birim.id);
                silButton.setAttribute('data-birim-adi', birim.birimAdi);
                silButton.addEventListener('click', handleDeleteBirimClick);
                buttonContainer.appendChild(silButton);

                eylemlerCell.appendChild(buttonContainer);
            });
        } else {
            const row = birimlerTableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 6; // Colspan güncellendi
            cell.textContent = 'Henüz kayıtlı birim bulunamadı.';
            cell.style.textAlign = 'center';
        }
    }

    // Birimleri Getir ve Göster
    async function fetchAndDisplayBirimler() {
        try {
            const birimler = await window.electronAPI.getBirimler();
            displayBirimler(birimler);
        } catch (error) {
            console.error('Birimleri alırken hata oluştu:', error);
            toastr.error('Birim listesi yüklenirken hata oluştu.');
        }
    }

    // Düzenle Butonuna Tıklandığında Formu Doldur
    function handleEditBirimClick(birim) {
        if (!birimEkleForm) return;
        birimIdInput.value = birim.id;
        birimAdiInput.value = birim.birimAdi;
        kisaAdInput.value = birim.kisaAd;
        anaBirimKisaAdInput.value = birim.anaBirimKisaAd || '';
        cevrimKatsayisiInput.value = birim.cevrimKatsayisi; // Katsayıyı forma yükle

        if (birimFormBaslik) birimFormBaslik.textContent = `Birimi Düzenle: ${birim.birimAdi}`;
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

    // Sil Butonuna Tıklama (Modal ile Onay)
    async function handleDeleteBirimClick(event) {
        const button = event.currentTarget;
        const birimId = button.getAttribute('data-birim-id');
        const birimAdi = button.getAttribute('data-birim-adi');

        const confirmed = await showConfirmationModal(
            `"${birimAdi}" adlı birimi silmek istediğinizden emin misiniz?`,
            'Evet, Sil', 'btn-danger'
        );

        if (!confirmed) {
            toastr.info('Silme işlemi iptal edildi.');
            return;
        }

        try {
            const silindi = await window.electronAPI.deleteBirim(Number(birimId));
            if (silindi) {
                toastr.success(`"${birimAdi}" adlı birim başarıyla silindi.`);
                await fetchAndDisplayBirimler();
                if (birimIdInput.value === birimId) {
                    switchToAddMode();
                }
            } else {
                toastr.warning(`"${birimAdi}" adlı birim silinemedi veya bulunamadı.`);
            }
        } catch (error) {
            console.error('Birim silinirken hata:', error);
            toastr.error(`Birim silinirken bir hata oluştu: ${error.message}`);
        }
    }

    // Form Submit Olayı (Ekleme ve Güncelleme)
    if (birimEkleForm) {
        birimEkleForm.onsubmit = async (event) => {
            event.preventDefault();
            const birimData = {
                id: birimIdInput.value ? parseInt(birimIdInput.value) : null,
                birimAdi: birimAdiInput.value.trim(),
                kisaAd: kisaAdInput.value.trim(),
                anaBirimKisaAd: anaBirimKisaAdInput.value.trim() || null,
                cevrimKatsayisi: parseFloat(cevrimKatsayisiInput.value) || 1
            };

            if (!birimData.birimAdi || !birimData.kisaAd || isNaN(birimData.cevrimKatsayisi) || birimData.cevrimKatsayisi <= 0) {
                 toastr.warning('Birim Adı, Kısa Ad ve geçerli bir Çevrim Katsayısı (>0) girilmelidir.');
                 return;
            }

            try {
                let islemYapildi = false;
                if (birimData.id) {
                    const guncellendi = await window.electronAPI.updateBirim(birimData);
                    if (guncellendi) {
                        toastr.success(`"${birimData.birimAdi}" başarıyla güncellendi!`);
                        islemYapildi = true;
                    } else {
                        // updateBirim handler'ı false dönerse veya hata fırlatırsa burası çalışır.
                        // Handler zaten kayıt bulunamadığında veya değişiklik olmadığında hata fırlatıyor.
                        // Bu yüzden bu info mesajı genellikle görülmeyebilir.
                        toastr.info(`"${birimData.birimAdi}" için değişiklik yapılmadı veya kayıt bulunamadı.`);
                    }
                } else {
                    await window.electronAPI.addBirim(birimData);
                    toastr.success(`"${birimData.birimAdi}" başarıyla eklendi!`);
                    islemYapildi = true;
                }

                if (islemYapildi) {
                    switchToAddMode();
                    await fetchAndDisplayBirimler();
                }
            } catch (error) {
                console.error('Birim Ekle/Güncelle hatası:', error);
                toastr.error(`İşlem sırasında bir hata oluştu: ${error.message}`);
            }
        };
    }

    // İptal Butonuna Tıklama
    if (birimFormCancelButton) {
        birimFormCancelButton.onclick = () => {
            switchToAddMode();
        };
    }

    // Sayfa Yüklendiğinde
    await fetchAndDisplayBirimler();
    if (birimEkleForm) {
       switchToAddMode();
    }
}