// renderer/alimlar.js

let alimEkleForm, alimIdInput, alimTarihInput, alimUrunIdSelect, alimMiktarInput, alimBirimKisaAdSelect, alimBirimFiyatInput, alimToplamTutarInput, alimFisNoInput;
let alimFormBaslik, alimFormSubmitButton, alimFormCancelButton;
let alimlarTableBody;
// let alimAciklamaInput; // Eğer HTML'e eklenirse

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

export async function loadAlimlarPage() {
    console.log('Alımlar sayfası JavaScript\'i yükleniyor...');

    alimEkleForm = document.querySelector('#alimEkleForm');
    alimIdInput = document.querySelector('#alimIdInput');
    alimTarihInput = document.querySelector('#alimTarih');
    alimUrunIdSelect = document.querySelector('#alimUrunId');
    alimMiktarInput = document.querySelector('#alimMiktar');
    alimBirimKisaAdSelect = document.querySelector('#alimBirimKisaAd');
    alimBirimFiyatInput = document.querySelector('#alimBirimFiyat');
    alimToplamTutarInput = document.querySelector('#alimToplamTutar');
    alimFisNoInput = document.querySelector('#alimFisNo');
    alimFormBaslik = document.querySelector('#alimFormBaslik');
    alimFormSubmitButton = document.querySelector('#alimFormSubmitButton');
    alimFormCancelButton = document.querySelector('#alimFormCancelButton');
    alimlarTableBody = document.querySelector('#alimlarTable tbody');

    if (alimMiktarInput && alimBirimFiyatInput && alimToplamTutarInput) {
        const calculateTotal = () => {
            const miktar = parseFloat(alimMiktarInput.value) || 0;
            const birimFiyat = parseFloat(alimBirimFiyatInput.value) || 0;
            alimToplamTutarInput.value = (miktar * birimFiyat).toFixed(2);
        };
        alimMiktarInput.addEventListener('input', calculateTotal);
        alimBirimFiyatInput.addEventListener('input', calculateTotal);
    }

    function switchToAddMode() {
        if (!alimEkleForm) return;
        alimEkleForm.reset();
        if (alimIdInput) alimIdInput.value = '';
        if (alimFormBaslik) alimFormBaslik.textContent = 'Yeni Alım Kaydı';
        if (alimFormSubmitButton) {
            const textSpan = alimFormSubmitButton.querySelector('span');
            if (textSpan) textSpan.textContent = 'Alımı Kaydet';
            alimFormSubmitButton.classList.remove('btn-success');
            alimFormSubmitButton.classList.add('btn-primary');
        }
        if (alimFormCancelButton) alimFormCancelButton.classList.add('d-none');
        if (alimTarihInput) {
            alimTarihInput.value = new Date().toISOString().split('T')[0];
            alimTarihInput.focus();
        }
        if(alimToplamTutarInput) alimToplamTutarInput.value = "0.00";
        if(alimFisNoInput) alimFisNoInput.value = "";
    }

    async function populateDropdowns() {
        try {
            if (alimUrunIdSelect) {
                const urunler = await window.electronAPI.getUrunler();
                alimUrunIdSelect.innerHTML = '<option value="">-- Ürün/Hammadde Seçiniz --</option>';
                urunler.forEach(urun => {
                    const option = document.createElement('option');
                    option.value = urun.id; // Değer integer ID olacak
                    option.textContent = `${urun.ad} (${urun.tur})`;
                    alimUrunIdSelect.appendChild(option);
                });
            }
            if (alimBirimKisaAdSelect) {
                const birimler = await window.electronAPI.getBirimler();
                alimBirimKisaAdSelect.innerHTML = '<option value="">-- Birim Seçiniz --</option>';
                birimler.forEach(birim => {
                    const option = document.createElement('option');
                    option.value = birim.kisaAd; // Değer string kisaAd olacak
                    option.textContent = `${birim.birimAdi} (${birim.kisaAd})`;
                    alimBirimKisaAdSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Alımlar sayfası dropdownları doldurulurken hata:', error);
            toastr.error('Form alanları yüklenirken bir hata oluştu.');
        }
    }

    function displayAlimlar(alimlar) {
        if (!alimlarTableBody) return;
        alimlarTableBody.innerHTML = '';

        if (alimlar && alimlar.length > 0) {
            alimlar.forEach(alim => {
                const row = alimlarTableBody.insertRow();
                row.insertCell(0).textContent = alim.id;
                const tarihObj = new Date(alim.tarih);
                row.insertCell(1).textContent = `${tarihObj.getDate().toString().padStart(2, '0')}.${(tarihObj.getMonth() + 1).toString().padStart(2, '0')}.${tarihObj.getFullYear()}`;
                row.insertCell(2).textContent = `${alim.urunAdi} (${alim.urunTuru})`;
                row.insertCell(3).textContent = alim.miktar;
                row.insertCell(4).textContent = alim.alimBirimAdi ? `${alim.alimBirimAdi} (${alim.birimKisaAd})` : alim.birimKisaAd;
                row.insertCell(5).textContent = alim.birimFiyat.toFixed(2);
                row.insertCell(6).textContent = alim.toplamTutar.toFixed(2);
                row.insertCell(7).textContent = alim.fisNo || '-';

                const eylemlerCell = row.insertCell(8);
                eylemlerCell.classList.add('text-end');
                const buttonContainer = document.createElement('div');

                const duzenleButton = document.createElement('button');
                duzenleButton.type = 'button';
                duzenleButton.classList.add('btn', 'btn-icon', 'btn-warning');
                duzenleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>';
                duzenleButton.title = "Düzenle";
                duzenleButton.addEventListener('click', () => handleEditAlim(alim));
                buttonContainer.appendChild(duzenleButton);

                const silButton = document.createElement('button');
                silButton.type = 'button';
                silButton.classList.add('btn', 'btn-icon', 'btn-danger', 'ms-1');
                silButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>';
                silButton.title = "Sil";
                silButton.setAttribute('data-alim-id', alim.id);
                silButton.setAttribute('data-alim-desc', `${new Date(alim.tarih).toLocaleDateString('tr-TR')} - ${alim.urunAdi} (${alim.fisNo || 'Fiş Yok'})`);
                silButton.addEventListener('click', handleDeleteAlim);
                buttonContainer.appendChild(silButton);

                eylemlerCell.appendChild(buttonContainer);
            });
        } else {
            const row = alimlarTableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 9;
            cell.textContent = 'Henüz kayıtlı alım bulunamadı.';
            cell.style.textAlign = 'center';
        }
    }

    async function fetchAndDisplayAlimlar() {
        try {
            const alimlar = await window.electronAPI.getAlimlar();
            displayAlimlar(alimlar);
        } catch (error) {
            console.error('Alımlar getirilirken hata oluştu:', error);
            toastr.error('Alım kayıtları yüklenirken bir hata oluştu.');
        }
    }

    async function handleEditAlim(alim) { // async yapıldı
        if (!alimEkleForm) return;
        
        // Dropdown'ların dolduğundan emin olmak için populateDropdowns'ı bekleyebiliriz.
        // Ancak loadAlimlarPage başında zaten çağrılıyor ve bekleniyor.
        // Bu yüzden doğrudan değer ataması yapabiliriz.
        // Eğer sorun devam ederse, burada `await populateDropdowns();` çağrılabilir.

        alimIdInput.value = alim.id;
        alimTarihInput.value = alim.tarih.split('T')[0]; // Tarih formatı YYYY-MM-DD
        
        // Değerleri atamadan önce konsola yazdırarak kontrol edelim
        console.log("Düzenlenecek Alım Ürün ID:", alim.urunId, typeof alim.urunId);
        console.log("Düzenlenecek Alım Birim Kısa Ad:", alim.birimKisaAd, typeof alim.birimKisaAd);

        alimUrunIdSelect.value = alim.urunId.toString(); // select.value her zaman string bekler
        alimMiktarInput.value = alim.miktar;
        alimBirimKisaAdSelect.value = alim.birimKisaAd; // Bu zaten string olmalı
        
        alimBirimFiyatInput.value = alim.birimFiyat.toFixed(2);
        alimToplamTutarInput.value = alim.toplamTutar.toFixed(2);
        alimFisNoInput.value = alim.fisNo || "";

        if (alimFormBaslik) alimFormBaslik.textContent = `Alım Kaydını Düzenle (ID: ${alim.id})`;
        if (alimFormSubmitButton) {
            const textSpan = alimFormSubmitButton.querySelector('span');
            if (textSpan) textSpan.textContent = 'Güncelle';
            alimFormSubmitButton.classList.remove('btn-primary');
            alimFormSubmitButton.classList.add('btn-success');
        }
        if (alimFormCancelButton) alimFormCancelButton.classList.remove('d-none');
        alimTarihInput.focus();
        window.scrollTo(0, 0);
    }

    async function handleDeleteAlim(event) {
        const button = event.currentTarget;
        const alimId = button.getAttribute('data-alim-id');
        const alimDesc = button.getAttribute('data-alim-desc');

        const confirmed = await showConfirmationModal(
            `"${alimDesc}" alım kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
            'Evet, Sil', 'btn-danger'
        );

        if (!confirmed) {
            toastr.info('Silme işlemi iptal edildi.');
            return;
        }

        try {
            const silindi = await window.electronAPI.deleteAlim(Number(alimId));
            if (silindi) {
                toastr.success('Alım kaydı başarıyla silindi.');
                await fetchAndDisplayAlimlar();
                if (alimIdInput.value === alimId) {
                    switchToAddMode();
                }
            } else {
                toastr.warning('Alım kaydı silinemedi veya bulunamadı.');
            }
        } catch (error) {
            console.error('Alım silinirken hata:', error);
            toastr.error(`Alım silinirken bir hata oluştu: ${error.message}`);
        }
    }

    if (alimEkleForm) {
        alimEkleForm.onsubmit = async (event) => {
            event.preventDefault();
            const alimId = alimIdInput.value ? parseInt(alimIdInput.value) : null;

            const alimData = {
                id: alimId,
                tarih: alimTarihInput.value,
                urunId: parseInt(alimUrunIdSelect.value),
                miktar: parseFloat(alimMiktarInput.value),
                birimKisaAd: alimBirimKisaAdSelect.value,
                birimFiyat: parseFloat(alimBirimFiyatInput.value),
                toplamTutar: parseFloat(alimToplamTutarInput.value),
                fisNo: alimFisNoInput.value.trim() || null
            };

            if (!alimData.tarih || !alimData.urunId || isNaN(alimData.miktar) || alimData.miktar <=0 || !alimData.birimKisaAd || isNaN(alimData.birimFiyat) || alimData.birimFiyat < 0) {
                toastr.warning('Lütfen tüm zorunlu alanları doğru bir şekilde doldurun.');
                return;
            }

            try {
                if (alimData.id) {
                    await window.electronAPI.updateAlim(alimData);
                    toastr.success('Alım kaydı başarıyla güncellendi!');
                } else {
                    await window.electronAPI.addAlim(alimData);
                    toastr.success('Alım kaydı başarıyla eklendi!');
                }
                switchToAddMode();
                await fetchAndDisplayAlimlar();
            } catch (error) {
                console.error('Alım eklerken/güncellerken hata:', error);
                toastr.error(`İşlem sırasında bir hata oluştu: ${error.message}`);
            }
        };
    }

    if (alimFormCancelButton) {
        alimFormCancelButton.onclick = () => {
            switchToAddMode();
        };
    }

    await populateDropdowns();
    await fetchAndDisplayAlimlar();
    if (alimEkleForm) {
        switchToAddMode();
    }
}