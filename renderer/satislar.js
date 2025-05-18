// renderer/satislar.js

let satisEkleForm, satisIdInput, satisTarihInput, satisPorsiyonIdSelect, satisMiktarInput, satisFiyatiInput, satisToplamTutarInput, satisAciklamaInput;
let satisFormBaslik, satisFormSubmitButton, satisFormCancelButton;
let satislarTableBody;

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

export async function loadSatislarPage() {
    console.log('Satışlar sayfası JavaScript\'i yükleniyor...');

    satisEkleForm = document.querySelector('#satisEkleForm');
    satisIdInput = document.querySelector('#satisIdInput');
    satisTarihInput = document.querySelector('#satisTarih');
    satisPorsiyonIdSelect = document.querySelector('#satisPorsiyonId');
    satisMiktarInput = document.querySelector('#satisMiktar');
    satisFiyatiInput = document.querySelector('#satisFiyati');
    satisToplamTutarInput = document.querySelector('#satisToplamTutar');
    satisAciklamaInput = document.querySelector('#satisAciklama');
    satisFormBaslik = document.querySelector('#satisFormBaslik');
    satisFormSubmitButton = document.querySelector('#satisFormSubmitButton');
    satisFormCancelButton = document.querySelector('#satisFormCancelButton');
    satislarTableBody = document.querySelector('#satislarTable tbody');

    const calculateTotal = () => {
        const miktar = parseFloat(satisMiktarInput.value) || 0;
        const satisFiyati = parseFloat(satisFiyatiInput.value) || 0;
        if (satisToplamTutarInput) satisToplamTutarInput.value = (miktar * satisFiyati).toFixed(2);
    };

    if (satisMiktarInput) satisMiktarInput.addEventListener('input', calculateTotal);
    if (satisFiyatiInput) satisFiyatiInput.addEventListener('input', calculateTotal);

    if (satisPorsiyonIdSelect && satisFiyatiInput) {
        satisPorsiyonIdSelect.addEventListener('change', (event) => {
            const selectedOption = event.target.options[event.target.selectedIndex];
            const varsayilanFiyat = selectedOption.dataset.varsayilanFiyat;
            if (varsayilanFiyat && varsayilanFiyat !== 'null' && varsayilanFiyat !== 'undefined') {
                satisFiyatiInput.value = parseFloat(varsayilanFiyat).toFixed(2);
            } else {
                satisFiyatiInput.value = "";
            }
            calculateTotal(); // Fiyat değişince toplamı güncelle
        });
    }

    function switchToAddMode() {
        if (!satisEkleForm) return;
        satisEkleForm.reset();
        if (satisIdInput) satisIdInput.value = '';
        if (satisFormBaslik) satisFormBaslik.textContent = 'Yeni Satış Kaydı';
        if (satisFormSubmitButton) {
            const textSpan = satisFormSubmitButton.querySelector('span');
            if (textSpan) textSpan.textContent = 'Satışı Kaydet';
            satisFormSubmitButton.classList.remove('btn-success');
            satisFormSubmitButton.classList.add('btn-primary');
        }
        if (satisFormCancelButton) satisFormCancelButton.classList.add('d-none');
        if (satisTarihInput) {
            satisTarihInput.value = new Date().toISOString().split('T')[0];
            satisTarihInput.focus();
        }
        if(satisToplamTutarInput) satisToplamTutarInput.value = "0.00";
    }

    async function populateDropdowns() {
        try {
            if (satisPorsiyonIdSelect) {
                const porsiyonlar = await window.electronAPI.getPorsiyonlar();
                satisPorsiyonIdSelect.innerHTML = '<option value="">-- Porsiyon Seçiniz --</option>';
                porsiyonlar.forEach(porsiyon => {
                    const option = document.createElement('option');
                    option.value = porsiyon.id;
                    option.dataset.varsayilanFiyat = porsiyon.varsayilanSatisFiyati || '0';
                    option.textContent = `${porsiyon.sonUrunAdi} - ${porsiyon.porsiyonAdi}`;
                    satisPorsiyonIdSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Satışlar sayfası dropdownları doldurulurken hata:', error);
            toastr.error('Porsiyon listesi yüklenirken bir hata oluştu.');
        }
    }

    function displaySatislar(satislar) {
        if (!satislarTableBody) return;
        satislarTableBody.innerHTML = '';

        if (satislar && satislar.length > 0) {
            satislar.forEach(satis => {
                const row = satislarTableBody.insertRow();
                row.insertCell(0).textContent = satis.id;
                const tarihObj = new Date(satis.tarih);
                row.insertCell(1).textContent = `${tarihObj.getDate().toString().padStart(2, '0')}.${(tarihObj.getMonth() + 1).toString().padStart(2, '0')}.${tarihObj.getFullYear()}`;
                row.insertCell(2).textContent = `${satis.sonUrunAdi} - ${satis.porsiyonAdi}`;
                const miktarCell = row.insertCell(3);
                miktarCell.textContent = satis.miktar;
                miktarCell.classList.add('text-end');
                const satisFiyatiCell = row.insertCell(4);
                satisFiyatiCell.textContent = satis.satisFiyati.toFixed(2);
                satisFiyatiCell.classList.add('text-end');
                const toplamTutarCell = row.insertCell(5);
                toplamTutarCell.textContent = satis.toplamSatisTutari.toFixed(2);
                toplamTutarCell.classList.add('text-end');
                row.insertCell(6).textContent = satis.aciklama || '-';

                const eylemlerCell = row.insertCell(7);
                eylemlerCell.classList.add('text-end');
                const buttonContainer = document.createElement('div');

                const duzenleButton = document.createElement('button');
                duzenleButton.type = 'button';
                duzenleButton.classList.add('btn', 'btn-icon', 'btn-warning');
                duzenleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>';
                duzenleButton.title = "Düzenle";
                duzenleButton.addEventListener('click', () => handleEditSatis(satis));
                buttonContainer.appendChild(duzenleButton);

                const silButton = document.createElement('button');
                silButton.type = 'button';
                silButton.classList.add('btn', 'btn-icon', 'btn-danger', 'ms-1');
                silButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>';
                silButton.title = "Sil";
                silButton.setAttribute('data-satis-id', satis.id);
                silButton.setAttribute('data-satis-desc', `${new Date(satis.tarih).toLocaleDateString('tr-TR')} - ${satis.sonUrunAdi} - ${satis.porsiyonAdi}`);
                silButton.addEventListener('click', handleDeleteSatis);
                buttonContainer.appendChild(silButton);

                eylemlerCell.appendChild(buttonContainer);
            });
        } else {
            const row = satislarTableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 8;
            cell.textContent = 'Henüz satış kaydı bulunamadı.';
            cell.style.textAlign = 'center';
        }
    }

    async function fetchAndDisplaySatislar() {
        try {
            const satislar = await window.electronAPI.getSatislar();
            displaySatislar(satislar);
        } catch (error) {
            console.error('Satışlar getirilirken hata oluştu:', error);
            toastr.error('Satış kayıtları yüklenirken bir hata oluştu.');
        }
    }

    function handleEditSatis(satis) {
        if (!satisEkleForm) return;
        satisIdInput.value = satis.id;
        satisTarihInput.value = satis.tarih.split('T')[0];
        satisPorsiyonIdSelect.value = satis.porsiyonId.toString(); // porsiyonId integer olabilir
        satisMiktarInput.value = satis.miktar;
        satisFiyatiInput.value = satis.satisFiyati.toFixed(2);
        satisToplamTutarInput.value = satis.toplamSatisTutari.toFixed(2);
        satisAciklamaInput.value = satis.aciklama || "";

        if (satisFormBaslik) satisFormBaslik.textContent = `Satış Kaydını Düzenle (ID: ${satis.id})`;
        if (satisFormSubmitButton) {
            const textSpan = satisFormSubmitButton.querySelector('span');
            if (textSpan) textSpan.textContent = 'Güncelle';
            satisFormSubmitButton.classList.remove('btn-primary');
            satisFormSubmitButton.classList.add('btn-success');
        }
        if (satisFormCancelButton) satisFormCancelButton.classList.remove('d-none');
        satisTarihInput.focus();
        window.scrollTo(0, 0);
    }

    async function handleDeleteSatis(event) {
        const button = event.currentTarget;
        const satisId = button.getAttribute('data-satis-id');
        const satisDesc = button.getAttribute('data-satis-desc');

        const confirmed = await showConfirmationModal(
            `"${satisDesc}" satış kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
            'Evet, Sil', 'btn-danger'
        );

        if (!confirmed) {
            toastr.info('Silme işlemi iptal edildi.');
            return;
        }

        try {
            const silindi = await window.electronAPI.deleteSatis(Number(satisId));
            if (silindi) {
                toastr.success('Satış kaydı başarıyla silindi.');
                await fetchAndDisplaySatislar();
                if (satisIdInput.value === satisId) {
                    switchToAddMode();
                }
            } else {
                toastr.warning('Satış kaydı silinemedi veya bulunamadı.');
            }
        } catch (error) {
            console.error('Satış silinirken hata:', error);
            toastr.error(`Satış silinirken bir hata oluştu: ${error.message}`);
        }
    }

    if (satisEkleForm) {
        satisEkleForm.onsubmit = async (event) => {
            event.preventDefault();
            const satisId = satisIdInput.value ? parseInt(satisIdInput.value) : null;

            const satisData = {
                id: satisId,
                tarih: satisTarihInput.value,
                porsiyonId: parseInt(satisPorsiyonIdSelect.value),
                miktar: parseFloat(satisMiktarInput.value),
                satisFiyati: parseFloat(satisFiyatiInput.value),
                toplamSatisTutari: parseFloat(satisToplamTutarInput.value),
                aciklama: satisAciklamaInput.value.trim() || null
            };

            if (!satisData.tarih || !satisData.porsiyonId || isNaN(satisData.miktar) || satisData.miktar <=0 || isNaN(satisData.satisFiyati) || satisData.satisFiyati < 0) {
                toastr.warning('Lütfen tüm zorunlu alanları (Tarih, Porsiyon, Miktar > 0, Satış Fiyatı >= 0) doğru bir şekilde doldurun.');
                return;
            }

            try {
                if (satisData.id) {
                    await window.electronAPI.updateSatis(satisData);
                    toastr.success('Satış kaydı başarıyla güncellendi!');
                } else {
                    await window.electronAPI.addSatis(satisData);
                    toastr.success('Satış kaydı başarıyla eklendi!');
                }
                switchToAddMode();
                await fetchAndDisplaySatislar();
            } catch (error) {
                console.error('Satış eklerken/güncellerken hata:', error);
                toastr.error(`İşlem sırasında bir hata oluştu: ${error.message}`);
            }
        };
    }

    if (satisFormCancelButton) {
        satisFormCancelButton.onclick = () => {
            switchToAddMode();
        };
    }

    await populateDropdowns();
    await fetchAndDisplaySatislar();
    if (satisEkleForm) {
        switchToAddMode();
    }
}