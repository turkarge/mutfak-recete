// renderer/toplu_maliyet.js

let hesaplaVeGuncelleButton;
let islemDurumuDiv;
let maliyetListesiKarti;
let guncellenenMaliyetlerTableBody;
let toplamKayitSayisiSpan;
let birimVerileri = {};

// Sayfa yüklendiğinde çalışacak ana fonksiyon
export async function loadTopluMaliyetPage() {
    console.log('Toplu Maliyet Güncelleme sayfası JavaScript\'i yükleniyor...');

    hesaplaVeGuncelleButton = document.querySelector('#hesaplaVeGuncelleButton');
    islemDurumuDiv = document.querySelector('#islemDurumu');
    maliyetListesiKarti = document.querySelector('#maliyetListesiKarti');
    guncellenenMaliyetlerTableBody = document.querySelector('#guncellenenMaliyetlerTable tbody');
    toplamKayitSayisiSpan = document.querySelector('#toplamKayitSayisi');

    async function loadAllBirimlerForMaliyet() {
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
            console.log("Birim verileri toplu maliyet hesaplama için yüklendi.");
            return true; // Başarılı yükleme
        } catch (error) {
            console.error("Toplu maliyet için birim verileri yüklenirken hata:", error);
            toastr.error("Birim verileri yüklenemedi, maliyet hesaplama yapılamaz.");
            return false; // Başarısız yükleme
        }
    }

    async function calculateHammaddeMaliyet(hammaddeId, kullanilanMiktar, kullanilanBirimKisaAd) {
        try {
            const alimInfo = await window.electronAPI.getLatestAlimInfoForUrun(hammaddeId);
            if (!alimInfo || alimInfo.alisFiyati == null || !alimInfo.alisBirimiKisaAd) {
                return { toplamMaliyet: 0, aciklama: "Alım kaydı/fiyatı yok" };
            }
            const { alisFiyati, alisBirimiKisaAd } = alimInfo;
            const kullanilanBirim = birimVerileri[kullanilanBirimKisaAd];
            const alisBirimi = birimVerileri[alisBirimiKisaAd];

            if (!kullanilanBirim) return { toplamMaliyet: 0, aciklama: `Kullanım birimi (${kullanilanBirimKisaAd}) tanımsız` };
            if (!alisBirimi) return { toplamMaliyet: 0, aciklama: `Alış birimi (${alisBirimiKisaAd}) tanımsız` };

            let kullanilanMiktarAnaCinsinden = parseFloat(kullanilanMiktar);
            if (kullanilanBirim.kisaAd !== kullanilanBirim.anaBirimKisaAd) {
                 if (kullanilanBirim.cevrimKatsayisi && kullanilanBirim.cevrimKatsayisi !== 0) {
                    kullanilanMiktarAnaCinsinden = kullanilanMiktar / kullanilanBirim.cevrimKatsayisi;
                } else return { toplamMaliyet: 0, aciklama: "Kullanım birimi çevrim hatası" };
            }
            const anaBirimKullanim = kullanilanBirim.anaBirimKisaAd;

            let alisFiyatiAnaCinsinden = parseFloat(alisFiyati);
            if (alisBirimi.kisaAd !== alisBirimi.anaBirimKisaAd) {
                if (alisBirimi.cevrimKatsayisi) {
                    alisFiyatiAnaCinsinden = alisFiyati * alisBirimi.cevrimKatsayisi;
                } else return { toplamMaliyet: 0, aciklama: "Alış birimi çevrim hatası" };
            }
            const anaBirimAlis = alisBirimi.anaBirimKisaAd;

            if (anaBirimKullanim !== anaBirimAlis) {
                return { toplamMaliyet: 0, aciklama: `Birimler arası çevrim yok (${anaBirimKullanim} -> ${anaBirimAlis})` };
            }
            return { toplamMaliyet: kullanilanMiktarAnaCinsinden * alisFiyatiAnaCinsinden, aciklama: "" };
        } catch (error) {
            console.error(`Hammadde ID ${hammaddeId} için maliyet hesaplama hatası:`, error);
            return { toplamMaliyet: 0, aciklama: "Hesaplama hatası" };
        }
    }

    function displayGuncellenenMaliyetler(guncellenenReceteler) {
        if (!guncellenenMaliyetlerTableBody || !maliyetListesiKarti || !toplamKayitSayisiSpan) return;

        guncellenenMaliyetlerTableBody.innerHTML = ''; // Tabloyu temizle
        if (guncellenenReceteler && guncellenenReceteler.length > 0) {
            guncellenenReceteler.forEach(recete => {
                const row = guncellenenMaliyetlerTableBody.insertRow();
                row.insertCell(0).textContent = `${recete.sonUrunAdi} - ${recete.porsiyonAdi}`;
                row.insertCell(1).textContent = recete.receteAdi || 'Varsayılan';
                const maliyetCell = row.insertCell(2);
                maliyetCell.textContent = recete.sonHesaplananMaliyet.toFixed(2);
                maliyetCell.classList.add('text-end');
                row.insertCell(3).textContent = new Date(recete.maliyetHesaplamaTarihi).toLocaleString('tr-TR');
            });
            toplamKayitSayisiSpan.textContent = `${guncellenenReceteler.length} reçete güncellendi.`;
            maliyetListesiKarti.style.display = 'block';
        } else {
            const row = guncellenenMaliyetlerTableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 4;
            cell.textContent = 'Güncellenecek veya gösterilecek reçete bulunamadı.';
            cell.style.textAlign = 'center';
            toplamKayitSayisiSpan.textContent = "";
            maliyetListesiKarti.style.display = 'block'; // Yine de kartı gösterelim, içinde mesaj olsun.
        }
    }


    if (hesaplaVeGuncelleButton) {
        hesaplaVeGuncelleButton.onclick = async () => {
            islemDurumuDiv.textContent = "Maliyetler hesaplanıyor, lütfen bekleyin...";
            islemDurumuDiv.className = 'alert alert-info mt-3';
            islemDurumuDiv.style.display = 'block';
            maliyetListesiKarti.style.display = 'none';
            guncellenenMaliyetlerTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Veriler işleniyor...</td></tr>';
            hesaplaVeGuncelleButton.disabled = true;
            let guncellenenReceteListesi = [];
            let basariliGuncellemeSayisi = 0;
            let hataliReceteSayisi = 0;

            try {
                toastr.info("Toplu maliyet güncelleme işlemi başlatıldı...");
                const birimlerYuklendi = await loadAllBirimlerForMaliyet();
                if (!birimlerYuklendi) {
                    throw new Error("Birim verileri yüklenemediği için işlem iptal edildi.");
                }

                const tumReceteler = await window.electronAPI.getReceteler();
                if (!tumReceteler || tumReceteler.length === 0) {
                    islemDurumuDiv.textContent = "Güncellenecek reçete bulunamadı.";
                    islemDurumuDiv.className = 'alert alert-warning mt-3';
                    toastr.warning("Güncellenecek reçete bulunamadı.");
                    hesaplaVeGuncelleButton.disabled = false;
                    return;
                }

                islemDurumuDiv.textContent = `Toplam ${tumReceteler.length} reçete işleniyor... (0/${tumReceteler.length})`;

                for (let i = 0; i < tumReceteler.length; i++) {
                    const recete = tumReceteler[i];
                    let receteToplamMaliyet = 0;
                    let hesaplamaBasarili = true;

                    const detaylar = await window.electronAPI.getReceteDetaylari(recete.id);
                    if (detaylar && detaylar.length > 0) {
                        for (const detay of detaylar) {
                            const maliyetSonucu = await calculateHammaddeMaliyet(detay.hammaddeId, detay.miktar, detay.birimKisaAd);
                            if (maliyetSonucu.aciklama !== "") {
                                console.warn(`Reçete ID ${recete.id}, Hammadde ID ${detay.hammaddeId} için maliyet hatası: ${maliyetSonucu.aciklama}`);
                                // İsteğe bağlı: Bu tür hatalı hesaplamaları da kullanıcıya bildirebiliriz.
                                // Şimdilik sadece konsola yazıyoruz ve o hammaddenin maliyetini 0 kabul ediyoruz.
                            }
                            receteToplamMaliyet += maliyetSonucu.toplamMaliyet;
                        }
                    } else {
                        console.log(`Reçete ID ${recete.id} için detay bulunamadı, maliyet 0 olarak ayarlandı.`);
                    }

                    // Maliyeti ve tarihi veritabanına kaydet
                    const hesaplamaTarihi = new Date().toISOString();
                    const updateSuccess = await window.electronAPI.updateReceteMaliyet(recete.id, receteToplamMaliyet, hesaplamaTarihi);

                    if (updateSuccess) {
                        basariliGuncellemeSayisi++;
                        guncellenenReceteListesi.push({
                            ...recete, // Porsiyon adı, reçete adı gibi bilgileri almak için
                            sonHesaplananMaliyet: receteToplamMaliyet,
                            maliyetHesaplamaTarihi: hesaplamaTarihi
                        });
                    } else {
                        hataliReceteSayisi++;
                        console.warn(`Reçete ID ${recete.id} için maliyet veritabanına kaydedilemedi.`);
                    }
                    islemDurumuDiv.textContent = `Toplam ${tumReceteler.length} reçete işleniyor... (${i + 1}/${tumReceteler.length})`;
                }

                displayGuncellenenMaliyetler(guncellenenReceteListesi);
                islemDurumuDiv.textContent = `${basariliGuncellemeSayisi} reçetenin maliyeti başarıyla güncellendi.`;
                if (hataliReceteSayisi > 0) {
                    islemDurumuDiv.textContent += ` ${hataliReceteSayisi} reçete güncellenirken hata oluştu.`;
                    islemDurumuDiv.className = 'alert alert-warning mt-3';
                    toastr.warning(`${hataliReceteSayisi} reçete güncellenirken hata oluştu. Detaylar için konsolu kontrol edin.`);
                } else {
                    islemDurumuDiv.className = 'alert alert-success mt-3';
                    toastr.success("Tüm reçete maliyetleri başarıyla güncellendi!");
                }

            } catch (error) {
                console.error("Toplu maliyet güncelleme sırasında genel hata:", error);
                islemDurumuDiv.textContent = `Bir hata oluştu: ${error.message}`;
                islemDurumuDiv.className = 'alert alert-danger mt-3';
                toastr.error("Toplu maliyet güncelleme sırasında bir hata oluştu.");
            } finally {
                hesaplaVeGuncelleButton.disabled = false;
            }
        };
    }

    // Sayfa Yüklendiğinde
    // await loadAllBirimlerForMaliyet(); // Butona basılınca yüklenecek
    islemDurumuDiv.style.display = 'none';
    maliyetListesiKarti.style.display = 'none';
}