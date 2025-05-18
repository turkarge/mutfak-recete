// renderer/receler.js
export async function loadRecetelerPage() {
    console.log('Reçete Yönetimi sayfası JavaScript\'i yükleniyor...');
    
// --- DOM Elementlerini Seçme (Ana Reçete Formu için yeni ID'ler eklendi) ---
const receteIdInput = document.querySelector('#receteIdInput'); // Ana reçete formu - Reçete ID (gizli)
const recetePorsiyonSelect = document.querySelector('#recetePorsiyonId');
const receteAdiInput = document.querySelector('#receteAdi');
const receteEkleForm = document.querySelector('#receteEkleForm');
const recelerTableBody = document.querySelector('#recelerTable tbody');
const receteFormBaslik = document.querySelector('#receteFormBaslik'); // Ana reçete formu başlığı
const receteFormSubmitButton = document.querySelector('#receteFormSubmitButton'); // Ana reçete formu submit butonu
const receteFormCancelButton = document.querySelector('#receteFormCancelButton'); // Ana reçete formu iptal butonu

// Detaylar için olanlar aynı kalıyor
const receteDetaylariCard = document.querySelector('#receteDetaylariCard');
const receteDetaylariTitle = document.querySelector('#receteDetaylariTitle');
const selectedReceteIdInput = document.querySelector('#selectedReceteId');
const hammaddeSelect = document.querySelector('#hammaddeId');
const miktarInput = document.querySelector('#miktar');
const detayBirimSelect = document.querySelector('#detayBirimKisaAd');
const receteDetayEkleForm = document.querySelector('#receteDetayEkleForm');
const receteDetaylariTableBody = document.querySelector('#receteDetaylariTable tbody');

const confirmationModal = document.getElementById('confirmationModal');
const confirmationModalBody = document.getElementById('confirmationModalBody');
const confirmActionButton = document.getElementById('confirmActionButton');

if (!confirmationModal || !confirmationModalBody || !confirmActionButton) {
    console.error("Onay modal elementleri bulunamadı.");
    toastr.error("Uygulama hatası: Onay modal elementleri eksik.");
    return;
}
if (typeof bootstrap === 'undefined' || typeof bootstrap.Modal === 'undefined') {
    console.error("Bootstrap Modal JS yüklenmedi.");
    toastr.error("Uygulama hatası: Bootstrap Modal yüklenemedi.");
    return;
}

let currentReceteId = null; // Görüntülenen reçete detayı için

// --- ANA REÇETE FORMU İÇİN MOD DEĞİŞTİRME ---
function switchToAddReceteMode() {
    if (!receteEkleForm) return;
    receteEkleForm.reset();
    if (receteIdInput) receteIdInput.value = ''; // Gizli ID'yi temizle
    if (receteFormBaslik) receteFormBaslik.textContent = 'Yeni Reçete Ekle';
    if (receteFormSubmitButton) {
        receteFormSubmitButton.textContent = 'Reçete Ekle';
        receteFormSubmitButton.classList.remove('btn-success');
        receteFormSubmitButton.classList.add('btn-primary');
    }
    if (receteFormCancelButton) receteFormCancelButton.classList.add('d-none');
    if (recetePorsiyonSelect) recetePorsiyonSelect.focus();
}

function showConfirmationModal(message, actionButtonText = 'Tamam', actionButtonClass = 'btn-primary') {
    return new Promise((resolve) => {
        confirmationModalBody.textContent = message;
        confirmActionButton.textContent = actionButtonText;
        confirmActionButton.className = 'btn'; // Önce tüm bootstrap btn sınıflarını temizle
        confirmActionButton.classList.add('btn', actionButtonClass); // Sonra yenilerini ekle


        const modalInstance = bootstrap.Modal.getInstance(confirmationModal) || new bootstrap.Modal(confirmationModal);
        
        const handleConfirm = () => {
            modalInstance.hide();
            resolve(true);
            cleanupListeners();
        };

        const handleDismiss = () => {
            // hide.bs.modal veya hidden.bs.modal daha uygun olabilir,
            // ancak resolve(false) sadece X veya İptal'e basıldığında olmalı.
            // Butonla kapatma zaten handleConfirm ile yönetiliyor.
            // ESC veya dışarı tıklama için 'hidden' daha iyi.
             resolve(false);
             cleanupListeners();
        };
        
        const cleanupListeners = () => {
            confirmActionButton.removeEventListener('click', handleConfirm);
            confirmationModal.removeEventListener('hidden.bs.modal', handleDismiss);
        };

        confirmActionButton.addEventListener('click', handleConfirm);
        // 'hidden.bs.modal' olayı, modal tamamen gizlendiğinde tetiklenir.
        // Eğer kullanıcı X ile veya ESC ile kapatırsa bu olay tetiklenir.
        confirmationModal.addEventListener('hidden.bs.modal', handleDismiss, { once: true }); // Sadece bir kez çalışsın

        modalInstance.show();
    });
}

async function populateRecetePorsiyonDropdown() {
    try {
        const porsiyonlar = await window.electronAPI.getPorsiyonlar();
        recetePorsiyonSelect.innerHTML = '<option value="">-- Porsiyon Seçiniz --</option>';
        porsiyonlar.forEach(porsiyon => {
            const option = document.createElement('option');
            option.value = porsiyon.id;
            option.textContent = `${porsiyon.sonUrunAdi} - ${porsiyon.porsiyonAdi}`;
            recetePorsiyonSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Porsiyonlar dropdown doldurulurken hata:', error);
        toastr.error('Porsiyonlar dropdown yüklenirken bir hata oluştu.');
    }
}

async function populateReceteDetayDropdowns() {
    try {
        const hammaddeler = await window.electronAPI.getUrunlerByTur('Hammadde');
        hammaddeSelect.innerHTML = '<option value="">-- Hammadde Seçiniz --</option>';
        hammaddeler.forEach(hammadde => {
            const option = document.createElement('option');
            option.value = hammadde.id;
            option.textContent = hammadde.ad;
            hammaddeSelect.appendChild(option);
        });

        const birimler = await window.electronAPI.getBirimler();
        detayBirimSelect.innerHTML = '<option value="">-- Birim Seçiniz --</option>';
        birimler.forEach(birim => {
            const option = document.createElement('option');
            option.value = birim.kisaAd;
            option.textContent = `${birim.birimAdi} (${birim.kisaAd})`;
            detayBirimSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Reçete Detay dropdownları doldurulurken hata:', error);
        toastr.error('Reçete Detay dropdownları yüklenirken bir hata oluştu.');
    }
}

function displayReceteler(receler) {
    recelerTableBody.innerHTML = '';
    if (receler && receler.length > 0) {
        receler.forEach(recete => {
            const row = recelerTableBody.insertRow();
            row.insertCell(0).textContent = recete.id;
            row.insertCell(1).textContent = `${recete.sonUrunAdi} - ${recete.porsiyonAdi}` || 'Porsiyon Bilgisi Eksik';
            row.insertCell(2).textContent = recete.receteAdi || 'Varsayılan';

            const actionsCell = row.insertCell(3);
            actionsCell.classList.add('text-nowrap'); // Butonların alt alta gelmesini engelle

            // YENİ: Ana Reçete Düzenle Butonu
            const editReceteButton = document.createElement('button');
            editReceteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>';
            editReceteButton.classList.add('btn', 'btn-sm', 'btn-warning', 'me-1'); // 'me-1' sağdan biraz boşluk
            editReceteButton.title = "Reçeteyi Düzenle";
            editReceteButton.addEventListener('click', () => handleEditRecete(recete));
            actionsCell.appendChild(editReceteButton);

            const viewDetailsButton = document.createElement('button');
            viewDetailsButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-notes" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 3m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z" /><path d="M9 7l6 0" /><path d="M9 11l6 0" /><path d="M9 15l4 0" /></svg>';
            viewDetailsButton.classList.add('btn', 'btn-sm', 'btn-info', 'me-1');
            viewDetailsButton.title = "Detayları Görüntüle/Düzenle";
            viewDetailsButton.addEventListener('click', () => handleViewReceteDetails(recete.id, recete));
            actionsCell.appendChild(viewDetailsButton);

            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>';
            deleteButton.classList.add('btn', 'btn-sm', 'btn-danger');
            deleteButton.title = "Reçeteyi Sil";
            deleteButton.addEventListener('click', () => handleDeleteRecete(recete.id, recete));
            actionsCell.appendChild(deleteButton);
        });
    } else {
        const row = recelerTableBody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 4;
        cell.textContent = 'Henüz kayıtlı reçete bulunamadı.';
        cell.style.textAlign = 'center';
    }
}

// YENİ: Ana Reçete Düzenleme Formunu Doldurma
function handleEditRecete(recete) {
    if (!receteEkleForm) return;
    console.log("Ana Reçete düzenleniyor:", recete);

    receteIdInput.value = recete.id;
    recetePorsiyonSelect.value = recete.porsiyonId;
    receteAdiInput.value = recete.receteAdi || ''; // null ise boş string

    receteFormBaslik.textContent = `Reçeteyi Düzenle: ${recete.sonUrunAdi} - ${recete.porsiyonAdi}`;
    receteFormSubmitButton.textContent = 'Reçeteyi Güncelle';
    receteFormSubmitButton.classList.remove('btn-primary');
    receteFormSubmitButton.classList.add('btn-success');
    receteFormCancelButton.classList.remove('d-none');

    recetePorsiyonSelect.focus();
    // Forma scroll etmeye gerek olmayabilir, çünkü form zaten görünür alanda.
}


function displayReceteDetaylari(detaylar) {
    receteDetaylariTableBody.innerHTML = '';
    if (detaylar && detaylar.length > 0) {
        detaylar.forEach(detay => {
            const row = receteDetaylariTableBody.insertRow();
            row.insertCell(0).textContent = detay.id;
            row.insertCell(1).textContent = detay.hammaddeAdi || 'Hammadde Bilgisi Eksik';
            row.insertCell(2).textContent = parseFloat(detay.miktar).toFixed(3); // Miktarı formatla
            row.insertCell(3).textContent = detay.birimKisaAd || 'Birim Bilgisi Eksik';

            const actionsCell = row.insertCell(4);
            actionsCell.classList.add('text-nowrap');

            const editButton = document.createElement('button');
            editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>';
            editButton.classList.add('btn', 'btn-sm', 'btn-warning', 'me-1'); // Renk warning olarak değiştirildi
            editButton.title = "Detayı Düzenle";
            editButton.addEventListener('click', () => handleEditReceteDetay(detay.id, detay));
            actionsCell.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>';
            deleteButton.classList.add('btn', 'btn-sm', 'btn-danger');
            deleteButton.title = "Detayı Sil";
            deleteButton.addEventListener('click', () => handleDeleteReceteDetay(detay.id));
            actionsCell.appendChild(deleteButton);
        });
    } else {
        const row = receteDetaylariTableBody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 5;
        cell.textContent = 'Bu reçetede henüz hammadde detayı bulunamadı.';
        cell.style.textAlign = 'center';
    }
}

async function handleViewReceteDetails(receteId, recete) {
    console.log(`Detayları Görüntüle: Reçete ID ${receteId}`);
    await fetchAndDisplayReceteDetails(receteId);
    currentReceteId = receteId; // Bu satır önemli

    if (receteDetaylariTitle && recete) {
        receteDetaylariTitle.textContent = `"${recete.sonUrunAdi} - ${recete.porsiyonAdi}" Reçete Detayları`;
        if (recete.receteAdi) {
            receteDetaylariTitle.textContent += ` ("${recete.receteAdi}")`;
        }
    } else {
        receteDetaylariTitle.textContent = 'Seçilen Reçete Detayları';
    }
    receteDetaylariCard.style.display = 'block';
    selectedReceteIdInput.value = receteId; // Detay ekleme formu için reçete ID'sini ayarla
    resetReceteDetayForm(); // Detay formunu her zaman ekleme modunda başlat
}

async function handleDeleteRecete(receteId, recete) {
    console.log(`Reçete Sil: ID ${receteId}`);
    const confirmed = await showConfirmationModal(
        `"${recete.sonUrunAdi} - ${recete.porsiyonAdi}" (${recete.receteAdi || 'Varsayılan'}) adlı reçeteyi silmek istediğinizden emin misiniz? Bu işlem reçeteye ait tüm detayları da silecektir!`,
        'Evet, Sil',
        'btn-danger'
    );
    if (!confirmed) {
        toastr.info('Reçete silme işlemi iptal edildi.');
        return;
    }
    try {
        const success = await window.electronAPI.deleteRecete(receteId);
        if (success) {
            toastr.success('Reçete başarıyla silindi!');
            await fetchAndDisplayReceteler();
            if (currentReceteId === receteId) { // Eğer silinen reçetenin detayları açıksa
                receteDetaylariCard.style.display = 'none';
                currentReceteId = null;
            }
            // Eğer silinen reçete ana formda düzenleniyorsa, formu ekleme moduna al
            if (receteIdInput.value === receteId.toString()) {
                switchToAddReceteMode();
            }
        } else {
            toastr.warning('Reçete silinemedi veya bulunamadı.');
        }
    } catch (error) {
        console.error('Reçete silme hatası:', error);
        if (error.message && error.message.includes('FOREIGN KEY constraint failed')) {
             toastr.error('Bu reçeteye bağlı detaylar olduğu için silinemedi. Veritabanı ayarlarınızı kontrol edin (ON DELETE CASCADE). Şimdilik detayları manuel silmeniz gerekebilir.');
        } else {
            toastr.error('Reçete silinirken bir hata oluştu: ' + error.message);
        }
    }
}

async function handleDeleteReceteDetay(detayId) {
    console.log(`Reçete Detay Sil: ID ${detayId}`);
    const confirmed = await showConfirmationModal(
        `Bu reçete detayını (hammadde kaydını) silmek istediğinizden emin misiniz?`,
        'Evet, Sil',
        'btn-danger'
    );
    if (!confirmed) {
        toastr.info('Reçete detay silme işlemi iptal edildi.');
        return;
    }
    try {
        const success = await window.electronAPI.deleteReceteDetay(detayId);
        if (success) {
            toastr.success('Hammadde reçeteden başarıyla silindi!');
            if (currentReceteId) {
                await fetchAndDisplayReceteDetails(currentReceteId);
            }
            // Eğer silinen detay, detay formunda düzenleniyorsa formu resetle
            if (receteDetayEkleForm.dataset.editingId === detayId.toString()) {
                resetReceteDetayForm();
            }
        } else {
            toastr.warning('Reçete detayı silinemedi veya bulunamadı.');
        }
    } catch (error) {
        console.error('Reçete detay silme hatası:', error);
        toastr.error('Reçete detayı silinirken bir hata oluştu: ' + error.message);
    }
}

async function handleEditReceteDetay(detayId, detay) {
    console.log(`Reçete Detay Düzenle: ID ${detayId}`);
    if (receteDetayEkleForm) {
        hammaddeSelect.value = detay.hammaddeId.toString();
        miktarInput.value = detay.miktar;
        detayBirimSelect.value = detay.birimKisaAd;
        receteDetayEkleForm.dataset.editingId = detay.id;

        const formTitle = receteDetayEkleForm.previousElementSibling;
        if (formTitle && formTitle.tagName === 'H4') {
            formTitle.textContent = 'Hammaddeyi Düzenle';
        }
        const submitButton = receteDetayEkleForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Güncelle';
            submitButton.classList.remove('btn-primary');
            submitButton.classList.add('btn-success');
        }
        miktarInput.focus(); // Miktar alanına odaklan
        // Detay formuna scroll etme (genellikle zaten görünür)
    }
}

function resetReceteDetayForm() {
    if (receteDetayEkleForm) {
        receteDetayEkleForm.reset();
        delete receteDetayEkleForm.dataset.editingId;
        const formTitle = receteDetayEkleForm.previousElementSibling;
        if (formTitle && formTitle.tagName === 'H4') formTitle.textContent = 'Hammadde Ekle';
        const submitButton = receteDetayEkleForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Hammadde Ekle';
            submitButton.classList.remove('btn-success');
            submitButton.classList.add('btn-primary');
        }
        // selectedReceteIdInput.value kalmalı
    }
}

async function fetchAndDisplayReceteler() {
    try {
        const receler = await window.electronAPI.getReceteler();
        displayReceteler(receler);
    } catch (error) {
        console.error('Reçeteleri alırken hata:', error);
        toastr.error('Reçete listesi yüklenirken hata oluştu.');
    }
}

async function fetchAndDisplayReceteDetails(receteId) {
    try {
        const detaylar = await window.electronAPI.getReceteDetaylari(receteId);
        displayReceteDetaylari(detaylar);
    } catch (error) {
        console.error(`Reçete detayları (ID: ${receteId}) alırken hata:`, error);
        toastr.error('Reçete detayları yüklenirken bir hata oluştu.');
    }
}

// ANA REÇETE EKLEME/GÜNCELLEME FORMU SUBMIT
if (receteEkleForm) {
    receteEkleForm.onsubmit = async (event) => { // .addEventListener yerine .onsubmit
        event.preventDefault();
        const id = receteIdInput.value ? parseInt(receteIdInput.value) : null;
        const porsiyonId = recetePorsiyonSelect.value;
        // Reçete adı boşsa "Varsayılan" olarak ayarla
        let receteAdiValue = receteAdiInput.value.trim();
        if (receteAdiValue === '') {
            receteAdiValue = 'Varsayılan';
        }


        const receteData = {
            id: id,
            porsiyonId: parseInt(porsiyonId),
            receteAdi: receteAdiValue
        };

        if (!receteData.porsiyonId) {
            toastr.warning('Porsiyon seçimi boş bırakılamaz.');
            return;
        }

        try {
            let islemYapildi = false;
            let mesaj = "";

            if (receteData.id) { // Güncelleme
                console.log("Ana Reçete güncelleniyor:", receteData);
                const guncellendi = await window.electronAPI.updateRecete(receteData);
                if (guncellendi) {
                    mesaj = `Reçete başarıyla güncellendi!`;
                    toastr.success(mesaj);
                    islemYapildi = true;
                } else {
                    toastr.info(`Reçete için herhangi bir değişiklik yapılmadı veya kayıt bulunamadı.`);
                }
            } else { // Ekleme
                console.log("Yeni ana reçete ekleniyor:", receteData);
                await window.electronAPI.addRecete(receteData);
                mesaj = `Reçete başarıyla eklendi!`;
                toastr.success(mesaj);
                islemYapildi = true;
            }

            if (islemYapildi) {
                switchToAddReceteMode();
                await fetchAndDisplayReceteler();
                // Eğer güncellenen reçetenin detayları açıksa, başlığını da güncelle
                if (receteData.id && currentReceteId === receteData.id) {
                    const guncelRecete = (await window.electronAPI.getReceteler()).find(r => r.id === receteData.id);
                    if (guncelRecete && receteDetaylariTitle) {
                         receteDetaylariTitle.textContent = `"${guncelRecete.sonUrunAdi} - ${guncelRecete.porsiyonAdi}" Reçete Detayları`;
                         if (guncelRecete.receteAdi && guncelRecete.receteAdi !== 'Varsayılan') { // Sadece "Varsayılan" değilse göster
                             receteDetaylariTitle.textContent += ` ("${guncelRecete.receteAdi}")`;
                         }
                    }
                }
            }
        } catch (error) {
            console.error('Ana Reçete Ekle/Güncelle hatası:', error);
            let displayMessage = 'İşlem sırasında bir hata oluştu.';
            if (error.message.includes('adında başka bir reçete zaten mevcut.')) {
                displayMessage = error.message;
            } else if (error.message && error.message.includes('UNIQUE constraint failed')) {
                const selectedPorsiyonText = recetePorsiyonSelect.options[recetePorsiyonSelect.selectedIndex].text;
                displayMessage = `"${selectedPorsiyonText}" porsiyonu için "${receteData.receteAdi}" adında bir reçete zaten mevcut.`;
            } else {
                displayMessage = 'İşlem sırasında bir hata oluştu: ' + error.message;
            }
            toastr.error(displayMessage);
        }
    };
} else {
    console.error("Ana reçete formu (receteEkleForm) bulunamadı.");
}

// ANA REÇETE İPTAL BUTONU
if (receteFormCancelButton) {
    receteFormCancelButton.onclick = () => { // .addEventListener yerine .onclick
        switchToAddReceteMode();
    };
}


// REÇETE DETAY EKLEME/GÜNCELLEME FORMU SUBMIT
if (receteDetayEkleForm) {
    receteDetayEkleForm.onsubmit = async (event) => { // .addEventListener yerine .onsubmit
        event.preventDefault();
        const receteIdForDetay = selectedReceteIdInput.value;
        const hammaddeIdVal = hammaddeSelect.value;
        const miktarVal = miktarInput.value;
        const birimKisaAdVal = detayBirimSelect.value;

        const detayData = {
            receteId: parseInt(receteIdForDetay),
            hammaddeId: parseInt(hammaddeIdVal),
            miktar: parseFloat(miktarVal),
            birimKisaAd: birimKisaAdVal
        };

        if (!detayData.receteId || !detayData.hammaddeId || isNaN(detayData.miktar) || !detayData.birimKisaAd) {
            toastr.warning('Hammadde, geçerli Miktar ve Birim boş bırakılamaz.');
            return;
        }
        if (detayData.miktar <= 0) {
            toastr.warning('Miktar sıfırdan büyük olmalıdır.');
            return;
        }

        const editingId = receteDetayEkleForm.dataset.editingId;
        try {
            let islemYapildiDetay = false;
            if (editingId) { // Detay Güncelleme
                detayData.id = parseInt(editingId);
                const success = await window.electronAPI.updateReceteDetay(detayData);
                if (success) {
                    toastr.success('Hammadde detayı güncellendi!');
                    islemYapildiDetay = true;
                } else {
                    toastr.warning('Reçete detayı güncelleme başarısız veya değişiklik yapılmadı.');
                }
            } else { // Detay Ekleme
                await window.electronAPI.addReceteDetay(detayData);
                toastr.success('Hammadde reçeteye eklendi!');
                islemYapildiDetay = true;
            }

            if (islemYapildiDetay) {
                resetReceteDetayForm(); // Detay formunu resetle
                if (currentReceteId) { // currentReceteId'nin dolu olduğundan emin ol
                    await fetchAndDisplayReceteDetails(currentReceteId);
                }
            }
        } catch (error) {
            console.error('Reçete Detay Ekle/Güncelle hatası:', error);
            toastr.error('Reçete detayı işlenirken bir hata oluştu: ' + error.message);
        }
    };
} else {
    console.error("Reçete detay formu (receteDetayEkleForm) bulunamadı.");
}

// Sayfa Yükleme İşlemleri
await populateRecetePorsiyonDropdown();
await populateReceteDetayDropdowns();
await fetchAndDisplayReceteler();

if (receteEkleForm) { // Ana reçete formu varsa ekleme modunda başlat
    switchToAddReceteMode();
}
receteDetaylariCard.style.display = 'none'; // Detay kartını gizle
}