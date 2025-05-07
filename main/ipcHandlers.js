// main/ipcHandlers.js
const { ipcMain } = require('electron');
const database = require('./db'); // db modülümüzü içeri aktarıyoruz
const path = require('node:path'); // <-- BU SATIRI EKLEYİN
const fs = require('node:fs').promises; // <-- BU SATIRI EKLEYİN

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