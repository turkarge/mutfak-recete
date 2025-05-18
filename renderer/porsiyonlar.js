// renderer/porsiyonlar.js
// Bu dosya, Porsiyon Yönetimi sayfası (views/porsiyonlar.html) ile ilgili JavaScript kodlarını içerir.

// Global scope'ta bir onay modalı referansı ve callback fonksiyonu (birimler.js'deki gibi)
let confirmationModalInstance;
let confirmActionCallback;

// Form elementleri (düzenleme için ileride kullanılacak)
let porsiyonEkleForm, porsiyonIdInput, sonUrunSelect, porsiyonAdiInput, satisBirimiSelect, varsayilanSatisFiyatiInput;
let porsiyonFormBaslik, porsiyonFormSubmitButton, porsiyonFormCancelButton;
let porsiyonlarTableBody;


// Bu fonksiyon, porsiyonlar.html içeriği ana sayfaya yüklendiğinde çağrılacak
export async function loadPorsiyonlarPage() {
    console.log('Porsiyonlar sayfası JavaScript\'i yükleniyor...');

    // Form ve tablo elementlerini DOM'dan seçelim
    porsiyonEkleForm = document.querySelector('#porsiyonEkleForm');
    porsiyonIdInput = document.querySelector('#porsiyonIdInput'); // Gizli ID (düzenleme için)
    sonUrunSelect = document.querySelector('#sonUrunId');
    porsiyonAdiInput = document.querySelector('#porsiyonAdi'); // Input elementini alalım
    satisBirimiSelect = document.querySelector('#satisBirimiKisaAd');
    varsayilanSatisFiyatiInput = document.querySelector('#varsayilanSatisFiyati'); // Input elementini alalım
    porsiyonFormBaslik = document.querySelector('#porsiyonFormBaslik'); // Düzenleme için
    porsiyonFormSubmitButton = document.querySelector('#porsiyonFormSubmitButton'); // Düzenleme için
    porsiyonFormCancelButton = document.querySelector('#porsiyonFormCancelButton'); // Düzenleme için
    porsiyonlarTableBody = document.querySelector('#porsiyonlarTable tbody');


    // Onay modalını ve butonunu al (index.html'de tanımlı olmalı)
    const confirmationModalElement = document.getElementById('confirmationModal');
    if (confirmationModalElement) {
        if (!bootstrap.Modal.getInstance(confirmationModalElement)) {
            confirmationModalInstance = new bootstrap.Modal(confirmationModalElement);
        } else {
            confirmationModalInstance = bootstrap.Modal.getInstance(confirmationModalElement);
        }
        const confirmBtn = confirmationModalElement.querySelector('#confirmActionButton');
        if (confirmBtn) {
            confirmBtn.onclick = () => { // Eski listener'ı ezer
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


    // Formdaki Son Ürünler ve Birimler dropdown'larını dolduran yardımcı fonksiyon
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


    // Porsiyonları tabloya ekleyen fonksiyon
    function displayPorsiyonlar(porsiyonlar) {
        if (!porsiyonlarTableBody) {
            console.error("Porsiyonlar tablo body'si bulunamadı.");
            return;
        }
        porsiyonlarTableBody.innerHTML = '';

        if (porsiyonlar && porsiyonlar.length > 0) {
            porsiyonlar.forEach(porsiyon => {
                const row = porsiyonlarTableBody.insertRow();

                row.insertCell(0).textContent = porsiyon.id;
                row.insertCell(1).textContent = porsiyon.sonUrunAdi || 'Bilinmiyor';
                row.insertCell(2).textContent = porsiyon.porsiyonAdi;
                row.insertCell(3).textContent = porsiyon.satisBirimiKisaAd || 'Bilinmiyor';
                row.insertCell(4).textContent = porsiyon.varsayilanSatisFiyati != null ? porsiyon.varsayilanSatisFiyati.toFixed(2) : 'Belirsiz';

                // YENİ: Eylemler hücresi ve Sil butonu
                const eylemlerCell = row.insertCell(5); // 6. sütun (index 5)
                eylemlerCell.classList.add('text-end');

                // Düzenle butonu (ileride eklenecek)
                // const duzenleButton = document.createElement('button');
                // ...

                const silButton = document.createElement('button');
                silButton.classList.add('btn', 'btn-danger', 'btn-sm', 'ms-1'); // 'ms-1' soldan biraz boşluk
                silButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>';
                silButton.setAttribute('data-porsiyon-id', porsiyon.id);
                silButton.setAttribute('data-porsiyon-adi', `${porsiyon.sonUrunAdi} - ${porsiyon.porsiyonAdi}`); // Daha açıklayıcı bir ad
                silButton.title = "Sil";
                silButton.addEventListener('click', handleDeletePorsiyonClick);
                eylemlerCell.appendChild(silButton);
            });
        } else {
            const row = porsiyonlarTableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 6; // Colspan 6'ya güncellendi (Eylemler sütunu dahil)
            cell.textContent = 'Henüz kayıtlı porsiyon bulunamadı.';
            cell.style.textAlign = 'center';
        }
    }

    // YENİ: Silme işlemi için olay yöneticisi
    async function handleDeletePorsiyonClick(event) {
        const button = event.currentTarget;
        const porsiyonId = button.getAttribute('data-porsiyon-id');
        const porsiyonAdi = button.getAttribute('data-porsiyon-adi'); // Kullanıcıya gösterilecek ad

        if (!confirmationModalInstance) {
            console.error('Onay modalı örneği bulunamadı.');
            toastr.error('Onay modalı düzgün başlatılamadı.');
            return;
        }

        const modalTitle = confirmationModalElement.querySelector('.modal-title');
        const modalBody = confirmationModalElement.querySelector('#confirmationModalBody');
        if (modalTitle) modalTitle.textContent = 'Porsiyon Silme Onayı';
        if (modalBody) modalBody.innerHTML = `<p><strong>"${porsiyonAdi}"</strong> adlı porsiyonu silmek istediğinizden emin misiniz?</p>
                                              <p class="text-danger small">Bu işlem geri alınamaz. Bu porsiyon bir reçetede kullanılıyorsa silinemeyecektir.</p>`;

        confirmActionCallback = async () => {
            try {
                console.log(`Porsiyon siliniyor: ID ${porsiyonId}`);
                const silindi = await window.electronAPI.deletePorsiyon(Number(porsiyonId));
                if (silindi) {
                    toastr.success(`"${porsiyonAdi}" adlı porsiyon başarıyla silindi.`);
                    // Porsiyon listesini yenile
                    const guncelPorsiyonlar = await window.electronAPI.getPorsiyonlar();
                    displayPorsiyonlar(guncelPorsiyonlar);
                    // Eğer form düzenleme modundaysa ve silinen porsiyon düzenleniyorsa, formu ekleme moduna al
                    // Bu kontrol düzenleme eklendiğinde yapılacak. Şimdilik formu resetleyebiliriz.
                    if (porsiyonEkleForm) porsiyonEkleForm.reset();
                } else {
                    // Bu durum deletePorsiyon handler'ında hata fırlatıldığı için normalde buraya düşmemeli
                    toastr.warning(`"${porsiyonAdi}" adlı porsiyon silinemedi. Beklenmedik durum.`);
                }
            } catch (error) {
                console.error('Porsiyon silinirken hata oluştu:', error);
                toastr.error(`Porsiyon silinirken bir hata oluştu: ${error.message}`);
            }
        };
        confirmationModalInstance.show();
    }


    // Form submit olayı (Sadece Ekleme için - Düzenleme ileride eklenecek)
    if (porsiyonEkleForm) {
        porsiyonEkleForm.onsubmit = async (event) => { // Eski listener'ı ezer
            event.preventDefault();

            const yeniPorsiyon = {
                sonUrunId: parseInt(sonUrunSelect.value),
                porsiyonAdi: porsiyonAdiInput.value.trim(),
                satisBirimiKisaAd: satisBirimiSelect.value,
                varsayilanSatisFiyati: varsayilanSatisFiyatiInput.value ? parseFloat(varsayilanSatisFiyatiInput.value) : null
            };

            if (!yeniPorsiyon.sonUrunId || !yeniPorsiyon.porsiyonAdi || !yeniPorsiyon.satisBirimiKisaAd) {
                 toastr.warning('Son Ürün, Porsiyon Adı ve Satış Birimi boş bırakılamaz.');
                 return;
            }
             if (yeniPorsiyon.varsayilanSatisFiyati !== null && isNaN(yeniPorsiyon.varsayilanSatisFiyati)) {
                toastr.warning('Varsayılan Satış Fiyatı geçerli bir sayı olmalıdır.');
                return;
            }
            if (yeniPorsiyon.varsayilanSatisFiyati < 0) {
                toastr.warning('Varsayılan Satış Fiyatı negatif olamaz.');
                return;
            }


            try {
                // TODO: Düzenleme modu eklendiğinde burası güncellenecek
                const eklenenPorsiyonId = await window.electronAPI.addPorsiyon(yeniPorsiyon);
                toastr.success(`"${sonUrunSelect.options[sonUrunSelect.selectedIndex].text} - ${yeniPorsiyon.porsiyonAdi}" başarıyla eklendi!`);

                porsiyonEkleForm.reset();
                sonUrunSelect.focus(); // İlk dropdown'a odaklan

                const guncelPorsiyonlar = await window.electronAPI.getPorsiyonlar();
                displayPorsiyonlar(guncelPorsiyonlar);

            } catch (error) {
                console.error('Porsiyon eklerken hata:', error);
                let displayMessage = 'Porsiyon eklenirken bir hata oluştu.';
                let toastrType = 'error';

                if (error.message && error.message.includes('UNIQUE constraint failed')) {
                     const selectedUrunAdi = sonUrunSelect.options[sonUrunSelect.selectedIndex].text;
                     displayMessage = `"${selectedUrunAdi}" ürünü için "${yeniPorsiyon.porsiyonAdi}" adında bir porsiyon zaten mevcut.`;
                     toastrType = 'warning';
                } else {
                     displayMessage = 'Porsiyon eklenirken bir hata oluştu: ' + error.message;
                }

                if (toastrType === 'warning') toastr.warning(displayMessage);
                else toastr.error(displayMessage);
            }
        };
    } else {
        console.error("Porsiyon ekleme formu (porsiyonEkleForm) bulunamadı.");
    }

    // Sayfa ilk yüklendiğinde yapılacaklar
    await populateDropdowns();

    try {
        const porsiyonlar = await window.electronAPI.getPorsiyonlar();
        displayPorsiyonlar(porsiyonlar);
      } catch (error) {
        console.error('Porsiyonları alırken hata oluştu:', error);
        toastr.error('Porsiyon listesi yüklenirken hata oluştu.');
      }

    // Düzenleme için formu ekleme moduna al (ileride kullanılacak)
    // switchToAddMode(); // Bu fonksiyon henüz tanımlanmadı
}