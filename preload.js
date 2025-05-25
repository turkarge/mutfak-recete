const { contextBridge, ipcRenderer } = require('electron');

// Renderer süreci için güvenli bir API sunuyoruz
contextBridge.exposeInMainWorld('electronAPI', {

  // Giriş Kontrolü
  checkLogin: (username, password) => ipcRenderer.invoke('checkLogin', username, password),

  // Başarılı Giriş Mesajı Gönderme
  sendLoginSuccess: () => ipcRenderer.send('login-successful'),

  // Ürünler handler'ları
  getUrunler: () => ipcRenderer.invoke('get-urunler'),
  addUrun: (urun) => ipcRenderer.invoke('add-urun', urun),
  deleteUrun: (urunId) => ipcRenderer.invoke('deleteUrun', urunId),
  updateUrun: (urun) => ipcRenderer.invoke('updateUrun', urun), // updateUrun eklenmişti, onu da ekleyelim

  // Sayfa HTML getirme handler'ı
  getPageHtml: (pageName) => ipcRenderer.invoke('get-page-html', pageName),

  // Birimler handler'ları
  getBirimler: () => ipcRenderer.invoke('get-birimler'),
  addBirim: (birim) => ipcRenderer.invoke('add-birim', birim),
  updateBirim: (birim) => ipcRenderer.invoke('updateBirim', birim),
  deleteBirim: (birimId) => ipcRenderer.invoke('deleteBirim', birimId), // YENİ: Birim silme

  // Porsiyonlar handler'ları
  getUrunlerByTur: (tur) => ipcRenderer.invoke('get-urunler-by-tur', tur),
  getPorsiyonlar: () => ipcRenderer.invoke('getPorsiyonlar'),
  addPorsiyon: (porsiyon) => ipcRenderer.invoke('addPorsiyon', porsiyon),
  deletePorsiyon: (porsiyonId) => ipcRenderer.invoke('deletePorsiyon', porsiyonId),
  updatePorsiyon: (porsiyon) => ipcRenderer.invoke('updatePorsiyon', porsiyon),

  // Reçeteler handler'ları
  getReceteler: () => ipcRenderer.invoke('getReceteler'),
  addRecete: (recete) => ipcRenderer.invoke('addRecete', recete),
  deleteRecete: (receteId) => ipcRenderer.invoke('deleteRecete', receteId),
  updateRecete: (recete) => ipcRenderer.invoke('updateRecete', recete), // YENİ: Ana Reçete güncelleme
  getReceteDetaylari: (receteId) => ipcRenderer.invoke('getReceteDetaylari', receteId),
  addReceteDetay: (detay) => ipcRenderer.invoke('addReceteDetay', detay),
  deleteReceteDetay: (detayId) => ipcRenderer.invoke('deleteReceteDetay', detayId),
  updateReceteDetay: (detay) => ipcRenderer.invoke('updateReceteDetay', detay),

  // Alımlar Handler'ları
  addAlim: (alim) => ipcRenderer.invoke('addAlim', alim),
  getAlimlar: () => ipcRenderer.invoke('getAlimlar'),
  deleteAlim: (alimId) => ipcRenderer.invoke('deleteAlim', alimId),
  updateAlim: (alim) => ipcRenderer.invoke('updateAlim', alim),

  // Giderler Handler'ları
  addGider: (gider) => ipcRenderer.invoke('addGider', gider),
  getGiderler: () => ipcRenderer.invoke('getGiderler'),
  updateGider: (gider) => ipcRenderer.invoke('updateGider', gider),
  deleteGider: (giderId) => ipcRenderer.invoke('deleteGider', giderId),
  // Satışlar Handler'ları
  addSatis: (satis) => ipcRenderer.invoke('addSatis', satis),
  getSatislar: () => ipcRenderer.invoke('getSatislar'),
  updateSatis: (satis) => ipcRenderer.invoke('updateSatis', satis),
  deleteSatis: (satisId) => ipcRenderer.invoke('deleteSatis', satisId),

  // Maliyet Hesaplama için Yardımcı Handler
  getLatestAlimInfoForUrun: (urunId) => ipcRenderer.invoke('getLatestAlimInfoForUrun', urunId),

  // Toplu Maliyet Güncelleme
  updateReceteMaliyet: (receteId, yeniMaliyet, tarih) => ipcRenderer.invoke('updateReceteMaliyet', receteId, yeniMaliyet, tarih),

  // Excel'e Aktarma
  exportMaliyetToExcel: (data) => ipcRenderer.invoke('exportMaliyetToExcel', data),
  
  // Maliyet Loglama ve Reçete Güncelleme
  logAndUpdateReceteMaliyet: (receteId, yeniMaliyet, tarih) => ipcRenderer.invoke('logAndUpdateReceteMaliyet', receteId, yeniMaliyet, tarih),
  getPreviousMaliyetLog: (receteId) => ipcRenderer.invoke('getPreviousMaliyetLog', receteId),

  // Maliyet Geçmişi Raporu
  getMaliyetGecmisi: (filtreler) => ipcRenderer.invoke('getMaliyetGecmisi', filtreler),

  // YENİ: Detaylı Maliyet Raporu için yardımcı API'ler
  getPorsiyonlarByUrunId: (sonUrunId) => ipcRenderer.invoke('getPorsiyonlarByUrunId', sonUrunId),
  getRecetelerByPorsiyonId: (porsiyonId) => ipcRenderer.invoke('getRecetelerByPorsiyonId', porsiyonId),

  // Ayarlar Handler'ları
  getAyar: (anahtar) => ipcRenderer.invoke('getAyar', anahtar),
  setAyar: (anahtar, deger) => ipcRenderer.invoke('setAyar', anahtar, deger),

  // Reçete PDF Oluşturma
  generateRecetePdf: (receteData) => ipcRenderer.invoke('generateRecetePdf', receteData),

  // TODO: Diğer handler'lar buraya gelecek (Birim/Porsiyon düzenleme, alım, gider, satış, analiz)
});