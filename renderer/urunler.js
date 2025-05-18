// renderer/urunler.js
// Bu dosya, Ürünler sayfası (views/urunler.html) ile ilgili JavaScript kodlarını içerir.

// Bu fonksiyon, urunler.html içeriği ana sayfaya yüklendiğinde çağrılacak
export async function loadUrunlerPage() {
    console.log('Ürünler sayfası JavaScript\'i yükleniyor...');

    // !!! DİKKAT: Buradaki kodlar, urunler.html yüklendikten sonra çalışacaktır.
    // DOM elementlerine bu fonksiyon içinden erişin.

    // --- DOM Elementlerini Seçme ---
    const urunAdiInput = document.querySelector('#urunAdi');
    const urunTuruSelect = document.querySelector('#urunTuru');
    const urunEkleForm = document.querySelector('#urunEkleForm'); // Form elementini tekrar seç (scope dışında)
    const urunlerTableBody = document.querySelector('#urunlerTable tbody');


    // --- Yardımcı Modal Onay Fonksiyonu (Bu sayfada kullanılmayabilir, genel scope'ta olmalıydı) ---
    // Modal onay fonksiyonu (showConfirmationModal) renderer.js dosyasında genel scope'ta tanımlı.
    // Burada tekrar tanımlamaya gerek yok, doğrudan çağırabiliriz.


    // --- Tablo Listeleme Fonksiyonu (displayUrunler) ---
    function displayUrunler(urunler) {
        const tableBody = urunlerTableBody; // Seçilmiş tbody elementini kullan
        tableBody.innerHTML = '';

        if (urunler && urunler.length > 0) {
            urunler.forEach(urun => {
                const row = tableBody.insertRow();

                row.insertCell(0).textContent = urun.id;
                row.insertCell(1).textContent = urun.ad;
                row.insertCell(2).textContent = urun.tur;

                // Eylemler hücresi
                const actionsCell = row.insertCell(3);

                // Düzenle butonu oluştur
                const editButton = document.createElement('button');
                editButton.textContent = 'Düzenle';
                editButton.classList.add('btn', 'btn-sm', 'btn-primary', 'me-2');
                editButton.dataset.id = urun.id;

                // Tıklama olayına handleEditUrun'ı çağırırken urun.id ve urun objesini gönder
                 editButton.addEventListener('click', () => handleEditUrun(urun.id, urun));


                // Sil butonu
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Sil';
                deleteButton.classList.add('btn', 'btn-sm', 'btn-danger');
                deleteButton.dataset.id = urun.id;
                 // Tıklama olayına handleDeleteUrun'ı çağırırken urun.id ve urun objesini gönder
                deleteButton.addEventListener('click', () => handleDeleteUrun(urun.id, urun)); // handleDeleteUrun de urun objesini alacak şekilde güncellenebilir


                // Butonları hücreye ekle
                actionsCell.appendChild(editButton);
                actionsCell.appendChild(deleteButton);

            });

        } else {
            const row = tableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 4;
            cell.textContent = 'Henüz kayıtlı ürün bulunamadı.';
            cell.style.textAlign = 'center';
        }
    }


    // --- Olay Dinleyicileri ve İşlem Fonksiyonları Handler'ları ---
    // (Bu fonksiyonlar loadUrunlerPage scope'unda tanımlı olacak)


    // Ürün Silme işlemini yönetecek fonksiyon (Modal Onaylı)
    async function handleDeleteUrun(urunId, urun) { // urun objesini de alalım log için
        console.log(`"Ürün Sil" butonuna tıklandı, Ürün ID: ${urunId}`);
        console.log('Silinecek Ürün Obj:', urun); // Loglayalım

        // Modal onayını bekle (showConfirmationModal renderer.js'de genel scope'ta)
        try {
             const confirmed = await showConfirmationModal(
                 `"${urun.ad}" ürününü silmek istediğinizden emin misiniz?`,
                 'Evet, Sil', // Onay butonu metni
                 'btn-danger' // Onay butonu rengi (kırmızı)
             );

             if (!confirmed) { // Kullanıcı iptal butonuna veya kapatma ikonuna tıkladıysa
                 console.log('Ürün silme işlemi kullanıcı tarafından iptal edildi (Modal).');
                 toastr.info('Ürün silme işlemi iptal edildi.');
                 return; // İşlemi durdur
             }

             // Onaylandıysa silme işlemini yap
            console.log('Ürün silme işlemi onaylandı (Modal).');
            // Ana Süreç'e silme isteği gönder
            const success = await window.electronAPI.deleteUrun(urunId); // deleteUrun handler'ı mevcut

            if (success) {
                console.log(`Ürün başarıyla silindi, ID: ${urunId}`);
                toastr.success('Ürün başarıyla silindi!');

                // Tabloyu yenile
                await fetchAndDisplayUrunler(); // Ürün listesini yeniden çek ve göster

                 // Eğer düzenleme formu silinen ürünle doluysa, formu resetle
                 if(urunEkleForm && urunEkleForm.dataset.editingId === urunId.toString()) {
                      resetUrunEkleForm();
                 }

            } else {
                // Başarısız olursa (örneğin ürün bulunamazsa)
                console.warn(`Ürün silme başarısız veya ürün bulunamadı, ID: ${urunId}`);
                toastr.warning('Ürün silme başarısız veya ürün bulunamadı.');
            }

        } catch (error) { // showConfirmationModal hatası veya deleteUrun hatası
            console.error('Genel Hata Yakalandı (Ürün Sil):', error);
             // TODO: Veritabanı kısıtlaması hatalarını yakala (örn: Bu ürün başka bir tabloda kullanılıyorsa)
             if (error.message && error.message.includes('FOREIGN KEY constraint failed')) {
                  console.warn('Yabancı anahtar kısıtlaması hatası yakalandı (Ürün Sil).');
                  toastr.error('Bu ürün başka tablolarda kullanıldığı için silinemez.');
             }
             else {
                toastr.error('Ürün silinirken bir hata oluştu: ' + error.message);
             }
        }
    }


    // *** Ürün Düzenleme işlemini yönetecek fonksiyon (handleEditUrun) ***
    // Bu fonksiyon, tıklanan butonun ait olduğu ürün objesini almalı
    async function handleEditUrun(urunId, urun) { // urun objesini de parametre olarak alıyor
        console.log(`"Ürün Düzenle" butonuna tıklandı, Ürün ID: ${urunId}`);
        console.log('Düzenlenecek Ürün Obj:', urun);

        // Formu seçilen ürün bilgileriyle doldur
        const urunEkleForm = document.querySelector('#urunEkleForm'); // Form elementini tekrar seç (scope dışında)
        const urunAdiInput = document.querySelector('#urunAdi');
        const urunTuruSelect = document.querySelector('#urunTuru');

        if (urunEkleForm) {
             // Düzenleme modunda olduğumuzu belirten data attribute ekle
             urunEkleForm.dataset.editingId = urun.id; // Düzenlenen ürün ID'sini kaydet

            // Ad ve Tür alanlarını doldur
            urunAdiInput.value = urun.ad;
            urunTuruSelect.value = urun.tur; // Select kutusunda doğru option seçili olmalı


             // Formun başlığını ve buton metnini değiştir
             const formTitle = urunEkleForm.previousElementSibling;
             if(formTitle && formTitle.tagName === 'H2') {
                 formTitle.textContent = 'Ürün/Hammaddeyi Düzenle';
             }
             const submitButton = urunEkleForm.querySelector('button[type="submit"]');
             if(submitButton) {
                  submitButton.textContent = 'Güncelle';
                   submitButton.classList.remove('btn-primary');
                  submitButton.classList.add('btn-success'); // Yeşil renk yap
             }

             toastr.info(`Ürün düzenleme formuna yüklendi (ID: ${urunId}).`);

        } else {
             console.error("Ürün ekleme formu (urunEkleForm) bulunamadı.");
        }
    }


    // *** Ürün ekleme/düzenleme formunu düzenleme modundan ekleme moduna döndüren fonksiyon ***
    function resetUrunEkleForm() {
        const urunEkleForm = document.querySelector('#urunEkleForm'); // Form elementini tekrar seç (scope dışında)
        const urunAdiInput = document.querySelector('#urunAdi');
        const urunTuruSelect = document.querySelector('#urunTuru');

        if (urunEkleForm) {
            urunEkleForm.reset(); // Formu temizle
            delete urunEkleForm.dataset.editingId; // Düzenleme ID'sini kaldır

             // Formun başlığını ve buton metnini varsayılana döndür
             const formTitle = urunEkleForm.previousElementSibling;
             if(formTitle && formTitle.tagName === 'H2') {
                 formTitle.textContent = 'Yeni Ürün/Hammadde Ekle';
             }
             const submitButton = urunEkleForm.querySelector('button[type="submit"]');
             if(submitButton) {
                  submitButton.textContent = 'Ürünü Ekle';
                   submitButton.classList.remove('btn-success');
                  submitButton.classList.add('btn-primary');
             }
        }
    }


    // --- Async Veri Çekme ve Gösterme Yardımcı Fonksiyonları ---

    // Ürün listesini Ana Süreç'ten çekip gösteren yardımcı fonksiyon
    async function fetchAndDisplayUrunler() {
        try {
            const urunler = await window.electronAPI.getUrunler();
            console.log('Ana Süreçten gelen ürünler:', urunler);
            displayUrunler(urunler); // Tabloya göster
        } catch (error) {
            console.error('Ürünleri alırken hata oluştu:', error);
            toastr.error('Ürün listesi yüklenirken hata oluştu.');
        }
    }


    // --- Form Submit Olay Dinleyicileri ---

    // Yeni Ürün Ekleme / Ürün Düzenleme Formu Submit Olayı
    if (urunEkleForm) {
        urunEkleForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const urunAdiInput = document.querySelector('#urunAdi');
            const urunTuruSelect = document.querySelector('#urunTuru');

            const urunData = { // Yeni veya güncellenecek ürün verileri
                ad: urunAdiInput.value.trim(),
                tur: urunTuruSelect.value
            };

            // Zorunlu alan kontrolü (ekleme ve düzenleme için ortak)
            if (!urunData.ad || !urunData.tur) {
                toastr.warning('Ürün Adı ve Türü boş bırakılamaz.');
                return;
            }

            // Form düzenleme modunda mı kontrol et (data-editing-id attribute'una bak)
            const editingId = urunEkleForm.dataset.editingId; // data-editing-id attribute'unu al

            if (editingId) {
                // *** Düzenleme Modunda ***
                console.log(`Ürün güncelleniyor, ID: ${editingId}`);
                urunData.id = parseInt(editingId); // Güncellenecek ürünün ID'sini objeye ekle


                try {
                    // Ana Süreç'e güncelleme isteği gönder
                    const success = await window.electronAPI.updateUrun(urunData); // updateUrun handler'ı mevcut

                    if (success) {
                        console.log(`Ürün başarıyla güncellendi, ID: ${editingId}`);
                        toastr.success('Ürün bilgileri güncellendi!');

                        // Formu resetle ve "Ekle" moduna dön
                        resetUrunEkleForm();

                        // Ürün listesini yenile
                        await fetchAndDisplayUrunler();

                    } else {
                        console.warn(`Ürün güncelleme başarısız, ID: ${editingId}`);
                        toastr.warning('Ürün güncelleme başarısız.');
                    }

                } catch (error) {
                    console.error('Genel Hata Yakalandı (Ürün Güncelle):', error);
                     // Veritabanı kısıtlaması hatalarını yakala (örn: UNIQUE ad)
                     if (error.message && error.message.includes('SQLITE_CONSTRAINT_UNIQUE')) {
                           toastr.error(`"${urunData.ad}" adında bir ürün zaten mevcut.`);
                     }
                     else {
                         toastr.error('Ürün güncellenirken bir hata oluştu: ' + error.message);
                     }
                }

            } else {
                // *** Ekleme Modunda ***
                console.log('Yeni ürün ekleniyor...');

                try {
                    const eklenenUrunId = await window.electronAPI.addUrun(urunData); // addUrun handler'ı mevcut
                    console.log('Ürün başarıyla eklendi, ID:', eklenenUrunId);
                    toastr.success(`"${urunData.ad}" başarıyla eklendi!`);

                    urunEkleForm.reset();

                    await fetchAndDisplayUrunler();

                } catch (error) {
                     console.error('Genel Hata Yakalandı (Ürün Ekle):', error);
                     let displayMessage = 'Ürün eklenirken beklenmeyen bir hata oluştu.';
                     if (error.message && error.message.includes('SQLITE_CONSTRAINT_UNIQUE')) {
                          displayMessage = `"${urunData.ad}" adında bir ürün zaten mevcut.`;
                     } else {
                          displayMessage = 'Ürün eklenirken bir hata oluştu: ' + error.message;
                     }
                      toastr.error(displayMessage);
                 }
            }
        });
    } else {
         console.error("Ürün ekleme formu (urunEkleForm) bulunamadı.");
    }


    // --- Sayfa Yüklendiğinde Çalışacaklar (loadUrunlerPage çağrıldığında) ---

    // Ürün listesini çek ve göster
    await fetchAndDisplayUrunler();

    // Başlangıçta formu "Ekle" modunda tut (varsayılan durum)
    resetUrunEkleForm(); // Sayfa yüklendiğinde formu default hale getir


} // loadUrunlerPage fonksiyonunun sonu