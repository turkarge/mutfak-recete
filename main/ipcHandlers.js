// main/ipcHandlers.js
// Renderer'dan gelen IPC mesajlarını işleyen handler'ları içerir.

const { ipcMain, dialog } = require('electron'); // dialog EKLENDİ
const database = require('./db');
const path = require('node:path');
const fs = require('node:fs'); // Sadece 'fs' olarak import edelim
const XLSX = require('xlsx');

function registerIpcHandlers() {
    console.log("IPC handler'lar kaydediliyor...");

    // Ürünler handler'ları
    ipcMain.handle('get-urunler', async (event) => {
        try {
            const urunler = await database.all("SELECT * FROM urunler");
            console.log('Ürünler başarıyla getirildi.');
            return urunler;
        } catch (error) {
            console.error('Ürünleri getirme hatası:', error.message);
            throw error;
        }
    });

    ipcMain.handle('add-urun', async (event, urun) => {
        try {
            const lastID = await database.run("INSERT INTO urunler (ad, tur) VALUES (?, ?)",
                [urun.ad, urun.tur]);
            console.log(`Ürün başarıyla eklendi: ${urun.ad}, ID: ${lastID}`);
            return lastID;
        } catch (error) {
            console.error('Ürün ekleme hatası:', error.message);
            throw error;
        }
    });

    ipcMain.handle('deleteUrun', async (event, urunId) => {
        try {
            const changes = await database.run("DELETE FROM urunler WHERE id = ?", [urunId]);
            console.log(`Ürün silme işlemi tamamlandı (ID: ${urunId}). Etkilenen satır sayısı: ${changes}`);
            return changes > 0;
        } catch (error) {
            console.error(`Genel Hata Yakalandı (Ürün Silme Handler, ID: ${urunId}):`, error);
            throw error;
        }
    });

    ipcMain.handle('updateUrun', async (event, urun) => { // Ürün objesini (id dahil) alıyor
        try {
            const changes = await database.run(
                "UPDATE urunler SET ad = ?, tur = ? WHERE id = ? COLLATE NOCASE", // COLLATE NOCASE güncellemede de belirtilmeli
                [urun.ad, urun.tur, urun.id]
            );
            console.log(`Ürün başarıyla güncellendi (ID: ${urun.id}). Etkilenen satır sayısı: ${changes}`);
            return changes > 0;
        } catch (error) {
            console.error(`Ürün güncelleme hatası (ID: ${urun.id}):`, error.message);
            throw error;
        }
    });

    // Sayfa HTML getirme handler'ı (GÜNCELLENMİŞ)
  ipcMain.handle('get-page-html', (event, pageName) => {
    return new Promise((resolve, reject) => {
      const pagePath = path.join(__dirname, '../views', `${pageName}.html`);
      console.log(`HTML dosyası okunuyor: ${pagePath}`);
      fs.readFile(pagePath, 'utf8', (err, htmlContent) => {
        if (err) {
          console.error(`HTML dosyası okuma hatası (${pageName}.html):`, err);
          reject(new Error(`"${pageName}.html" dosyası okunamadı: ${err.message}`));
        } else {
          console.log(`${pageName}.html başarıyla okundu.`);
          resolve(htmlContent);
        }
      });
    });
  });

    // --- Birimler için Handler'lar ---
    ipcMain.handle('get-birimler', async (event) => {
        try {
            // SELECT * zaten cevrimKatsayisi sütununu da getirecektir.
            const birimler = await database.all("SELECT * FROM birimler ORDER BY birimAdi COLLATE NOCASE");
            console.log('Birimler başarıyla getirildi.');
            return birimler;
        } catch (error) {
            console.error('Birimleri getirme hatası:', error.message);
            throw error;
        }
    });

    ipcMain.handle('add-birim', async (event, birim) => {
        // birim objesi artık { birimAdi, kisaAd, anaBirimKisaAd, cevrimKatsayisi } içerecek
        try {
            const anaBirim = birim.anaBirimKisaAd ? birim.anaBirimKisaAd.trim() : null;
            const katsayi = birim.cevrimKatsayisi ? parseFloat(birim.cevrimKatsayisi) : 1;

            // Aynı birim adı veya kısa adın tekrar kaydedilmesini engellemek için
            // veritabanındaki UNIQUE kısıtlamalarına güveniyoruz (db.js'de tanımlı).
            // Ekstra kontrol istenirse buraya eklenebilir.

            const sql = `INSERT INTO birimler (birimAdi, kisaAd, anaBirimKisaAd, cevrimKatsayisi)
                   VALUES (?, ?, ?, ?)`;
            const params = [
                birim.birimAdi.trim(),
                birim.kisaAd.trim(),
                anaBirim,
                katsayi
            ];
            const lastID = await database.run(sql, params);
            console.log(`Birim başarıyla eklendi: ${birim.birimAdi}, Katsayı: ${katsayi}, ID: ${lastID}`);
            return lastID;
        } catch (error) {
            console.error('Birim ekleme hatası:', error.message);
            // UNIQUE constraint hatasını daha spesifik ele al
            if (error.message.includes('UNIQUE constraint failed')) {
                if (error.message.includes('birimler.birimAdi')) {
                    throw new Error(`"${birim.birimAdi.trim()}" adında bir birim zaten mevcut.`);
                } else if (error.message.includes('birimler.kisaAd')) {
                    throw new Error(`"${birim.kisaAd.trim()}" kısa adında bir birim zaten mevcut.`);
                } else {
                    throw new Error('Eklemeye çalıştığınız birim adı veya kısa adı zaten kullanılıyor.');
                }
            }
            throw error;
        }
    });

    ipcMain.handle('deleteBirim', async (event, birimId) => {
        try {
            // İlgili FOREIGN KEY kısıtlamaları (ON DELETE RESTRICT) db.js'de tanımlı olduğu için
            // veritabanı, bu birim başka tablolarda kullanılıyorsa silmeyi engelleyecektir.
            const changes = await database.run("DELETE FROM birimler WHERE id = ?", [birimId]);
            if (changes > 0) {
                console.log(`Birim silme işlemi tamamlandı (ID: ${birimId}).`);
                return true;
            } else {
                console.warn(`Birim silinirken kayıt bulunamadı (ID: ${birimId})`);
                throw new Error('Silinecek birim bulunamadı.');
            }
        } catch (error) {
            console.error(`Birim silme hatası (ID: ${birimId}):`, error.message);
            if (error.message.includes('FOREIGN KEY constraint failed')) {
                throw new Error('Bu birim başka kayıtlarda (Porsiyon, Reçete Detayı, Alım vb.) kullanıldığı için silinemez.');
            }
            throw error;
        }
    });

    ipcMain.handle('updateBirim', async (event, birim) => {
        // birim objesi: { id, birimAdi, kisaAd, anaBirimKisaAd, cevrimKatsayisi }
        try {
            const anaBirim = birim.anaBirimKisaAd ? birim.anaBirimKisaAd.trim() : null;
            const katsayi = birim.cevrimKatsayisi ? parseFloat(birim.cevrimKatsayisi) : 1;

            const sql = `
        UPDATE birimler SET
          birimAdi = ?,
          kisaAd = ?,
          anaBirimKisaAd = ?,
          cevrimKatsayisi = ?
        WHERE id = ?`;
            const params = [
                birim.birimAdi.trim(),
                birim.kisaAd.trim(),
                anaBirim,
                katsayi,
                birim.id
            ];
            const changes = await database.run(sql, params);
            if (changes > 0) {
                console.log(`Birim başarıyla güncellendi (ID: ${birim.id}).`);
                return true;
            } else {
                console.warn(`Birim güncellenirken kayıt bulunamadı veya veri değişmedi (ID: ${birim.id})`);
                // UNIQUE kısıtlamasını kontrol etmek için ekstra sorgu yapılabilir (ID hariç)
                // Ama şimdilik veritabanı hatasına güveniyoruz.
                throw new Error('Güncellenecek birim bulunamadı veya verilerde değişiklik yapılmadı.');
            }
        } catch (error) {
            console.error(`Birim güncelleme hatası (ID: ${birim.id}):`, error.message);
            if (error.message.includes('UNIQUE constraint failed')) {
                if (error.message.includes('birimler.birimAdi')) {
                    throw new Error(`"${birim.birimAdi.trim()}" adında başka bir birim zaten mevcut.`);
                } else if (error.message.includes('birimler.kisaAd')) {
                    throw new Error(`"${birim.kisaAd.trim()}" kısa adında başka bir birim zaten mevcut.`);
                } else {
                    throw new Error('Güncellemeye çalıştığınız birim adı veya kısa adı zaten başka bir birim tarafından kullanılıyor.');
                }
            }
            throw error;
        }
    });

    ipcMain.handle('exportMaliyetToExcel', async (event, data) => {
    // data: [{ urunAdi, porsiyonAdi, eskiTarih, eskiMaliyet, yeniTarih, yeniMaliyet, degisimYuzdesi }, ...]
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { success: false, message: 'Dışa aktarılacak veri bulunamadı.' };
    }

    try {
      // Kullanıcıya dosyayı nereye kaydedeceğini sor
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Maliyet Raporunu Kaydet',
        defaultPath: `maliyet_raporu_${new Date().toISOString().split('T')[0]}.xlsx`,
        filters: [{ name: 'Excel Dosyası', extensions: ['xlsx'] }]
      });

      if (canceled || !filePath) {
        console.log('Excel dışa aktarma işlemi kullanıcı tarafından iptal edildi.');
        return { success: false, message: 'İşlem iptal edildi.' };
      }

      const formatNumberForExcel_TR = (num) => {
        if (num === null || num === undefined || isNaN(parseFloat(num))) {
          return '-';
        }
        // Sayıyı string'e çevirip noktayı virgüle dönüştür
        return parseFloat(num).toFixed(2).replace('.', ',');
      };
      
      const formatPercentageForExcel_TR = (num) => {
        if (num === null || num === undefined || isNaN(parseFloat(num))) {
          return '-';
        }
        return parseFloat(num).toFixed(2).replace('.', ',') + '%';
      };

      // Excel için veri formatını hazırla (başlıklar ve satırlar)
      const worksheetData = [
        ["Ürün", "Porsiyon", "Eski Hesaplama Tarihi", "Eski Maliyet (₺)", "Yeni Hesaplama Tarihi", "Yeni Maliyet (₺)", "Değişim (%)"],
        ...data.map(item => [
          item.urunAdi,
          item.porsiyonAdi,
          item.eskiTarih ? formatDateForExcel(item.eskiTarih) : '-',
          formatNumberForExcel_TR(item.eskiMaliyet), // FORMATLAMA
          item.yeniTarih ? formatDateForExcel(item.yeniTarih) : '-',
          formatNumberForExcel_TR(item.yeniMaliyet), // FORMATLAMA
          formatPercentageForExcel_TR(item.degisimYuzdesi) // FORMATLAMA
        ])
      ];
      
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Sütun genişliklerini ayarla (isteğe bağlı ama daha iyi görünüm için)
      worksheet['!cols'] = [
        { wch: 30 }, // Ürün
        { wch: 20 }, // Porsiyon
        { wch: 20 }, // Eski Tarih
        { wch: 15 }, // Eski Maliyet
        { wch: 20 }, // Yeni Tarih
        { wch: 15 }, // Yeni Maliyet
        { wch: 15 }  // Değişim %
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'MaliyetRaporu');
      XLSX.writeFile(workbook, filePath);

      console.log('Maliyet raporu başarıyla Excel dosyasına aktarıldı:', filePath);
      return { success: true, path: filePath, message: 'Rapor başarıyla dışa aktarıldı.' };

    } catch (error) {
      console.error('Excel dışa aktarma hatası:', error);
      return { success: false, message: `Excel dosyası oluşturulurken bir hata oluştu: ${error.message}` };
    }
  });

    // Tarihi DD.MM.YYYY formatına çeviren yardımcı fonksiyon (main process için)
