// renderer/detayli_maliyet.js

// DOM Elementleri
let filtreForm, filtreSonUrunIdSelect, filtrePorsiyonIdSelect, filtreReceteIdRaporSelect;
let filtreRaporBaslangicTarihiInput, filtreRaporBitisTarihiInput;
let detayliMaliyetSonucKarti, raporBasligiEkiSpan, detayliMaliyetTableBody, detayliRaporKayitSayisiSpan;

// Tarihi DD.MM.YYYY formatına çeviren yardımcı fonksiyon
function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const dateObj = new Date(dateString);
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}.${month}.${year} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
    } catch (e) {
        return dateString;
    }
}

// Sayfa yüklendiğinde çalışacak ana fonksiyon
export async function loadDetayliMaliyetPage() {
    console.log('Detaylı Maliyet Raporu sayfası JavaScript\'i yükleniyor...');

    // DOM Elementlerini Seçme
    filtreForm = document.querySelector('#detayliMaliyetFiltreForm');
    filtreSonUrunIdSelect = document.querySelector('#filtreSonUrunId');
    filtrePorsiyonIdSelect = document.querySelector('#filtrePorsiyonId');
    filtreReceteIdRaporSelect = document.querySelector('#filtreReceteIdRapor');
    filtreRaporBaslangicTarihiInput = document.querySelector('#filtreRaporBaslangicTarihi');
    filtreRaporBitisTarihiInput = document.querySelector('#filtreRaporBitisTarihi');

    detayliMaliyetSonucKarti = document.querySelector('#detayliMaliyetSonucKarti');
    raporBasligiEkiSpan = document.querySelector('#raporBasligiEki');
    detayliMaliyetTableBody = document.querySelector('#detayliMaliyetTable tbody');
    detayliRaporKayitSayisiSpan = document.querySelector('#detayliRaporKayitSayisi');

    // Son Ürünler Dropdown'ını Doldurma
    async function populateSonUrunDropdown() {
        console.log("[populateSonUrunDropdown] Fonksiyon başlatıldı."); // LOG
        try {
            if (filtreSonUrunIdSelect) {
                console.log("[populateSonUrunDropdown] filtreSonUrunIdSelect elementi bulundu."); // LOG
                const sonUrunler = await window.electronAPI.getUrunlerByTur('Son Ürün');
                console.log("[populateSonUrunDropdown] Çekilen Son Ürünler:", sonUrunler); // LOG
                
                filtreSonUrunIdSelect.innerHTML = '<option value="">-- Son Ürün Seçiniz --</option>';
                
                if (sonUrunler && sonUrunler.length > 0) {
                    console.log(`[populateSonUrunDropdown] ${sonUrunler.length} adet son ürün bulundu, dropdown'a ekleniyor.`); // LOG
                    sonUrunler.forEach(urun => {
                        const option = document.createElement('option');
                        option.value = urun.id;
                        option.textContent = urun.ad;
                        filtreSonUrunIdSelect.appendChild(option);
                    });
                    console.log("[populateSonUrunDropdown] Son ürünler dropdown'a eklendi."); // LOG
                } else {
                    console.warn("[populateSonUrunDropdown] Veritabanında 'Son Ürün' tipinde ürün bulunamadı veya veri gelmedi."); // LOG
                }
            } else {
                console.error("[populateSonUrunDropdown] filtreSonUrunIdSelect elementi bulunamadı!"); // LOG
            }
        } catch (error) {
            console.error('[populateSonUrunDropdown] Son Ürün dropdown doldurulurken hata:', error);
            toastr.error('Son Ürün listesi yüklenirken bir hata oluştu.');
        }
    }

    // Porsiyonlar Dropdown'ını Doldurma (Son Ürün seçimine göre)
    async function populatePorsiyonDropdown(sonUrunId) {
        console.log(`[populatePorsiyonDropdown] Fonksiyon başlatıldı, sonUrunId: ${sonUrunId}`); // LOG
        if (!filtrePorsiyonIdSelect) {
            console.error("[populatePorsiyonDropdown] filtrePorsiyonIdSelect elementi bulunamadı!"); // LOG
            return;
        }
        filtrePorsiyonIdSelect.innerHTML = '<option value="">Yükleniyor...</option>';
        filtrePorsiyonIdSelect.disabled = true;
        if (filtreReceteIdRaporSelect) { // Reçete dropdown'ını da sıfırla
            filtreReceteIdRaporSelect.innerHTML = '<option value="">-- Önce Porsiyon Seçiniz --</option>';
            filtreReceteIdRaporSelect.disabled = true;
        }

        if (!sonUrunId) {
            filtrePorsiyonIdSelect.innerHTML = '<option value="">-- Önce Son Ürün Seçiniz --</option>';
            console.log("[populatePorsiyonDropdown] sonUrunId boş, porsiyon dropdown sıfırlandı."); // LOG
            return;
        }
        try {
            const porsiyonlar = await window.electronAPI.getPorsiyonlarByUrunId(parseInt(sonUrunId)); // ID integer olmalı
            console.log(`[populatePorsiyonDropdown] Ürün ID ${sonUrunId} için çekilen porsiyonlar:`, porsiyonlar); // LOG
            filtrePorsiyonIdSelect.innerHTML = '<option value="">-- Porsiyon Seçiniz --</option>';
            if (porsiyonlar && porsiyonlar.length > 0) { // EKLENDİ: Veri var mı kontrolü
                porsiyonlar.forEach(porsiyon => {
                    const option = document.createElement('option');
                    option.value = porsiyon.id;
                    option.textContent = porsiyon.porsiyonAdi;
                    filtrePorsiyonIdSelect.appendChild(option);
                });
            } else {
                 console.warn(`[populatePorsiyonDropdown] Ürün ID ${sonUrunId} için porsiyon bulunamadı.`);
            }
            filtrePorsiyonIdSelect.disabled = false;
        } catch (error) {
            console.error(`[populatePorsiyonDropdown] Porsiyonlar (Ürün ID: ${sonUrunId}) dropdown doldurulurken hata:`, error);
            toastr.error('Porsiyon listesi yüklenirken bir hata oluştu.');
            filtrePorsiyonIdSelect.innerHTML = '<option value="">Hata oluştu</option>';
        }
    }

    // Reçeteler Dropdown'ını Doldurma (Porsiyon seçimine göre)
    async function populateReceteDropdown(porsiyonId) {
        console.log(`[populateReceteDropdown] Fonksiyon başlatıldı, porsiyonId: ${porsiyonId}`); // LOG
        if (!filtreReceteIdRaporSelect) {
            console.error("[populateReceteDropdown] filtreReceteIdRaporSelect elementi bulunamadı!"); // LOG
            return;
        }
        filtreReceteIdRaporSelect.innerHTML = '<option value="">Yükleniyor...</option>';
        filtreReceteIdRaporSelect.disabled = true;

        if (!porsiyonId) {
            filtreReceteIdRaporSelect.innerHTML = '<option value="">-- Önce Porsiyon Seçiniz --</option>';
             console.log("[populateReceteDropdown] porsiyonId boş, reçete dropdown sıfırlandı."); // LOG
            return;
        }
        try {
            const receteler = await window.electronAPI.getRecetelerByPorsiyonId(parseInt(porsiyonId)); // ID integer olmalı
            console.log(`[populateReceteDropdown] Porsiyon ID ${porsiyonId} için çekilen reçeteler:`, receteler); // LOG
            filtreReceteIdRaporSelect.innerHTML = '<option value="">-- Tüm Reçeteler (Bu Porsiyon İçin) --</option>';
            if (receteler && receteler.length > 0) { // EKLENDİ: Veri var mı kontrolü
                receteler.forEach(recete => {
                    const option = document.createElement('option');
                    option.value = recete.id;
                    option.textContent = recete.receteAdi || 'Varsayılan';
                    filtreReceteIdRaporSelect.appendChild(option);
                });
            } else {
                console.warn(`[populateReceteDropdown] Porsiyon ID ${porsiyonId} için reçete bulunamadı.`);
            }
            filtreReceteIdRaporSelect.disabled = false;
        } catch (error) {
            console.error(`[populateReceteDropdown] Reçeteler (Porsiyon ID: ${porsiyonId}) dropdown doldurulurken hata:`, error);
            toastr.error('Reçete listesi yüklenirken bir hata oluştu.');
            filtreReceteIdRaporSelect.innerHTML = '<option value="">Hata oluştu</option>';
        }
    }

    // Olay Dinleyicileri
    if (filtreSonUrunIdSelect) {
        filtreSonUrunIdSelect.addEventListener('change', (event) => {
            populatePorsiyonDropdown(event.target.value);
        });
    }
    if (filtrePorsiyonIdSelect) {
        filtrePorsiyonIdSelect.addEventListener('change', (event) => {
            populateReceteDropdown(event.target.value);
        });
    }

    // Maliyet Geçmişini Tabloya Ekleme Fonksiyonu
    function displayDetayliMaliyetGecmisi(loglar, secilenFiltreText) {
        if (!detayliMaliyetTableBody || !detayliMaliyetSonucKarti) return;
        detayliMaliyetTableBody.innerHTML = '';

        if (raporBasligiEkiSpan && secilenFiltreText) {
            raporBasligiEkiSpan.textContent = secilenFiltreText;
        } else if (raporBasligiEkiSpan) {
            raporBasligiEkiSpan.textContent = "Tüm Kayıtlar"; // Veya uygun bir başlık
        }

        if (loglar && loglar.length > 0) {
            loglar.forEach(log => {
                const row = detayliMaliyetTableBody.insertRow();
                row.insertCell(0).textContent = formatDate(log.hesaplamaTarihi);
                // HTML'de sadece 2 sütun var: Tarih ve Maliyet. Porsiyon/Reçete adı için sütun eklenirse burası güncellenmeli.
                // Şimdilik log objesinden porsiyon/reçete adını kullanmayacağız tabloda.
                // İstersen tabloya Porsiyon ve Reçete Adı sütunlarını ekleyebiliriz,
                // getMaliyetGecmisi handler'ı bu bilgileri zaten döndürüyor.
                const maliyetCell = row.insertCell(1);
                maliyetCell.textContent = log.hesaplananMaliyet.toFixed(2);
                maliyetCell.classList.add('text-end');
            });
            if(detayliRaporKayitSayisiSpan) detayliRaporKayitSayisiSpan.textContent = `${loglar.length} kayıt bulundu.`;
            detayliMaliyetSonucKarti.style.display = 'block';
        } else {
            const row = detayliMaliyetTableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 2; // HTML'deki sütun sayısına göre
            cell.textContent = 'Belirtilen kriterlere uygun maliyet kaydı bulunamadı.';
            cell.style.textAlign = 'center';
            if(detayliRaporKayitSayisiSpan) detayliRaporKayitSayisiSpan.textContent = "0 kayıt bulundu.";
            detayliMaliyetSonucKarti.style.display = 'block';
        }
    }

    // Filtre Formu Submit Olayı
    if (filtreForm) {
        filtreForm.onsubmit = async (event) => {
            event.preventDefault();
            const receteIdValue = filtreReceteIdRaporSelect.value;
            const porsiyonIdValue = filtrePorsiyonIdSelect.value;
            // const sonUrunIdValue = filtreSonUrunIdSelect.value; // Bu bilgiye de sahibiz

            // Öncelik: Reçete ID'si varsa onu kullan, yoksa Porsiyon ID'si, o da yoksa Son Ürün ID'si
            // Ancak getMaliyetGecmisi şu an sadece receteId alıyor.
            // Bu mantığı daha sonra geliştirebiliriz veya getMaliyetGecmisi'ni güncelleyebiliriz.
            // Şimdilik sadece seçilen receteId'yi gönderiyoruz.
            // Eğer receteId seçilmemişse (yani "Tüm Reçeteler" veya "Porsiyon Seçiniz" durumları),
            // IPC handler tüm reçeteleri getirecek şekilde ayarlanmıştı (WHERE koşulu eklenmeyerek).
            const filtreler = {
                receteId: receteIdValue ? parseInt(receteIdValue) : null,
                baslangicTarihi: filtreRaporBaslangicTarihiInput.value || null,
                bitisTarihi: filtreRaporBitisTarihiInput.value || null,
            };

            if (filtreler.bitisTarihi) {
                filtreler.bitisTarihi = `${filtreler.bitisTarihi}T23:59:59.999Z`;
            }

            console.log("Maliyet geçmişi filtreleri:", filtreler);
            detayliMaliyetTableBody.innerHTML = '<tr><td colspan="2" class="text-center">Rapor yükleniyor...</td></tr>';
            if(detayliRaporKayitSayisiSpan) detayliRaporKayitSayisiSpan.textContent = "";
            if(raporBasligiEkiSpan) raporBasligiEkiSpan.textContent = "";

            try {
                const loglar = await window.electronAPI.getMaliyetGecmisi(filtreler);
                console.log("Filtrelenmiş Maliyet Logları:", loglar); // LOG

                let raporBaslikEkiMetni = "Filtrelenen Kayıtlar"; // Varsayılan başlık
                if(filtreReceteIdRaporSelect.value && filtreReceteIdRaporSelect.options.length > 0 && filtreReceteIdRaporSelect.selectedIndex > 0) {
                    raporBaslikEkiMetni = filtreReceteIdRaporSelect.options[filtreReceteIdRaporSelect.selectedIndex].text;
                    if(filtrePorsiyonIdSelect.value && filtrePorsiyonIdSelect.options.length > 0 && filtrePorsiyonIdSelect.selectedIndex > 0) {
                         raporBaslikEkiMetni = filtrePorsiyonIdSelect.options[filtrePorsiyonIdSelect.selectedIndex].text + " - " + raporBaslikEkiMetni;
                         if(filtreSonUrunIdSelect.value && filtreSonUrunIdSelect.options.length > 0 && filtreSonUrunIdSelect.selectedIndex > 0){
                            raporBaslikEkiMetni = filtreSonUrunIdSelect.options[filtreSonUrunIdSelect.selectedIndex].text + " - " + raporBaslikEkiMetni;
                         }
                    }
                } else if (filtrePorsiyonIdSelect.value && filtrePorsiyonIdSelect.options.length > 0 && filtrePorsiyonIdSelect.selectedIndex > 0) {
                    raporBaslikEkiMetni = filtrePorsiyonIdSelect.options[filtrePorsiyonIdSelect.selectedIndex].text + " (Tüm Reçeteleri)";
                     if(filtreSonUrunIdSelect.value && filtreSonUrunIdSelect.options.length > 0 && filtreSonUrunIdSelect.selectedIndex > 0){
                        raporBaslikEkiMetni = filtreSonUrunIdSelect.options[filtreSonUrunIdSelect.selectedIndex].text + " - " + raporBaslikEkiMetni;
                     }
                } else if (filtreSonUrunIdSelect.value && filtreSonUrunIdSelect.options.length > 0 && filtreSonUrunIdSelect.selectedIndex > 0) {
                    raporBaslikEkiMetni = filtreSonUrunIdSelect.options[filtreSonUrunIdSelect.selectedIndex].text + " (Tüm Porsiyon ve Reçeteleri)";
                }

                displayDetayliMaliyetGecmisi(loglar, raporBaslikEkiMetni);
            } catch (error) {
                console.error("Maliyet geçmişi getirilirken hata:", error);
                toastr.error("Rapor oluşturulurken bir hata oluştu.");
                detayliMaliyetTableBody.innerHTML = '<tr><td colspan="2" class="text-center text-danger">Rapor yüklenirken hata oluştu.</td></tr>';
            }
        };
    }

    // --- Sayfa Yüklendiğinde Çalışacaklar ---
    console.log("[loadDetayliMaliyetPage] Sayfa yükleme işlemleri başlıyor...");
    await populateSonUrunDropdown();
    console.log("[loadDetayliMaliyetPage] Son Ürün dropdown dolduruldu.");
    // Başlangıçta Porsiyon ve Reçete dropdown'ları boş ve disabled kalsın.
    if (filtrePorsiyonIdSelect) {
        filtrePorsiyonIdSelect.innerHTML = '<option value="">-- Önce Son Ürün Seçiniz --</option>';
        filtrePorsiyonIdSelect.disabled = true;
    }
    if (filtreReceteIdRaporSelect) {
        filtreReceteIdRaporSelect.innerHTML = '<option value="">-- Önce Porsiyon Seçiniz --</option>';
        filtreReceteIdRaporSelect.disabled = true;
    }

    if(detayliMaliyetSonucKarti) detayliMaliyetSonucKarti.style.display = 'none';
    if(raporBasligiEkiSpan) raporBasligiEkiSpan.textContent = "";
    if(detayliRaporKayitSayisiSpan) detayliRaporKayitSayisiSpan.textContent = "Filtreleme yapınız.";
    console.log("[loadDetayliMaliyetPage] Sayfa yükleme işlemleri tamamlandı.");
}