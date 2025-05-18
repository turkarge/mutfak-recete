// renderer/giderler.js

let giderEkleForm, giderIdInput, giderTarihInput, giderKalemiInput, giderTutarInput, giderAciklamaInput;
let giderFormBaslik, giderFormSubmitButton, giderFormCancelButton;
let giderlerTableBody;

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

export async function loadGiderlerPage() {
    console.log('Giderler sayfası JavaScript\'i yükleniyor...');

    giderEkleForm = document.querySelector('#giderEkleForm');
    giderIdInput = document.querySelector('#giderIdInput');
    giderTarihInput = document.querySelector('#giderTarih');
    giderKalemiInput = document.querySelector('#giderKalemi');
    giderTutarInput = document.querySelector('#giderTutar');
    giderAciklamaInput = document.querySelector('#giderAciklama');
    giderFormBaslik = document.querySelector('#giderFormBaslik');
    giderFormSubmitButton = document.querySelector('#giderFormSubmitButton');
    giderFormCancelButton = document.querySelector('#giderFormCancelButton');
    giderlerTableBody = document.querySelector('#giderlerTable tbody');

    function switchToAddMode() {
        if (!giderEkleForm) return;
        giderEkleForm.reset();
        if (giderIdInput) giderIdInput.value = '';
        if (giderFormBaslik) giderFormBaslik.textContent = 'Yeni Gider Kaydı';
        if (giderFormSubmitButton) {
            const textSpan = giderFormSubmitButton.querySelector('span');
            if (textSpan) textSpan.textContent = 'Gideri Kaydet';
            giderFormSubmitButton.classList.remove('btn-success');
            giderFormSubmitButton.classList.add('btn-primary');
        }
        if (giderFormCancelButton) giderFormCancelButton.classList.add('d-none');
        if (giderTarihInput) {
            giderTarihInput.value = new Date().toISOString().split('T')[0];
            giderTarihInput.focus();
        }
    }

    function displayGiderler(giderler) {
        if (!giderlerTableBody) return;
        giderlerTableBody.innerHTML = '';

        if (giderler && giderler.length > 0) {
            giderler.forEach(gider => {
                const row = giderlerTableBody.insertRow();
                row.insertCell(0).textContent = gider.id;
                const tarihObj = new Date(gider.tarih);
                row.insertCell(1).textContent = `${tarihObj.getDate().toString().padStart(2, '0')}.${(tarihObj.getMonth() + 1).toString().padStart(2, '0')}.${tarihObj.getFullYear()}`;
                row.insertCell(2).textContent = gider.giderKalemi;
                const tutarCell = row.insertCell(3);
                tutarCell.textContent = gider.tutar.toFixed(2);
                tutarCell.classList.add('text-end'); // Tutarı sağa yasla
                row.insertCell(4).textContent = gider.aciklama || '-';

                const eylemlerCell = row.insertCell(5);
                eylemlerCell.classList.add('text-end');
                const buttonContainer = document.createElement('div');

                const duzenleButton = document.createElement('button');
                duzenleButton.type = 'button';
                duzenleButton.classList.add('btn', 'btn-icon', 'btn-warning');
                duzenleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>';
                duzenleButton.title = "Düzenle";
                duzenleButton.addEventListener('click', () => handleEditGider(gider));
                buttonContainer.appendChild(duzenleButton);

                const silButton = document.createElement('button');
                silButton.type = 'button';
                silButton.classList.add('btn', 'btn-icon', 'btn-danger', 'ms-1');
                silButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>';
                silButton.title = "Sil";
                silButton.setAttribute('data-gider-id', gider.id);
                silButton.setAttribute('data-gider-kalemi', gider.giderKalemi);
                silButton.addEventListener('click', handleDeleteGider);
                buttonContainer.appendChild(silButton);

                eylemlerCell.appendChild(buttonContainer);
            });
        } else {
            const row = giderlerTableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 6; // HTML'deki sütun sayısına göre
            cell.textContent = 'Henüz kayıtlı gider bulunamadı.';
            cell.style.textAlign = 'center';
        }
    }

    async function fetchAndDisplayGiderler() {
        try {
            const giderler = await window.electronAPI.getGiderler();
            displayGiderler(giderler);
        } catch (error) {
            console.error('Giderler getirilirken hata oluştu:', error);
            toastr.error('Gider kayıtları yüklenirken bir hata oluştu.');
        }
    }

    function handleEditGider(gider) {
        if (!giderEkleForm) return;
        giderIdInput.value = gider.id;
        giderTarihInput.value = gider.tarih.split('T')[0];
        giderKalemiInput.value = gider.giderKalemi;
        giderTutarInput.value = gider.tutar.toFixed(2);
        giderAciklamaInput.value = gider.aciklama || "";

        if (giderFormBaslik) giderFormBaslik.textContent = `Gider Kaydını Düzenle (ID: ${gider.id})`;
        if (giderFormSubmitButton) {
            const textSpan = giderFormSubmitButton.querySelector('span');
            if (textSpan) textSpan.textContent = 'Güncelle';
            giderFormSubmitButton.classList.remove('btn-primary');
            giderFormSubmitButton.classList.add('btn-success');
        }
        if (giderFormCancelButton) giderFormCancelButton.classList.remove('d-none');
        giderTarihInput.focus();
        window.scrollTo(0, 0);
    }

    async function handleDeleteGider(event) {
        const button = event.currentTarget;
        const giderId = button.getAttribute('data-gider-id');
        const giderKalemi = button.getAttribute('data-gider-kalemi');

        const confirmed = await showConfirmationModal(
            `"${giderKalemi}" gider kaydını (ID: ${giderId}) silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
            'Evet, Sil', 'btn-danger'
        );

        if (!confirmed) {
            toastr.info('Silme işlemi iptal edildi.');
            return;
        }

        try {
            const silindi = await window.electronAPI.deleteGider(Number(giderId));
            if (silindi) {
                toastr.success('Gider kaydı başarıyla silindi.');
                await fetchAndDisplayGiderler();
                if (giderIdInput.value === giderId) {
                    switchToAddMode();
                }
            } else {
                toastr.warning('Gider kaydı silinemedi veya bulunamadı.');
            }
        } catch (error) {
            console.error('Gider silinirken hata:', error);
            toastr.error(`Gider silinirken bir hata oluştu: ${error.message}`);
        }
    }

    if (giderEkleForm) {
        giderEkleForm.onsubmit = async (event) => {
            event.preventDefault();
            const giderId = giderIdInput.value ? parseInt(giderIdInput.value) : null;

            const giderData = {
                id: giderId,
                tarih: giderTarihInput.value,
                giderKalemi: giderKalemiInput.value.trim(),
                tutar: parseFloat(giderTutarInput.value),
                aciklama: giderAciklamaInput.value.trim() || null
            };

            if (!giderData.tarih || !giderData.giderKalemi || isNaN(giderData.tutar) || giderData.tutar <= 0) {
                toastr.warning('Lütfen tüm zorunlu alanları (Tarih, Gider Kalemi, Tutar > 0) doğru bir şekilde doldurun.');
                return;
            }

            try {
                if (giderData.id) { // Güncelleme
                    await window.electronAPI.updateGider(giderData);
                    toastr.success('Gider kaydı başarıyla güncellendi!');
                } else { // Ekleme
                    await window.electronAPI.addGider(giderData);
                    toastr.success('Gider kaydı başarıyla eklendi!');
                }
                switchToAddMode();
                await fetchAndDisplayGiderler();
            } catch (error) {
                console.error('Gider eklerken/güncellerken hata:', error);
                toastr.error(`İşlem sırasında bir hata oluştu: ${error.message}`);
            }
        };
    }

    if (giderFormCancelButton) {
        giderFormCancelButton.onclick = () => {
            switchToAddMode();
        };
    }

    await fetchAndDisplayGiderler(); // Giderleri yükle ve göster
    if (giderEkleForm) {
        switchToAddMode();
    }
}