// renderer/receler.js
export async function loadRecetelerPage() {
    console.log('Reçete Yönetimi sayfası JavaScript\'i yükleniyor...');

    // --- DOM Elementlerini Seçme ---
    const receteIdInput = document.querySelector('#receteIdInput');
    const recetePorsiyonSelect = document.querySelector('#recetePorsiyonId');
    const receteAdiInput = document.querySelector('#receteAdi');
    const receteEkleForm = document.querySelector('#receteEkleForm');
    const recelerTableBody = document.querySelector('#recelerTable tbody');
    const receteFormBaslik = document.querySelector('#receteFormBaslik');
    const receteFormSubmitButton = document.querySelector('#receteFormSubmitButton');
    const receteFormCancelButton = document.querySelector('#receteFormCancelButton');

    // HTML'deki ID değişikliklerine göre güncellendi
    const receteDetaylariAlani = document.querySelector('#receteDetaylariAlani');
    const receteDetaylariGenelBaslik = document.querySelector('#receteDetaylariGenelBaslik');

    const selectedReceteIdInput = document.querySelector('#selectedReceteId');
    const receteDetayIdInput = document.querySelector('#receteDetayIdInput'); // HTML'e eklenmişti

    const hammaddeSelect = document.querySelector('#hammaddeId');
    const miktarInput = document.querySelector('#miktar');
    const detayBirimSelect = document.querySelector('#detayBirimKisaAd');
    const receteDetayEkleForm = document.querySelector('#receteDetayEkleForm');
    const receteDetaylariTableBody = document.querySelector('#receteDetaylariTable tbody');
    const receteDetayFormBaslik = document.querySelector('#receteDetayFormBaslik');
    const receteDetaySubmitButton = document.querySelector('#receteDetaySubmitButton');
    const receteDetayFormCancelButton = document.querySelector('#receteDetayFormCancelButton');

    const confirmationModal = document.getElementById('confirmationModal');
    const confirmationModalBody = document.getElementById('confirmationModalBody');
    const confirmActionButton = document.getElementById('confirmActionButton');

    if (!confirmationModal || !confirmationModalBody || !confirmActionButton) {
        console.error("Onay modal elementleri bulunamadı.");
        toastr.error("Uygulama hatası: Onay modal elementleri eksik.");
        return;
    }
    if (typeof bootstrap === 'undefined' || typeof bootstrap.Modal === 'undefined') {
        console.error("Bootstrap Modal JS yüklenmedi.");
        toastr.error("Uygulama hatası: Bootstrap Modal yüklenemedi.");
        return;
    }

    let currentReceteId = null;
    let birimVerileri = {};
    function showConfirmationModal(message, actionButtonText = 'Tamam', actionButtonClass = 'btn-primary') {
        return new Promise((resolve) => {
            confirmationModalBody.textContent = message;
            confirmActionButton.textContent = actionButtonText;
            confirmActionButton.className = 'btn';
            confirmActionButton.classList.add(actionButtonClass);
            const modalInstance = bootstrap.Modal.getInstance(confirmationModal) || new bootstrap.Modal(confirmationModal);
            let confirmed = false;
            const handleConfirm = () => { confirmed = true; modalInstance.hide(); };
            const handleDismissOrHide = () => {
                confirmActionButton.removeEventListener('click', handleConfirm);
                confirmationModal.removeEventListener('hidden.bs.modal', handleDismissOrHide);
                resolve(confirmed);
            };
            confirmActionButton.removeEventListener('click', handleConfirm);
            confirmationModal.removeEventListener('hidden.bs.modal', handleDismissOrHide);
            confirmActionButton.addEventListener('click', handleConfirm);
            confirmationModal.addEventListener('hidden.bs.modal', handleDismissOrHide, { once: true });
            modalInstance.show();
        });
    }
    // YENİ: Tüm birim bilgilerini yükle ve sakla
    async function loadAllBirimler() {
        try {
            const birimler = await window.electronAPI.getBirimler();
            birimVerileri = {};
            birimler.forEach(birim => {
                birimVerileri[birim.kisaAd] = {
                    id: birim.id,
                    birimAdi: birim.birimAdi,
                    anaBirimKisaAd: birim.anaBirimKisaAd,
                    cevrimKatsayisi: parseFloat(birim.cevrimKatsayisi)
                };
            });
            console.log("Birim verileri maliyet hesaplama için yüklendi:", birimVerileri);
        } catch (error) {
            console.error("Birim verileri yüklenirken hata:", error);
            toastr.error("Maliyet hesaplaması için birim verileri yüklenemedi.");
        }
    }

    // YENİ: Hammadde Maliyetini Hesaplama Fonksiyonu
    async function calculateHammaddeMaliyet(hammaddeId, kullanilanMiktar, kullanilanBirimKisaAd) {
        console.log(`Maliyet Hesaplanıyor: Hammadde ID=${hammaddeId}, Miktar=${kullanilanMiktar}, Birim=${kullanilanBirimKisaAd}`);
        try {
            const alimInfo = await window.electronAPI.getLatestAlimInfoForUrun(hammaddeId);
            console.log("Alım Bilgisi:", alimInfo);
            if (!alimInfo || alimInfo.alisFiyati == null || !alimInfo.alisBirimiKisaAd) {
                return { birimMaliyet: 0, toplamMaliyet: 0, aciklama: "Alım kaydı/fiyatı yok" };
            }
            const { alisFiyati, alisBirimiKisaAd } = alimInfo;
            const kullanilanBirim = birimVerileri[kullanilanBirimKisaAd];
            const alisBirimi = birimVerileri[alisBirimiKisaAd];
            console.log("Kullanılan Birim Detayı:", kullanilanBirim);
            console.log("Alış Birimi Detayı:", alisBirimi);

            if (!kullanilanBirim) return { birimMaliyet: 0, toplamMaliyet: 0, aciklama: `Kullanım birimi (${kullanilanBirimKisaAd}) tanımsız` };
            if (!alisBirimi) return { birimMaliyet: 0, toplamMaliyet: 0, aciklama: `Alış birimi (${alisBirimiKisaAd}) tanımsız` };

            let kullanilanMiktarAnaCinsinden = parseFloat(kullanilanMiktar);
            if (kullanilanBirim.kisaAd !== kullanilanBirim.anaBirimKisaAd) {
                if (kullanilanBirim.cevrimKatsayisi && kullanilanBirim.cevrimKatsayisi !== 0) {
                    kullanilanMiktarAnaCinsinden = kullanilanMiktar / kullanilanBirim.cevrimKatsayisi;
                } else return { birimMaliyet: 0, toplamMaliyet: 0, aciklama: "Kullanım birimi çevrim hatası" };
            }
            const anaBirimKullanim = kullanilanBirim.anaBirimKisaAd;
            console.log("Kullanılan Miktar (Ana Birimde):", kullanilanMiktarAnaCinsinden, anaBirimKullanim);

            let alisFiyatiAnaCinsinden = parseFloat(alisFiyati);
            if (alisBirimi.kisaAd !== alisBirimi.anaBirimKisaAd) {
                if (alisBirimi.cevrimKatsayisi) {
                    alisFiyatiAnaCinsinden = alisFiyati * alisBirimi.cevrimKatsayisi;
                } else return { birimMaliyet: 0, toplamMaliyet: 0, aciklama: "Alış birimi çevrim hatası" };
            }
            const anaBirimAlis = alisBirimi.anaBirimKisaAd;
            console.log("Alış Fiyatı (Ana Birimde):", alisFiyatiAnaCinsinden, anaBirimAlis);

            if (anaBirimKullanim !== anaBirimAlis) {
                return { birimMaliyet: 0, toplamMaliyet: 0, aciklama: `Birimler arası çevrim yok (${anaBirimKullanim} -> ${anaBirimAlis})` };
            }

            const maliyetAnaBirimCinsinden = kullanilanMiktarAnaCinsinden * alisFiyatiAnaCinsinden;
            const birimMaliyet = kullanilanMiktar != 0 ? maliyetAnaBirimCinsinden / parseFloat(kullanilanMiktar) : 0;
            console.log("Hesaplanan Birim Maliyet:", birimMaliyet, "Toplam Maliyet:", maliyetAnaBirimCinsinden);

            return { birimMaliyet: birimMaliyet, toplamMaliyet: maliyetAnaBirimCinsinden, aciklama: "" };
        } catch (error) {
            console.error(`Hammadde ID ${hammaddeId} için maliyet hesaplama hatası:`, error);
            return { birimMaliyet: 0, toplamMaliyet: 0, aciklama: "Hesaplama hatası" };
        }
    }
    function switchToAddReceteMode() {
        if (!receteEkleForm) return;
        receteEkleForm.reset();
        if (receteIdInput) receteIdInput.value = '';
        if (receteFormBaslik) receteFormBaslik.textContent = 'Yeni Reçete Ekle';
        if (receteFormSubmitButton) {
            const textSpan = receteFormSubmitButton.querySelector('span');
            if (textSpan) textSpan.textContent = 'Reçete Ekle';
            receteFormSubmitButton.classList.remove('btn-success');
            receteFormSubmitButton.classList.add('btn-primary');
        }
        if (receteFormCancelButton) receteFormCancelButton.classList.add('d-none');
        if (recetePorsiyonSelect) recetePorsiyonSelect.focus();
    }

    function resetReceteDetayForm() {
        if (!receteDetayEkleForm) return;
        receteDetayEkleForm.reset();
        if (receteDetayIdInput) receteDetayIdInput.value = '';
        if (receteDetayFormBaslik) receteDetayFormBaslik.textContent = 'Hammadde Ekle';
        if (receteDetaySubmitButton) {
            const textSpan = receteDetaySubmitButton.querySelector('span');
            if (textSpan) textSpan.textContent = 'Hammadde Ekle';
            receteDetaySubmitButton.classList.remove('btn-success');
            receteDetaySubmitButton.classList.add('btn-primary');
        }
        if (receteDetayFormCancelButton) receteDetayFormCancelButton.classList.add('d-none');
        if (hammaddeSelect) hammaddeSelect.focus();
    }

    async function populateRecetePorsiyonDropdown() {
        try {
            const porsiyonlar = await window.electronAPI.getPorsiyonlar();
            recetePorsiyonSelect.innerHTML = '<option value="">-- Porsiyon Seçiniz --</option>';
            porsiyonlar.forEach(porsiyon => {
                const option = document.createElement('option');
                option.value = porsiyon.id;
                option.textContent = `${porsiyon.sonUrunAdi} - ${porsiyon.porsiyonAdi}`;
                recetePorsiyonSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Porsiyonlar dropdown doldurulurken hata:', error);
            toastr.error('Porsiyonlar dropdown yüklenirken bir hata oluştu.');
        }
    }

    async function populateReceteDetayDropdowns() {
        try {
            const hammaddeler = await window.electronAPI.getUrunlerByTur('Hammadde');
            hammaddeSelect.innerHTML = '<option value="">-- Hammadde Seçiniz --</option>';
            hammaddeler.forEach(hammadde => {
                const option = document.createElement('option');
                option.value = hammadde.id;
                option.textContent = hammadde.ad;
                hammaddeSelect.appendChild(option);
            });

            const birimler = await window.electronAPI.getBirimler();
            detayBirimSelect.innerHTML = '<option value="">-- Birim Seçiniz --</option>';
            birimler.forEach(birim => {
                const option = document.createElement('option');
                option.value = birim.kisaAd;
                option.textContent = `${birim.birimAdi} (${birim.kisaAd})`;
                detayBirimSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Reçete Detay dropdownları doldurulurken hata:', error);
            toastr.error('Reçete Detay dropdownları yüklenirken bir hata oluştu.');
        }
    }

    function displayReceteler(receler) {
        if (!recelerTableBody) return;
        recelerTableBody.innerHTML = '';
        if (receler && receler.length > 0) {
            receler.forEach(recete => {
                const row = recelerTableBody.insertRow();
                row.insertCell(0).textContent = recete.id;
                row.insertCell(1).textContent = `${recete.sonUrunAdi} - ${recete.porsiyonAdi}` || 'Porsiyon Bilgisi Eksik';
                row.insertCell(2).textContent = recete.receteAdi || 'Varsayılan';

                const actionsCell = row.insertCell(3);
                actionsCell.classList.add('text-end');
                const buttonContainer = document.createElement('div');

                const editReceteButton = document.createElement('button');
                editReceteButton.type = 'button';
                editReceteButton.classList.add('btn', 'btn-icon', 'btn-warning');
                editReceteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>';
                editReceteButton.title = "Reçeteyi Düzenle";
                editReceteButton.addEventListener('click', () => handleEditRecete(recete));
                buttonContainer.appendChild(editReceteButton);

                const viewDetailsButton = document.createElement('button');
                viewDetailsButton.type = 'button';
                viewDetailsButton.classList.add('btn', 'btn-icon', 'btn-info', 'ms-1');
                viewDetailsButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-notes" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 3m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z" /><path d="M9 7l6 0" /><path d="M9 11l6 0" /><path d="M9 15l4 0" /></svg>';
                viewDetailsButton.title = "Detayları Görüntüle/Düzenle";
                viewDetailsButton.addEventListener('click', () => handleViewReceteDetails(recete.id, recete));
                buttonContainer.appendChild(viewDetailsButton);

                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.classList.add('btn', 'btn-icon', 'btn-danger', 'ms-1');
                deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>';
                deleteButton.title = "Reçeteyi Sil";
                deleteButton.setAttribute('data-recete-id', recete.id);
                deleteButton.setAttribute('data-recete-tam-adi', `${recete.sonUrunAdi} - ${recete.porsiyonAdi} (${recete.receteAdi || 'Varsayılan'})`);
                deleteButton.addEventListener('click', handleDeleteRecete);
                buttonContainer.appendChild(deleteButton);
                actionsCell.appendChild(buttonContainer);

                // YENİ: Maliyeti Yenile Butonu
                const refreshCostButton = document.createElement('button');
                refreshCostButton.textContent = 'Maliyet'; // Veya sadece ikon
                refreshCostButton.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'me-1'); // Stilini ayarla
                refreshCostButton.title = "Bu Reçetenin Güncel Maliyetini Hesapla";
                refreshCostButton.addEventListener('click', async () => {
                    try {
                        toastr.info(`"${recete.porsiyonAdi} - ${recete.receteAdi || 'Varsayılan'}" için maliyet hesaplanıyor...`);
                        const detaylar = await window.electronAPI.getReceteDetaylari(recete.id);
                        let toplamMaliyet = 0;
                        if (detaylar && detaylar.length > 0) {
                            for (const detay of detaylar) {
                                const maliyetSonucu = await calculateHammaddeMaliyet(detay.hammaddeId, detay.miktar, detay.birimKisaAd);
                                toplamMaliyet += maliyetSonucu.toplamMaliyet;
                            }
                        }
                        toastr.success(`"${recete.porsiyonAdi} - ${recete.receteAdi || 'Varsayılan'}" için hesaplanan maliyet: ${toplamMaliyet.toFixed(2)} ₺`);
                    } catch (error) {
                        console.error("Reçete maliyeti yenilenirken hata:", error);
                        toastr.error("Maliyet yenilenirken bir hata oluştu.");
                    }
                });
                actionsCell.appendChild(refreshCostButton);
            });
        } else {
            const row = recelerTableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 4;
            cell.textContent = 'Henüz kayıtlı reçete bulunamadı.';
            cell.style.textAlign = 'center';
        }
    }

    function handleEditRecete(recete) {
        if (!receteEkleForm) return;
        receteIdInput.value = recete.id;
        recetePorsiyonSelect.value = recete.porsiyonId;
        receteAdiInput.value = recete.receteAdi || '';
        if (receteFormBaslik) receteFormBaslik.textContent = `Reçeteyi Düzenle: ${recete.sonUrunAdi} - ${recete.porsiyonAdi}`;
        if (receteFormSubmitButton) {
            const textSpan = receteFormSubmitButton.querySelector('span');
            if (textSpan) textSpan.textContent = 'Reçeteyi Güncelle';
            receteFormSubmitButton.classList.remove('btn-primary');
            receteFormSubmitButton.classList.add('btn-success');
        }
        if (receteFormCancelButton) receteFormCancelButton.classList.remove('d-none');
        recetePorsiyonSelect.focus();
    }

    async function displayReceteDetaylari(detaylar) {
        if(!receteDetaylariTableBody) return;
        receteDetaylariTableBody.innerHTML = '';
        let genelToplamMaliyet = 0;

        if (detaylar && detaylar.length > 0) {
            for (const detay of detaylar) {
                const row = receteDetaylariTableBody.insertRow();
                row.insertCell(0).textContent = detay.id;
                row.insertCell(1).textContent = detay.hammaddeAdi || 'Hammadde Bilgisi Eksik';
                row.insertCell(2).textContent = parseFloat(detay.miktar).toFixed(3);
                row.insertCell(3).textContent = detay.birimKisaAd || 'Birim Bilgisi Eksik';

                const maliyetSonucu = await calculateHammaddeMaliyet(detay.hammaddeId, detay.miktar, detay.birimKisaAd);

                const birimMaliyetCell = row.insertCell(4);
                birimMaliyetCell.textContent = maliyetSonucu.birimMaliyet.toFixed(2) + " ₺";
                birimMaliyetCell.classList.add('text-end');
                birimMaliyetCell.title = maliyetSonucu.aciklama || "";

                const toplamMaliyetCell = row.insertCell(5);
                toplamMaliyetCell.textContent = maliyetSonucu.toplamMaliyet.toFixed(2) + " ₺";
                toplamMaliyetCell.classList.add('text-end');
                toplamMaliyetCell.title = maliyetSonucu.aciklama || "";

                genelToplamMaliyet += maliyetSonucu.toplamMaliyet;

                const actionsCell = row.insertCell(6);
                actionsCell.classList.add('text-end');
                const buttonContainer = document.createElement('div');

                const editButton = document.createElement('button');
                editButton.type = 'button';
                editButton.classList.add('btn', 'btn-icon', 'btn-warning');
                editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>';
                editButton.title = "Detayı Düzenle";
                // DÜZELTME: handleEditReceteDetay fonksiyonuna tüm 'detay' objesini gönderiyoruz. Bu doğru.
                editButton.addEventListener('click', () => handleEditReceteDetay(detay));
                buttonContainer.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.classList.add('btn', 'btn-icon', 'btn-danger', 'ms-1');
                deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>';
                deleteButton.title = "Detayı Sil";
                deleteButton.setAttribute('data-detay-id', detay.id);
                deleteButton.setAttribute('data-hammadde-adi', detay.hammaddeAdi || 'Bilinmeyen Hammadde'); // Null kontrolü
                // DÜZELTME: handleDeleteReceteDetay fonksiyonuna event objesinin otomatik geçmesini sağlıyoruz.
                deleteButton.addEventListener('click', handleDeleteReceteDetay);
                buttonContainer.appendChild(deleteButton);
                actionsCell.appendChild(buttonContainer);
            } // forEach döngüsü sonu
        } else {
            const row = receteDetaylariTableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 7; // Yeni sütunlarla colspan'i 7 yap
            cell.textContent = 'Bu reçetede henüz hammadde detayı bulunamadı.';
            cell.style.textAlign = 'center';
        }

        // HTML'de <h5 id="toplamReceteMaliyetiText" class="mt-2 mb-3">Toplam Maliyet: - ₺</h5> gibi bir element olmalı
        const toplamReceteMaliyetiEl = document.getElementById('toplamReceteMaliyetiText');
        if (toplamReceteMaliyetiEl) {
            toplamReceteMaliyetiEl.textContent = `Toplam Reçete Maliyeti: ${genelToplamMaliyet.toFixed(2)} ₺`;
        } else {
            // Eğer HTML elementi yoksa, receteDetaylariGenelBaslik'a ekleyebiliriz veya konsola yazdırabiliriz.
            if (receteDetaylariGenelBaslik) { // receteDetaylariTitle yerine güncel ID
                receteDetaylariGenelBaslik.textContent += ` - Toplam Maliyet: ${genelToplamMaliyet.toFixed(2)} ₺`;
            } else {
                console.log(`Toplam Reçete Maliyeti: ${genelToplamMaliyet.toFixed(2)} ₺`);
            }
        }
    }

    async function handleViewReceteDetails(receteId, recete) {
        console.log(`Detayları Görüntüle: Reçete ID ${receteId}`);
        await fetchAndDisplayReceteDetails(receteId);
        currentReceteId = receteId;

        if (receteDetaylariGenelBaslik && recete) {
            receteDetaylariGenelBaslik.textContent = `"${recete.sonUrunAdi} - ${recete.porsiyonAdi}" Reçete Detayları`;
            if (recete.receteAdi && recete.receteAdi.toLowerCase() !== 'varsayılan') {
                receteDetaylariGenelBaslik.textContent += ` ("${recete.receteAdi}")`;
            }
        } else if (receteDetaylariGenelBaslik) {
            receteDetaylariGenelBaslik.textContent = 'Seçilen Reçete Detayları';
        }

        if (receteDetaylariAlani) receteDetaylariAlani.style.display = 'block';
        selectedReceteIdInput.value = receteId;
        resetReceteDetayForm();
    }

    async function handleDeleteRecete(event) {
        const button = event.currentTarget;
        const receteId = button.getAttribute('data-recete-id');
        const receteTamAdi = button.getAttribute('data-recete-tam-adi');

        const confirmed = await showConfirmationModal(
            `${receteTamAdi} adlı reçeteyi silmek istediğinizden emin misiniz? Bu işlem reçeteye ait tüm detayları da silecektir!`,
            'Evet, Sil', 'btn-danger'
        );
        if (!confirmed) {
            toastr.info('Reçete silme işlemi iptal edildi.');
            return;
        }
        try {
            const success = await window.electronAPI.deleteRecete(Number(receteId));
            if (success) {
                toastr.success('Reçete başarıyla silindi!');
                await fetchAndDisplayReceteler();
                if (currentReceteId === Number(receteId)) {
                    if (receteDetaylariAlani) receteDetaylariAlani.style.display = 'none';
                    currentReceteId = null;
                }
                if (receteIdInput.value === receteId.toString()) { // toString() eklendi, ID karşılaştırması için
                    switchToAddReceteMode();
                }
            } else {
                toastr.warning('Reçete silinemedi veya bulunamadı.');
            }
        } catch (error) {
            console.error('Reçete silme hatası:', error);
            let errMsg = `Reçete silinirken bir hata oluştu: ${error.message}`;
            if (error.message && error.message.toLowerCase().includes('foreign key constraint failed')) {
                errMsg = 'Bu reçeteye bağlı detaylar olduğu için silinemedi. Lütfen önce detayları silin veya veritabanı ayarlarınızı kontrol edin.';
            }
            toastr.error(errMsg);
        }
    }

    async function handleDeleteReceteDetay(event) {
        const button = event.currentTarget;
        const detayId = button.getAttribute('data-detay-id');
        const hammaddeAdi = button.getAttribute('data-hammadde-adi');
        const mesaj = hammaddeAdi ? `"${hammaddeAdi}" adlı hammadde kaydını silmek istediğinizden emin misiniz?` : `Bu reçete detayını silmek istediğinizden emin misiniz?`;

        const confirmed = await showConfirmationModal(mesaj, 'Evet, Sil', 'btn-danger');
        if (!confirmed) {
            toastr.info('Reçete detay silme işlemi iptal edildi.');
            return;
        }
        try {
            const success = await window.electronAPI.deleteReceteDetay(Number(detayId));
            if (success) {
                toastr.success('Hammadde reçeteden başarıyla silindi!');
                if (currentReceteId) {
                    await fetchAndDisplayReceteDetails(currentReceteId);
                }
                if (receteDetayIdInput.value === detayId.toString()) { // toString() eklendi
                    resetReceteDetayForm();
                }
            } else {
                toastr.warning('Reçete detayı silinemedi veya bulunamadı.');
            }
        } catch (error) {
            console.error('Reçete detay silme hatası:', error);
            toastr.error('Reçete detayı silinirken bir hata oluştu: ' + error.message);
        }
    }

    function handleEditReceteDetay(detay) {
        if (!receteDetayEkleForm) return;
        selectedReceteIdInput.value = detay.receteId;
        receteDetayIdInput.value = detay.id;
        hammaddeSelect.value = detay.hammaddeId.toString();
        miktarInput.value = detay.miktar;
        detayBirimSelect.value = detay.birimKisaAd;
        if (receteDetayFormBaslik) receteDetayFormBaslik.textContent = `Hammaddeyi Düzenle: ${detay.hammaddeAdi}`;
        if (receteDetaySubmitButton) {
            const textSpan = receteDetaySubmitButton.querySelector('span');
            if (textSpan) textSpan.textContent = 'Güncelle';
            receteDetaySubmitButton.classList.remove('btn-primary');
            receteDetaySubmitButton.classList.add('btn-success');
        }
        if (receteDetayFormCancelButton) receteDetayFormCancelButton.classList.remove('d-none');
        miktarInput.focus();
    }

    async function fetchAndDisplayReceteler() {
        try {
            const receler = await window.electronAPI.getReceteler();
            displayReceteler(receler);
        } catch (error) {
            console.error('Reçeteleri alırken hata:', error);
            toastr.error('Reçete listesi yüklenirken hata oluştu.');
        }
    }

    async function fetchAndDisplayReceteDetails(receteId) {
        try {
            const detaylar = await window.electronAPI.getReceteDetaylari(receteId);
            displayReceteDetaylari(detaylar);
        } catch (error) {
            console.error(`Reçete detayları (ID: ${receteId}) alırken hata:`, error);
            toastr.error('Reçete detayları yüklenirken bir hata oluştu.');
        }
    }

    if (receteEkleForm) {
        receteEkleForm.onsubmit = async (event) => {
            event.preventDefault();
            const id = receteIdInput.value ? parseInt(receteIdInput.value) : null;
            const porsiyonId = recetePorsiyonSelect.value;
            let receteAdiValue = receteAdiInput.value.trim();
            if (receteAdiValue === '') {
                receteAdiValue = 'Varsayılan';
            }
            const receteData = { id: id, porsiyonId: parseInt(porsiyonId), receteAdi: receteAdiValue };

            if (!receteData.porsiyonId) {
                toastr.warning('Porsiyon seçimi boş bırakılamaz.');
                return;
            }
            try {
                let islemYapildi = false;
                if (receteData.id) {
                    const guncellendi = await window.electronAPI.updateRecete(receteData);
                    if (guncellendi) {
                        toastr.success(`Reçete başarıyla güncellendi!`);
                        islemYapildi = true;
                    } else {
                        toastr.info(`Reçete için herhangi bir değişiklik yapılmadı veya kayıt bulunamadı.`);
                    }
                } else {
                    await window.electronAPI.addRecete(receteData);
                    toastr.success(`Reçete başarıyla eklendi!`);
                    islemYapildi = true;
                }
                if (islemYapildi) {
                    switchToAddReceteMode();
                    await fetchAndDisplayReceteler();
                    if (receteData.id && currentReceteId === receteData.id) {
                        const guncelRecete = (await window.electronAPI.getReceteler()).find(r => r.id === receteData.id);
                        if (guncelRecete && receteDetaylariGenelBaslik) { // Yeni ID'yi kullan
                            receteDetaylariGenelBaslik.textContent = `"${guncelRecete.sonUrunAdi} - ${guncelRecete.porsiyonAdi}" Reçete Detayları`;
                            if (guncelRecete.receteAdi && guncelRecete.receteAdi.toLowerCase() !== 'varsayılan') {
                                receteDetaylariGenelBaslik.textContent += ` ("${guncelRecete.receteAdi}")`;
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Ana Reçete Ekle/Güncelle hatası:', error);
                let displayMessage = 'İşlem sırasında bir hata oluştu.';
                if (error.message.includes('adında başka bir reçete zaten mevcut.')) {
                    displayMessage = error.message;
                } else if (error.message && error.message.toLowerCase().includes('unique constraint failed')) {
                    const selectedPorsiyonText = recetePorsiyonSelect.options[recetePorsiyonSelect.selectedIndex].text;
                    displayMessage = `"${selectedPorsiyonText}" porsiyonu için "${receteData.receteAdi}" adında bir reçete zaten mevcut.`;
                } else {
                    displayMessage = 'İşlem sırasında bir hata oluştu: ' + error.message;
                }
                toastr.error(displayMessage);
            }
        };
    }

    if (receteFormCancelButton) {
        receteFormCancelButton.onclick = () => { switchToAddReceteMode(); };
    }

    if (receteDetayEkleForm) {
        receteDetayEkleForm.onsubmit = async (event) => {
            event.preventDefault();
            const anaReceteId = selectedReceteIdInput.value;
            const detayId = receteDetayIdInput.value ? parseInt(receteDetayIdInput.value) : null;

            const detayData = {
                receteId: parseInt(anaReceteId),
                hammaddeId: parseInt(hammaddeSelect.value),
                miktar: parseFloat(miktarInput.value),
                birimKisaAd: detayBirimSelect.value,
                id: detayId
            };

            if (!detayData.receteId || !detayData.hammaddeId || isNaN(detayData.miktar) || !detayData.birimKisaAd) {
                toastr.warning('Hammadde, geçerli Miktar ve Birim boş bırakılamaz.');
                return;
            }
            if (detayData.miktar <= 0) {
                toastr.warning('Miktar sıfırdan büyük olmalıdır.');
                return;
            }
            try {
                let islemYapildiDetay = false;
                if (detayData.id) {
                    const success = await window.electronAPI.updateReceteDetay(detayData);
                    if (success) {
                        toastr.success('Hammadde detayı güncellendi!');
                        islemYapildiDetay = true;
                    } else {
                        toastr.warning('Reçete detayı güncelleme başarısız veya değişiklik yapılmadı.');
                    }
                } else {
                    await window.electronAPI.addReceteDetay(detayData);
                    toastr.success('Hammadde reçeteye eklendi!');
                    islemYapildiDetay = true;
                }
                if (islemYapildiDetay) {
                    resetReceteDetayForm();
                    if (currentReceteId) {
                        await fetchAndDisplayReceteDetails(currentReceteId);
                    }
                }
            } catch (error) {
                console.error('Reçete Detay Ekle/Güncelle hatası:', error);
                toastr.error('Reçete detayı işlenirken bir hata oluştu: ' + error.message);
            }
        };
    }
    if (receteDetayFormCancelButton) {
        receteDetayFormCancelButton.onclick = () => {
            resetReceteDetayForm();
        };
    }

console.log("Sayfa yükleme akışı başlıyor...");
    await loadAllBirimler(); // <<-- ÖNCE TÜM BİRİMLERİ YÜKLE VE BEKLE
    console.log("Birimler yüklendi, dropdownlar dolduruluyor...");
    await populateRecetePorsiyonDropdown();
    await populateReceteDetayDropdowns();
    console.log("Dropdownlar dolduruldu, reçeteler çekiliyor...");
    await fetchAndDisplayReceteler(); // Bu fonksiyon içinde displayReceteler çağrılıyor

    console.log("Form modları ayarlanıyor...");
    if (receteEkleForm) { switchToAddReceteMode(); }
    if (receteDetayEkleForm) { resetReceteDetayForm(); }
    if (receteDetaylariAlani) receteDetaylariAlani.style.display = 'none';
    console.log("Reçeteler sayfası yüklemesi tamamlandı.");
}