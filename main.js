// main.js (Ana Giriş Noktası)
// Electron uygulamasının başlatılmasını, ana pencereyi ve temel olayları yönetir.

const { app, BrowserWindow, dialog, ipcMain } = require('electron'); // ipcMain ve dialog modülü kalsın
const path = require('node:path');
const database = require('./main/db'); // Veritabanı modülümüz
const { registerIpcHandlers } = require('./main/ipcHandlers'); // IPC handler modülümüz

let mainWindow = null; // Sadece ana pencere değişkeni kaldı
// splashWindow ve loginWindow değişkenleri SİLİNDİ

// createSplashWindow ve createLoginWindow fonksiyonları SİLİNDİ

// *** createMainWindow fonksiyonu ***
const createMainWindow = () => { // Fonksiyon adını createMainWindow yapalım
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: true, // <-- Pencere başlangıçta GÖRÜNÜR olacak
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
       webSecurity: process.env.NODE_ENV !== 'development',
       allowRunningInsecureContent: process.env.NODE_ENV === 'development',
    }
  });

  // Ana HTML dosyasını yükle (index.html)
  mainWindow.loadFile('index.html');

  // Ana pencere hazır olduğunda (ready-to-show eventine gerek kalmayabilir show: true ile)
  // mainWindow.once('ready-to-show', () => { ... });

   mainWindow.on('closed', () => {
       mainWindow = null;
   });

   // Geliştirme Araçlarını aç (isteğe bağlı)
   // mainWindow.webContents.openDevTools();
};


// Electron uygulaması başlatılmaya hazır olduğunda
app.whenReady().then(async () => {

  // *** Başlangıç işlemleri ve Ana Pencere Oluşturma ***
  try {
      await database.initialize(); // Veritabanını başlat
      console.log("Veritabanı başlatma tamamlandı.");

      registerIpcHandlers(); // IPC handler'larını kaydet
      console.log("IPC handler'lar kaydedildi.");

      createMainWindow(); // <-- Doğrudan Ana Pencereyi oluştur


  } catch (error) {
      console.error("Uygulama başlatılırken hata:", error);
       // Hata durumunda splash veya login penceresi olmadığı için doğrudan hata kutusu gösterilir.
       dialog.showErrorBox('Uygulama Başlatma Hatası', 'Uygulama başlatılırken kritik bir hata oluştu: ' + error.message);
      app.quit();
  }


  // macOS için ek ayar: Dock simgesine tıklanması durumunda
  app.on('activate', () => {
    if (mainWindow === null) { // Sadece ana pencere null ise
         createMainWindow(); // Ana pencereyi yeniden oluştur
    }
  });
});

// Tüm pencereler kapandığında uygulamayı kapat (macOS hariç)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
      // Eğer tüm BrowserWindows kapatıldıysa (getAllWindows().length === 0), uygulamayı kapat.
      if (BrowserWindow.getAllWindows().length === 0) {
          console.log("Tüm BrowserWindows kapandı, uygulama kapatılıyor...");
          app.quit();
      }
  }
});

app.on('before-quit', () => {
    console.log("Uygulama kapanıyor...");
});

// *** IPC Handler Kaydı (login-success handler'ı SİLİNECEK) ***
// login ve loginSuccess handler'ları artık olmayacak.
// ipcMain.on('login-success', (event) => { ... }); // <-- Bu handler SİLİNECEK


// Güvenlik notu: Renderer process'te Node.js API'lerine doğrudan erişim engellenmiştir.
// Gerekli iletişimler için preload script ve IPC kullanılmalıdır.