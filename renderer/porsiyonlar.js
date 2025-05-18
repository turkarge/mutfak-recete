// renderer/porsiyonlar.js

// Form elementleri global scope'ta
let porsiyonEkleForm, porsiyonIdInput, sonUrunSelect, porsiyonAdiInput, satisBirimiSelect, varsayilanSatisFiyatiInput;
let porsiyonFormBaslik, porsiyonFormSubmitButton, porsiyonFormCancelButton;
let porsiyonlarTableBody;

// Onay Modalı Fonksiyonu (Diğer sayfalardaki gibi)
function showConfirmationModal(message, actionButtonText = 'Tamam', actionButtonClass = 'btn-primary') {
    return new Promise((resolve) => {
        const confirmationModalElement = document.getElementById('confirmationModal');
        const confirmationModalBodyElement = document.getElementById('confirmationModalBody');
        const confirmActionButtonElement = document.getElementById('confirmActionButton');

        if (!confirmationModalElement || !confirmationModalBodyElement || !confirmActionButtonElement) {
            console.error("Onay modal elementleri bulunamadı! Lütfen index.html dosyanızı kontrol edin.");
            toastr.error("Uygulama hatası: Onay modalı için gerekli HTML elementleri eksik.");
            resolve(false);
            return;
        }
        if (typeof bootstrap === 'undefined' || typeof bootstrap.Modal === 'undefined') {
           console.error("Bootstrap Modal JS yüklenmedi veya bootstrap objesi tanımsız.");
            toastr.error("Uygulama hatası: Bootstrap Modal yüklenemedi.");
            resolve(false);
            return;
        }
        confirmationModalBodyElement.textContent = message;
        confirmActionButtonElement.textContent = actionButtonText;
        confirmActionButtonElement.className = 'btn';
        confirmActionButtonElement.classList.add(actionButtonClass);

        const modalInstance = bootstrap.Modal.getInstance(confirmationModalElement) || new bootstrap.Modal(confirmationModalElement);
        let confirmed = false;
        const handleConfirm = () => {
            confirmed = true;
            modalInstance.hide();
        };
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

export async function loadPorsiyonlarPage() {
    console.log('Porsiyonlar sayfası JavaScript\'i yükleniyor...');

    // DOM Elementlerini Seçme
    porsiyonEkleForm = document.querySelector('#porsiyonEkleForm');
    porsiyonIdInput = document.querySelector('#porsiyonIdInput');
    sonUrunSelect = document.querySelector('#sonUrunId');
    porsiyonAdiInput = document.querySelector('#porsiyonAdi');
    satisBirimiSelect = document.querySelector('#satisBirimiKisaAd');
    varsayilanSatisFiyatiInput = document.querySelector('#varsayilanSatisFiyati');
    porsiyonFormBaslik = document.querySelector('#porsiyonFormBaslik');
    porsiyonFormSubmitButton = document.querySelector('#porsiyonFormSubmitButton');
    porsiyonFormCancelButton = document.querySelector('#porsiyonFormCancelButton');
    porsiyonlarTableBody = document.querySelector('#porsiyonlarTable tbody');

    // Formu Ekleme Moduna Ayarla
    function switchToAddMode() {
        if (!porsiyonEkleForm) return;
        porsiyonEkleForm.reset();
        if (porsiyonIdInput) porsiyonIdInput.value = '';
        if (porsiyonFormBaslik) porsiyonFormBaslik.textContent = 'Yeni Porsiyon Ekle';
        if (porsiyonFormSubmitButton) {
            const textSpan = porsiyonFormSubmitButton.querySelector('span'); // HTML'deki span'i hedefle
            if (textSpan) textSpan.textContent = 'Porsiyon Ekle'; // Veya "Kaydet"
            porsiyonFormSubmitButton.classList.remove('btn-success');
            porsiyonFormSubmitButton.classList.add('btn-primary');
        }
        if (porsiyonFormCancelButton) porsiyonFormCancelButton.classList.add('d-none');
        if (sonUrunSelect) sonUrunSelect.focus();
    }

    // Dropdownları Doldur
    async function populateDropdowns() {
        try {
            if (!sonUrunSelect || !satisBirimiSelect) return;
            const sonUrunler = await window.electronAPI.getUrunlerByTur('Son Ürün');
            sonUrunSelect.innerHTML = '<option value="">-- Son Ürün Seçiniz --</option>';
            sonUrunler.forEach(urun => {
                const option = document.createElement('option');
                option.value = urun.id;
                option.textContent = urun.ad;
                sonUrunSelect.appendChild(option);
            });
            const birimler = await window.electronAPI.getBirimler();
            satisBirimiSelect.innerHTML = '<option value="">-- Satış Birimi Seçiniz --</option>';
            birimler.forEach(birim => {
                const option = document.createElement('option');
                option.value = birim.kisaAd;
                option.textContent = `${birim.birimAdi} (${birim.kisaAd})`;
                satisBirimiSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Dropdownlar doldurulurken hata:', error);
            toastr.error('Form alanları yüklenirken bir hata oluştu.');
        }
    }

    // Porsiyonları Tabloya Ekleme
    function displayPorsiyonlar(porsiyonlar) {
        if (!porsiyonlarTableBody) return;
        porsiyonlarTableBody.innerHTML = '';

        if (porsiyonlar && porsiyonlar.length > 0) {
            porsiyonlar.forEach(porsiyon => {
                const row = porsiyonlarTableBody.insertRow();
                row.insertCell(0).textContent = porsiyon.id;
                row.insertCell(1).textContent = porsiyon.sonUrunAdi || 'Bilinmiyor';
                row.insertCell(2).textContent = porsiyon.porsiyonAdi;
                row.insertCell(3).textContent = porsiyon.satisBirimiKisaAd || 'Bilinmiyor';
                row.insertCell(4).textContent = porsiyon.varsayilanSatisFiyati != null ? porsiyon.varsayilanSatisFiyati.toFixed(2) : 'Belirsiz';

                const eylemlerCell = row.insertCell(5);
                eylemlerCell.classList.add('text-end');

                const buttonContainer = document.createElement('div');
                // buttonContainer.classList.add('btn-list'); // veya btn-group

                const duzenleButton = document.createElement('button');
                duzenleButton.type = 'button';
                duzenleButton.classList.add('btn', 'btn-icon', 'btn-warning');
                duzenleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>';
                duzenleButton.title = "Düzenle";
                duzenleButton.addEventListener('click', () => handleEditPorsiyonClick(porsiyon));
                buttonContainer.appendChild(duzenleButton);

                const silButton = document.createElement('button');
                silButton.type = 'button';
                silButton.classList.add('btn', 'btn-icon', 'btn-danger', 'ms-1');
                silButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>';
                silButton.title = "Sil";
                silButton.setAttribute('data-porsiyon-id', porsiyon.id);
                silButton.setAttribute('data-porsiyon-adi', `${porsiyon.sonUrunAdi} - ${porsiyon.porsiyonAdi}`);
                silButton.addEventListener('click', handleDeletePorsiyonClick);
                buttonContainer.appendChild(silButton);

                eylemlerCell.appendChild(buttonContainer);
            });
        } else {
            const row = porsiyonlarTableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 6;
            cell.textContent = 'Henüz kayıtlı porsiyon bulunamadı.';
            cell.style.textAlign = 'center';
        }
    }

    // Düzenle Butonuna Tıklama
    function handleEditPorsiyonClick(porsiyon) {
        if (!porsiyonEkleForm) return;
        porsiyonIdInput.value = porsiyon.id;
        sonUrunSelect.value = porsiyon.sonUrunId;
        porsiyonAdiInput.value = porsiyon.porsiyonAdi;
        satisBirimiSelect.value = porsiyon.satisBirimiKisaAd;
        varsayilanSatisFiyatiInput.value = porsiyon.varsayilanSatisFiyati != null ? porsiyon.varsayilanSatisFiyati.toFixed(2) : '';

        if (porsiyonFormBaslik) porsiyonFormBaslik.textContent = `Porsiyonu Düzenle: ${porsiyon.sonUrunAdi} - ${porsiyon.porsiyonAdi}`;
        if (porsiyonFormSubmitButton) {
            const textSpan = porsiyonFormSubmitButton.querySelector('span');
            if (textSpan) textSpan.textContent = 'Porsiyonu Güncelle';
            porsiyonFormSubmitButton.classList.remove('btn-primary');
            porsiyonFormSubmitButton.classList.add('btn-success');
        }
        if (porsiyonFormCancelButton) porsiyonFormCancelButton.classList.remove('d-none');
        sonUrunSelect.focus();
        window.scrollTo(0, 0);
    }

    // Sil Butonuna Tıklama
    async function handleDeletePorsiyonClick(event) {
        const button = event.currentTarget;
        const porsiyonId = button.getAttribute('data-porsiyon-id');
        const porsiyonAdi = button.getAttribute('data-porsiyon-adi');

        try {
            const confirmed = await showConfirmationModal(
                `"${porsiyonAdi}" adlı porsiyonu silmek istediğinizden emin misiniz?`,
                'Evet, Sil',
                'btn-danger'
            );
            if (!confirmed) {
                toastr.info('Porsiyon silme işlemi iptal edildi.');
                return;
            }
            const silindi = await window.electronAPI.deletePorsiyon(Number(porsiyonId));
            if (silindi) {
                toastr.success(`"${porsiyonAdi}" adlı porsiyon başarıyla silindi.`);
                await fetchAndDisplayPorsiyonlar();
                if (porsiyonIdInput.value === porsiyonId) {
                    switchToAddMode();
                }
            } // 'else' bloğu deletePorsiyon'dan hata gelirse çalışır
        } catch (error) {
            console.error('Porsiyon silinirken hata:', error);
            toastr.error(`Porsiyon silinirken bir hata oluştu: ${error.message}`);
        }
    }

    // Form Submit Olayı
    if (porsiyonEkleForm) {
        porsiyonEkleForm.onsubmit = async (event) => {
            event.preventDefault();
            const porsiyonData = {
                id: porsiyonIdInput.value ? parseInt(porsiyonIdInput.value) : null,
                sonUrunId: parseInt(sonUrunSelect.value),
                porsiyonAdi: porsiyonAdiInput.value.trim(),
                satisBirimiKisaAd: satisBirimiSelect.value,
                varsayilanSatisFiyati: varsayilanSatisFiyatiInput.value.trim() === '' ? null : parseFloat(varsayilanSatisFiyatiInput.value)
            };

            if (!porsiyonData.sonUrunId || !porsiyonData.porsiyonAdi || !porsiyonData.satisBirimiKisaAd) {
                toastr.warning('Son Ürün, Porsiyon Adı ve Satış Birimi boş bırakılamaz.');
                return;
            }
            if (porsiyonData.varsayilanSatisFiyati !== null && isNaN(porsiyonData.varsayilanSatisFiyati)) {
                toastr.warning('Varsayılan Satış Fiyatı geçerli bir sayı olmalıdır.');
                return;
            }
            if (porsiyonData.varsayilanSatisFiyati < 0) {
                toastr.warning('Varsayılan Satış Fiyatı negatif olamaz.');
                return;
            }

            try {
                let islemYapildi = false;
                const porsiyonEtiketi = `${sonUrunSelect.options[sonUrunSelect.selectedIndex].text} - ${porsiyonData.porsiyonAdi}`;

                if (porsiyonData.id) {
                    const guncellendi = await window.electronAPI.updatePorsiyon(porsiyonData);
                    if (guncellendi) {
                        toastr.success(`"${porsiyonEtiketi}" başarıyla güncellendi!`);
                        islemYapildi = true;
                    } else {
                        toastr.info(`"${porsiyonEtiketi}" için değişiklik yapılmadı veya kayıt bulunamadı.`);
                    }
                } else {
                    await window.electronAPI.addPorsiyon(porsiyonData);
                    toastr.success(`"${porsiyonEtiketi}" başarıyla eklendi!`);
                    islemYapildi = true;
                }

                if (islemYapildi) {
                    switchToAddMode();
                    await fetchAndDisplayPorsiyonlar();
                }
            } catch (error) {
                console.error('Porsiyon Ekle/Güncelle hatası:', error);
                let displayMessage = 'İşlem sırasında bir hata oluştu.';
                if (error.message.includes('adında başka bir porsiyon zaten mevcut.')) {
                    displayMessage = error.message;
                } else if (error.message.includes('UNIQUE constraint failed')) {
                     const selectedUrunAdi = sonUrunSelect.options[sonUrunSelect.selectedIndex].text;
                     displayMessage = `"${selectedUrunAdi}" ürünü için "${porsiyonData.porsiyonAdi}" adında bir porsiyon zaten mevcut.`;
                } else {
                     displayMessage = 'İşlem sırasında bir hata oluştu: ' + error.message;
                }
                toastr.error(displayMessage);
            }
        };
    }

    // İptal Butonu
    if (porsiyonFormCancelButton) {
        porsiyonFormCancelButton.onclick = () => {
            switchToAddMode();
        };
    }

    // Sayfa Yükleme
    async function fetchAndDisplayPorsiyonlar() {
        try {
            const porsiyonlar = await window.electronAPI.getPorsiyonlar();
            displayPorsiyonlar(porsiyonlar);
        } catch (error) {
            console.error('Porsiyonları alırken hata:', error);
            toastr.error('Porsiyon listesi yüklenirken hata oluştu.');
        }
    }

    await populateDropdowns();
    await fetchAndDisplayPorsiyonlar();
    if (porsiyonEkleForm) {
       switchToAddMode();
    }
}