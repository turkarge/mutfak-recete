// renderer/porsiyonlar.js
// Bu dosya, Porsiyon Yönetimi sayfası (views/porsiyonlar.html) ile ilgili JavaScript kodlarını içerir.

let confirmationModalInstance;
let confirmActionCallback;

let porsiyonEkleForm, porsiyonIdInput, sonUrunSelect, porsiyonAdiInput, satisBirimiSelect, varsayilanSatisFiyatiInput;
let porsiyonFormBaslik, porsiyonFormSubmitButton, porsiyonFormCancelButton;
let porsiyonlarTableBody;

export async function loadPorsiyonlarPage() {
    console.log('Porsiyonlar sayfası JavaScript\'i yükleniyor...');

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
                if (confirmationModalInstance) confirmationModalInstance.hide();
            };
        } else {
            console.error('Onay modalı içinde #confirmActionButton bulunamadı.');
        }
    } else {
        console.error('#confirmationModal bulunamadı.');
    }

    // Formu Ekleme Moduna Ayarla
    function switchToAddMode() {
        if (!porsiyonEkleForm) return;

        porsiyonEkleForm.reset(); // Formu temizle
        if (porsiyonIdInput) porsiyonIdInput.value = '';
        if (porsiyonFormBaslik) porsiyonFormBaslik.textContent = 'Yeni Porsiyon Ekle';
        if (porsiyonFormSubmitButton) {
            porsiyonFormSubmitButton.textContent = 'Porsiyon Ekle';
            porsiyonFormSubmitButton.classList.remove('btn-success');
            porsiyonFormSubmitButton.classList.add('btn-primary');
        }
        if (porsiyonFormCancelButton) porsiyonFormCancelButton.classList.add('d-none');
        if (sonUrunSelect) sonUrunSelect.focus(); // İlk dropdown'a odaklan
    }

    async function populateDropdowns() {
        try {
            if (!sonUrunSelect || !satisBirimiSelect) {
                console.error('Dropdown select elementleri bulunamadı.');
                return;
            }
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
            console.error('Dropdownlar doldurulurken hata oluştu:', error);
            toastr.error('Form alanları yüklenirken bir hata oluştu.');
        }
    }

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

                // YENİ: Düzenle Butonu
                const duzenleButton = document.createElement('button');
                duzenleButton.classList.add('btn', 'btn-warning', 'btn-sm');
                duzenleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>';
                duzenleButton.title = "Düzenle";
                // Tüm porsiyon objesini gönderiyoruz, çünkü formda tüm alanlar var.
                // porsiyon objesi getPorsiyonlar'dan geliyor ve sonUrunId, porsiyonAdi, satisBirimiKisaAd, varsayilanSatisFiyati içermeli.
                // sonUrunId'nin dropdown'da seçilmesi için ID'ye ihtiyacımız var.
                duzenleButton.addEventListener('click', () => handleEditPorsiyonClick(porsiyon));
                eylemlerCell.appendChild(duzenleButton);

                const silButton = document.createElement('button');
                silButton.classList.add('btn', 'btn-danger', 'btn-sm', 'ms-1');
                silButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>';
                silButton.setAttribute('data-porsiyon-id', porsiyon.id);
                silButton.setAttribute('data-porsiyon-adi', `${porsiyon.sonUrunAdi} - ${porsiyon.porsiyonAdi}`);
                silButton.title = "Sil";
                silButton.addEventListener('click', handleDeletePorsiyonClick);
                eylemlerCell.appendChild(silButton);
            });
        } else {
            const row = porsiyonlarTableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 6;
            cell.textContent = 'Henüz kayıtlı porsiyon bulunamadı.';
            cell.style.textAlign = 'center';
        }
    }

    // YENİ: Düzenle butonuna tıklandığında formu doldurur
    function handleEditPorsiyonClick(porsiyon) {
        if (!porsiyonEkleForm) return;

        porsiyonIdInput.value = porsiyon.id;
        sonUrunSelect.value = porsiyon.sonUrunId; // Dropdown'da ID'ye göre seç
        porsiyonAdiInput.value = porsiyon.porsiyonAdi;
        satisBirimiSelect.value = porsiyon.satisBirimiKisaAd; // Dropdown'da kısa ada göre seç
        varsayilanSatisFiyatiInput.value = porsiyon.varsayilanSatisFiyati != null ? porsiyon.varsayilanSatisFiyati.toFixed(2) : '';

        porsiyonFormBaslik.textContent = `Porsiyonu Düzenle: ${porsiyon.sonUrunAdi} - ${porsiyon.porsiyonAdi}`;
        porsiyonFormSubmitButton.textContent = 'Porsiyonu Güncelle';
        porsiyonFormSubmitButton.classList.remove('btn-primary');
        porsiyonFormSubmitButton.classList.add('btn-success');
        porsiyonFormCancelButton.classList.remove('d-none');

        sonUrunSelect.focus();
        window.scrollTo(0, 0);
    }

    async function handleDeletePorsiyonClick(event) {
        const button = event.currentTarget;
        const porsiyonId = button.getAttribute('data-porsiyon-id');
        const porsiyonAdi = button.getAttribute('data-porsiyon-adi');

        if (!confirmationModalInstance) return;

        const modalTitle = confirmationModalElement.querySelector('.modal-title');
        const modalBody = confirmationModalElement.querySelector('#confirmationModalBody');
        if (modalTitle) modalTitle.textContent = 'Porsiyon Silme Onayı';
        if (modalBody) modalBody.innerHTML = `<p><strong>"${porsiyonAdi}"</strong> adlı porsiyonu silmek istediğinizden emin misiniz?</p>
                                              <p class="text-danger small">Bu işlem geri alınamaz. Bu porsiyon bir reçetede kullanılıyorsa silinemeyecektir.</p>`;

        confirmActionCallback = async () => {
            try {
                const silindi = await window.electronAPI.deletePorsiyon(Number(porsiyonId));
                if (silindi) {
                    toastr.success(`"${porsiyonAdi}" adlı porsiyon başarıyla silindi.`);
                    const guncelPorsiyonlar = await window.electronAPI.getPorsiyonlar();
                    displayPorsiyonlar(guncelPorsiyonlar);
                    // Eğer silinen porsiyon formda düzenleniyorsa, formu ekleme moduna al
                    if (porsiyonIdInput.value === porsiyonId) {
                        switchToAddMode();
                    }
                }
            } catch (error) {
                console.error('Porsiyon silinirken hata oluştu:', error);
                toastr.error(`Porsiyon silinirken bir hata oluştu: ${error.message}`);
            }
        };
        confirmationModalInstance.show();
    }

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
                let mesaj = "";

                if (porsiyonData.id) { // Güncelleme
                    console.log("Porsiyon güncelleniyor:", porsiyonData);
                    const guncellendi = await window.electronAPI.updatePorsiyon(porsiyonData);
                    if (guncellendi) {
                        mesaj = `"${sonUrunSelect.options[sonUrunSelect.selectedIndex].text} - ${porsiyonData.porsiyonAdi}" başarıyla güncellendi!`;
                        toastr.success(mesaj);
                        islemYapildi = true;
                    } else {
                        toastr.info(`"${sonUrunSelect.options[sonUrunSelect.selectedIndex].text} - ${porsiyonData.porsiyonAdi}" için herhangi bir değişiklik yapılmadı veya kayıt bulunamadı.`);
                    }
                } else { // Ekleme
                    console.log("Yeni porsiyon ekleniyor:", porsiyonData);
                    await window.electronAPI.addPorsiyon(porsiyonData);
                    mesaj = `"${sonUrunSelect.options[sonUrunSelect.selectedIndex].text} - ${porsiyonData.porsiyonAdi}" başarıyla eklendi!`;
                    toastr.success(mesaj);
                    islemYapildi = true;
                }

                if (islemYapildi) {
                    switchToAddMode(); // Formu temizle ve ekleme moduna dön
                    const guncelPorsiyonlar = await window.electronAPI.getPorsiyonlar();
                    displayPorsiyonlar(guncelPorsiyonlar);
                }
            } catch (error) {
                console.error('Porsiyon Ekle/Güncelle hatası:', error);
                let displayMessage = 'İşlem sırasında bir hata oluştu.';
                let toastrType = 'error';

                // main/ipcHandlers.js'den gelen özel hata mesajlarını yakala
                if (error.message.includes('adında başka bir porsiyon zaten mevcut.')) {
                    displayMessage = error.message;
                    toastrType = 'warning';
                } else if (error.message.includes('UNIQUE constraint failed')) { // Genel UNIQUE hatası (addPorsiyon için)
                     const selectedUrunAdi = sonUrunSelect.options[sonUrunSelect.selectedIndex].text;
                     displayMessage = `"${selectedUrunAdi}" ürünü için "${porsiyonData.porsiyonAdi}" adında bir porsiyon zaten mevcut.`;
                     toastrType = 'warning';
                } else {
                     displayMessage = 'İşlem sırasında bir hata oluştu: ' + error.message;
                }
                if (toastrType === 'warning') toastr.warning(displayMessage);
                else toastr.error(displayMessage);
            }
        };
    }

    if (porsiyonFormCancelButton) {
        porsiyonFormCancelButton.onclick = () => {
            switchToAddMode();
        };
    }

    await populateDropdowns();
    try {
        const porsiyonlar = await window.electronAPI.getPorsiyonlar();
        displayPorsiyonlar(porsiyonlar);
    } catch (error) {
        console.error('Porsiyonları alırken hata oluştu:', error);
        toastr.error('Porsiyon listesi yüklenirken hata oluştu.');
    }

    // Sayfa ilk yüklendiğinde formu ekleme moduna al
    if (porsiyonEkleForm) {
       switchToAddMode();
    }
}