const { contextBridge, ipcRenderer } = require('electron');

// Renderer süreci için güvenli bir API sunuyoruz
contextBridge.exposeInMainWorld('electronAPI', {
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

  // TODO: Diğer handler'lar buraya gelecek (Birim/Porsiyon düzenleme, alım, gider, satış, analiz)
});