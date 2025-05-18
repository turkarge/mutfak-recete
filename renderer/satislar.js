// renderer/satislar.js

// Form elementleri ve tablo body'si için global değişkenler
let satisEkleForm, satisIdInput, satisTarihInput, satisPorsiyonIdSelect, satisMiktarInput, satisFiyatiInput, satisToplamTutarInput, satisAciklamaInput;
let satisFormBaslik, satisFormSubmitButton, satisFormCancelButton;
let satislarTableBody;

// Onay Modalı Fonksiyonu (Diğer sayfalardaki gibi)
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
export async function loadSatislarPage() {
    console.log('Satışlar sayfası JavaScript\'i yükleniyor...');

    // DOM Elementlerini Seçme
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

    // --- Olay Dinleyicileri ---
    // Miktar veya Satış Fiyatı değiştikçe Toplam Tutarı hesapla
    if (satisMiktarInput && satisFiyatiInput && satisToplamTutarInput) {
        const calculateTotal = () => {
            const miktar = parseFloat(satisMiktarInput.value) || 0;
            const satisFiyati = parseFloat(satisFiyatiInput.value) || 0;
            satisToplamTutarInput.value = (miktar * satisFiyati).toFixed(2);
        };
        satisMiktarInput.addEventListener('input', calculateTotal);
        satisFiyatiInput.addEventListener('input', calculateTotal);
    }

    // Porsiyon seçildiğinde varsayılan satış fiyatını getirme (İsteğe Bağlı Özellik)
    if (satisPorsiyonIdSelect && satisFiyatiInput) {
        satisPorsiyonIdSelect.addEventListener('change', async (event) => {
            const porsiyonId = event.target.value;
            if (porsiyonId) {
                try {
                    // Porsiyon detaylarını çekmek için bir IPC handler'a ihtiyacımız olacak
                    // Şimdilik varsayalım ki porsiyonlar listesiyle birlikte varsayılan fiyat geliyor
                    // Ya da getPorsiyonlar'dan dönen porsiyon objesinde bu bilgi var.
                    // Bu kısmı IPC handler'ları ekledikten sonra dolduracağız.
                    // Örnek: const porsiyon = await window.electronAPI.getPorsiyonById(porsiyonId);
                    // if(porsiyon && porsiyon.varsayilanSatisFiyati) {
                    //     satisFiyatiInput.value = porsiyon.varsayilanSatisFiyati.toFixed(2);
                    //     calculateTotal(); // Toplamı yeniden hesapla
                    // }
                    console.log("Porsiyon değişti, ID:", porsiyonId, "- Varsayılan fiyat getirme TODO");
                } catch (error) {
                    console.error("Porsiyon için varsayılan fiyat getirilirken hata:", error);
                }
            } else {
                satisFiyatiInput.value = ""; // Porsiyon seçilmemişse fiyatı temizle
                if(satisToplamTutarInput) satisToplamTutarInput.value = "0.00";
            }
        });
    }


    // Formu Ekleme Moduna Ayarla
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

    // Dropdownları Doldurma Fonksiyonu
    async function populateDropdowns() {
        try {
            // Porsiyonlar Dropdown
            if (satisPorsiyonIdSelect) {
                const porsiyonlar = await window.electronAPI.getPorsiyonlar(); // Bu handler zaten var
                satisPorsiyonIdSelect.innerHTML = '<option value="">-- Porsiyon Seçiniz --</option>';
                porsiyonlar.forEach(porsiyon => {
                    const option = document.createElement('option');
                    option.value = porsiyon.id;
                    // Porsiyon objesinden varsayılan fiyatı da alıp data attribute olarak saklayabiliriz
                    option.dataset.varsayilanFiyat = porsiyon.varsayilanSatisFiyati || '0';
                    option.textContent = `${porsiyon.sonUrunAdi} - ${porsiyon.porsiyonAdi}`;
                    satisPorsiyonIdSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Satışlar sayfası dropdownları doldurulurken hata:', error);
            toastr.error('Form alanları yüklenirken bir hata oluştu.');
        }
    }

    // --- Sayfa Yüklendiğinde Çalışacaklar ---
    await populateDropdowns(); // Dropdownları doldur

    if (satisEkleForm) {
        switchToAddMode(); // Formu başlangıçta ekleme moduna al
    }

    // Porsiyon seçildiğinde varsayılan satış fiyatını doldurma (populateDropdowns sonrası)
    if (satisPorsiyonIdSelect && satisFiyatiInput) {
        satisPorsiyonIdSelect.addEventListener('change', (event) => {
            const selectedOption = event.target.options[event.target.selectedIndex];
            const varsayilanFiyat = selectedOption.dataset.varsayilanFiyat;
            if (varsayilanFiyat && varsayilanFiyat !== 'null' && varsayilanFiyat !== 'undefined') {
                satisFiyatiInput.value = parseFloat(varsayilanFiyat).toFixed(2);
            } else {
                satisFiyatiInput.value = ""; // Varsayılan fiyat yoksa boşalt
            }
            // Toplamı yeniden hesapla
            const miktar = parseFloat(satisMiktarInput.value) || 0;
            const satisFiyati = parseFloat(satisFiyatiInput.value) || 0;
            if(satisToplamTutarInput) satisToplamTutarInput.value = (miktar * satisFiyati).toFixed(2);
        });
    }

    // TODO: Satışları listeleme (fetchAndDisplaySatislar)
    // TODO: Form submit olayı (addSatis / updateSatis)
    // TODO: Silme butonu olayı (handleDeleteSatis)
    // TODO: Düzenleme butonu olayı (handleEditSatis)
}