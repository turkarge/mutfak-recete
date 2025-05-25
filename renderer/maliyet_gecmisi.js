// renderer/maliyet_gecmisi.js

// DOM Elementleri
let filtreForm, filtreReceteIdSelect, filtreBaslangicTarihiInput, filtreBitisTarihiInput;
let maliyetGecmisiTableBody, raporKayitSayisiSpan;

// Sayfa yüklendiğinde çalışacak ana fonksiyon
export async function loadMaliyetGecmisiPage() {
    console.log('Maliyet Geçmişi Raporu sayfası JavaScript\'i yükleniyor...');

    // DOM Elementlerini Seçme
    filtreForm = document.querySelector('#maliyetGecmisiFiltreForm');
    filtreReceteIdSelect = document.querySelector('#filtreReceteId');
    filtreBaslangicTarihiInput = document.querySelector('#filtreBaslangicTarihi');
    filtreBitisTarihiInput = document.querySelector('#filtreBitisTarihi');
    maliyetGecmisiTableBody = document.querySelector('#maliyetGecmisiTable tbody');
    raporKayitSayisiSpan = document.querySelector('#raporKayitSayisi');

    // Reçete Dropdown'ını Doldurma
    async function populateReceteDropdown() {
        try {
            if (filtreReceteIdSelect) {
                const receteler = await window.electronAPI.getReceteler(); // Bu handler zaten var
                filtreReceteIdSelect.innerHTML = '<option value="">-- Tüm Reçeteler --</option>';
                receteler.forEach(recete => {
                    const option = document.createElement('option');
                    option.value = recete.id;
                    option.textContent = `${recete.sonUrunAdi} - ${recete.porsiyonAdi} (${recete.receteAdi || 'Varsayılan'})`;
                    filtreReceteIdSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Maliyet Geçmişi için Reçete dropdown doldurulurken hata:', error);
            toastr.error('Reçete listesi yüklenirken bir hata oluştu.');
        }
    }

    // Tarihi DD.MM.YYYY formatına çeviren yardımcı fonksiyon
    function formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const dateObj = new Date(dateString);
            const day = dateObj.getDate().toString().padStart(2, '0');
            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // Aylar 0'dan başlar
            const year = dateObj.getFullYear();
            return `${day}.${month}.${year}`;
        } catch (e) {
            return dateString;
        }
    }

    // Maliyet Geçmişini Tabloya Ekleme
    function displayMaliyetGecmisi(loglar) {
        if (!maliyetGecmisiTableBody) return;
        maliyetGecmisiTableBody.innerHTML = '';

        if (loglar && loglar.length > 0) {
            loglar.forEach(log => {
                const row = maliyetGecmisiTableBody.insertRow();
                row.insertCell(0).textContent = formatDate(log.hesaplamaTarihi);
                row.insertCell(1).textContent = `${log.sonUrunAdi} - ${log.porsiyonAdi}`;
                row.insertCell(2).textContent = log.receteAdi || 'Varsayılan';
                const maliyetCell = row.insertCell(3);
                maliyetCell.textContent = log.hesaplananMaliyet.toFixed(2);
                maliyetCell.classList.add('text-end');
            });
            if(raporKayitSayisiSpan) raporKayitSayisiSpan.textContent = `${loglar.length} kayıt bulundu.`;
        } else {
            const row = maliyetGecmisiTableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 4;
            cell.textContent = 'Belirtilen kriterlere uygun maliyet kaydı bulunamadı.';
            cell.style.textAlign = 'center';
            if(raporKayitSayisiSpan) raporKayitSayisiSpan.textContent = "0 kayıt bulundu.";
        }
    }

    // Filtre Formu Submit Olayı
    if (filtreForm) {
        filtreForm.onsubmit = async (event) => {
            event.preventDefault();
            const filtreler = {
                receteId: filtreReceteIdSelect.value ? parseInt(filtreReceteIdSelect.value) : null,
                baslangicTarihi: filtreBaslangicTarihiInput.value || null,
                bitisTarihi: filtreBitisTarihiInput.value || null,
            };

            // Bitiş tarihine saat 23:59:59 ekleyerek o günün tamamını dahil et
            if (filtreler.bitisTarihi) {
                filtreler.bitisTarihi = `${filtreler.bitisTarihi}T23:59:59.999Z`;
            }


            console.log("Maliyet geçmişi filtreleri:", filtreler);
            maliyetGecmisiTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Rapor yükleniyor...</td></tr>';
            if(raporKayitSayisiSpan) raporKayitSayisiSpan.textContent = "";


            try {
                const loglar = await window.electronAPI.getMaliyetGecmisi(filtreler);
                displayMaliyetGecmisi(loglar);
            } catch (error) {
                console.error("Maliyet geçmişi getirilirken hata:", error);
                toastr.error("Rapor oluşturulurken bir hata oluştu.");
                 maliyetGecmisiTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Rapor yüklenirken hata oluştu.</td></tr>';
            }
        };
    }

    // --- Sayfa Yüklendiğinde Çalışacaklar ---
    await populateReceteDropdown();
    // Başlangıçta boş bir rapor göster veya tümünü listele (şimdilik boş)
    displayMaliyetGecmisi([]);
    if(raporKayitSayisiSpan) raporKayitSayisiSpan.textContent = "Filtreleme yapınız.";
}