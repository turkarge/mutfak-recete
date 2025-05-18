// renderer/birimler.js
// ... (dosyanın başı aynı)

// Global scope'ta bir onay modalı referansı ve callback fonksiyonu
let confirmationModalInstance;
let confirmActionCallback;


// Bu fonksiyon, birimler.html içeriği ana sayfaya yüklendiğinde çağrılacak
export async function loadBirimlerPage() {
    console.log('Birimler sayfası JavaScript\'i yükleniyor...');

    // Onay modalını ve butonunu al (index.html'de tanımlı olmalı)
    const confirmationModalElement = document.getElementById('confirmationModal');
    if (confirmationModalElement) {
        // Bootstrap modal instance'ını sadece bir kere oluştur
        if (!bootstrap.Modal.getInstance(confirmationModalElement)) {
            confirmationModalInstance = new bootstrap.Modal(confirmationModalElement);
        } else {
            confirmationModalInstance = bootstrap.Modal.getInstance(confirmationModalElement);
        }
        
        // YENİ DEĞİŞİKLİK: Doğru ID ile butonu seç
        const confirmBtn = confirmationModalElement.querySelector('#confirmActionButton'); // <--- ID GÜNCELLENDİ

        if (confirmBtn) {
            // Olay dinleyicisinin tekrar tekrar eklenmesini önle
            // Önce mevcut dinleyiciyi kaldır (varsa), sonra yenisini ekle.
            // Bu, sayfa tekrar yüklendiğinde birden fazla dinleyici olmasını engeller.
            // Daha basit bir yol: confirmBtn'i her loadBirimlerPage'de yeniden bulup, dinleyiciyi bir kere eklemek.
            // Ancak confirmActionCallback her seferinde değiştiği için bu yaklaşım sorun çıkarmaz.
            // Sadece butona tıklandığında confirmActionCallback çağrılacak.

            // Olay dinleyicisini doğrudan atamak yerine, her seferinde yeniden atayalım
            // (Bu, confirmActionCallback'in her seferinde güncel olmasını sağlar)
            // Ancak, eğer buton her zaman aynıysa ve sadece callback değişiyorsa,
            // dinleyiciyi bir kere ekleyip sadece callback'i güncellemek daha performanslı olabilir.
            // Şimdilik bu şekilde bırakalım, basit ve çalışır.
            confirmBtn.onclick = () => { // .addEventListener yerine .onclick kullanarak eski listener'ı ezeriz.
                if (confirmActionCallback) {
                    confirmActionCallback();
                }
                if (confirmationModalInstance) { // Modal instance hala geçerli mi kontrol et
                    confirmationModalInstance.hide();
                }
            };
        } else {
            console.error('Onay modalı içinde #confirmActionButton bulunamadı.'); // <--- Hata mesajı da güncellendi
        }
    } else {
        console.error('#confirmationModal bulunamadı. index.html dosyasını kontrol edin.');
    }

    // ... (displayBirimler, handleDeleteBirimClick ve form submit kodları aynı kalacak)
    // displayBirimler fonksiyonu içindeki silme butonu oluşturma ve
    // handleDeleteBirimClick fonksiyonundaki modal içeriğini ayarlama kısımları aynı.
    // Sadece yukarıdaki modal butonu seçimi ve olay dinleyicisi ataması güncellendi.


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

                const eylemlerCell = row.insertCell(4);
                eylemlerCell.classList.add('text-end');

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
        const modalBody = confirmationModalElement.querySelector('#confirmationModalBody'); // Modal body için de ID kullanmak daha iyi
        if (modalTitle) modalTitle.textContent = 'Birim Silme Onayı';
        if (modalBody) modalBody.innerHTML = `<p><strong>"${birimAdi}"</strong> adlı birimi silmek istediğinizden emin misiniz?</p>
                                              <p class="text-danger small">Bu işlem geri alınamaz. Bu birim başka kayıtlarda kullanılıyorsa silinemeyebilir.</p>`;
        
        confirmActionCallback = async () => {
            try {
                const silindi = await window.electronAPI.deleteBirim(Number(birimId));
                if (silindi) {
                    toastr.success(`"${birimAdi}" adlı birim başarıyla silindi.`);
                    const guncelBirimler = await window.electronAPI.getBirimler();
                    displayBirimler(guncelBirimler);
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

    const birimEkleForm = document.querySelector('#birimEkleForm');
    if (birimEkleForm) {
        birimEkleForm.onsubmit = async (event) => { // .addEventListener yerine .onsubmit kullanarak eski listener'ı ezeriz
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
                await window.electronAPI.addBirim(yeniBirim);
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
                if (toastrType === 'warning') toastr.warning(displayMessage);
                else toastr.error(displayMessage);
            }
        };
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