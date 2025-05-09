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