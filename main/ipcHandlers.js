// main/ipcHandlers.js
// Renderer'dan gelen IPC mesajlarını işleyen handler'ları içerir.

const { ipcMain } = require('electron');
const database = require('./db'); // db modülümüzü içeri aktarıyoruz
const path = require('node:path'); // Dosya yolları için path modülü
const fs = require('node:fs').promises; // Dosya okuma için fs modülü (Promise versiyonu)

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


    // Sayfa HTML getirme handler'ı
    ipcMain.handle('get-page-html', async (event, pageName) => {
        try {
            const pagePath = path.join(__dirname, '../views', `${pageName}.html`);
            console.log(`HTML dosyası okunuyor: ${pagePath}`);
            const htmlContent = await fs.readFile(pagePath, 'utf8');
            console.log(`${pageName}.html başarıyla okundu.`);
            return htmlContent;
        } catch (error) {
            console.error(`HTML dosyası okuma hatası (${pageName}.html):`, error);
            throw new Error(`"${pageName}.html" dosyası okunamadı: ${error.message}`);
        }
    });

    // Birimler handler'ları
    ipcMain.handle('get-birimler', async (event) => {
        try {
            const birimler = await database.all("SELECT * FROM birimler");
            console.log('Birimler başarıyla getirildi.');
            return birimler;
        } catch (error) {
            console.error('Birimleri getirme hatası:', error.message);
            throw error;
        }
    });

    ipcMain.handle('add-birim', async (event, birim) => {
        try {
            const lastID = await database.run("INSERT INTO birimler (birimAdi, kisaAd, anaBirimKisaAd) VALUES (?, ?, ?)",
                [birim.birimAdi, birim.kisaAd, birim.anaBirimKisaAd]);
            console.log(`Birim başarıyla eklendi: ${birim.birimAdi}, ID: ${lastID}`);
            return lastID;
        } catch (error) {
            console.error('Birim ekleme hatası:', error.message);
            throw error;
        }
    });

    // YENİ: Birim güncelleme handler'ı
    ipcMain.handle('updateBirim', async (event, birim) => { // birim objesini (id dahil) alıyor
        try {
            // Ana birim kisa adı boş string ise null olarak kaydet
            const anaBirimKisaAdToSave = birim.anaBirimKisaAd === '' ? null : birim.anaBirimKisaAd;

            // UNIQUE kısıtlamalarını kontrol etmek için, güncelleme yapmadan önce
            // aynı birimAdi veya kisaAd ile başka bir birim var mı diye bakabiliriz (mevcut ID hariç).
            // Şimdilik veritabanının UNIQUE kısıtlamasına güveniyoruz.
            const changes = await database.run(
                "UPDATE birimler SET birimAdi = ?, kisaAd = ?, anaBirimKisaAd = ? WHERE id = ?",
                [birim.birimAdi, birim.kisaAd, anaBirimKisaAdToSave, birim.id]
            );
            if (changes > 0) {
                console.log(`Birim başarıyla güncellendi (ID: ${birim.id}). Etkilenen satır sayısı: ${changes}`);
                return true;
            } else {
                console.warn(`Birim güncellenirken kayıt bulunamadı veya veri değişmedi (ID: ${birim.id})`);
                // Güncellenecek birim bulunamadıysa veya gönderilen veriler mevcut verilerle aynıysa
                // 'changes' 0 olabilir. Bu durumu bir hata olarak değil, bir uyarı olarak ele alabiliriz.
                // Ya da renderer tarafında, gerçekten bir değişiklik yapılıp yapılmadığına bakılabilir.
                // Şimdilik, değişiklik olmadıysa false dönüyoruz. İsteğe bağlı olarak hata da fırlatılabilir.
                // throw new Error('Güncellenecek birim bulunamadı veya verilerde değişiklik yapılmadı.');
                return false;
            }
        } catch (error) {
            console.error(`Birim güncelleme hatası (ID: ${birim.id}):`, error.message);
            // UNIQUE constraint hatasını daha spesifik ele alabiliriz
            if (error.message.includes('UNIQUE constraint failed')) {
                if (error.message.includes('birimler.birimAdi')) {
                    throw new Error(`"${birim.birimAdi}" adında başka bir birim zaten mevcut.`);
                } else if (error.message.includes('birimler.kisaAd')) {
                    throw new Error(`"${birim.kisaAd}" kısa adında başka bir birim zaten mevcut.`);
                } else {
                    throw new Error('Güncellemeye çalıştığınız birim adı veya kısa adı zaten başka bir birim tarafından kullanılıyor.');
                }
            }
            // TODO: Yabancı anahtar hatasını da yakalayabiliriz (ana birim bulunamadığında)
            // if (error.message && error.message.includes('FOREIGN KEY constraint failed')) { ... }
            throw error; // Diğer hataları olduğu gibi fırlat
        }
    });

    // YENİ: Birim silme handler'ı
    ipcMain.handle('deleteBirim', async (event, birimId) => {
        try {
            // TODO: İleride bu birimin porsiyonlarda veya reçete detaylarında kullanılıp kullanılmadığını kontrol et.
            // Eğer kullanılıyorsa, silme işlemi engellenmeli veya kullanıcıya uyarı verilmeli.
            // Şimdilik basit silme yapıyoruz.
            const changes = await database.run("DELETE FROM birimler WHERE id = ?", [birimId]);
            console.log(`Birim silme işlemi tamamlandı (ID: ${birimId}). Etkilenen satır sayısı: ${changes}`);
            return changes > 0; // Silme başarılıysa true, değilse false döner
        } catch (error) {
            console.error(`Birim silme hatası (ID: ${birimId}):`, error.message);
            // FOREIGN KEY constraint failed hatasını kontrol et
            if (error.message.includes('FOREIGN KEY constraint failed')) {
                throw new Error('Bu birim başka kayıtlarda (örn: Porsiyonlar, Reçete Detayları) kullanıldığı için silinemez.');
            }
            throw error; // Diğer hataları olduğu gibi fırlat
        }
    });

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
              r.receteAdi
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