function formatDateForExcel(dateString) {
    if (!dateString) return '-';
    try {
        const dateObj = new Date(dateString);
        // Excel'in tarih olarak tanıması için YYYY-MM-DD formatını da kullanabiliriz
        // veya direkt string olarak DD.MM.YYYY. Şimdilik string.
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}.${month}.${year}`;
    } catch (e) {
        return dateString;
    }
}

    // Belirli bir türdeki ürünleri getirme isteğini dinle (örn: Sadece Son Ürünler)
    ipcMain.handle('get-urunler-by-tur', async (event, tur) => {
        try {
            const urunler = await database.all("SELECT * FROM urunler WHERE tur = ?", [tur]);
            console.log(`'${tur}' türündeki ürünler başarıyla getirildi. (${urunler.length} adet)`);
            return urunler;
        } catch (error) {
            console.error(`'${tur}' türündeki ürünleri getirme hatası:`, error.message);
            throw error;
        }
    });

    // Porsiyonları getirme isteğini dinle
    ipcMain.handle('getPorsiyonlar', async (event) => {
        try {
            const porsiyonlar = await database.all(`
            SELECT
              p.id,
              p.sonUrunId,
              u.ad AS sonUrunAdi,
              p.porsiyonAdi,
              p.satisBirimiKisaAd,
              p.varsayilanSatisFiyati
            FROM porsiyonlar p
            JOIN urunler u ON p.sonUrunId = u.id
          `);
            console.log('Porsiyonlar başarıyla getirildi.');
            return porsiyonlar;
        } catch (error) {
            console.error('Porsiyonlar getirme hatası:', error.message);
            throw error;
        }
    });

    ipcMain.handle('addPorsiyon', async (event, porsiyon) => {
        try {
            const lastID = await database.run("INSERT INTO porsiyonlar (sonUrunId, porsiyonAdi, satisBirimiKisaAd, varsayilanSatisFiyati) VALUES (?, ?, ?, ?)",
                [porsiyon.sonUrunId, porsiyon.porsiyonAdi, porsiyon.satisBirimiKisaAd, porsiyon.varsayilanSatisFiyati]);
            console.log(`Porsiyon başarıyla eklendi: ${porsiyon.porsiyonAdi}, ID: ${lastID}`);
            return lastID;
        } catch (error) {
            console.error('Porsiyon ekleme hatası:', error.message);
            throw error;
        }
    });

    // YENİ: Porsiyon silme handler'ı
    ipcMain.handle('deletePorsiyon', async (event, porsiyonId) => {
        try {
            // ÖNEMLİ: Bu porsiyonun herhangi bir reçetede kullanılıp kullanılmadığını kontrol et.
            // Eğer kullanılıyorsa, silme işlemi engellenmeli veya kullanıcıya çok net bir uyarı verilmeli.
            // Şimdilik, reçeteler tablosunda bu porsiyonId'yi arayalım.
            const recetelerdeKullanim = await database.get(
                "SELECT COUNT(id) AS count FROM receler WHERE porsiyonId = ?",
                [porsiyonId]
            );

            if (recetelerdeKullanim && recetelerdeKullanim.count > 0) {
                console.warn(`Porsiyon (ID: ${porsiyonId}) ${recetelerdeKullanim.count} adet reçetede kullanılıyor. Silme işlemi engellendi.`);
                throw new Error(`Bu porsiyon ${recetelerdeKullanim.count} adet reçetede kullanıldığı için silinemez. Önce ilgili reçeteleri düzenleyin veya silin.`);
            }

            // TODO: İleride bu porsiyonun 'satışlar' tablosunda kullanılıp kullanılmadığı da kontrol edilebilir.
            // Ancak satış kaydı geçmişe dönük bir veri olduğu için, porsiyonu silmek yerine "pasif" hale getirmek daha iyi bir seçenek olabilir.
            // Şimdilik sadece reçete kontrolü yapıyoruz.

            const changes = await database.run("DELETE FROM porsiyonlar WHERE id = ?", [porsiyonId]);
            if (changes > 0) {
                console.log(`Porsiyon silme işlemi tamamlandı (ID: ${porsiyonId}). Etkilenen satır sayısı: ${changes}`);
                return true; // Silme başarılı
            } else {
                console.warn(`Porsiyon silinirken kayıt bulunamadı (ID: ${porsiyonId})`);
                // Silinecek porsiyon bulunamadıysa.
                throw new Error('Silinecek porsiyon bulunamadı.');
            }
        } catch (error) {
            console.error(`Porsiyon silme hatası (ID: ${porsiyonId}):`, error.message);
            // Hata zaten anlamlı bir mesaj içeriyorsa olduğu gibi fırlat (örn: reçetede kullanım hatası)
            // Diğer beklenmedik SQLite veya veritabanı hataları için genel bir mesaj da eklenebilir.
            throw error;
        }
    });

    // YENİ: Porsiyon güncelleme handler'ı
    ipcMain.handle('updatePorsiyon', async (event, porsiyon) => { // porsiyon objesini (id dahil) alıyor
        try {
            // Gelen porsiyon objesi: { id, sonUrunId, porsiyonAdi, satisBirimiKisaAd, varsayilanSatisFiyati }
            // varsayilanSatisFiyati boş string ise null olarak kaydet
            const satisFiyatiToSave = (porsiyon.varsayilanSatisFiyati === '' || porsiyon.varsayilanSatisFiyati === null || isNaN(parseFloat(porsiyon.varsayilanSatisFiyati)))
                ? null
                : parseFloat(porsiyon.varsayilanSatisFiyati);

            // UNIQUE kısıtlamasını kontrol et: Aynı sonUrunId ve porsiyonAdi ile başka bir kayıt var mı (mevcut ID hariç)?
            const existingPorsiyon = await database.get(
                "SELECT id FROM porsiyonlar WHERE sonUrunId = ? AND porsiyonAdi = ? COLLATE NOCASE AND id != ?",
                [porsiyon.sonUrunId, porsiyon.porsiyonAdi, porsiyon.id]
            );

            if (existingPorsiyon) {
                // Seçilen son ürünün adını alıp daha iyi bir mesaj vermek için
                const sonUrun = await database.get("SELECT ad FROM urunler WHERE id = ?", [porsiyon.sonUrunId]);
                const sonUrunAdi = sonUrun ? sonUrun.ad : "Bilinmeyen Ürün";
                throw new Error(`"${sonUrunAdi}" ürünü için "${porsiyon.porsiyonAdi}" adında başka bir porsiyon zaten mevcut.`);
            }

            const changes = await database.run(
                "UPDATE porsiyonlar SET sonUrunId = ?, porsiyonAdi = ?, satisBirimiKisaAd = ?, varsayilanSatisFiyati = ? WHERE id = ?",
                [
                    porsiyon.sonUrunId,
                    porsiyon.porsiyonAdi,
                    porsiyon.satisBirimiKisaAd,
                    satisFiyatiToSave,
                    porsiyon.id
                ]
            );

            if (changes > 0) {
                console.log(`Porsiyon başarıyla güncellendi (ID: ${porsiyon.id}). Etkilenen satır sayısı: ${changes}`);
                return true;
            } else {
                console.warn(`Porsiyon güncellenirken kayıt bulunamadı veya veri değişmedi (ID: ${porsiyon.id})`);
                // Güncellenecek porsiyon bulunamadıysa veya gönderilen veriler mevcut verilerle aynıysa
                // 'changes' 0 olabilir. Bu durumu bir hata olarak değil, bir uyarı olarak ele alabiliriz.
                // throw new Error('Güncellenecek porsiyon bulunamadı veya verilerde değişiklik yapılmadı.');
                return false; // Değişiklik olmadıysa veya kayıt bulunamadıysa false dön.
            }
        } catch (error) {
            console.error(`Porsiyon güncelleme hatası (ID: ${porsiyon.id}):`, error.message);
            // UNIQUE constraint veya diğer özel hatalar zaten anlamlı bir mesajla fırlatılmış olabilir.
            // if (error.message.includes('FOREIGN KEY constraint failed')) { ... } gibi kontroller eklenebilir.
            throw error;
        }
    });

    // Reçeteler handler'ları
    ipcMain.handle('getReceteler', async (event) => {
        try {
            const receler = await database.all(`
            SELECT
              r.id,
              r.porsiyonId,
              p.porsiyonAdi,
              p.sonUrunId,
              u.ad AS sonUrunAdi,
              r.receteAdi,
             r.sonHesaplananMaliyet,
             r.maliyetHesaplamaTarihi
             FROM receler r
             JOIN porsiyonlar p ON r.porsiyonId = p.id
             JOIN urunler u ON p.sonUrunId = u.id
          `);
            console.log('Reçeteler başarıyla getirildi.');
            return receler;
        } catch (error) {
            console.error('Reçeteleri getirme hatası:', error.message);
            throw error;
        }
    });

    ipcMain.handle('addRecete', async (event, recete) => {
        try {
            const lastID = await database.run("INSERT INTO receler (porsiyonId, receteAdi) VALUES (?, ?)",
                [recete.porsiyonId, recete.receteAdi]);
            console.log(`Reçete başarıyla eklendi (Porsiyon ID: ${recete.porsiyonId}, Ad: ${recete.receteAdi}), ID: ${lastID}`);
            return lastID;
        } catch (error) {
            console.error('Reçete ekleme hatası:', error.message);
            throw error;
        }
    });

    ipcMain.handle('deleteRecete', async (event, receteId) => {
        try {
            const changes = await database.run("DELETE FROM receler WHERE id = ?", [receteId]);
            console.log(`Reçete başarıyla silindi (ID: ${receteId}). Etkilenen satır sayısı: ${changes}`);
            return changes > 0;
        } catch (error) {
            console.error('Reçete silme hatası (ID: ${receteId}):', error.message);
            throw error;
        }
    });

    // Ana Reçete Güncelleme handler'ı
    ipcMain.handle('updateRecete', async (event, recete) => {
        // Gelen recete objesi: { id, porsiyonId, receteAdi }
        try {
            // UNIQUE kısıtlaması (porsiyonId, receteAdi) için kontrol
            // Aynı porsiyona ait aynı isimde başka bir reçete var mı (mevcut ID hariç)?
            const existingRecete = await database.get(
                "SELECT id FROM receler WHERE porsiyonId = ? AND receteAdi = ? COLLATE NOCASE AND id != ?",
                [recete.porsiyonId, recete.receteAdi, recete.id]
            );

            if (existingRecete) {
                // Porsiyon adını alıp daha iyi bir mesaj vermek için
                const porsiyon = await database.get(
                    "SELECT p.porsiyonAdi, u.ad AS sonUrunAdi FROM porsiyonlar p JOIN urunler u ON p.sonUrunId = u.id WHERE p.id = ?",
                    [recete.porsiyonId]
                );
                const porsiyonTamAdi = porsiyon ? `${porsiyon.sonUrunAdi} - ${porsiyon.porsiyonAdi}` : "Bilinmeyen Porsiyon";
                throw new Error(`"${porsiyonTamAdi}" porsiyonu için "${recete.receteAdi}" adında başka bir reçete zaten mevcut.`);
            }

            const changes = await database.run(
                "UPDATE receler SET porsiyonId = ?, receteAdi = ? WHERE id = ?",
                [recete.porsiyonId, recete.receteAdi, recete.id]
            );

            if (changes > 0) {
                console.log(`Reçete başarıyla güncellendi (ID: ${recete.id}). Etkilenen satır sayısı: ${changes}`);
                return true;
            } else {
                console.warn(`Reçete güncellenirken kayıt bulunamadı veya veri değişmedi (ID: ${recete.id})`);
                return false; // Değişiklik olmadıysa veya kayıt bulunamadıysa false dön.
            }
        } catch (error) {
            console.error(`Reçete güncelleme hatası (ID: ${recete.id}):`, error.message);
            // UNIQUE constraint veya diğer özel hatalar zaten anlamlı bir mesajla fırlatılmış olabilir.
            // if (error.message.includes('FOREIGN KEY constraint failed')) { ... } (porsiyonId geçerli mi kontrolü)
            throw error;
        }
    });


    ipcMain.handle('getReceteDetaylari', async (event, receteId) => {
        try {
            const detaylar = await database.all(`
            SELECT
              rd.id,
              rd.receteId,
              rd.hammaddeId,
              u.ad AS hammaddeAdi,
              rd.miktar,
              rd.birimKisaAd,
              b.birimAdi AS birimAd
            FROM receteDetaylari rd
            JOIN urunler u ON rd.hammaddeId = u.id
            JOIN birimler b ON rd.birimKisaAd = b.kisaAd
            WHERE rd.receteId = ?
          `, [receteId]);
            console.log(`Reçete detayları başarıyla getirildi (Reçete ID: ${receteId}).`);
            return detaylar;
        } catch (error) {
            console.error(`Reçete detayları getirme hatası (Reçete ID: ${receteId}):`, error.message);
            throw error;
        }
    });

    ipcMain.handle('addReceteDetay', async (event, detay) => {
        try {
            const lastID = await database.run("INSERT INTO receteDetaylari (receteId, hammaddeId, miktar, birimKisaAd) VALUES (?, ?, ?, ?)",
                [detay.receteId, detay.hammaddeId, detay.miktar, detay.birimKisaAd]);
            console.log(`Reçete detayı başarıyla eklendi (Reçete ID: ${detay.receteId}, Hammadde ID: ${detay.hammaddeId}), ID: ${lastID}`);
            return lastID;
        } catch (error) {
            console.error('Reçete detayı ekleme hatası:', error.message);
            throw error;
        }
    });

    ipcMain.handle('deleteReceteDetay', async (event, detayId) => {
        try {
            const changes = await database.run("DELETE FROM receteDetaylari WHERE id = ?", [detayId]);
            console.log(`Reçete detayı başarıyla silindi (ID: ${detayId}). Etkilenen satır sayısı: ${changes}`);
            return changes > 0;
        } catch (error) {
            console.error(`Reçete detayı silme hatası (ID: ${detayId}):`, error.message);
            throw error;
        }
    });

    ipcMain.handle('updateReceteDetay', async (event, detay) => {
        try {
            const changes = await database.run(
                "UPDATE receteDetaylari SET hammaddeId = ?, miktar = ?, birimKisaAd = ? WHERE id = ?",
                [detay.hammaddeId, detay.miktar, detay.birimKisaAd, detay.id]
            );
            console.log(`Reçete detayı başarıyla güncellendi (ID: ${detay.id}). Etkilenen satır sayısı: ${changes}`);
            return changes > 0;
        } catch (error) {
            console.error(`Reçete detayı güncelleme hatası (ID: ${detay.id}):`, error.message);
            throw error;
        }
    });

    // --- Alımlar için Handler'lar ---
    ipcMain.handle('addAlim', async (event, alim) => {
        // alim objesi: { tarih, urunId, miktar, birimKisaAd, birimFiyat, toplamTutar, fisNo }
        try {
            const sql = `INSERT INTO alimlar (tarih, urunId, miktar, birimKisaAd, birimFiyat, toplamFiyat, fisNo)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`; // fisNo eklendi
            const params = [
                alim.tarih,
                alim.urunId,
                alim.miktar,
                alim.birimKisaAd,
                alim.birimFiyat,
                alim.toplamTutar,
                alim.fisNo // fisNo parametresi eklendi
            ];
            const lastID = await database.run(sql, params);
            console.log(`Alım başarıyla eklendi. ID: ${lastID}, Fiş No: ${alim.fisNo}`);
            return lastID;
        } catch (error) {
            console.error('Alım ekleme hatası:', error.message);
            if (error.message.includes('FOREIGN KEY constraint failed')) { /* ... (hata yönetimi aynı) ... */ }
            throw error;
        }
    });

    ipcMain.handle('getAlimlar', async (event) => {
        try {
            const sql = `
        SELECT
          a.id,
          a.tarih,
          a.urunId,
          u.ad AS urunAdi,
          u.tur AS urunTuru,
          a.miktar,
          a.birimKisaAd,
          b.birimAdi AS alimBirimAdi,
          a.birimFiyat,
          a.toplamFiyat AS toplamTutar,
          a.fisNo                             -- fisNo seçime eklendi
        FROM alimlar a
        JOIN urunler u ON a.urunId = u.id
        JOIN birimler b ON a.birimKisaAd = b.kisaAd
        ORDER BY a.tarih DESC, a.id DESC;
      `;
            const alimlar = await database.all(sql);
            console.log(`${alimlar.length} adet alım kaydı başarıyla getirildi.`);
            return alimlar;
        } catch (error) {
            console.error('Alımları getirme hatası:', error.message);
            throw error;
        }
    });

    // YENİ: Alım Silme Handler'ı
    ipcMain.handle('deleteAlim', async (event, alimId) => {
        try {
            // İleride bu alım kaydının başka bir yerde kullanılıp kullanılmadığı kontrol edilebilir (stok hareketleri vb.)
            // Şimdilik direkt silme yapıyoruz.
            const changes = await database.run("DELETE FROM alimlar WHERE id = ?", [alimId]);
            if (changes > 0) {
                console.log(`Alım kaydı başarıyla silindi (ID: ${alimId}).`);
                return true;
            } else {
                console.warn(`Alım kaydı silinirken bulunamadı (ID: ${alimId})`);
                throw new Error('Silinecek alım kaydı bulunamadı.');
            }
        } catch (error) {
            console.error(`Alım silme hatası (ID: ${alimId}):`, error.message);
            throw error;
        }
    });

    // YENİ: Alım Güncelleme Handler'ı
    ipcMain.handle('updateAlim', async (event, alim) => {
        // alim objesi: { id, tarih, urunId, miktar, birimKisaAd, birimFiyat, toplamTutar, fisNo }
        try {
            const sql = `
        UPDATE alimlar SET
          tarih = ?,
          urunId = ?,
          miktar = ?,
          birimKisaAd = ?,
          birimFiyat = ?,
          toplamFiyat = ?,
          fisNo = ?
        WHERE id = ?`;
            const params = [
                alim.tarih,
                alim.urunId,
                alim.miktar,
                alim.birimKisaAd,
                alim.birimFiyat,
                alim.toplamTutar,
                alim.fisNo,
                alim.id
            ];
            const changes = await database.run(sql, params);
            if (changes > 0) {
                console.log(`Alım kaydı başarıyla güncellendi (ID: ${alim.id}).`);
                return true;
            } else {
                console.warn(`Alım güncellenirken kayıt bulunamadı veya veri değişmedi (ID: ${alim.id})`);
                throw new Error('Güncellenecek alım kaydı bulunamadı veya verilerde değişiklik yapılmadı.');
            }
        } catch (error) {
            console.error(`Alım güncelleme hatası (ID: ${alim.id}):`, error.message);
            if (error.message.includes('FOREIGN KEY constraint failed')) { /* ... (hata yönetimi eklenebilir) ... */ }
            throw error;
        }
    });
    // --- Giderler için Handler'lar ---
    ipcMain.handle('addGider', async (event, gider) => {
        // gider objesi: { tarih, giderKalemi, tutar, aciklama }
        try {
            const sql = `INSERT INTO giderler (tarih, giderKalemi, tutar, aciklama)
                   VALUES (?, ?, ?, ?)`;
            const params = [
                gider.tarih,
                gider.giderKalemi,
                gider.tutar,
                gider.aciklama
            ];
            const lastID = await database.run(sql, params);
            console.log(`Gider başarıyla eklendi. ID: ${lastID}, Kalem: ${gider.giderKalemi}`);
            return lastID;
        } catch (error) {
            console.error('Gider ekleme hatası:', error.message);
            throw error;
        }
    });

    ipcMain.handle('getGiderler', async (event) => {
        try {
            const sql = `SELECT * FROM giderler ORDER BY tarih DESC, id DESC`;
            const giderler = await database.all(sql);
            console.log(`${giderler.length} adet gider kaydı başarıyla getirildi.`);
            return giderler;
        } catch (error) {
            console.error('Giderleri getirme hatası:', error.message);
            throw error;
        }
    });

    ipcMain.handle('updateGider', async (event, gider) => {
        // gider objesi: { id, tarih, giderKalemi, tutar, aciklama }
        try {
            const sql = `
        UPDATE giderler SET
          tarih = ?,
          giderKalemi = ?,
          tutar = ?,
          aciklama = ?
        WHERE id = ?`;
            const params = [
                gider.tarih,
                gider.giderKalemi,
                gider.tutar,
                gider.aciklama,
                gider.id
            ];
            const changes = await database.run(sql, params);
            if (changes > 0) {
                console.log(`Gider kaydı başarıyla güncellendi (ID: ${gider.id}).`);
                return true;
            } else {
                console.warn(`Gider güncellenirken kayıt bulunamadı veya veri değişmedi (ID: ${gider.id})`);
                throw new Error('Güncellenecek gider kaydı bulunamadı veya verilerde değişiklik yapılmadı.');
            }
        } catch (error) {
            console.error(`Gider güncelleme hatası (ID: ${gider.id}):`, error.message);
            throw error;
        }
    });

    ipcMain.handle('deleteGider', async (event, giderId) => {
        try {
            const changes = await database.run("DELETE FROM giderler WHERE id = ?", [giderId]);
            if (changes > 0) {
                console.log(`Gider kaydı başarıyla silindi (ID: ${giderId}).`);
                return true;
            } else {
                console.warn(`Gider kaydı silinirken bulunamadı (ID: ${giderId})`);
                throw new Error('Silinecek gider kaydı bulunamadı.');
            }
        } catch (error) {
            console.error(`Gider silme hatası (ID: ${giderId}):`, error.message);
            throw error;
        }
    });

    // --- Satışlar için Handler'lar ---
    ipcMain.handle('addSatis', async (event, satis) => {
        // satis objesi: { tarih, porsiyonId, miktar, satisFiyati, toplamSatisTutari, aciklama }
        try {
            const sql = `INSERT INTO satislar (tarih, porsiyonId, miktar, satisFiyati, toplamSatisTutari, aciklama)
                   VALUES (?, ?, ?, ?, ?, ?)`;
            const params = [
                satis.tarih,
                satis.porsiyonId,
                satis.miktar,
                satis.satisFiyati,
                satis.toplamSatisTutari, // JS'de hesaplanıp gönderilecek
                satis.aciklama
            ];
            const lastID = await database.run(sql, params);
            console.log(`Satış başarıyla eklendi. ID: ${lastID}, Porsiyon ID: ${satis.porsiyonId}`);
            return lastID;
        } catch (error) {
            console.error('Satış ekleme hatası:', error.message);
            if (error.message.includes('FOREIGN KEY constraint failed')) {
                throw new Error('Seçilen porsiyon geçerli değil veya bulunamadı.');
            }
            throw error;
        }
    });

    ipcMain.handle('getSatislar', async (event) => {
        try {
            // Satışları listelerken porsiyon adını ve son ürün adını da getirelim.
            const sql = `
        SELECT
          s.id,
          s.tarih,
          s.porsiyonId,
          p.porsiyonAdi,
          u.ad AS sonUrunAdi,
          s.miktar,
          s.satisFiyati,
          s.toplamSatisTutari,
          s.aciklama
        FROM satislar s
        JOIN porsiyonlar p ON s.porsiyonId = p.id
        JOIN urunler u ON p.sonUrunId = u.id
        ORDER BY s.tarih DESC, s.id DESC;
      `;
            const satislar = await database.all(sql);
            console.log(`${satislar.length} adet satış kaydı başarıyla getirildi.`);
            return satislar;
        } catch (error) {
            console.error('Satışları getirme hatası:', error.message);
            throw error;
        }
    });

    ipcMain.handle('updateSatis', async (event, satis) => {
        try {
            const sql = `
        UPDATE satislar SET
          tarih = ?,
          porsiyonId = ?,
          miktar = ?,
          satisFiyati = ?,
          toplamSatisTutari = ?,
          aciklama = ?
        WHERE id = ?`;
            const params = [
                satis.tarih,
                satis.porsiyonId,
                satis.miktar,
                satis.satisFiyati,
                satis.toplamSatisTutari,
                satis.aciklama,
                satis.id
            ];
            const changes = await database.run(sql, params);
            if (changes > 0) {
                console.log(`Satış kaydı başarıyla güncellendi (ID: ${satis.id}).`);
                return true;
            } else {
                throw new Error('Güncellenecek satış kaydı bulunamadı veya verilerde değişiklik yapılmadı.');
            }
        } catch (error) {
            console.error(`Satış güncelleme hatası (ID: ${satis.id}):`, error.message);
            if (error.message.includes('FOREIGN KEY constraint failed')) {
                throw new Error('Seçilen porsiyon geçerli değil veya bulunamadı.');
            }
            throw error;
        }
    });

    ipcMain.handle('deleteSatis', async (event, satisId) => {
        try {
            const changes = await database.run("DELETE FROM satislar WHERE id = ?", [satisId]);
            if (changes > 0) {
                console.log(`Satış kaydı başarıyla silindi (ID: ${satisId}).`);
                return true;
            } else {
                throw new Error('Silinecek satış kaydı bulunamadı.');
            }
        } catch (error) {
            console.error(`Satış silme hatası (ID: ${satisId}):`, error.message);
            throw error;
        }
    });

    // --- Ayarlar için Handler'lar ---
    ipcMain.handle('getAyar', async (event, anahtar) => {
        try {
            const sql = "SELECT deger FROM ayarlar WHERE anahtar = ?";
            const row = await database.get(sql, [anahtar]);
            if (row) {
                console.log(`Ayar getirildi: ${anahtar} = ${row.deger}`);
                return row.deger;
            } else {
                console.log(`Ayar bulunamadı: ${anahtar}`);
                return null; // Anahtar bulunamazsa null dön
            }
        } catch (error) {
            console.error(`Ayar (${anahtar}) getirme hatası:`, error.message);
            throw error;
        }
    });

    ipcMain.handle('setAyar', async (event, anahtar, deger) => {
        try {
            // INSERT OR REPLACE: Eğer anahtar varsa değeri günceller, yoksa yeni kayıt ekler.
            const sql = "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES (?, ?)";
            await database.run(sql, [anahtar, deger]);
            console.log(`Ayar güncellendi/eklendi: ${anahtar} = ${deger}`);
            return true;
        } catch (error) {
            console.error(`Ayar (${anahtar}) kaydetme hatası:`, error.message);
            throw error;
        }
    });

    // Belirli bir ürün için en son alım bilgilerini getir
    ipcMain.handle('getLatestAlimInfoForUrun', async (event, urunId) => {
        if (!urunId) {
            console.warn("getLatestAlimInfoForUrun çağrıldı ancak urunId sağlanmadı.");
            return null; // Veya uygun bir hata objesi
        }
        try {
            const sql = `
        SELECT birimFiyat, birimKisaAd
        FROM alimlar
        WHERE urunId = ?
        ORDER BY tarih DESC, id DESC  -- En son tarihi, aynı tarihte ise en son ekleneni al
        LIMIT 1;
      `;
            const alimInfo = await database.get(sql, [urunId]); // database.get tek bir satır döndürür
            console.log(`[IPC] Ürün ID ${urunId} için alımInfo:`, alimInfo); // EKLE
            if (alimInfo) {
                console.log(`Ürün ID ${urunId} için en son alım bilgisi: Fiyat=${alimInfo.birimFiyat}, Birim=${alimInfo.birimKisaAd}`);
                return {
                    alisFiyati: alimInfo.birimFiyat,
                    alisBirimiKisaAd: alimInfo.birimKisaAd
                };
            } else {
                console.log(`Ürün ID ${urunId} için alım kaydı bulunamadı.`);
                return null; // Eğer ürün için hiç alım yapılmamışsa null dön
            }
        } catch (error) {
            console.error(`Ürün ID ${urunId} için alım bilgisi getirme hatası:`, error.message);
            throw error; // Veya null dönüp renderer tarafında hata yönetimi
        }
    });

    // YENİ veya GÜNCELLENMİŞ: Reçete maliyetini logla ve ana reçete tablosunu güncelle
    ipcMain.handle('logAndUpdateReceteMaliyet', async (event, receteId, yeniMaliyet, hesaplamaTarihi) => {
        if (receteId == null || yeniMaliyet == null || !hesaplamaTarihi) {
            console.error("logAndUpdateReceteMaliyet için eksik parametreler:", { receteId, yeniMaliyet, hesaplamaTarihi });
            throw new Error("Maliyet kaydı için eksik parametreler.");
        }
        try {
            // 1. Yeni maliyeti maliyet_log tablosuna ekle
            const logSql = `INSERT INTO maliyet_log (receteId, hesaplamaTarihi, hesaplananMaliyet)
                      VALUES (?, ?, ?)`;
            const logParams = [receteId, hesaplamaTarihi, yeniMaliyet];
            const logId = await database.run(logSql, logParams);
            console.log(`Maliyet loguna eklendi. Log ID: ${logId}, Reçete ID: ${receteId}, Maliyet: ${yeniMaliyet}`);

            // 2. receler tablosundaki son maliyet ve tarih bilgilerini güncelle
            const updateReceteSql = `
        UPDATE receler SET
          sonHesaplananMaliyet = ?,
          maliyetHesaplamaTarihi = ?
        WHERE id = ?`;
            const updateReceteParams = [yeniMaliyet, hesaplamaTarihi, receteId];
            const changes = await database.run(updateReceteSql, updateReceteParams);

            if (changes > 0) {
                console.log(`Reçeteler tablosu güncellendi. Reçete ID: ${receteId}`);
                return { success: true, logId: logId, receteId: receteId };
            } else {
                // Bu durum, receteId bulunamazsa olabilir. Log yine de eklenmiş olacak.
                console.warn(`Reçeteler tablosunda Reçete ID ${receteId} güncellenirken bulunamadı veya değer değişmedi.`);
                // Başarılı loglama ama reçete güncelleme hatası durumunu ele alabiliriz.
                // Şimdilik log başarılıysa genel başarı kabul edelim.
                return { success: true, logId: logId, receteId: receteId, warning: "Reçete ana kaydı güncellenemedi." };
            }
        } catch (error) {
            console.error(`Reçete ID ${receteId} için maliyet loglama/güncelleme hatası:`, error.message);
            throw error;
        }
    });
    

    // Ek olarak, bir önceki maliyeti getirecek bir handler'a ihtiyacımız olacak
    // `toplu_maliyet.html`'de "Eski Fiyat/Tarih" göstermek için.
    ipcMain.handle('getPreviousMaliyetLog', async (event, receteId) => {
        if (!receteId) {
            console.warn("getPreviousMaliyetLog için receteId sağlanmadı.");
            return null;
        }
        try {
            // En sonuncudan bir önceki kaydı (yani ikinci en son kaydı) getir
            const sql = `
        SELECT hesaplamaTarihi, hesaplananMaliyet
        FROM maliyet_log
        WHERE receteId = ?
        ORDER BY hesaplamaTarihi DESC
        LIMIT 1 OFFSET 1; 
      `;
            // Eğer sadece bir kayıt varsa, OFFSET 1 sonuç döndürmez. Bu durumda receler tablosundaki
            // sonHesaplananMaliyet'ten farklı bir şey göstermek için bir mantık gerekebilir
            // veya en son kaydı alıp "önceki maliyet yok" diyebiliriz.
            // Şimdilik, eğer 2 veya daha fazla log varsa bir öncekini getirecek.
            const row = await database.get(sql, [receteId]);
            if (row) {
                return { tarih: row.hesaplamaTarihi, maliyet: row.hesaplananMaliyet };
            }
            // Eğer sadece 1 log varsa veya hiç log yoksa, receler tablosundaki mevcut maliyeti "eski" kabul edebiliriz.
            // Veya daha iyisi, receler tablosuna oncekiMaliyet ve oncekiMaliyetTarihi sütunlarını eklemekti.
            // Bu handler'ı şimdilik böyle bırakalım, renderer'da bu durumu ele alırız.
            console.log(`Reçete ID ${receteId} için bir önceki maliyet logu bulunamadı.`);
            return null;
        } catch (error) {
            console.error(`Reçete ID ${receteId} için önceki maliyet logu getirme hatası:`, error.message);
            throw error;
        }
    });

    // TODO: Diğer handler'lar buraya gelecek:
    // - Reçete düzenleme (updateRecete)
    // - Birim düzenleme
    // - Porsiyon silme/düzenleme
    // - Alım ekleme/silme/getirme handlerları
    // - Gider ekleme/silme/getirme handlerları
    // - Satış ekleme/silme/getirme handlerları
    // - Analiz handlerları
}

module.exports = {
    registerIpcHandlers
};