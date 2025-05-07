// main/ipcHandlers.js
const { ipcMain } = require('electron');
const database = require('./db'); // db modülümüzü içeri aktarıyoruz
const path = require('node:path'); // <-- BU SATIRI EKLEYİN
const fs = require('node:fs').promises; // <-- BU SATIRI EKLEYİN
const sqlite3 = require('sqlite3');

function registerIpcHandlers() {
  // Örnek: Ürünleri getirme isteğini dinle
  ipcMain.handle('get-urunler', async (event) => {
    try {
      // db modülündeki all fonksiyonunu kullanıyoruz
      const urunler = await database.all("SELECT * FROM urunler");
      console.log('Ürünler başarıyla getirildi.');
      return urunler; // Promise otomatik çözülür
    } catch (error) {
      console.error('Ürünleri getirme hatası:', error.message);
      // Hatayı Renderer'a iletmek için throw ediyoruz
      throw error;
    }
  });

  // Örnek: Ürün ekleme isteğini dinle
  ipcMain.handle('add-urun', async (event, urun) => {
      try {
          // db modülündeki run fonksiyonunu kullanıyoruz
          const lastID = await database.run("INSERT INTO urunler (ad, tur) VALUES (?, ?)",
                                             [urun.ad, urun.tur]);
          console.log(`Ürün başarıyla eklendi: ${urun.ad}, ID: ${lastID}`);
          return lastID; // Eklenen ürünün ID'sini döndür
      } catch (error) {
          console.error('Ürün ekleme hatası:', error.message);
          // Hatayı Renderer'a iletmek için throw ediyoruz
          throw error;
      }
  });

  // HTML dosyasının içeriğini getirme isteğini dinle
  ipcMain.handle('get-page-html', async (event, pageName) => {
    try {
        const pagePath = path.join(__dirname, '../views', `${pageName}.html`);
        console.log(`HTML dosyası okunuyor: ${pagePath}`);
        const htmlContent = await fs.readFile(pagePath, 'utf8');
        console.log(`${pageName}.html başarıyla okundu.`);
        return htmlContent; // HTML içeriğini Renderer'a geri gönder
    } catch (error) {
        console.error(`HTML dosyası okuma hatası (${pageName}.html):`, error);
        // Hata durumunda Renderer'a boş içerik veya hata iletmek yerine hata atalım
        throw new Error(`"${pageName}.html" dosyası okunamadı: ${error.message}`);
    }
});

ipcMain.handle('get-birimler', async (event) => {
  try {
      const birimler = await database.all("SELECT * FROM birimler");
      console.log('Birimler başarıyla getirildi.');
      return birimler;
  } catch (error) {
      console.error('Birimleri getirme hatası:', error.message);
      throw error; // Hatayı Renderer'a ilet
  }
});

// Birim ekleme isteğini dinle
ipcMain.handle('add-birim', async (event, birim) => {
  try {
      // Veritabanına yeni birim ekle
      const lastID = await database.run("INSERT INTO birimler (birimAdi, kisaAd, anaBirimKisaAd) VALUES (?, ?, ?)",
                                         [birim.birimAdi, birim.kisaAd, birim.anaBirimKisaAd]);
      console.log(`Birim başarıyla eklendi: ${birim.birimAdi}, ID: ${lastID}`);
      return lastID; // Eklenen birimin ID'sini döndür
  } catch (error) {
      console.error('Birim ekleme hatası:', error.message);
      throw error; // Hatayı Renderer'a ilet
  }
});

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

// Ürün silme isteğini dinle
ipcMain.handle('deleteUrun', async (event, urunId) => {
  try {
      // Veritabanından ürünü sil
      // db.run komutu silinen satır sayısını this.changes ile verir.
      // function(err) callback'i kullanmalıyız.
      return new Promise((resolve, reject) => {
          database.db.run("DELETE FROM urunler WHERE id = ?", [urunId], function(err) { // <-- database.db'yi kullanıyoruz
              if (err) {
                  console.error(`Ürün silme hatası (ID: ${urunId}):`, err.message);
                  reject(err); // Hatayı Renderer'a ilet
              } else {
                   console.log(`Ürün başarıyla silindi (ID: ${urunId}). Silinen satır sayısı: ${this.changes}`);
                   // Silme başarılıysa ve en az 1 satır etkilendiyse true döndür
                   resolve(this.changes > 0);
              }
          });
      });

  } catch (error) {
      console.error(`Genel Hata Yakalandı (Ürün Silme Handler, ID: ${urunId}):`, error);
      throw error; // Hatayı Renderer'a ilet
  }
});

  // TODO: Diğer handler'ları buraya ekleyeceğiz:
  // - Birimleri getirme (get-birimler)
  // - Birim ekleme (add-birim)
  // - Porsiyonları getirme (get-porsiyonlar)
  // - Porsiyon ekleme (add-porsiyon)
  // - Reçete ekleme (add-recete)
  // - Reçete detay ekleme (add-recete-detay)
  // - Alım ekleme (add-alim)
  // - Gider ekleme (add-gider)
  // - Satış ekleme (add-satis)
  // - Analiz handler'ları (get-maliyet, get-kar, etc.)
}

module.exports = {
  registerIpcHandlers // registerIpcHandlers fonksiyonunu dışarıya aktarıyoruz
};