// renderer/toplu_maliyet.js

let hesaplaVeGuncelleButton;
let islemDurumuDiv;
let maliyetListesiKarti;
let guncellenenMaliyetlerTableBody;
let toplamKayitSayisiSpan;
let birimVerileri = {};
let guncellenenReceteListesi = []; // <<-- GLOBAL DEĞİŞKEN OLARAK TANIMLANDI

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
            return true;
        } catch (error) {
            console.error("Toplu maliyet için birim verileri yüklenirken hata:", error);
            toastr.error("Birim verileri yüklenemedi, maliyet hesaplama yapılamaz.");
            return false;
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

    function formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const dateObj = new Date(dateString);
            const day = dateObj.getDate().toString().padStart(2, '0');
            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const year = dateObj.getFullYear();
            return `${day}.${month}.${year}`;
        } catch (e) {
            return dateString;
        }
    }

    function displayGuncellenenMaliyetler(liste) { // Parametre adı 'liste'
        if (!guncellenenMaliyetlerTableBody || !maliyetListesiKarti || !toplamKayitSayisiSpan) return;

        guncellenenMaliyetlerTableBody.innerHTML = '';
        if (liste && liste.length > 0) {
            liste.forEach(recete => {
                const row = guncellenenMaliyetlerTableBody.insertRow();
                row.insertCell(0).textContent = recete.urunAdi;
                row.insertCell(1).textContent = recete.porsiyonAdi;
                row.insertCell(2).textContent = formatDate(recete.eskiTarih);
                const eskiFiyatCell = row.insertCell(3);
                eskiFiyatCell.textContent = recete.eskiMaliyet !== null ? recete.eskiMaliyet.toFixed(2) : '-';
                eskiFiyatCell.classList.add('text-end');
                row.insertCell(4).textContent = formatDate(recete.yeniTarih);
                const yeniFiyatCell = row.insertCell(5);
                yeniFiyatCell.textContent = recete.yeniMaliyet.toFixed(2);
                yeniFiyatCell.classList.add('text-end');
                const degisimCell = row.insertCell(6);
                degisimCell.textContent = recete.degisimYuzdesi !== null ? `${recete.degisimYuzdesi.toFixed(2)}%` : '-';
                degisimCell.classList.add('text-end');
                if (recete.degisimYuzdesi > 0) degisimCell.classList.add('text-danger');
                if (recete.degisimYuzdesi < 0) degisimCell.classList.add('text-success');
            });
            toplamKayitSayisiSpan.textContent = `${liste.length} reçete için maliyet bilgisi gösteriliyor.`;
            maliyetListesiKarti.style.display = 'block';
        } else {
            const row = guncellenenMaliyetlerTableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 7;
            cell.textContent = 'Güncellenecek veya gösterilecek reçete bulunamadı.';
            cell.style.textAlign = 'center';
            toplamKayitSayisiSpan.textContent = "";
            maliyetListesiKarti.style.display = 'block';
        }
    }


    if (hesaplaVeGuncelleButton) {
        hesaplaVeGuncelleButton.onclick = async () => {
            console.log("Toplu maliyet hesaplama başlatıldı.");
            islemDurumuDiv.textContent = "Maliyetler hesaplanıyor, lütfen bekleyin...";
            islemDurumuDiv.className = 'alert alert-info mt-3';
            islemDurumuDiv.style.display = 'block';
            maliyetListesiKarti.style.display = 'none';
            guncellenenMaliyetlerTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Veriler işleniyor...</td></tr>';
            hesaplaVeGuncelleButton.disabled = true;
            
            guncellenenReceteListesi = []; // <<-- SADECE SIFIRLA, 'let' ile yeniden tanımlama YOK
            let basariliGuncellemeSayisi = 0;
            let hataliReceteSayisi = 0;

            try {
                toastr.info("Toplu maliyet güncelleme işlemi başlatıldı...");
                const birimlerYuklendi = await loadAllBirimlerForMaliyet();
                if (!birimlerYuklendi) {
                    throw new Error("Birim verileri yüklenemediği için işlem iptal edildi.");
                }
                console.log("Birimler yüklendi.");

                const tumReceteler = await window.electronAPI.getReceteler();
                console.log("Tüm reçeteler çekildi:", tumReceteler);
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
                    console.log(`İşleniyor: Reçete ID ${recete.id} - ${recete.sonUrunAdi} - ${recete.porsiyonAdi}`);
                    let yeniReceteToplamMaliyet = 0;

                    const eskiMaliyet = recete.sonHesaplananMaliyet;
                    const eskiTarih = recete.maliyetHesaplamaTarihi;
                    console.log(`  Eski Maliyet: ${eskiMaliyet}, Eski Tarih: ${eskiTarih}`);

                    const detaylar = await window.electronAPI.getReceteDetaylari(recete.id);
                    console.log(`  Reçete ID ${recete.id} için detaylar:`, detaylar);
                    if (detaylar && detaylar.length > 0) {
                        for (const detay of detaylar) {
                            const maliyetSonucu = await calculateHammaddeMaliyet(detay.hammaddeId, detay.miktar, detay.birimKisaAd);
                            console.log(`    Hammadde ID ${detay.hammaddeId} maliyet sonucu:`, maliyetSonucu);
                            yeniReceteToplamMaliyet += maliyetSonucu.toplamMaliyet;
                        }
                    } else {
                        console.log(`  Reçete ID ${recete.id} için detay bulunamadı, maliyet 0 olarak ayarlandı.`);
                    }
                    console.log(`  Reçete ID ${recete.id} için YENİ Toplam Maliyet: ${yeniReceteToplamMaliyet}`);

                    const hesaplamaTarihi = new Date().toISOString();
                    console.log(`  Veritabanına kaydediliyor: ReceteID=${recete.id}, YeniMaliyet=${yeniReceteToplamMaliyet}, Tarih=${hesaplamaTarihi}`);
                    const updateResult = await window.electronAPI.logAndUpdateReceteMaliyet(recete.id, yeniReceteToplamMaliyet, hesaplamaTarihi);
                    console.log(`  Güncelleme sonucu (logAndUpdateReceteMaliyet):`, updateResult);


                    if (updateResult && updateResult.success) {
                        basariliGuncellemeSayisi++;
                        let degisimYuzdesi = null;
                        if (eskiMaliyet !== null && eskiMaliyet !== 0 && yeniReceteToplamMaliyet !== null) {
                            degisimYuzdesi = ((yeniReceteToplamMaliyet - eskiMaliyet) / eskiMaliyet) * 100;
                        } else if (yeniReceteToplamMaliyet > 0 && (eskiMaliyet === null || eskiMaliyet === 0)) {
                            degisimYuzdesi = 100;
                        }
                        console.log(`  Değişim Yüzdesi: ${degisimYuzdesi}`);

                        guncellenenReceteListesi.push({
                            urunAdi: recete.sonUrunAdi,
                            porsiyonAdi: recete.porsiyonAdi,
                            receteAdi: recete.receteAdi,
                            eskiMaliyet: eskiMaliyet,
                            eskiTarih: eskiTarih,
                            yeniMaliyet: yeniReceteToplamMaliyet,
                            yeniTarih: hesaplamaTarihi,
                            degisimYuzdesi: degisimYuzdesi
                        });
                    } else {
                        hataliReceteSayisi++;
                        console.warn(`  Reçete ID ${recete.id} için maliyet veritabanına kaydedilemedi veya ana reçete kaydı güncellenemedi.`);
                    }
                    islemDurumuDiv.textContent = `Toplam ${tumReceteler.length} reçete işleniyor... (${i + 1}/${tumReceteler.length})`;
                }

                console.log("Döngü tamamlandı. Güncellenen reçete listesi:", guncellenenReceteListesi);
                console.log("displayGuncellenenMaliyetler çağrılıyor...");
                displayGuncellenenMaliyetler(guncellenenReceteListesi);

                islemDurumuDiv.textContent = `${basariliGuncellemeSayisi} reçetenin maliyeti başarıyla güncellendi.`;
                if (hataliReceteSayisi > 0) {
                    islemDurumuDiv.textContent += ` ${hataliReceteSayisi} reçete güncellenirken hata oluştu.`;
                    islemDurumuDiv.className = 'alert alert-warning mt-3';
                    toastr.warning(`${hataliReceteSayisi} reçete güncellenirken hata oluştu. Detaylar için konsolu kontrol edin.`);
                } else if (basariliGuncellemeSayisi > 0) {
                    islemDurumuDiv.className = 'alert alert-success mt-3';
                    toastr.success("Tüm uygun reçete maliyetleri başarıyla güncellendi!");
                } else {
                    islemDurumuDiv.textContent = "İşlem tamamlandı, ancak güncellenen reçete yok.";
                    islemDurumuDiv.className = 'alert alert-info mt-3';
                }

            } catch (error) {
                console.error("Toplu maliyet güncelleme sırasında genel hata:", error);
                islemDurumuDiv.textContent = `Bir hata oluştu: ${error.message}`;
                islemDurumuDiv.className = 'alert alert-danger mt-3';
                toastr.error("Toplu maliyet güncelleme sırasında bir hata oluştu.");
            } finally {
                console.log("Finally bloğu çalışıyor, buton aktif ediliyor.");
                hesaplaVeGuncelleButton.disabled = false;
            }
        };
    }

    islemDurumuDiv.style.display = 'none';
    maliyetListesiKarti.style.display = 'none';
}