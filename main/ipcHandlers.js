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
          console.log(`Ürün başarıyla eklendi: ${urun.ad}, ID: ${lastID}`);
          return lastID; // Eklenen ürünün ID'sini döndür
      } catch (error) {
          console.error('Ürün ekleme hatası:', error.message);
          throw error;
      }
  });

  // HTML dosyasının içeriğini getirme isteğini dinle
  ipcMain.handle('get-page-html', async (event, pageName) => {
      try {
          // __dirname ipcHandlers.js dosyasının bulunduğu main klasörünü temsil eder.
          // '../views' ile bir üst klasöre çıkıp views klasörüne gidiyoruz.
          const pagePath = path.join(__dirname, '../views', `${pageName}.html`);
          console.log(`HTML dosyası okunuyor: ${pagePath}`);
          const htmlContent = await fs.readFile(pagePath, 'utf8');
          console.log(`${pageName}.html başarıyla okundu.`);
          return htmlContent; // HTML içeriğini Renderer'a geri gönder
      } catch (error) {
          console.error(`HTML dosyası okuma hatası (${pageName}.html):`, error);
          throw new Error(`"${pageName}.html" dosyası okunamadı: ${error.message}`);
      }
  });

  // Birimleri getirme isteğini dinle
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

  // Birim ekleme isteğini dinle
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
          // Porsiyonlarla birlikte ilgili Son Ürünün adını da çekelim (JOIN kullanarak)
          const porsiyonlar = await database.all(`
            SELECT
              p.id,
              p.sonUrunId,
              u.ad AS sonUrunAdi, -- urunler tablosundaki adı 'sonUrunAdi' olarak alıyoruz
              p.porsiyonAdi,
              p.satisBirimiKisaAd,
              p.varsayilanSatisFiyati
            FROM porsiyonlar p
            JOIN urunler u ON p.sonUrunId = u.id
          `);
          console.log('Porsiyonlar başarıyla getirildi.');
          return porsiyonlar;
      } catch (error) {
          console.error('Porsiyonları getirme hatası:', error.message);
          throw error;
      }
  });

  // Porsiyon ekleme isteğini dinle
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

  // <-- Ürün silme isteğini dinle (Bu handler'da this.changes'a ihtiyacımız var) -->
  ipcMain.handle('deleteUrun', async (event, urunId) => {
      try {
          // database.run fonksiyonu zaten Promise döndürüyor ve silinen satır sayısını (this.changes) döndürecek şekilde ayarlandı.
          // database.run'ın dönen değeri this.lastID || this.changes idi. DELETE için this.lastID null, this.changes geçerli olur.
          const changes = await database.run("DELETE FROM urunler WHERE id = ?", [urunId]); // <-- database.run kullanılıyor

          console.log(`Ürün silme işlemi tamamlandı (ID: ${urunId}). Etkilenen satır sayısı: ${changes}`);

          // Eğer 1 veya daha fazla satır silindiyse başarılı say
          return changes > 0;

      } catch (error) {
          console.error(`Genel Hata Yakalandı (Ürün Silme Handler, ID: ${urunId}):`, error);
           // Hata durumunda Renderer'a iletmek için throw ediyoruz
          throw error;
      }
  });

  // Reçeteleri getirme isteğini dinle (Porsiyon Adı ve Son Ürün Adı ile birlikte)
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
          console.log('Reçeteler başarıyla getirildi.');
          return receler;
      } catch (error) {
          console.error('Reçeteleri getirme hatası:', error.message);
          throw error;
      }
  });

  // Reçete ekleme isteğini dinle
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

  // Belirli bir reçetenin detaylarını getirme isteğini dinle
  ipcMain.handle('getReceteDetaylari', async (event, receteId) => {
      try {
          // Reçete detayları ile birlikte Hammadde Adı ve Birim bilgisi çekelim
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
          console.log(`Reçete detayları başarıyla getirildi (Reçete ID: ${receteId}).`);
          return detaylar;
      } catch (error) {
          console.error(`Reçete detayları getirme hatası (Reçete ID: ${receteId}):`, error.message);
          throw error;
      }
  });

  // Reçete detayı ekleme isteğini dinle (Hammadde, Miktar, Birim)
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

  // Reçete detayı silme isteğini dinle
   ipcMain.handle('deleteReceteDetay', async (event, detayId) => {
      try {
           // database.run fonksiyonu silme durumunda this.changes dönecek şekilde ayarlı.
           const changes = await database.run("DELETE FROM receteDetaylari WHERE id = ?", [detayId]);
           console.log(`Reçete detayı başarıyla silindi (ID: ${detayId}). Etkilenen satır sayısı: ${changes}`);
           return changes > 0; // 1 veya daha fazla satır silindiyse true döndür
      } catch (error) {
           console.error(`Reçete detayı silme hatası (ID: ${detayId}):`, error.message);
           throw error;
      }
  });

  // TODO: Diğer handler'lar buraya gelecek:
  // - Birim silme (delete-birim)
  // - Porsiyon silme (delete-porsiyon)
  // - Reçete ekleme/silme/getirme handlerları
  // - Alım ekleme/silme/getirme handlerları
  // - Gider ekleme/silme/getirme handlerları
  // - Satış ekleme/silme/getirme handlerları
  // - Analiz handlerları
}

module.exports = {
  registerIpcHandlers // registerIpcHandlers fonksiyonunu dışarıya aktarıyoruz
};