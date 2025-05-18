// renderer/birimler.js
// Bu dosya, Birim Yönetimi sayfası (views/birimler.html) ile ilgili JavaScript kodlarını içerir.

// Global scope'ta bir onay modalı referansı ve callback fonksiyonu
let confirmationModalInstance;
let confirmActionCallback;


// Bu fonksiyon, birimler.html içeriği ana sayfaya yüklendiğinde çağrılacak
export async function loadBirimlerPage() {
    console.log('Birimler sayfası JavaScript\'i yükleniyor...');

    // Onay modalını ve butonunu al (index.html'de tanımlı olmalı)
    const confirmationModalElement = document.getElementById('confirmationModal');
    if (confirmationModalElement) {
        confirmationModalInstance = new bootstrap.Modal(confirmationModalElement);
        const confirmBtn = confirmationModalElement.querySelector('#confirmActionBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (confirmActionCallback) {
                    confirmActionCallback();
                }
                confirmationModalInstance.hide();
            });
        } else {
            console.error('Onay modalı içinde #confirmActionBtn bulunamadı.');
        }
    } else {
        console.error('#confirmationModal bulunamadı. index.html dosyasını kontrol edin.');
    }


    // Birimleri tabloya ekleyen fonksiyon (displayBirimler)
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

                // YENİ: Eylemler hücresi ve Sil butonu
                const eylemlerCell = row.insertCell(4);
                eylemlerCell.classList.add('text-end'); // Butonları sağa yasla

                const silButton = document.createElement('button');
                silButton.classList.add('btn', 'btn-danger', 'btn-sm', 'ms-1'); // 'ms-1' soldan biraz boşluk
                silButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>';
                silButton.setAttribute('data-birim-id', birim.id);
                silButton.setAttribute('data-birim-adi', birim.birimAdi);
                silButton.title = "Sil"; // Tooltip
                silButton.addEventListener('click', handleDeleteBirimClick);
                eylemlerCell.appendChild(silButton);

                // TODO: Düzenle butonu buraya eklenecek
            });
        } else {
            const row = tableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 5; // Colspan 5'e güncellendi
            cell.textContent = 'Henüz kayıtlı birim bulunamadı.';
            cell.style.textAlign = 'center';
        }
    }

    // YENİ: Silme işlemi için olay yöneticisi
    async function handleDeleteBirimClick(event) {
        const button = event.currentTarget;
        const birimId = button.getAttribute('data-birim-id');
        const birimAdi = button.getAttribute('data-birim-adi');

        if (!confirmationModalInstance) {
            console.error('Onay modalı örneği bulunamadı.');
            toastr.error('Onay modalı düzgün başlatılamadı.');
            return;
        }

        // Modal içeriğini ayarla
        const modalTitle = confirmationModalElement.querySelector('.modal-title');
        const modalBody = confirmationModalElement.querySelector('.modal-body');
        if (modalTitle) modalTitle.textContent = 'Birim Silme Onayı';
        if (modalBody) modalBody.innerHTML = `<p><strong>"${birimAdi}"</strong> adlı birimi silmek istediğinizden emin misiniz?</p>
                                              <p class="text-danger small">Bu işlem geri alınamaz. Bu birim başka kayıtlarda kullanılıyorsa silinemeyebilir.</p>`;

        // Onay callback'ini ayarla
        confirmActionCallback = async () => {
            try {
                console.log(`Birim siliniyor: ID ${birimId}`);
                const silindi = await window.electronAPI.deleteBirim(Number(birimId));
                if (silindi) {
                    toastr.success(`"${birimAdi}" adlı birim başarıyla silindi.`);
                    // Birim listesini yenile
                    const guncelBirimler = await window.electronAPI.getBirimler();
                    displayBirimler(guncelBirimler);
                } else {
                    // Bu durum normalde olmamalı, handler true/false dönmeli veya hata fırlatmalı
                    toastr.warning(`"${birimAdi}" adlı birim silinemedi. Kayıt bulunamadı veya başka bir sorun oluştu.`);
                }
            } catch (error) {
                console.error('Birim silinirken hata oluştu:', error);
                toastr.error(`Birim silinirken bir hata oluştu: ${error.message}`);
            }
        };

        confirmationModalInstance.show();
    }


    // Formu seç ve submit olayını dinle
    const birimEkleForm = document.querySelector('#birimEkleForm');

    if (birimEkleForm) {
        birimEkleForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const birimAdiInput = document.querySelector('#birimAdi');
            const kisaAdInput = document.querySelector('#kisaAd');
            const anaBirimKisaAdInput = document.querySelector('#anaBirimKisaAd');

            const yeniBirim = {
                birimAdi: birimAdiInput.value.trim(),
                kisaAd: kisaAdInput.value.trim(),
                anaBirimKisaAd: anaBirimKisaAdInput.value.trim() || null
            };

            if (!yeniBirim.birimAdi || !yeniBirim.kisaAd) {
                 toastr.warning('Birim Adı ve Kısa Ad boş bırakılamaz.');
                 return;
            }

            try {
                const eklenenBirimId = await window.electronAPI.addBirim(yeniBirim);
                toastr.success(`"${yeniBirim.birimAdi}" başarıyla eklendi!`);

                birimAdiInput.value = '';
                kisaAdInput.value = '';
                anaBirimKisaAdInput.value = '';

                const guncelBirimler = await window.electronAPI.getBirimler();
                displayBirimler(guncelBirimler);

            } catch (error) {
                console.error('Genel Hata Yakalandı (Birim Ekle):', error);
                let displayMessage = 'Birim eklenirken beklenmeyen bir hata oluştu.';
                let toastrType = 'error';

                if (error.message && error.message.includes('UNIQUE constraint failed')) {
                     if (error.message.includes('birimler.birimAdi')) {
                          displayMessage = `"${yeniBirim.birimAdi}" adında bir birim zaten mevcut.`;
                     } else if (error.message.includes('birimler.kisaAd')) {
                          displayMessage = `"${yeniBirim.kisaAd}" kısa adında bir birim zaten mevcut.`;
                     } else {
                         displayMessage = 'Eklemeye çalıştığınız birim zaten mevcut (Ad veya Kısa Ad).';
                     }
                     toastrType = 'warning';
                } else {
                     displayMessage = 'Birim eklenirken bir hata oluştu: ' + error.message;
                     toastrType = 'error';
                }

                if (toastrType === 'warning') {
                    toastr.warning(displayMessage);
                } else {
                    toastr.error(displayMessage);
                }
            }
        });
    } else {
        console.error("Birim ekleme formu (birimEkleForm) bulunamadı. birimler.html yüklü mü?");
    }

    try {
        const birimler = await window.electronAPI.getBirimler();
        displayBirimler(birimler);
      } catch (error) {
        console.error('Birimleri alırken hata oluştu:', error);
        toastr.error('Birim listesi yüklenirken hata oluştu.');
      }
}