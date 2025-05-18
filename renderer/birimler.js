// renderer/birimler.js

// Global scope'ta bir onay modalı referansı ve callback fonksiyonu
let confirmationModalInstance;
let confirmActionCallback;

// Form elementlerini global olarak tanımlayalım ki her yerden erişebilelim
let birimEkleForm, birimIdInput, birimAdiInput, kisaAdInput, anaBirimKisaAdInput;
let birimFormBaslik, birimFormSubmitButton, birimFormCancelButton;

// Bu fonksiyon, birimler.html içeriği ana sayfaya yüklendiğinde çağrılacak
export async function loadBirimlerPage() {
    console.log('Birimler sayfası JavaScript\'i yükleniyor...');

    // Form elementlerini DOM'dan seçelim
    birimEkleForm = document.querySelector('#birimEkleForm');
    birimIdInput = document.querySelector('#birimIdInput'); // Gizli ID alanı
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

    // Formu Ekleme Moduna Ayarla (sayfa ilk yüklendiğinde ve iptal edildiğinde)
    function switchToAddMode() {
        if (!birimEkleForm) return; // Form yoksa işlem yapma

        birimEkleForm.reset(); // Formu temizle
        if (birimIdInput) birimIdInput.value = ''; // Gizli ID'yi temizle
        if (birimFormBaslik) birimFormBaslik.textContent = 'Yeni Birim Ekle';
        if (birimFormSubmitButton) {
            birimFormSubmitButton.textContent = 'Birim Ekle';
            birimFormSubmitButton.classList.remove('btn-success'); // Eğer düzenleme modu için farklı renk kullandıysak
            birimFormSubmitButton.classList.add('btn-primary');
        }
        if (birimFormCancelButton) birimFormCancelButton.classList.add('d-none'); // İptal butonunu gizle
        if (birimAdiInput) birimAdiInput.focus(); // İlk inputa odaklan
    }

    // Birimleri tabloya ekleyen fonksiyon
    function displayBirimler(birimler) {
        const tableBody = document.querySelector('#birimlerTable tbody');
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

                // YENİ: Düzenle Butonu
                const duzenleButton = document.createElement('button');
                duzenleButton.classList.add('btn', 'btn-warning', 'btn-sm');
                duzenleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>';
                duzenleButton.title = "Düzenle";
                duzenleButton.addEventListener('click', () => handleEditBirimClick(birim)); // Tüm birim objesini gönder
                eylemlerCell.appendChild(duzenleButton);

                const silButton = document.createElement('button');
                silButton.classList.add('btn', 'btn-danger', 'btn-sm', 'ms-1');
                silButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>';
                silButton.setAttribute('data-birim-id', birim.id);
                silButton.setAttribute('data-birim-adi', birim.birimAdi);
                silButton.title = "Sil";
                silButton.addEventListener('click', handleDeleteBirimClick);
                eylemlerCell.appendChild(silButton);
            });
        } else {
            const row = tableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 5;
            cell.textContent = 'Henüz kayıtlı birim bulunamadı.';
            cell.style.textAlign = 'center';
        }
    }

    // YENİ: Düzenle butonuna tıklandığında formu doldurur
    function handleEditBirimClick(birim) {
        if (!birimEkleForm || !birimIdInput || !birimAdiInput || !kisaAdInput || !anaBirimKisaAdInput || !birimFormBaslik || !birimFormSubmitButton || !birimFormCancelButton) {
            console.error('Form elementlerinden biri bulunamadı, düzenleme moduna geçilemiyor.');
            toastr.error('Form düzgün yüklenemedi, düzenleme yapılamıyor.');
            return;
        }

        birimIdInput.value = birim.id;
        birimAdiInput.value = birim.birimAdi;
        kisaAdInput.value = birim.kisaAd;
        anaBirimKisaAdInput.value = birim.anaBirimKisaAd || ''; // null ise boş string

        birimFormBaslik.textContent = `Birimi Düzenle: ${birim.birimAdi}`;
        birimFormSubmitButton.textContent = 'Birimi Güncelle';
        birimFormSubmitButton.classList.remove('btn-primary');
        birimFormSubmitButton.classList.add('btn-success'); // Güncelleme için farklı renk
        birimFormCancelButton.classList.remove('d-none'); // İptal butonunu göster

        birimAdiInput.focus(); // İlk inputa odaklan
        window.scrollTo(0, 0); // Sayfanın başına git (formu görmek için)
    }

    // Silme işlemi için olay yöneticisi (Mevcut)
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
                                              <p class="text-danger small">Bu işlem geri alınamaz.</p>`;
        
        confirmActionCallback = async () => {
            try {
                const silindi = await window.electronAPI.deleteBirim(Number(birimId));
                if (silindi) {
                    toastr.success(`"${birimAdi}" adlı birim başarıyla silindi.`);
                    const guncelBirimler = await window.electronAPI.getBirimler();
                    displayBirimler(guncelBirimler);
                    switchToAddMode(); // Silme sonrası formu ekleme moduna al
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

    // Form submit olayını dinle (Ekleme ve Güncelleme için)
    if (birimEkleForm) {
        birimEkleForm.onsubmit = async (event) => {
            event.preventDefault();

            // Formdan güncel değerleri al
            const birimData = {
                id: birimIdInput.value ? parseInt(birimIdInput.value) : null, // ID varsa integer, yoksa null
                birimAdi: birimAdiInput.value.trim(),
                kisaAd: kisaAdInput.value.trim(),
                anaBirimKisaAd: anaBirimKisaAdInput.value.trim() || null
            };

            if (!birimData.birimAdi || !birimData.kisaAd) {
                 toastr.warning('Birim Adı ve Kısa Ad boş bırakılamaz.');
                 return;
            }

            try {
                if (birimData.id) { // ID varsa güncelleme işlemi
                    console.log("Birim güncelleniyor:", birimData);
                    const guncellendi = await window.electronAPI.updateBirim(birimData);
                    if (guncellendi) {
                        toastr.success(`"${birimData.birimAdi}" başarıyla güncellendi!`);
                    } else {
                        toastr.info(`"${birimData.birimAdi}" için herhangi bir değişiklik yapılmadı veya kayıt bulunamadı.`);
                    }
                } else { // ID yoksa ekleme işlemi
                    console.log("Yeni birim ekleniyor:", birimData);
                    const eklenenBirimId = await window.electronAPI.addBirim(birimData); // addBirim artık ID dönüyor
                    toastr.success(`"${birimData.birimAdi}" başarıyla eklendi!`);
                }

                // İşlem sonrası formu temizle ve ekleme moduna dön
                switchToAddMode();
                // Listeyi yenile
                const guncelBirimler = await window.electronAPI.getBirimler();
                displayBirimler(guncelBirimler);

            } catch (error) {
                console.error('Genel Hata Yakalandı (Birim Ekle/Güncelle):', error);
                let displayMessage = 'İşlem sırasında beklenmeyen bir hata oluştu.';
                let toastrType = 'error';

                if (error.message && error.message.includes('UNIQUE constraint failed')) {
                     if (error.message.includes('birimler.birimAdi')) {
                          displayMessage = `"${birimData.birimAdi}" adında bir birim zaten mevcut.`;
                     } else if (error.message.includes('birimler.kisaAd')) {
                          displayMessage = `"${birimData.kisaAd}" kısa adında bir birim zaten mevcut.`;
                     } else {
                         displayMessage = 'Eklemeye/Güncellemeye çalıştığınız birim adı veya kısa adı zaten mevcut.';
                     }
                     toastrType = 'warning';
                }
                // main/ipcHandlers.js'den gelen özel hata mesajlarını yakala (updateBirim için)
                else if (error.message.startsWith('"') && error.message.endsWith('zaten mevcut.') || error.message.endsWith('kullanılıyor.')) {
                    displayMessage = error.message;
                    toastrType = 'warning';
                }
                else {
                     displayMessage = 'İşlem sırasında bir hata oluştu: ' + error.message;
                     toastrType = 'error';
                }

                if (toastrType === 'warning') toastr.warning(displayMessage);
                else toastr.error(displayMessage);
            }
        };
    } else {
        console.error("Birim ekleme formu (birimEkleForm) bulunamadı. birimler.html yüklü mü?");
    }

    // YENİ: İptal butonuna olay dinleyici ekle
    if (birimFormCancelButton) {
        birimFormCancelButton.onclick = () => {
            switchToAddMode();
        };
    }

    // Sayfa ilk yüklendiğinde formu ekleme moduna al
    if (birimEkleForm) { // Sadece form varsa bu işlemi yap
       switchToAddMode();
    }


    // Sayfa yüklendiğinde birimleri çek ve göster
     try {
        const birimler = await window.electronAPI.getBirimler();
        displayBirimler(birimler);
      } catch (error) {
        console.error('Birimleri alırken hata oluştu:', error);
        toastr.error('Birim listesi yüklenirken hata oluştu.');
      }
}