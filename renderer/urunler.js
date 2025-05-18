// renderer/urunler.js

// Form elementlerini global scope'ta tanımla
let urunEkleForm, urunIdInput, urunAdiInput, urunTuruSelect;
let urunFormBaslik, urunFormSubmitButton, urunFormCancelButton;
let urunlerTableBody;

// --- YENİ: Onay Modalı Fonksiyonu (receler.js'den alındı ve uyarlandı) ---
// Bu fonksiyon, bir onay mesajı gösterir ve kullanıcı onaylayana kadar bekler (Promise döndürür)
function showConfirmationModal(message, actionButtonText = 'Tamam', actionButtonClass = 'btn-primary') {
    return new Promise((resolve) => {
        const confirmationModalElement = document.getElementById('confirmationModal');
        const confirmationModalBodyElement = document.getElementById('confirmationModalBody'); // ID'yi düzeltelim
        const confirmActionButtonElement = document.getElementById('confirmActionButton');

        if (!confirmationModalElement || !confirmationModalBodyElement || !confirmActionButtonElement) {
            console.error("Onay modal elementleri bulunamadı! Lütfen index.html dosyanızı kontrol edin.");
            toastr.error("Uygulama hatası: Onay modalı için gerekli HTML elementleri eksik.");
            resolve(false); // Hata durumunda false ile çöz
            return;
        }

        if (typeof bootstrap === 'undefined' || typeof bootstrap.Modal === 'undefined') {
           console.error("Bootstrap Modal JS yüklenmedi veya bootstrap objesi tanımsız.");
            toastr.error("Uygulama hatası: Bootstrap Modal yüklenemedi.");
            resolve(false); // Hata durumunda false ile çöz
            return;
        }

        confirmationModalBodyElement.textContent = message;
        confirmActionButtonElement.textContent = actionButtonText;
        
        // Buton sınıflarını temizle ve yenisini ekle
        confirmActionButtonElement.className = 'btn'; // Önce temel sınıf
        confirmActionButtonElement.classList.add(actionButtonClass);


        const modalInstance = bootstrap.Modal.getInstance(confirmationModalElement) || new bootstrap.Modal(confirmationModalElement);
        
        let confirmed = false; // Kullanıcının onay verip vermediğini takip etmek için

        const handleConfirm = () => {
            confirmed = true;
            modalInstance.hide();
            // Olay dinleyicileri hidden.bs.modal içinde kaldırılacak
        };

        const handleDismissOrHide = () => {
            // Olay dinleyicilerini kaldır
            confirmActionButtonElement.removeEventListener('click', handleConfirm);
            confirmationModalElement.removeEventListener('hidden.bs.modal', handleDismissOrHide);
            resolve(confirmed); // Modal kapandığında, en son onay durumunu döndür
        };

        // Önceki dinleyicileri kaldır (önlem olarak, normalde gerek olmayabilir)
        confirmActionButtonElement.removeEventListener('click', handleConfirm);
        confirmationModalElement.removeEventListener('hidden.bs.modal', handleDismissOrHide);
        
        // Yeni dinleyicileri ekle
        confirmActionButtonElement.addEventListener('click', handleConfirm);
        confirmationModalElement.addEventListener('hidden.bs.modal', handleDismissOrHide, { once: true });

        modalInstance.show();
    });
}


