const { contextBridge, ipcRenderer } = require('electron');

// Renderer süreci için güvenli bir API sunuyoruz
contextBridge.exposeInMainWorld('electronAPI', {
  // Ürünler handler'ları
  getUrunler: () => ipcRenderer.invoke('get-urunler'),
  addUrun: (urun) => ipcRenderer.invoke('add-urun', urun),
  deleteUrun: (urunId) => ipcRenderer.invoke('deleteUrun', urunId),

  // Sayfa HTML getirme handler'ı
  getPageHtml: (pageName) => ipcRenderer.invoke('get-page-html', pageName),

  // Birimler handler'ları
  getBirimler: () => ipcRenderer.invoke('get-birimler'),
  addBirim: (birim) => ipcRenderer.invoke('add-birim', birim),

  // Porsiyonlar handler'ları
  getUrunlerByTur: (tur) => ipcRenderer.invoke('get-urunler-by-tur', tur), // Belirli türdeki ürünleri getirme (Son Ürünler için)
  getPorsiyonlar: () => ipcRenderer.invoke('getPorsiyonlar'),
  addPorsiyon: (porsiyon) => ipcRenderer.invoke('addPorsiyon', porsiyon),

  // Reçeteler handler'ları
  getReceteler: () => ipcRenderer.invoke('getReceteler'),
  addRecete: (recete) => ipcRenderer.invoke('addRecete', recete),
  getReceteDetaylari: (receteId) => ipcRenderer.invoke('getReceteDetaylari', receteId),
  addReceteDetay: (detay) => ipcRenderer.invoke('addReceteDetay', detay),
  deleteReceteDetay: (detayId) => ipcRenderer.invoke('deleteReceteDetay', detayId),

  // TODO: Diğer handler'lar buraya gelecek (silme/düzenleme, alım, gider, satış, analiz)
});