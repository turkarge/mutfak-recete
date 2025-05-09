const { contextBridge, ipcRenderer } = require('electron');

// Renderer süreci için güvenli bir API sunuyoruz
contextBridge.exposeInMainWorld('electronAPI', {
  // 'ipcRenderer.invoke' ile Ana Süreç'e asenkron mesaj gönderiyoruz
  // Ana Süreç'ten veri almak veya bir işlem yapmasını istemek için kullanılır
  getUrunler: () => ipcRenderer.invoke('get-urunler'), // Ürünleri getirmek için
  addUrun: (urun) => ipcRenderer.invoke('add-urun', urun), // Ürün eklemek için
  deleteUrun: (urunId) => ipcRenderer.invoke('deleteUrun', urunId),
  getBirimler: () => ipcRenderer.invoke('get-birimler'),
  addBirim: (birim) => ipcRenderer.invoke('add-birim', birim),
  getUrunlerByTur: (tur) => ipcRenderer.invoke('get-urunler-by-tur', tur),
  getPorsiyonlar: () => ipcRenderer.invoke('getPorsiyonlar'),
  addPorsiyon: (porsiyon) => ipcRenderer.invoke('addPorsiyon', porsiyon),
  getReceteler: () => ipcRenderer.invoke('getReceteler'),
  addRecete: (recete) => ipcRenderer.invoke('addRecete', recete),
  getReceteDetaylari: (receteId) => ipcRenderer.invoke('getReceteDetaylari', receteId),
  addReceteDetay: (detay) => ipcRenderer.invoke('addReceteDetay', detay),
  deleteReceteDetay: (detayId) => ipcRenderer.invoke('deleteReceteDetay', detayId),
  deleteRecete: (receteId) => ipcRenderer.invoke('deleteRecete', receteId),
  getPageHtml: (pageName) => ipcRenderer.invoke('get-page-html', pageName)
  // Diğer veri tabanı işlemleri (güncelleme, silme) için de buraya fonksiyonlar ekleyeceğiz
});

// Not: contextBridge.exposeInMainWorld, Renderer süreci içindeki 'window' objesine
// 'electronAPI' adında bir obje ekler. Bu obje içindeki fonksiyonlar (getUrunler, addUrun),
// ipcRenderer kullanarak Ana Süreç'e mesaj gönderir.
// Bu yaklaşım, Node.js API'lerinin doğrudan Renderer'da kullanılmasını engeller ve güvenlik sağlar.