export async function loadUrunlerPage() {
    console.log('Ürünler sayfası JavaScript\'i yükleniyor...');

    // DOM Elementlerini Seçme
    urunEkleForm = document.querySelector('#urunEkleForm');
    urunIdInput = document.querySelector('#urunIdInput');
    urunAdiInput = document.querySelector('#urunAdi');
    urunTuruSelect = document.querySelector('#urunTuru');
    urunFormBaslik = document.querySelector('#urunFormBaslik');
    urunFormSubmitButton = document.querySelector('#urunFormSubmitButton');
    urunFormCancelButton = document.querySelector('#urunFormCancelButton');
    urunlerTableBody = document.querySelector('#urunlerTable tbody');

    // Formu Ekleme Moduna Ayarla
    function switchToAddMode() {
        if (!urunEkleForm) return;
        urunEkleForm.reset();
        if (urunIdInput) urunIdInput.value = '';
        if (urunFormBaslik) urunFormBaslik.textContent = 'Yeni Ürün/Hammadde Ekle';
        if (urunFormSubmitButton) {
            const textSpan = urunFormSubmitButton.querySelector('span');
            if (textSpan) textSpan.textContent = 'Ürün Ekle';
            urunFormSubmitButton.classList.remove('btn-success');
            urunFormSubmitButton.classList.add('btn-primary');
        }
        if (urunFormCancelButton) urunFormCancelButton.classList.add('d-none');
        if (urunAdiInput) urunAdiInput.focus();
    }

    // Ürünleri Tabloya Ekleme
    function displayUrunler(urunler) {
        if (!urunlerTableBody) return;
        urunlerTableBody.innerHTML = '';

        if (urunler && urunler.length > 0) {
            urunler.forEach(urun => {
                const row = urunlerTableBody.insertRow();
                row.insertCell(0).textContent = urun.id;
                row.insertCell(1).textContent = urun.ad;
                row.insertCell(2).textContent = urun.tur;

                const eylemlerCell = row.insertCell(3);
                eylemlerCell.classList.add('text-end');

                const buttonContainer = document.createElement('div');

                const duzenleButton = document.createElement('button');
                duzenleButton.type = 'button';
                duzenleButton.classList.add('btn', 'btn-icon', 'btn-warning');
                duzenleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>';
                duzenleButton.title = "Düzenle";
                duzenleButton.addEventListener('click', () => handleEditUrunClick(urun));
                buttonContainer.appendChild(duzenleButton);

                const silButton = document.createElement('button');
                silButton.type = 'button';
                silButton.classList.add('btn', 'btn-icon', 'btn-danger', 'ms-1');
                silButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>';
                silButton.title = "Sil";
                silButton.setAttribute('data-urun-id', urun.id);
                silButton.setAttribute('data-urun-adi', urun.ad);
                silButton.addEventListener('click', handleDeleteUrunClick);
                buttonContainer.appendChild(silButton);

                eylemlerCell.appendChild(buttonContainer);
            });
        } else {
            const row = urunlerTableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 4;
            cell.textContent = 'Henüz kayıtlı ürün bulunamadı.';
            cell.style.textAlign = 'center';
        }
    }

    // Düzenle Butonuna Tıklandığında Formu Doldur
    function handleEditUrunClick(urun) {
        if (!urunEkleForm) return;
        urunIdInput.value = urun.id;
        urunAdiInput.value = urun.ad;
        urunTuruSelect.value = urun.tur;

        if (urunFormBaslik) urunFormBaslik.textContent = `Ürünü Düzenle: ${urun.ad}`;
        if (urunFormSubmitButton) {
            const textSpan = urunFormSubmitButton.querySelector('span');
            if (textSpan) textSpan.textContent = 'Ürünü Güncelle';
            urunFormSubmitButton.classList.remove('btn-primary');
            urunFormSubmitButton.classList.add('btn-success');
        }
        if (urunFormCancelButton) urunFormCancelButton.classList.remove('d-none');
        urunAdiInput.focus();
        window.scrollTo(0, 0);
    }

    // Sil Butonuna Tıklama (Modal ile Onay)
    async function handleDeleteUrunClick(event) {
        const button = event.currentTarget;
        const urunId = button.getAttribute('data-urun-id');
        const urunAdi = button.getAttribute('data-urun-adi');

        try {
            const confirmed = await showConfirmationModal( // Şimdi bu fonksiyon tanımlı olmalı
                `"${urunAdi}" adlı ürünü silmek istediğinizden emin misiniz?`,
                'Evet, Sil',
                'btn-danger'
            );

            if (!confirmed) {
                toastr.info('Ürün silme işlemi iptal edildi.');
                return;
            }

            const silindi = await window.electronAPI.deleteUrun(Number(urunId));
            if (silindi) {
                toastr.success(`"${urunAdi}" adlı ürün başarıyla silindi.`);
                await fetchAndDisplayUrunler();
                if (urunIdInput.value === urunId) { // String ID ile number ID karşılaştırması için toString() veya Number() kullanılabilir, ama === ile direkt karşılaştırma genellikle sorun çıkarmaz eğer ID'ler tutarlıysa.
                    switchToAddMode();
                }
            } else {
                toastr.warning(`"${urunAdi}" adlı ürün silinemedi veya bulunamadı.`);
            }
        } catch (error) {
            console.error('Ürün silinirken hata:', error);
            let errMsg = `Ürün silinirken bir hata oluştu: ${error.message}.`;
            if (error.message && error.message.toLowerCase().includes('foreign key constraint failed')) {
                errMsg = `Bu ürün/hammadde başka bir kayıtta (Porsiyon, Reçete Detayı, Alım vb.) kullanıldığı için silinemez.`;
            }
            toastr.error(errMsg);
        }
    }

    // Form Submit Olayı (Ekleme ve Güncelleme)
    if (urunEkleForm) {
        urunEkleForm.onsubmit = async (event) => {
            event.preventDefault();
            const urunData = {
                id: urunIdInput.value ? parseInt(urunIdInput.value) : null,
                ad: urunAdiInput.value.trim(),
                tur: urunTuruSelect.value
            };

            if (!urunData.ad || !urunData.tur) {
                 toastr.warning('Ürün Adı ve Türü boş bırakılamaz.');
                 return;
            }

            try {
                let islemYapildi = false;
                if (urunData.id) {
                    const guncellendi = await window.electronAPI.updateUrun(urunData);
                    if (guncellendi) {
                        toastr.success(`"${urunData.ad}" başarıyla güncellendi!`);
                        islemYapildi = true;
                    } else {
                        toastr.info(`"${urunData.ad}" için değişiklik yapılmadı veya kayıt bulunamadı.`);
                    }
                } else {
                    await window.electronAPI.addUrun(urunData);
                    toastr.success(`"${urunData.ad}" başarıyla eklendi!`);
                    islemYapildi = true;
                }

                if (islemYapildi) {
                    switchToAddMode();
                    await fetchAndDisplayUrunler();
                }
            } catch (error) {
                console.error('Ürün Ekle/Güncelle hatası:', error);
                let displayMessage = 'İşlem sırasında bir hata oluştu.';
                if (error.message && error.message.toLowerCase().includes('unique constraint failed')) {
                     displayMessage = `"${urunData.ad}" adında bir ürün zaten mevcut.`;
                } else {
                     displayMessage = 'İşlem sırasında bir hata oluştu: ' + error.message;
                }
                toastr.error(displayMessage);
            }
        };
    }

    // İptal Butonuna Tıklama
    if (urunFormCancelButton) {
        urunFormCancelButton.onclick = () => {
            switchToAddMode();
        };
    }

    // Sayfa Yüklendiğinde Verileri Çek ve Formu Ayarla
    async function fetchAndDisplayUrunler() {
        try {
            const urunler = await window.electronAPI.getUrunler();
            displayUrunler(urunler);
        } catch (error) {
            console.error('Ürünleri alırken hata:', error);
            toastr.error('Ürün listesi yüklenirken hata oluştu.');
        }
    }

    await fetchAndDisplayUrunler();
    if (urunEkleForm) {
       switchToAddMode();
    }
}