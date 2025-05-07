// renderer/urunler.js
// Bu dosya, Ürünler sayfası (views/urunler.html) ile ilgili JavaScript kodlarını içerir.

// Bu fonksiyon, urunler.html içeriği ana sayfaya yüklendiğinde çağrılacak.
// Bu fonksiyon içinde urunler.html'deki DOM elementlerine erişebiliriz.
export async function loadUrunlerPage() {
    console.log('Ürünler sayfası JavaScript\'i yükleniyor...');

    // !!! DİKKAT: Buradaki kodlar, urunler.html yüklendikten sonra çalışacaktır.
    // DOM elementlerine (form, tablo vb.) bu fonksiyon içinden erişin.

    // Ürünleri tabloya ekleyen fonksiyon (displayUrunler)
    function displayUrunler(urunler) {
        const tableBody = document.querySelector('#urunlerTable tbody'); // Tablonun tbody elementini seç

        // Tablonun mevcut içeriğini tamamen temizle
        tableBody.innerHTML = '';

        if (urunler && urunler.length > 0) {
            urunler.forEach(urun => {
                const row = tableBody.insertRow(); // Yeni bir satır oluştur

                // Her satıra 3 hücre (sütun) ekle: ID, Ad, Tür
                const idCell = row.insertCell(0);
                const adCell = row.insertCell(1);
                const turCell = row.insertCell(2);

                // Hücrelere verileri yaz
                idCell.textContent = urun.id;
                adCell.textContent = urun.ad;
                turCell.textContent = urun.tur;

                // Eylemler hücresi oluştur
                const actionsCell = row.insertCell(3);

                // Düzenle butonu oluştur
                const editButton = document.createElement('button');
                editButton.textContent = 'Düzenle';
                editButton.classList.add('btn', 'btn-sm', 'btn-primary', 'me-2'); // Tabler buton sınıfları
                editButton.dataset.id = urun.id; // Butona ürün ID'sini ekle (hangi ürünü düzenleyeceğimizi bilmek için)
                editButton.addEventListener('click', handleEditUrun); // Tıklama olayını dinle (handleEditUrun fonksiyonu henüz yok)

                // Sil butonu oluştur
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Sil';
                deleteButton.classList.add('btn', 'btn-sm', 'btn-danger'); // Tabler buton sınıfları
                deleteButton.dataset.id = urun.id; // Butona ürün ID'sini ekle (hangi ürünü sileceğimizi bilmek için)
                deleteButton.addEventListener('click', handleDeleteUrun); // Tıklama olayını dinle (handleDeleteUrun fonksiyonu henüz yok)


                // Butonları hücreye ekle
                actionsCell.appendChild(editButton);
                actionsCell.appendChild(deleteButton);
            });

        } else {
            // Eğer ürün yoksa bilgilendirici bir mesaj göster
            const row = tableBody.insertRow();
            const cell = row.insertCell(0);
            // Index.html'deki tablo başlık sayısı kadar colSpan (ID, Ad, Tür = 3 sütun)
            cell.colSpan = 4;
            cell.textContent = 'Henüz kayıtlı ürün bulunamadı.';
            cell.style.textAlign = 'center';
        }
    }

    // Formu seç ve submit olayını dinle
    const urunEkleForm = document.querySelector('#urunEkleForm');

    // Formun sayfada var olup olmadığını kontrol et (önemli!)
    if (urunEkleForm) {
        urunEkleForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Formun normal submit davranışını engelle

            // Form alanlarından değerleri al
            const urunAdiInput = document.querySelector('#urunAdi');
            const urunTuruSelect = document.querySelector('#urunTuru');

            const urun = {
                ad: urunAdiInput.value.trim(), // Boşlukları temizle
                tur: urunTuruSelect.value
            };

            // Alanların boş olup olmadığını kontrol et
            if (!urun.ad || !urun.tur) {
                toastr.warning('Ürün Adı ve Türü boş bırakılamaz.');
                return;
            }

            try {
                const eklenenUrunId = await window.electronAPI.addUrun(urun);
                console.log('Ürün başarıyla eklendi, ID:', eklenenUrunId);
                toastr.success(`"${urun.ad}" başarıyla eklendi!`); // Başarı bildirimi

                // Formu temizle
                urunAdiInput.value = '';
                urunTuruSelect.value = '';
                urunTuruSelect.selectedIndex = 0;

                // Ürün listesini yenile
                const guncelUrunler = await window.electronAPI.getUrunler();
                displayUrunler(guncelUrunler);

            } catch (error) {
                console.error('Genel Hata Yakalandı (Ürün Ekle):', error);
                console.log('Hata mesajı:', error.message);

                let displayMessage = 'Ürün eklenirken beklenmeyen bir hata oluştu.';
                let toastrType = 'error';

                if (error.message && error.message.includes('UNIQUE constraint failed')) {
                    console.warn('Benzersizlik kısıtlaması hatası yakalandı.');
                    displayMessage = `"${urun.ad}" adında bir ürün zaten mevcut.`;
                    toastrType = 'warning';
                } else {
                    displayMessage = 'Ürün eklenirken bir hata oluştu: ' + error.message;
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
        console.error("Ürün ekleme formu (urunEkleForm) bulunamadı. urunler.html yüklü mü?");
    }


    // Sayfa yüklendiğinde ürünleri çek ve göster (loadUrunlerPage çağrıldığında)
    try {
        const urunler = await window.electronAPI.getUrunler();
        console.log('Ana Süreçten gelen ürünler:', urunler);
        displayUrunler(urunler);
    } catch (error) {
        console.error('Ürünleri alırken hata oluştu:', error);
        toastr.error('Ürün listesi yüklenirken hata oluştu.');
    }
} // loadUrunlerPage fonksiyonunun sonu