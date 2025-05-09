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
                // Porsiyon Adını göstermek için recete objesinde 'porsiyonAdi' ve 'sonUrunAdi' olmalı (JOIN ile geliyor)
                row.insertCell(1).textContent = `${recete.sonUrunAdi} - ${recete.porsiyonAdi}` || 'Porsiyon Bilgisi Eksik';
                row.insertCell(2).textContent = recete.receteAdi || 'Varsayılan'; // Reçete Adı yoksa 'Varsayılan' göster

                // Eylemler hücresi (Detayları Görüntüle butonu)
                const actionsCell = row.insertCell(3);
                const viewDetailsButton = document.createElement('button');
                viewDetailsButton.textContent = 'Detayları Görüntüle';
                viewDetailsButton.classList.add('btn', 'btn-sm', 'btn-info'); // Bilgi butonu
                viewDetailsButton.dataset.id = recete.id; // Butona reçete ID'sini ekle

                // Tıklama olayına handleViewReceteDetails'ı çağırırken recete objesini de gönder
                // Arrow function kullanıyoruz çünkü bu fonksiyonun kendi 'this' bağlamına ihtiyacı yok.
                viewDetailsButton.addEventListener('click', () => handleViewReceteDetails(recete.id, recete));

                // Sil butonu oluştur
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Sil';
                deleteButton.classList.add('btn', 'btn-sm', 'btn-danger'); // Kırmızı buton
                deleteButton.dataset.id = recete.id; // Butona reçete ID'sini ekle

                // Tıklama olayına handleDeleteRecete'yi çağırırken recete.id ve recete objesini gönder
                deleteButton.addEventListener('click', () => handleDeleteRecete(recete.id, recete));


                // Butonları hücreye ekle
                actionsCell.appendChild(viewDetailsButton);
                actionsCell.appendChild(deleteButton);

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
                // Hammadde Adını göstermek için detay objesinde 'hammaddeAdi' olmalı (JOIN ile geliyor)
                row.insertCell(1).textContent = detay.hammaddeAdi || 'Hammadde Bilgisi Eksik';
                row.insertCell(2).textContent = detay.miktar;
                // Birim Kısa Adını göstermek için detay objesinde 'birimKisaAd' olmalı (JOIN ile geliyor)
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
                // Tıklama olayına handleDeleteReceteDetay'ı çağırırken detay.id'yi gönder
                // Arrow function kullanıyoruz çünkü bu fonksiyonun kendi 'this' bağlamına ihtiyacı yok.
                deleteButton.addEventListener('click', () => handleDeleteReceteDetay(detay.id));

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

    // Reçete Silme işlemini yönetecek fonksiyon
    async function handleDeleteRecete(receteId, recete) { // Recete objesini de alalım log için
        console.log(`"Reçete Sil" butonuna tıklandı, Reçete ID: ${receteId}`);
        console.log('Silinecek Reçete Obj:', recete);

        // Kullanıcıdan silme işlemini onaylamasını iste (Basit confirm kutusu)
        // TODO: Modal ile daha şık bir onay kutusu yapılabilir.
        const confirmation = confirm(`"${recete.sonUrunAdi} - ${recete.porsiyonAdi}" reçetesini silmek istediğinizden emin misiniz? (ID: ${receteId})`);

        if (confirmation) {
            try {
                // Ana Süreç'e silme isteği gönder
                const success = await window.electronAPI.deleteRecete(receteId); // TODO: deleteRecete handler'ı eklenecek

                if (success) {
                    console.log(`Reçete başarıyla silindi, ID: ${receteId}`);
                    toastr.success('Reçete başarıyla silindi!');

                    // Reçete listesini yenile
                    await fetchAndDisplayReceteler();

                    // Eğer silinen reçetenin detayları şu an gösteriliyorsa, detay kartını gizle
                    if (currentReceteId === receteId) {
                        receteDetaylariCard.style.display = 'none';
                        currentReceteId = null; // Şu anki reçete bilgisini temizle
                    }

                } else {
                    // Başarısız olursa (örneğin reçete bulunamazsa)
                    console.warn(`Reçete silme başarısız veya reçete bulunamadı, ID: ${receteId}`);
                    toastr.warning('Reçete silme başarısız veya reçete bulunamadı.');
                }

            } catch (error) {
                console.error('Genel Hata Yakalandı (Reçete Sil):', error);
                // TODO: Veritabanı kısıtlaması hatalarını yakala (örn: Bu reçetenin detayları varsa)
                if (error.message && error.message.includes('FOREIGN KEY constraint failed')) {
                    console.warn('Yabancı anahtar kısıtlaması hatası yakalandı (Reçete Sil).');
                    // Hata mesajında hangi tablonun kısıtlamayı tetiklediği görünebilir.
                    // Reçeteler tablosunun detayları receteDetaylari tablosunda tutulur.
                    toastr.error('Bu reçetenin detayları olduğu için silinemez. Önce detaylarını silin.');
                }
                else {
                    toastr.error('Reçete silinirken bir hata oluştu: ' + error.message);
                }
            }
        } else {
            console.log('Reçete silme işlemi kullanıcı tarafından iptal edildi.');
            toastr.info('Reçete silme işlemi iptal edildi.');
        }
    }

    // --- Olay Dinleyicileri ve İşlem Fonksiyonları Handler'ları ---
    // (Bu fonksiyonlar loadRecetelerPage scope'unda tanımlı olacak)


    // "Detayları Görüntüle" butonuna tıklama handler'ı
    // Bu fonksiyon, tıklanan butonun ait olduğu reçete objesini de almalı
    async function handleViewReceteDetails(receteId, recete) { // <-- recete objesini de parametre olarak alıyor
        console.log(`"Detayları Görüntüle" butonuna tıklandı, Reçete ID: ${receteId}`);
        console.log('Seçilen Reçete Obj:', recete); // Loglayalım

        // Seçilen reçetenin detaylarını çek ve göster
        await fetchAndDisplayReceteDetails(receteId);
        currentReceteId = receteId; // Şu anki reçete ID'sini kaydet

        // Reçete detayları kartının başlığını güncelle
        // Başlık formatı: "[Son Ürün Adı] - [Porsiyon Adı] Reçete Detayları (Reçete Adı)"
        if (receteDetaylariTitle && recete) {
            receteDetaylariTitle.textContent = `"${recete.sonUrunAdi} - ${recete.porsiyonAdi}" Reçete Detayları`;
            // İsteğe bağlı: Eğer reçete adı varsa onu da ekleyelim
            if (recete.receteAdi) {
                receteDetaylariTitle.textContent += ` ("${recete.receteAdi}")`;
            }
        } else {
            receteDetaylariTitle.textContent = 'Seçilen Reçete Detayları'; // Varsayılan başlık
        }


        // Detaylar kartını görünür yap
        receteDetaylariCard.style.display = 'block';

        // Gizli inputa reçete ID'sini kaydet
        selectedReceteIdInput.value = receteId;

        // TODO: Reçete detayları kartına scroll yapma efekti eklenebilir
    }


    // Reçete Detayları tablosundaki "Sil" butonuna tıklama handler'ı
    async function handleDeleteReceteDetay(detayId) {
        console.log(`"Reçete Detay Sil" butonuna tıklandı, Detay ID: ${detayId}`);

        // TODO: Modal ile daha şık bir onay kutusu (mevcut confirm yerine)
        const confirmation = confirm(`Bu reçete detayını silmek istediğinizden emin misiniz? (ID: ${detayId})`);


        if (confirmation) {
            try {
                // Ana Süreç'e reçete detay silme isteği gönder
                const success = await window.electronAPI.deleteReceteDetay(detayId); // deleteReceteDetay handler'ı mevcut

                if (success) {
                    console.log(`Reçete Detayı başarıyla silindi, ID: ${detayId}`);
                    toastr.success('Hammadde reçeteden silindi!');

                    // Reçete Detayları listesini yenile
                    if (currentReceteId) {
                        await fetchAndDisplayReceteDetails(currentReceteId); // Şu anki reçetenin detaylarını yenile
                    } else {
                        console.error("Silme sonrası reçete detayları yenilenemedi: currentReceteId boş.");
                        // Tüm reçeteleri yeniden çekip göstermek gibi bir fallback yapılabilir.
                        // await fetchAndDisplayReceteler(); // Tüm reçeteleri yenile
                    }

                } else {
                    // Başarısız olursa (örneğin detay bulunamazsa)
                    console.warn(`Reçete Detay silme başarısız veya detay bulunamadı, ID: ${detayId}`);
                    toastr.warning('Reçete detayı silme başarısız veya detay bulunamadı.');
                }

            } catch (error) {
                console.error('Genel Hata Yakalandı (Reçete Detay Sil):', error);
                // TODO: Veritabanı kısıtlaması hatalarını yakala (örn: Bu detay başka bir tabloda kullanılıyorsa - ki reçete detayı başka yerde kullanılmaz, bu hata muhtemelen receteId/hammaddeId/birimKisaAd yabancı anahtarlarıyla ilgilidir, ama silerken bu geçerli olmaz)
                let displayMessage = 'Reçete detayı silinirken bir hata oluştu.';
                toastr.error(displayMessage + ': ' + error.message); // Hata mesajını da göster
            }
        } else {
            // confirm iptal edilirse Toastr bilgi mesajı gösterelim
            console.log('Reçete detay silme işlemi kullanıcı tarafından iptal edildi.');
            toastr.info('Reçete detay silme işlemi iptal edildi.');
        }

    }


    // --- Async Veri Çekme ve Gösterme Yardımcı Fonksiyonları ---

    // Reçete listesini Ana Süreç'ten çekip gösteren yardımcı fonksiyon
    async function fetchAndDisplayReceteler() {
        try {
            const receler = await window.electronAPI.getReceteler(); // getReceteler handler'ı mevcut
            console.log('Ana Süreçten gelen reçeteler:', receler);
            displayReceteler(receler); // Tabloya göster
        } catch (error) {
            console.error('Reçeteleri alırken hata oluştu:', error);
            toastr.error('Reçete listesi yüklenirken hata oluştu.');
        }
    }

    // Seçilen Reçete Detaylarını Ana Süreç'ten çekip gösteren yardımcı fonksiyon
    async function fetchAndDisplayReceteDetails(receteId) {
        try {
            // Seçilen reçetenin detaylarını çek (JOIN ile Hammadde Adı ve Birim Bilgisi gelecek)
            const detaylar = await window.electronAPI.getReceteDetaylari(receteId); // getReceteDetaylari handler'ı mevcut
            console.log(`Ana Süreçten gelen reçete detayları (ID: ${receteId}):`, detaylar);
            displayReceteDetaylari(detaylar); // Detaylar tablosuna göster

        } catch (error) {
            console.error(`Reçete detayları (ID: ${receteId}) alırken hata oluştu:`, error);
            toastr.error('Reçete detayları yüklenirken bir hata oluştu.');
        }
    }


    // --- Form Submit Olay Dinleyicileri ---

    // Yeni Reçete Ekleme Formu Submit Olayı
    // Formun sayfada var olup olmadığını kontrol et (önemli!)
    if (receteEkleForm) {
        receteEkleForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const porsiyonId = recetePorsiyonSelect.value;
            const receteAdi = receteAdiInput.value.trim() || null; // Boşsa null kaydet

            const yeniRecete = {
                porsiyonId: parseInt(porsiyonId), // Sayı olarak kaydet
                receteAdi: receteAdi
            };

            // Zorunlu alan kontrolü
            if (!yeniRecete.porsiyonId) {
                toastr.warning('Porsiyon seçimi boş bırakılamaz.');
                return;
            }

            try {
                const eklenenReceteId = await window.electronAPI.addRecete(yeniRecete); // addRecete handler'ı mevcut
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
                toastr.error(displayMessage); // Toastr ile hata göster
            }
        });
    } else {
        console.error("Yeni reçete ekleme formu (receteEkleForm) bulunamadı.");
    }

    // Seçilen Reçete Detayları Formu Submit Olayı (Hammadde Ekleme)
    // Formun sayfada var olup olmadığını kontrol et (önemli!)
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
                const eklenenDetayId = await window.electronAPI.addReceteDetay(yeniDetay); // addReceteDetay handler'ı mevcut
                console.log('Reçete Detayı başarıyla eklendi, ID:', eklenenDetayId);
                toastr.success('Hammadde reçeteye eklendi!');

                // Formu temizle
                receteDetayEkleForm.reset();
                selectedReceteIdInput.value = receteId; // Gizli inputu tekrar ayarla (form resetlenince temizlenebilir)

                // Reçete Detayları listesini yenile
                if (currentReceteId) {
                    await fetchAndDisplayReceteDetails(currentReceteId); // Şu anki reçetenin detaylarını yeniden çek ve göster
                } else {
                    console.error("Silme sonrası reçete detayları yenilenemedi: currentReceteId boş.");
                    // Tüm reçeteleri yeniden çekip göstermek gibi bir fallback yapılabilir.
                    // await fetchAndDisplayReceteler(); // Tüm reçeteleri yenile
                }

            } catch (error) {
                console.error('Genel Hata Yakalandı (Reçete Detay Ekle):', error);
                let displayMessage = 'Reçete detayı eklenirken beklenmeyen bir hata oluştu.';
                // TODO: Yabancı anahtar hatalarını yakala (receteId, hammaddeId, birimKisaAd bulunamadığında)
                toastr.error(displayMessage + ': ' + error.message); // Hata mesajını da göster

            }
        });
    } else {
        console.error("Hammadde ekleme formu (receteDetayEkleForm) bulunamadı.");
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