// renderer/receler.js
// Bu dosya, Reçete Yönetimi sayfası (views/receler.html) ile ilgili JavaScript kodlarını içerir.

// Bu fonksiyon, receler.html içeriği ana sayfaya yüklendiğinde çağrılacak
export async function loadRecetelerPage() {
    console.log('Reçete Yönetimi sayfası JavaScript\'i yükleniyor...');

    // !!! DİKKAT: Buradaki kodlar, receler.html yüklendikten sonra çalışacaktır.
    // DOM elementlerine bu fonksiyon içinden erişin.

    // --- DOM Elementlerini Seçme ---
    const recetePorsiyonSelect = document.querySelector('#recetePorsiyonId'); // Yeni reçete formu - Porsiyon seçici
    const receteAdiInput = document.querySelector('#receteAdi');             // Yeni reçete formu - Reçete Adı
    const receteEkleForm = document.querySelector('#receteEkleForm');       // Yeni reçete formu
    const recelerTableBody = document.querySelector('#recelerTable tbody'); // Reçete listesi tablosu tbody

    const receteDetaylariCard = document.querySelector('#receteDetaylariCard'); // Reçete detayları kartı
    const receteDetaylariTitle = document.querySelector('#receteDetaylariTitle'); // Reçete detayları kartı başlığı
    const selectedReceteIdInput = document.querySelector('#selectedReceteId'); // Hammadde ekleme formu - Seçilen reçete ID'si (gizli input)
    const hammaddeSelect = document.querySelector('#hammaddeId');           // Hammadde ekleme formu - Hammadde seçici
    const miktarInput = document.querySelector('#miktar');                 // Hammadde ekleme formu - Miktar
    const detayBirimSelect = document.querySelector('#detayBirimKisaAd'); // Hammadde ekleme formu - Birim seçici
    const receteDetayEkleForm = document.querySelector('#receteDetayEkleForm'); // Hammadde ekleme formu
    const receteDetaylariTableBody = document.querySelector('#receteDetaylariTable tbody'); // Reçete detayları tablosu tbody

    // Genel Onay Modalı Elementleri
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmationModalBody = document.getElementById('confirmationModalBody');
    const confirmActionButton = document.getElementById('confirmActionButton');

    // Modal elementlerinin varlığını kontrol et
     if (!confirmationModal || !confirmationModalBody || !confirmActionButton) {
         console.error("Onay modal elementleri bulunamadı. Lütfen index.html dosyanızı kontrol edin.");
          toastr.error("Uygulama hatası: Onay modal elementleri eksik.");
          return;
     }

    // Bootstrap Modal JS'inin yüklenip yüklenmediğini kontrol et
     if (typeof bootstrap === 'undefined' || typeof bootstrap.Modal === 'undefined') {
        console.error("Bootstrap Modal JS yüklenmedi veya bootstrap objesi tanımsız.");
         toastr.error("Uygulama hatası: Bootstrap Modal yüklenemedi.");
         return;
     }


    let currentReceteId = null;


    // --- Yardımcı Modal Onay Fonksiyonu ---
    // Bu fonksiyon, bir onay mesajı gösterir ve kullanıcı onaylayana kadar bekler (Promise döndürür)
    // Modal elementlerini dış scope'tan (loadRecetelerPage scope'u) alır.
    function showConfirmationModal(message, actionButtonText = 'Tamam', actionButtonClass = 'btn-primary') {
        return new Promise((resolve, reject) => {
            // Modal elementlerinin varlığını kontrol etmeye burada gerek yok,
            // loadRecetelerPage fonksiyonu başında kontrol ettik.

            confirmationModalBody.textContent = message; // Mesajı ayarla
            confirmActionButton.textContent = actionButtonText; // Buton metnini ayarla

            // Buton sınıflarını ayarla (mevcutları kaldırıp yeniyi ekle)
            confirmActionButton.classList.remove('btn-primary', 'btn-secondary', 'btn-success', 'btn-danger', 'btn-info', 'btn-warning');
            confirmActionButton.classList.add(actionButtonClass);


            // Modal kapatıldığında ve onaylanmadığında promise'ı reject et (false ile)
             const onModalHidden = () => {
                 console.log("Onay modal kapatıldı (gizlendi).");
                 resolve(false); // İptal durumunda false döndür
                 // Olay dinleyicilerini kaldır
                 confirmationModal.removeEventListener('hidden.bs.modal', onModalHidden);
                 confirmActionButton.removeEventListener('click', onConfirmActionClick);
             };

             // Onay butonuna tıklama olayını dinle
             const onConfirmActionClick = () => {
                 console.log("Onay butonuna tıklandı.");
                 // Olay dinleyicilerini kaldır
                 confirmationModal.removeEventListener('hidden.bs.modal', onModalHidden);
                 confirmActionButton.removeEventListener('click', onConfirmActionClick);
                 // Modalı gizle
                 const modalInstance = bootstrap.Modal.getInstance(confirmationModal); // Bootstrap modal instance'ı al
                 if (modalInstance) modalInstance.hide(); // Modalı gizle
                 // Promise'ı çöz (true ile onaylandı)
                 resolve(true);
             };


            // Olay dinleyicilerini ekle (her zaman yeniden ekliyoruz ve kapatınca kaldırıyoruz)
            confirmationModal.addEventListener('hidden.bs.modal', onModalHidden);
            confirmActionButton.addEventListener('click', onConfirmActionClick);


            // Modalı göster
             const modalInstance = bootstrap.Modal.getInstance(confirmationModal) || new bootstrap.Modal(confirmationModal);
            modalInstance.show(); // Modalı göster

        }); // Promise sonu
    }


    // --- Dropdownları Doldurma Fonksiyonları ---

    // Yeni reçete formu için Porsiyonlar dropdown'ını doldur
    async function populateRecetePorsiyonDropdown() {
        try {
             const porsiyonlar = await window.electronAPI.getPorsiyonlar();
             console.log('Reçete formu için Porsiyonlar dropdown:', porsiyonlar);
             recetePorsiyonSelect.innerHTML = '<option value="">-- Porsiyon Seçiniz --</option>';
             porsiyonlar.forEach(porsiyon => {
                const option = document.createElement('option');
                option.value = porsiyon.id;
                option.textContent = `${porsiyon.sonUrunAdi} - ${porsiyon.porsiyonAdi}`;
                recetePorsiyonSelect.appendChild(option);
             });

        } catch (error) {
             console.error('Porsiyonlar dropdown doldurulurken hata oluştu:', error);
             toastr.error('Porsiyonlar dropdown yüklenirken bir hata oluştu.');
        }
    }

     // Hammadde ekleme formu için Hammadde ve Birimler dropdown'larını doldur
    async function populateReceteDetayDropdowns() {
        try {
             const hammaddeler = await window.electronAPI.getUrunlerByTur('Hammadde');
             console.log('Reçete Detay formu için Hammaddeler dropdown:', hammaddeler);
             hammaddeSelect.innerHTML = '<option value="">-- Hammadde Seçiniz --</option>';
             hammaddeler.forEach(hammadde => {
                const option = document.createElement('option');
                option.value = hammadde.id;
                option.textContent = hammadde.ad;
                hammaddeSelect.appendChild(option);
             });

             const birimler = await window.electronAPI.getBirimler();
             console.log('Reçete Detay formu için Birimler dropdown:', birimler);
             detayBirimSelect.innerHTML = '<option value="">-- Birim Seçiniz --</option>';
              birimler.forEach(birim => {
                const option = document.createElement('option');
                option.value = birim.kisaAd;
                option.textContent = `${birim.birimAdi} (${birim.kisaAd})`;
                detayBirimSelect.appendChild(option);
             });

        } catch (error) {
             console.error('Reçete Detay dropdownları doldurulurken hata oluştu:', error);
             toastr.error('Reçete Detay dropdownları yüklenirken bir hata oluştu.');
        }
    }


    // --- Tablo Listeleme Fonksiyonları ---

    // Reçeteleri tabloya ekleyen fonksiyon (displayReceteler)
    function displayReceteler(receler) {
        recelerTableBody.innerHTML = '';

        if (receler && receler.length > 0) {
            receler.forEach(recete => {
                const row = recelerTableBody.insertRow();

                row.insertCell(0).textContent = recete.id;
                row.insertCell(1).textContent = `${recete.sonUrunAdi} - ${recete.porsiyonAdi}` || 'Porsiyon Bilgisi Eksik';
                row.insertCell(2).textContent = recete.receteAdi || 'Varsayılan';

                // Eylemler hücresi
                const actionsCell = row.insertCell(3);

                // Detayları Görüntüle butonu
                const viewDetailsButton = document.createElement('button');
                viewDetailsButton.textContent = 'Detayları Görüntüle';
                viewDetailsButton.classList.add('btn', 'btn-sm', 'btn-info', 'me-2');
                viewDetailsButton.dataset.id = recete.id;

                viewDetailsButton.addEventListener('click', () => handleViewReceteDetails(recete.id, recete));

                // Sil butonu oluştur
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Sil';
                deleteButton.classList.add('btn', 'btn-sm', 'btn-danger');
                deleteButton.dataset.id = recete.id;

                 deleteButton.addEventListener('click', () => handleDeleteRecete(recete.id, recete));


                // Butonları hücreye ekle
                actionsCell.appendChild(viewDetailsButton);
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

    // Seçilen Reçete Detaylarını tabloya ekleyen fonksiyon (displayReceteDetaylari)
    function displayReceteDetaylari(detaylar) {
         receteDetaylariTableBody.innerHTML = '';

        if (detaylar && detaylar.length > 0) {
            detaylar.forEach(detay => {
                const row = receteDetaylariTableBody.insertRow();

                row.insertCell(0).textContent = detay.id;
                row.insertCell(1).textContent = detay.hammaddeAdi || 'Hammadde Bilgisi Eksik';
                row.insertCell(2).textContent = detay.miktar;
                row.insertCell(3).textContent = detay.birimKisaAd || 'Birim Bilgisi Eksik';


                // Eylemler hücresi (Düzenle/Sil butonları)
                const actionsCell = row.insertCell(4);
                // Düzenle butonu
                const editButton = document.createElement('button');
                editButton.textContent = 'Düzenle';
                editButton.classList.add('btn', 'btn-sm', 'btn-primary', 'me-2');
                editButton.dataset.id = detay.id;
                // editButton.disabled = true; // <-- Bu satırı kaldırdık, buton artık aktif olacak

                // Tıklama olayına handleEditReceteDetay'ı çağırırken detay.id ve detay objesini gönder
                 editButton.addEventListener('click', () => handleEditReceteDetay(detay.id, detay));


                // Sil butonu
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Sil';
                deleteButton.classList.add('btn', 'btn-sm', 'btn-danger');
                deleteButton.dataset.id = detay.id;
                deleteButton.addEventListener('click', () => handleDeleteReceteDetay(detay.id));

                actionsCell.appendChild(editButton);
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


    // --- Olay Dinleyicileri ve İşlem Fonksiyonları Handler'ları ---
    // (Bu fonksiyonlar loadRecetelerPage scope'unda tanımlı olacak)


    // "Detayları Görüntüle" butonuna tıklama handler'ı
    async function handleViewReceteDetails(receteId, recete) {
        console.log(`"Detayları Görüntüle" butonuna tıklandı, Reçete ID: ${receteId}`);
        console.log('Seçilen Reçete Obj:', recete);

        await fetchAndDisplayReceteDetails(receteId);
        currentReceteId = receteId;

        if (receteDetaylariTitle && recete) {
             receteDetaylariTitle.textContent = `"${recete.sonUrunAdi} - ${recete.porsiyonAdi}" Reçete Detayları`;
             if (recete.receteAdi) {
                  receteDetaylariTitle.textContent += ` ("${recete.receteAdi}")`;
             }
        } else {
            receteDetaylariTitle.textContent = 'Seçilen Reçete Detayları';
        }

         receteDetaylariCard.style.display = 'block';

         selectedReceteIdInput.value = receteId;

         // TODO: Reçete detayları kartına scroll yapma efekti eklenebilir
    }


     // Reçete Silme işlemini yönetecek fonksiyon (Modal Onaylı)
    async function handleDeleteRecete(receteId, recete) {
        console.log(`"Reçete Sil" butonuna tıklandı, Reçete ID: ${receteId}`);
        console.log('Silinecek Reçete Obj:', recete);

        try {
             const confirmed = await showConfirmationModal(
                 `"${recete.sonUrunAdi} - ${recete.porsiyonAdi}" reçetesini silmek istediğinizden emin misiniz?`,
                 'Evet, Sil',
                 'btn-danger'
             );

             if (!confirmed) {
                 console.log('Reçete silme işlemi kullanıcı tarafından iptal edildi (Modal).');
                 toastr.info('Reçete silme işlemi iptal edildi.');
                 return;
             }

            console.log('Reçete silme işlemi onaylandı (Modal).');
            const success = await window.electronAPI.deleteRecete(receteId);

            if (success) {
                console.log(`Reçete başarıyla silindi, ID: ${receteId}`);
                toastr.success('Reçete başarıyla silindi!');

                await fetchAndDisplayReceteler();

                if (currentReceteId === receteId) {
                    receteDetaylariCard.style.display = 'none';
                    currentReceteId = null;
                }

            } else {
                console.warn(`Reçete silme başarısız veya reçete bulunamadı, ID: ${receteId}`);
                toastr.warning('Reçete silme başarısız veya reçete bulunamadı.');
            }

        } catch (error) {
            console.error('Genel Hata Yakalandı (Reçete Sil):', error);
             if (error.message && error.message.includes('FOREIGN KEY constraint failed')) {
                  console.warn('Yabancı anahtar kısıtlaması hatası yakalandı (Reçete Sil).');
                  toastr.error('Bu reçetenin detayları olduğu için silinemez. Önce detaylarını silin.');
             }
             else {
                toastr.error('Reçete silinirken bir hata oluştu: ' + error.message);
             }
        }
    }


     // Reçete Detayları Silme işlemini yönetecek fonksiyon (Modal Onaylı)
     async function handleDeleteReceteDetay(detayId) {
        console.log(`"Reçete Detay Sil" butonuna tıklandı, Detay ID: ${detayId}`);

        try {
             const confirmed = await showConfirmationModal(
                 `Bu reçete detayını silmek istediğinizden emin misiniz?`,
                 'Evet, Sil',
                 'btn-danger'
             );

             if (!confirmed) {
                 console.log('Reçete detay silme işlemi kullanıcı tarafından iptal edildi (Modal).');
                 toastr.info('Reçete detay silme işlemi iptal edildi.');
                 return;
             }

             console.log('Reçete detay silme işlemi onaylandı (Modal).');
            const success = await window.electronAPI.deleteReceteDetay(detayId);

            if (success) {
                console.log(`Reçete Detayı başarıyla silindi, ID: ${detayId}`);
                toastr.success('Hammadde reçeteden silindi!');

                if (currentReceteId) {
                    await fetchAndDisplayReceteDetails(currentReceteId);
                } else {
                     console.error("Silme sonrası reçete detayları yenilenemedi: currentReceteId boş.");
                }

            } else {
                console.warn(`Reçete Detay silme başarısız veya detay bulunamadı, ID: ${detayId}`);
                toastr.warning('Reçete detayı silme başarısız veya detay bulunamadı.');
            }

         } catch (error) {
             console.error('Genel Hata Yakalandı (Reçete Detay Sil):', error);
              let displayMessage = 'Reçete detayı silinirken beklenmeyen bir hata oluştu.';
              toastr.error(displayMessage + ': ' + error.message);
         }
     }


    // *** Reçete Detayı Düzenleme işlemini yönetecek fonksiyon (handleEditReceteDetay) ***
    async function handleEditReceteDetay(detayId, detay) { // detay objesini de parametre olarak alıyor
        console.log(`"Reçete Detay Düzenle" butonuna tıklandı, Detay ID: ${detayId}`);
        console.log('Düzenlenecek Detay Obj:', detay);

        // Formu seçilen detay bilgileriyle doldur
        if (receteDetayEkleForm) {
             // selectedReceteIdInput zaten dolu olmalı (Detayları Görüntüle'ye basıldığında)
             // selectedReceteIdInput.value = detay.receteId; // Emin olmak için tekrar set edilebilir

            // Hammadde, Miktar ve Birim alanlarını doldur
            // Dropdownlar string değer tuttuğu için value ataması string olmalı
            hammaddeSelect.value = detay.hammaddeId.toString(); // ID'yi string'e çevir
            miktarInput.value = detay.miktar;
            detayBirimSelect.value = detay.birimKisaAd; // Kısa Ad zaten string


            // Düzenleme modunda olduğumuzu belirten data attribute ekle
            receteDetayEkleForm.dataset.editingId = detay.id;

             // Formun başlığını ve buton metnini değiştir
             const formTitle = receteDetayEkleForm.previousElementSibling;
             if(formTitle && formTitle.tagName === 'H4') {
                 formTitle.textContent = 'Hammaddeyi Düzenle';
             }
             const submitButton = receteDetayEkleForm.querySelector('button[type="submit"]');
             if(submitButton) {
                  submitButton.textContent = 'Güncelle';
                   submitButton.classList.remove('btn-primary');
                  submitButton.classList.add('btn-success'); // Yeşil renk yap
             }

             toastr.info(`Hammadde düzenleme formuna yüklendi (ID: ${detayId}).`);

        } else {
             console.error("Hammadde ekleme formu (receteDetayEkleForm) bulunamadı.");
        }
    }


    // *** Reçete detay formu düzenleme modundan ekleme moduna döndüren fonksiyon ***
    function resetReceteDetayForm() {
        if (receteDetayEkleForm) {
            receteDetayEkleForm.reset(); // Formu temizle
            delete receteDetayEkleForm.dataset.editingId; // Düzenleme ID'sini kaldır

             // Formun başlığını ve buton metnini varsayılana döndür
             const formTitle = receteDetayEkleForm.previousElementSibling;
             if(formTitle && formTitle.tagName === 'H4') {
                 formTitle.textContent = 'Hammadde Ekle';
             }
             const submitButton = receteDetayEkleForm.querySelector('button[type="submit"]');
             if(submitButton) {
                  submitButton.textContent = 'Hammadde Ekle';
                   submitButton.classList.remove('btn-success');
                  submitButton.classList.add('btn-primary');
             }
             // selectedReceteIdInput değeri aynı kalacak (hangi reçetenin detayları)
        }
    }


    // --- Async Veri Çekme ve Gösterme Yardımcı Fonksiyonları ---

    // Reçete listesini Ana Süreç'ten çekip gösteren yardımcı fonksiyon
    async function fetchAndDisplayReceteler() {
        try {
            const receler = await window.electronAPI.getReceteler();
            console.log('Ana Süreçten gelen reçeteler:', receler);
            displayReceteler(receler);
        } catch (error) {
            console.error('Reçeteleri alırken hata oluştu:', error);
            toastr.error('Reçete listesi yüklenirken hata oluştu.');
        }
    }

    // Seçilen Reçete Detaylarını Ana Süreç'ten çekip gösteren yardımcı fonksiyon
    async function fetchAndDisplayReceteDetails(receteId) {
         try {
            const detaylar = await window.electronAPI.getReceteDetaylari(receteId);
            console.log(`Ana Süreçten gelen reçete detayları (ID: ${receteId}):`, detaylar);
            displayReceteDetaylari(detaylar);

         } catch (error) {
            console.error(`Reçete detayları (ID: ${receteId}) alırken hata oluştu:`, error);
            toastr.error('Reçete detayları yüklenirken bir hata oluştu.');
        }
    }


    // --- Form Submit Olay Dinleyicileri ---

    // Yeni Reçete Ekleme Formu Submit Olayı
    if (receteEkleForm) {
        receteEkleForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const porsiyonId = recetePorsiyonSelect.value;
            const receteAdi = receteAdiInput.value.trim() || null;

            const yeniRecete = {
                porsiyonId: parseInt(porsiyonId),
                receteAdi: receteAdi
            };

             if (!yeniRecete.porsiyonId) {
                toastr.warning('Porsiyon seçimi boş bırakılamaz.');
                return;
             }

            try {
                const eklenenReceteId = await window.electronAPI.addRecete(yeniRecete);
                console.log('Reçete başarıyla eklendi, ID:', eklenenReceteId);
                toastr.success('Reçete başarıyla eklendi!');

                receteEkleForm.reset();

                // Yeni reçete eklendikten sonra reçete listesini yenile
                await fetchAndDisplayReceteler();

            } catch (error) {
                console.error('Genel Hata Yakalandı (Reçete Ekle):', error);
                let displayMessage = 'Reçete eklenirken beklenmeyen bir hata oluştu.';
                if (error.message && error.message.includes('UNIQUE constraint failed')) {
                     console.warn('Benzersizlik kısıtlaması hatası yakalandı (Reçete Ekle).');
                      const selectedPorsiyonText = recetePorsiyonSelect.options[recetePorsiyonSelect.selectedIndex].text;
                      if (yeniRecete.receteAdi) {
                           displayMessage = `"${selectedPorsiyonText}" porsiyonu için "${yeniRecete.receteAdi}" adında bir reçete zaten mevcut.`;
                      } else {
                           displayMessage = `"${selectedPorsiyonText}" porsiyonu için varsayılan (adı boş) bir reçete zaten mevcut.`;
                      }

                }
                else {
                     displayMessage = 'Reçete eklenirken bir hata oluştu: ' + error.message;
                }
                 toastr.error(displayMessage);
            }
        });
    } else {
         console.error("Yeni reçete ekleme formu (receteEkleForm) bulunamadı.");
    }


    // Seçilen Reçete Detayları Formu Submit Olayı (Hammadde Ekleme veya Düzenleme)
    if (receteDetayEkleForm) {
        receteDetayEkleForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const receteId = selectedReceteIdInput.value; // Gizli inputtan seçilen reçete ID'sini al
            const hammaddeId = hammaddeSelect.value;
            const miktar = miktarInput.value;
            const birimKisaAd = detayBirimSelect.value;

             const detayData = {
                 receteId: parseInt(receteId),
                 // Hammadde, Miktar ve Birim inputlarından alınan değerler
                 hammaddeId: parseInt(hammaddeId),
                 miktar: parseFloat(miktar),
                 birimKisaAd: birimKisaAd
             };

             if (!detayData.receteId || !detayData.hammaddeId || !detayData.miktar || !detayData.birimKisaAd) {
                 toastr.warning('Hammadde, Miktar ve Birim boş bırakılamaz.');
                 return;
             }
             if (detayData.miktar <= 0) {
                  toastr.warning('Miktar sıfırdan büyük olmalıdır.');
                 return;
             }


             const editingId = receteDetayEkleForm.dataset.editingId;

             if (editingId) {
                 // *** Düzenleme Modunda ***
                 console.log(`Reçete detayı güncelleniyor, ID: ${editingId}`);
                 detayData.id = parseInt(editingId);


                 try {
                     const success = await window.electronAPI.updateReceteDetay(detayData);

                     if (success) {
                         console.log(`Reçete detayı başarıyla güncellendi, ID: ${editingId}`);
                         toastr.success('Hammadde detayı güncellendi!');

                         resetReceteDetayForm();

                         if (currentReceteId) {
                             await fetchAndDisplayReceteDetails(currentReceteId);
                         } else {
                              console.error("Güncelleme sonrası reçete detayları yenilenemedi: currentReceteId boş.");
                         }

                     } else {
                         console.warn(`Reçete detayı güncelleme başarısız, ID: ${editingId}`);
                         toastr.warning('Reçete detayı güncelleme başarısız.');
                     }

                 } catch (error) {
                     console.error('Genel Hata Yakalandı (Reçete Detay Güncelle):', error);
                      let displayMessage = 'Reçete detayı güncellenirken beklenmeyen bir hata oluştu.';
                      toastr.error(displayMessage + ': ' + error.message);

                 }

             } else {
                 // *** Ekleme Modunda ***
                 console.log('Yeni reçete detayı ekleniyor...');

                 try {
                     const eklenenDetayId = await window.electronAPI.addReceteDetay(detayData);
                     console.log('Reçete Detayı başarıyla eklendi, ID:', eklenenDetayId);
                     toastr.success('Hammadde reçeteye eklendi!');

                     receteDetayEkleForm.reset();
                     selectedReceteIdInput.value = detayData.receteId;

                     if (currentReceteId) {
                         await fetchAndDisplayReceteDetails(currentReceteId);
                     } else {
                          console.error("Ekleme sonrası reçete detayları yenilenemedi: currentReceteId boş.");
                     }

                 } catch (error) {
                      console.error('Genel Hata Yakalandı (Reçete Detay Ekle):', error);
                      let displayMessage = 'Reçete detayı eklenirken beklenmeyen bir hata oluştu.';
                       toastr.error(displayMessage + ': ' + error.message);

                 }
             }
        });
    } else {
         console.error("Hammadde ekleme formu (receteDetayEkleForm) bulunamadı.");
    }


    // --- Sayfa Yüklendiğinde Çalışacaklar (loadRecetelerPage çağrıldığında) ---

    // Dropdownları doldur
    await populateRecetePorsiyonDropdown();
    await populateReceteDetayDropdowns();

    // Reçete listesini çek ve göster
    await fetchAndDisplayReceteler();

    // Başlangıçta reçete detayları kartını gizle (HTML'de display: none yaptık, emin olalım)
    receteDetaylariCard.style.display = 'none';


} // loadRecetelerPage fonksiyonunun sonu