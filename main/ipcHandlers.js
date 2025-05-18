// main/ipcHandlers.js
// Renderer'dan gelen IPC mesajlarını işleyen handler'ları içerir.

const { ipcMain } = require('electron');
const database = require('./db'); // db modülümüzü içeri aktarıyoruz
const path = require('node:path'); // Dosya yolları için path modülü
const fs = require('node:fs').promises; // Dosya okuma için fs modülü (Promise versiyonu)

function registerIpcHandlers() {
  console.log("IPC handler'lar kaydediliyor...");

  // Ürünleri getirme isteğini dinle
  ipcMain.handle('get-urunler', async (event) => {
    try {
      // db modülündeki all fonksiyonunu kullanıyoruz
      const urunler = await database.all("SELECT * FROM urunler");
      console.log('Ürünler başarıyla getirildi.');
      return urunler;
    } catch (error) {
      console.error('Ürünleri getirme hatası:', error.message);
      // Hatayı Renderer'a iletmek için throw ediyoruz
      throw error;
    }
  });

  // Ürün ekleme isteğini dinle
  ipcMain.handle('add-urun', async (event, urun) => {
      try {
          // db modülündeki run fonksiyonunu kullanıyoruz
          // database.run zaten function() callback'i kullandığı için lastID'yi döndürecek.
          const lastID = await database.run("INSERT INTO urunler (ad, tur) VALUES (?, ?)",
                                             [urun.ad, urun.tur]);
          console.log(`├Ürün ba┼şar─▒yla eklendi: ${urun.ad}, ID: ${lastID}`);
          return lastID; // Eklenen ürünün ID'sini döndür
      } catch (error) {
          console.error('├Ürün ekleme hatas─▒:', error.message);
          throw error;
      }
  });

  // HTML dosyasının içeriğini getirme isteğini dinle
  ipcMain.handle('get-page-html', async (event, pageName) => {
      try {
          // __dirname ipcHandlers.js dosyasının bulunduğu main klasörünü temsil eder.
          // '../views' ile bir üst klasöre çıkıp views klasörüne gidiyoruz.
          const pagePath = path.join(__dirname, '../views', `${pageName}.html`);
          console.log(`HTML dosyas─▒ okunuyor: ${pagePath}`);
          const htmlContent = await fs.readFile(pagePath, 'utf8');
          console.log(`${pageName}.html ba┼şar─▒yla okundu.`);
          return htmlContent; // HTML içeriğini Renderer'a geri gönder
      } catch (error) {
          console.error(`HTML dosyas─▒ okuma hatas─▒ (${pageName}.html):`, error);
          throw new Error(`"${pageName}.html" dosyas─▒ okunamad─▒: ${error.message}`);
      }
  });

  // Birimleri getirme isteğini dinle
  ipcMain.handle('get-birimler', async (event) => {
      try {
          const birimler = await database.all("SELECT * FROM birimler");
          console.log('Birimler ba┼şar─▒yla getirildi.');
          return birimler;
      } catch (error) {
          console.error('Birimleri getirme hatas─▒:', error.message);
          throw error;
      }
  });

  // Birim ekleme isteğini dinle
  ipcMain.handle('add-birim', async (event, birim) => {
      try {
          const lastID = await database.run("INSERT INTO birimler (birimAdi, kisaAd, anaBirimKisaAd) VALUES (?, ?, ?)",
                                             [birim.birimAdi, birim.kisaAd, birim.anaBirimKisaAd]);
          console.log(`Birim ba┼şar─▒yla eklendi: ${birim.birimAdi}, ID: ${lastID}`);
          return lastID;
      } catch (error) {
          console.error('Birim ekleme hatas─▒:', error.message);
          throw error;
      }
  });

  // Belirli bir türdeki ürünleri getirme isteğini dinle (örn: Sadece Son Ürünler)
  ipcMain.handle('get-urunler-by-tur', async (event, tur) => {
      try {
          const urunler = await database.all("SELECT * FROM urunler WHERE tur = ?", [tur]);
          console.log(`'${tur}' türündeki ürünler ba┼şar─▒yla getirildi. (${urunler.length} adet)`);
          return urunler;
      } catch (error) {
          console.error(`'${tur}' türündeki ürünleri getirme hatas─▒:`, error.message);
          throw error;
      }
  });

  // Porsiyonları getirme isteğini dinle
  ipcMain.handle('getPorsiyonlar', async (event) => {
      try {
          // Porsiyonlarla birlikte ilgili Son ├Ürün ad─▒n─▒ da çekelim (JOIN kullanarak)
          const porsiyonlar = await database.all(`
            SELECT
              p.id,
              p.sonUrunId,
              u.ad AS sonUrunAdi, -- urunler tablosundaki ad─▒ 'sonUrunAdi' olarak al─▒yoruz
              p.porsiyonAdi,
              p.satisBirimiKisaAd,
              p.varsayilanSatisFiyati
            FROM porsiyonlar p
            JOIN urunler u ON p.sonUrunId = u.id
          `);
          console.log('Porsiyonlar ba┼şar─▒yla getirildi.');
          return porsiyonlar;
      } catch (error) {
          console.error('Porsiyonlar getirme hatas─▒:', error.message);
          throw error;
      }
  });

  // Porsiyon ekleme isteğini dinle
  ipcMain.handle('addPorsiyon', async (event, porsiyon) => {
      try {
          const lastID = await database.run("INSERT INTO porsiyonlar (sonUrunId, porsiyonAdi, satisBirimiKisaAd, varsayilanSatisFiyati) VALUES (?, ?, ?, ?)",
                                             [porsiyon.sonUrunId, porsiyon.porsiyonAdi, porsiyon.satisBirimiKisaAd, porsiyon.varsayilanSatisFiyati]);
          console.log(`Porsiyon ba┼şar─▒yla eklendi: ${porsiyon.porsiyonAdi}, ID: ${lastID}`);
          return lastID;
      } catch (error) {
          console.error('Porsiyon ekleme hatas─▒:', error.message);
          throw error;
      }
  });

  // ├Ürün silme iste─ğini dinle (Bu handler'da this.changes'a ihtiyac─▒m─▒z var)
  ipcMain.handle('deleteUrun', async (event, urunId) => {
      try {
          // database.run fonksiyonu silme durumunda this.changes dönecek şekilde ayarland─▒.
           // database.run'─▒n dönen de─ğerinde this.changes mevcut olacak.
          const changes = await database.run("DELETE FROM urunler WHERE id = ?", [urunId]); // <-- database.run kullan─▒l─▒yor

          console.log(`├Ürün silme i┼şlemi tamamland─▒ (ID: ${urunId}). Etkilenen sat─▒r say─▒s─▒: ${changes}`);

          // E─ğer 1 veya daha fazla sat─▒r silindiyse ba┼şar─▒l─▒ say
          return changes > 0;

      } catch (error) {
          console.error(`Genel Hata Yakaland─▒ (├Ürün Silme Handler, ID: ${urunId}):`, error);
           // Hatay─▒ Renderer'a iletmek için throw ediyoruz
          throw error;
      }
  });


  // Reçeteleri getirme isteğini dinle (Porsiyon Ad─▒ ve Son ├Ürün Ad─▒ ile birlikte)
  ipcMain.handle('getReceteler', async (event) => {
      try {
          const receler = await database.all(`
            SELECT
              r.id,
              r.porsiyonId,
              p.porsiyonAdi,        -- porsiyonlar tablosundan
              p.sonUrunId,          -- porsiyonlar tablosundan
              u.ad AS sonUrunAdi,   -- urunler tablosundan (JOIN porsiyonlar -> urunler)
              r.receteAdi
            FROM receler r
            JOIN porsiyonlar p ON r.porsiyonId = p.id
            JOIN urunler u ON p.sonUrunId = u.id
          `);
          console.log('Reçeteler ba┼şar─▒yla getirildi.');
          return receler;
      } catch (error) {
          console.error('Reçeteleri getirme hatas─▒:', error.message);
          throw error;
      }
  });

  // Reçete ekleme isteğini dinle
  ipcMain.handle('addRecete', async (event, recete) => {
      try {
          const lastID = await database.run("INSERT INTO receler (porsiyonId, receteAdi) VALUES (?, ?)",
                                             [recete.porsiyonId, recete.receteAdi]);
          console.log(`Reçete ba┼şar─▒yla eklendi (Porsiyon ID: ${recete.porsiyonId}, Ad: ${recete.receteAdi}), ID: ${lastID}`);
          return lastID;
      } catch (error) {
          console.error('Reçete ekleme hatas─▒:', error.message);
          throw error;
      }
  });

  // Belirli bir reçetenin detaylar─▒n─▒ getirme iste─ğini dinle
  ipcMain.handle('getReceteDetaylari', async (event, receteId) => {
      try {
          // Reçete detaylar─▒ ile birlikte Hammadde Ad─▒ ve Birim bilgisi çekelim
          const detaylar = await database.all(`
            SELECT
              rd.id,
              rd.receteId,
              rd.hammaddeId,
              u.ad AS hammaddeAdi,      -- urunler tablosundan (JOIN receteDetaylari -> urunler)
              rd.miktar,
              rd.birimKisaAd,
              b.birimAdi AS birimAd     -- birimler tablosundan (JOIN receteDetaylari -> birimler)
            FROM receteDetaylari rd
            JOIN urunler u ON rd.hammaddeId = u.id
            JOIN birimler b ON rd.birimKisaAd = b.kisaAd
            WHERE rd.receteId = ?
          `, [receteId]);
          console.log(`Reçete detaylar─▒ ba┼şar─▒yla getirildi (Reçete ID: ${receteId}).`);
          return detaylar;
      } catch (error) {
          console.error(`Reçete detaylar─▒ getirme hatas─▒ (Reçete ID: ${receteId}):`, error.message);
          throw error;
      }
  });

  // Reçete detaya─ğ─▒ ekleme iste─ğini dinle (Hammadde, Miktar, Birim)
  ipcMain.handle('addReceteDetay', async (event, detay) => {
      try {
          const lastID = await database.run("INSERT INTO receteDetaylari (receteId, hammaddeId, miktar, birimKisaAd) VALUES (?, ?, ?, ?)",
                                             [detay.receteId, detay.hammaddeId, detay.miktar, detay.birimKisaAd]);
          console.log(`Reçete detaya─ğ─▒ ba┼şar─▒yla eklendi (Reçete ID: ${detay.receteId}, Hammadde ID: ${detay.hammaddeId}), ID: ${lastID}`);
          return lastID;
      } catch (error) {
          console.error('Reçete detaya─ğ─▒ ekleme hatas─▒:', error.message);
          throw error;
      }
  });

  // Reçete detaya─ğ─▒ silme iste─ğini dinle
   ipcMain.handle('deleteReceteDetay', async (event, detayId) => {
      try {
           // database.run fonksiyonu silme durumunda this.changes dönecek şekilde ayarl─▒.
           const changes = await database.run("DELETE FROM receteDetaylari WHERE id = ?", [detayId]);
           console.log(`Reçete detaya─ğ─▒ ba┼şar─▒yla silindi (ID: ${detayId}). Etkilenen sat─▒r say─▒s─▒: ${changes}`);
           return changes > 0; // 1 veya daha fazla sat─▒r silindiyse true döndür
      } catch (error) {
           console.error(`Reçete detaya─ğ─▒ silme hatas─▒ (ID: ${detayId}):`, error.message);
           throw error;
      }
  });

  ipcMain.handle('deleteRecete', async (event, receteId) => {
      try {
           // database.run fonksiyonu silme durumunda this.changes dönecek şekilde ayarlı.
           const changes = await database.run("DELETE FROM receler WHERE id = ?", [receteId]);
           console.log(`Reçete başarıyla silindi (ID: ${receteId}). Etkilenen satır sayısı: ${changes}`);
           return changes > 0; // 1 veya daha fazla satır silindiyse true döndür
      } catch (error) {
           console.error(`Reçete silme hatası (ID: ${receteId}):`, error.message);
           throw error;
      }
  });

    // Reçete detayı güncelleme isteğini dinle
  ipcMain.handle('updateReceteDetay', async (event, detay) => { // Detay objesini (id dahil) alıyor
      try {
           // database.run fonksiyonu güncelleme durumunda this.changes dönecek şekilde ayarlı.
           const changes = await database.run(
               "UPDATE receteDetaylari SET hammaddeId = ?, miktar = ?, birimKisaAd = ? WHERE id = ?",
               [detay.hammaddeId, detay.miktar, detay.birimKisaAd, detay.id]
           );
           console.log(`Reçete detayı başarıyla güncellendi (ID: ${detay.id}). Etkilenen satır sayısı: ${changes}`);
           return changes > 0; // 1 veya daha fazla satır etkilendiyse true döndür
      } catch (error) {
           console.error(`Reçete detayı güncelleme hatası (ID: ${detay.id}):`, error.message);
           throw error;
      }
  });
  
  // TODO: Diğer handler'lar buraya gelecek:
  // - Reçete silme (deleteRecete)
  // - Birim silme (delete-birim)
  // - Porsiyon silme (delete-porsiyon)
  // - Reçete düzenleme/detay düzenleme handlerlar─▒
  // - Al─▒m ekleme/silme/getirme handlerlar─▒
  // - Gider ekleme/silme/getirme handlerlar─▒
  // - Sat─▒┼ş ekleme/silme/getirme handlerlar─▒
  // - Analiz handlerlar─▒
}

module.exports = {
  registerIpcHandlers // registerIpcHandlers fonksiyonunu d─▒┼şar─▒ya aktar─▒yoruz
};