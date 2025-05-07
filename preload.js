const { contextBridge, ipcRenderer } = require('electron');

// Renderer süreci için güvenli bir API sunuyoruz
contextBridge.exposeInMainWorld('electronAPI', {
  // 'ipcRenderer.invoke' ile Ana Süreç'e asenkron mesaj gönderiyoruz
  // Ana Süreç'ten veri almak veya bir işlem yapmasını istemek için kullanılır
  getUrunler: () => ipcRenderer.invoke('get-urunler'), // Ürünleri getirmek için
  addUrun: (urun) => ipcRenderer.invoke('add-urun', urun), // Ürün eklemek için
  getBirimler: () => ipcRenderer.invoke('get-birimler'),
  addBirim: (birim) => ipcRenderer.invoke('add-birim', birim),
  getPageHtml: (pageName) => ipcRenderer.invoke('get-page-html', pageName)
  // Diğer veri tabanı işlemleri (güncelleme, silme) için de buraya fonksiyonlar ekleyeceğiz
});

// Not: contextBridge.exposeInMainWorld, Renderer süreci içindeki 'window' objesine
// 'electronAPI' adında bir obje ekler. Bu obje içindeki fonksiyonlar (getUrunler, addUrun),
// ipcRenderer kullanarak Ana Süreç'e mesaj gönderir.
// Bu yaklaşım, Node.js API'lerinin doğrudan Renderer'da kullanılmasını engeller ve güvenlik sağlar.