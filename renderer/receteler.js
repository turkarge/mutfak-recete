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

    let currentReceteId = null; // Şu anda detayları gösterilen reçetenin ID'si


    // --- Dropdownları Doldurma Fonksiyonları ---

    // Yeni reçete formu için Porsiyonlar dropdown'ını doldur
    async function populateRecetePorsiyonDropdown() {
        try {
             // Ana Süreç'ten tüm porsiyonları çek (ilgili Son Ürün adıyla birlikte)
             const porsiyonlar = await window.electronAPI.getPorsiyonlar(); // getPorsiyonlar handler'ı mevcut
             console.log('Reçete formu için Porsiyonlar dropdown:', porsiyonlar);
             recetePorsiyonSelect.innerHTML = '<option value="">-- Porsiyon Seçiniz --</option>'; // Temizle ve varsayılanı ekle
             porsiyonlar.forEach(porsiyon => {
                const option = document.createElement('option');
                option.value = porsiyon.id;
                option.textContent = `${porsiyon.sonUrunAdi} - ${porsiyon.porsiyonAdi}`; // Son Ürün Adı ve Porsiyon Adı birlikte
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
             // Ana Süreç'ten sadece Hammadde türündeki ürünleri çek
             const hammaddeler = await window.electronAPI.getUrunlerByTur('Hammadde'); // getUrunlerByTur handler'ı mevcut
             console.log('Reçete Detay formu için Hammaddeler dropdown:', hammaddeler);
             hammaddeSelect.innerHTML = '<option value="">-- Hammadde Seçiniz --</option>'; // Temizle ve varsayılanı ekle
             hammaddeler.forEach(hammadde => {
                const option = document.createElement('option');
                option.value = hammadde.id;
                option.textContent = hammadde.ad;
                hammaddeSelect.appendChild(option);
             });

             // Ana Süreç'ten tüm birimleri çek
             const birimler = await window.electronAPI.getBirimler(); // getBirimler handler'ı mevcut
             console.log('Reçete Detay formu için Birimler dropdown:', birimler);
             detayBirimSelect.innerHTML = '<option value="">-- Birim Seçiniz --</option>'; // Temizle ve varsayılanı ekle
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
        recelerTableBody.innerHTML = ''; // Tablonun mevcut içeriğini tamamen temizle

        if (receler && receler.length > 0) {
            receler.forEach(recete => {
                const row = recelerTableBody.insertRow(); // Yeni bir satır oluştur

                // Her satıra 4 hücre (sütun) ekle (views/receler.html - reçete listesi)
                row.insertCell(0).textContent = recete.id;
                // Porsiyon Adını göstermek için recete objesinde 'porsiyonAdi' ve 'sonUrunAdi' olmalı
                row.insertCell(1).textContent = `${recete.sonUrunAdi} - ${recete.porsiyonAdi}` || 'Porsiyon Bilgisi Eksik';
                row.insertCell(2).textContent = recete.receteAdi || 'Varsayılan'; // Reçete Adı yoksa 'Varsayılan' göster

                // Eylemler hücresi (Detayları Görüntüle butonu)
                const actionsCell = row.insertCell(3);
                const viewDetailsButton = document.createElement('button');
                viewDetailsButton.textContent = 'Detayları Görüntüle';
                viewDetailsButton.classList.add('btn', 'btn-sm', 'btn-info'); // Bilgi butonu
                viewDetailsButton.dataset.id = recete.id; // Butona reçete ID'sini ekle
                viewDetailsButton.addEventListener('click', handleViewReceteDetails); // Tıklama olayını dinle

                actionsCell.appendChild(viewDetailsButton);
            });

        } else {
            // Eğer reçete yoksa bilgilendirici bir mesaj göster
            const row = recelerTableBody.insertRow();
            const cell = row.insertCell(0);
            // views/receler.html'deki reçete listesi tablo başlık sayısı kadar colSpan (4 sütun)
            cell.colSpan = 4;
            cell.textContent = 'Henüz kayıtlı reçete bulunamadı.';
            cell.style.textAlign = 'center';
        }
    }

    // Seçilen Reçete Detaylarını tabloya ekleyen fonksiyon (displayReceteDetaylari)
    function displayReceteDetaylari(detaylar) {
         receteDetaylariTableBody.innerHTML = ''; // Tablonun mevcut içeriğini tamamen temizle

        if (detaylar && detaylar.length > 0) {
            detaylar.forEach(detay => {
                const row = receteDetaylariTableBody.insertRow(); // Yeni bir satır oluştur

                // Her satıra 5 hücre (sütun) ekle (views/receler.html - reçete detayları listesi)
                row.insertCell(0).textContent = detay.id;
                 // Hammadde Adını göstermek için detay objesinde 'hammaddeAdi' olmalı
                row.insertCell(1).textContent = detay.hammaddeAdi || 'Hammadde Bilgisi Eksik';
                row.insertCell(2).textContent = detay.miktar;
                 // Birim Kısa Adını göstermek için detay objesinde 'birimKisaAd' olmalı
                row.insertCell(3).textContent = detay.birimKisaAd || 'Birim Bilgisi Eksik';


                // Eylemler hücresi (Düzenle/Sil butonları)
                const actionsCell = row.insertCell(4);
                // Düzenle butonu (şimdilik pasif)
                const editButton = document.createElement('button');
                editButton.textContent = 'Düzenle';
                editButton.classList.add('btn', 'btn-sm', 'btn-primary', 'me-2');
                editButton.dataset.id = detay.id; // Butona detay ID'sini ekle
                editButton.disabled = true; // Şimdilik devre dışı

                // Sil butonu
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Sil';
                deleteButton.classList.add('btn', 'btn-sm', 'btn-danger');
                deleteButton.dataset.id = detay.id; // Butona detay ID'sini ekle
                deleteButton.addEventListener('click', handleDeleteReceteDetay); // Tıklama olayını dinle

                actionsCell.appendChild(editButton);
                actionsCell.appendChild(deleteButton);
            });

        } else {
            // Eğer detay yoksa bilgilendirici bir mesaj göster
            const row = receteDetaylariTableBody.insertRow();
            const cell = row.insertCell(0);
            // views/receler.html'deki reçete detayları tablo başlık sayısı kadar colSpan (5 sütun)
            cell.colSpan = 5;
            cell.textContent = 'Bu reçetede henüz hammadde detayı bulunamadı.';
            cell.style.textAlign = 'center';
        }
    }


    // --- Olay Dinleyicileri ve İşlem Fonksiyonları ---

    // Yeni Reçete Ekleme Formu Submit Olayı
    if (receteEkleForm) {
        receteEkleForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const porsiyonId = recetePorsiyonSelect.value;
            const receteAdi = receteAdiInput.value.trim() || null; // Boşsa null kaydet

            const yeniRecete = {
                porsiyonId: parseInt(porsiyonId),
                receteAdi: receteAdi
            };

            // Zorunlu alan kontrolü
             if (!yeniRecete.porsiyonId) {
                toastr.warning('Porsiyon seçimi boş bırakılamaz.');
                return;
             }

            try {
                const eklenenReceteId = await window.electronAPI.addRecete(yeniRecete); // TODO: addRecete handler'ı eklenecek
                console.log('Reçete başarıyla eklendi, ID:', eklenenReceteId);
                toastr.success('Reçete başarıyla eklendi!');

                // Formu temizle
                receteEkleForm.reset();

                // Reçete listesini yenile
                await fetchAndDisplayReceteler(); // Reçeteleri yeniden çek ve göster

            } catch (error) {
                console.error('Genel Hata Yakalandı (Reçete Ekle):', error);
                let displayMessage = 'Reçete eklenirken beklenmeyen bir hata oluştu.';
                if (error.message && error.message.includes('UNIQUE constraint failed')) {
                     console.warn('Benzersizlik kısıtlaması hatası yakalandı (Reçete Ekle).');
                     // Hatanın kaynağı UNIQUE(porsiyonId, receteAdi) olabilir
                      const selectedPorsiyonText = recetePorsiyonSelect.options[recetePorsiyonSelect.selectedIndex].text;
                      if (yeniRecete.receteAdi) {
                           displayMessage = `"${selectedPorsiyonText}" porsiyonu için "${yeniRecete.receteAdi}" adında bir reçete zaten mevcut.`;
                      } else {
                           displayMessage = `"${selectedPorsiyonText}" porsiyonu için varsayılan (adı boş) bir reçete zaten mevcut.`;
                      }

                }
                 // TODO: Yabancı anahtar hatasını yakala (porsiyonId bulunamadığında)
                else {
                     displayMessage = 'Reçete eklenirken bir hata oluştu: ' + error.message;
                }
                 toastr.error(displayMessage);
            }
        });
    } else {
         console.error("Yeni reçete ekleme formu (receteEkleForm) bulunamadı.");
    }

    // Reçete Listesindeki "Detayları Görüntüle" Butonuna Tıklama Olayı
    // Bu olay dinleyici, tabloya dinamik olarak eklenen butonlar için global olarak atanmalı
    // veya her reçete satırı oluşturulurken atanmalıdır.
    // Şu an her satır oluşturulurken atanıyor (displayReceteler fonksiyonunda).
    // handleViewReceteDetails fonksiyonu aşağıda tanımlı olacak.

    // Seçilen Reçete Detayları Formu Submit Olayı (Hammadde Ekleme)
    if (receteDetayEkleForm) {
        receteDetayEkleForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const receteId = selectedReceteIdInput.value; // Gizli inputtan seçilen reçete ID'sini al
            const hammaddeId = hammaddeSelect.value;
            const miktar = miktarInput.value;
            const birimKisaAd = detayBirimSelect.value;

             const yeniDetay = {
                 receteId: parseInt(receteId),
                 hammaddeId: parseInt(hammaddeId),
                 miktar: parseFloat(miktar),
                 birimKisaAd: birimKisaAd
             };

             // Zorunlu alan kontrolü
             if (!yeniDetay.receteId || !yeniDetay.hammaddeId || !yeniDetay.miktar || !yeniDetay.birimKisaAd) {
                 toastr.warning('Hammadde, Miktar ve Birim boş bırakılamaz.');
                 return;
             }
             if (yeniDetay.miktar <= 0) {
                  toastr.warning('Miktar sıfırdan büyük olmalıdır.');
                 return;
             }


            try {
                 // Yeni reçete detayını (hammadde) Ana Süreç'e gönder
                const eklenenDetayId = await window.electronAPI.addReceteDetay(yeniDetay); // TODO: addReceteDetay handler'ı eklenecek
                console.log('Reçete Detayı başarıyla eklendi, ID:', eklenenDetayId);
                toastr.success('Hammadde reçeteye eklendi!');

                // Formu temizle
                receteDetayEkleForm.reset();
                selectedReceteIdInput.value = receteId; // Gizli inputu tekrar ayarla (form resetlenince temizlenebilir)

                // Reçete Detayları listesini yenile
                 await fetchAndDisplayReceteDetails(receteId); // Seçili reçetenin detaylarını yeniden çek ve göster

            } catch (error) {
                 console.error('Genel Hata Yakalandı (Reçete Detay Ekle):', error);
                 let displayMessage = 'Reçete Detayı eklenirken beklenmeyen bir hata oluştu.';
                  // TODO: Yabancı anahtar hatalarını yakala (receteId, hammaddeId, birimKisaAd bulunamadığında)
                 toastr.error(displayMessage + ': ' + error.message); // Hata mesajını da göster

            }
        });
    } else {
         console.error("Hammadde ekleme formu (receteDetayEkleForm) bulunamadı.");
    }


    // Reçete listesini Ana Süreç'ten çekip gösteren yardımcı fonksiyon
    async function fetchAndDisplayReceteler() {
        try {
            const receler = await window.electronAPI.getReceteler(); // TODO: getReceteler handler'ı eklenecek
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
            // Seçilen reçetenin detaylarını çek (JOIN ile Hammadde Adı ve Birim Bilgisi gelecek)
            const detaylar = await window.electronAPI.getReceteDetaylari(receteId); // TODO: getReceteDetaylari handler'ı eklenecek
            console.log(`Ana Süreçten gelen reçete detayları (ID: ${receteId}):`, detaylar);
            displayReceteDetaylari(detaylar);

            // Detaylar kartını görünür yap
             receteDetaylariCard.style.display = 'block';

             // Gizli inputa reçete ID'sini kaydet
             selectedReceteIdInput.value = receteId;

             // Reçete detayları kartının başlığını güncelle (Seçilen reçetenin adı)
             // Bunun için reçete listesini çekmiş olmamız lazım veya reçete adını da döndüren bir handler lazım.
             // Şimdilik basit tutalım, sadece "Seçilen Reçete Detayları" kalsın veya sonra reçete adını bulup güncelleyelim.
             // Daha iyisi: Reçete listesini çekerken Porsiyon Adı ve Reçete Adını birleştirip gösteriyorduk.
             // handleViewReceteDetails fonksiyonuna reçete objesini de geçirelim.
             // Veya getRecetelerhandler'ını tek reçete getirecek şekilde genişletelim.
             // Şimdilik başlığı sabit bırakalım.

        } catch (error) {
            console.error(`Reçete detayları (ID: ${receteId}) alırken hata oluştu:`, error);
            toastr.error('Reçete detayları yüklenirken bir hata oluştu.');
        }
    }

    // "Detayları Görüntüle" butonuna tıklama handler'ı
    async function handleViewReceteDetails(event) {
        const receteId = event.target.dataset.id;
         console.log(`"Detayları Görüntüle" butonuna tıklandı, Reçete ID: ${receteId}`);

         // Seçilen reçetenin detaylarını çek ve göster
         await fetchAndDisplayReceteDetails(receteId);
         currentReceteId = receteId; // Şu anki reçete ID'sini kaydet

         // TODO: Reçete detayları kartına scroll yapma efekti eklenebilir
    }

     // Reçete Detayları tablosundaki "Sil" butonuna tıklama handler'ı
     async function handleDeleteReceteDetay(event) {
        const detayId = event.target.dataset.id;
         console.log(`"Reçete Detay Sil" butonuna tıklandı, Detay ID: ${detayId}`);

         const confirmation = confirm(`Bu reçete detayını silmek istediğinizden emin misiniz? (ID: ${detayId})`);
         // TODO: Modal ile daha şık bir onay kutusu

         if (confirmation) {
              try {
                // Ana Süreç'e reçete detay silme isteği gönder
                const success = await window.electronAPI.deleteReceteDetay(detayId); // TODO: deleteReceteDetay handler'ı eklenecek

                if (success) {
                    console.log(`Reçete Detayı başarıyla silindi, ID: ${detayId}`);
                    toastr.success('Hammadde reçeteden silindi!');

                    // Reçete Detayları listesini yenile
                    if (currentReceteId) {
                        await fetchAndDisplayReceteDetails(currentReceteId); // Şu anki reçetenin detaylarını yenile
                    } else {
                         console.error("Silme sonrası reçete detayları yenilenemedi: currentReceteId boş.");
                    }

                } else {
                    // Başarısız olursa
                    console.warn(`Reçete Detay silme başarısız veya detay bulunamadı, ID: ${detayId}`);
                    toastr.warning('Reçete detayı silme başarısız veya detay bulunamadı.');
                }

             } catch (error) {
                 console.error('Genel Hata Yakalandı (Reçete Detay Sil):', error);
                  // TODO: Veritabanı kısıtlaması hatalarını yakala
                 toastr.error('Reçete detayı silinirken bir hata oluştu: ' + error.message);
             }
         } else {
              console.log('Reçete detay silme işlemi kullanıcı tarafından iptal edildi.');
              toastr.info('Reçete detay silme işlemi iptal edildi.');
         }

     }


    // --- Sayfa Yüklendiğinde Çalışacaklar (loadRecetelerPage çağrıldığında) ---

    // Dropdownları doldur
    await populateRecetePorsiyonDropdown(); // Yeni reçete formu için
    await populateReceteDetayDropdowns(); // Hammadde ekleme formu için

    // Reçete listesini çek ve göster
    await fetchAndDisplayReceteler();

    // Başlangıçta reçete detayları kartını gizle (HTML'de display: none yaptık, emin olalım)
    receteDetaylariCard.style.display = 'none';


} // loadRecetelerPage fonksiyonunun sonu