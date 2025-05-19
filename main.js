// main.js
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('node:path');
const database = require('./main/db');
const { registerIpcHandlers } = require('./main/ipcHandlers');

let mainWindow = null;

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1024, // Ana uygulama için boyutlar
    height: 768,
    // Splash ve login için başlangıçta daha küçük bir pencere ve ortalanmış olabilir
    // Veya sabit boyutta tutup sadece içeriği değiştirebiliriz. Şimdilik sabit.
    // width: 500,
    // height: 400,
    // center: true,
    // frame: false, // Splash için çerçevesiz pencere (isteğe bağlı)
    show: false, // Başlangıçta gösterme, ready-to-show ile göster
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Her zaman aynı preload'ı kullanacağız
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: process.env.NODE_ENV !== 'development',
      allowRunningInsecureContent: process.env.NODE_ENV === 'development',
    }
  });

  // 1. Splash ekranını yükle
  mainWindow.loadFile(path.join(__dirname, 'splash.html')); // Ana dizindeki splash.html

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Splash ekranı gösterildikten sonra belirli bir süre bekleyip login ekranına geç
    setTimeout(() => {
      if (mainWindow) { // Pencere hala açıksa
        // 2. Login ekranını yükle
        mainWindow.loadFile(path.join(__dirname, 'login.html')); // Ana dizindeki login.html
      }
    }, 3000); // 3 saniye splash gösterim süresi (isteğe bağlı)
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Geliştirme Araçlarını aç (isteğe bağlı)
  // if (process.env.NODE_ENV === 'development') {
  //    mainWindow.webContents.openDevTools();
  // }
};

app.whenReady().then(async () => {
  try {
    await database.initialize();
    console.log("Veritabanı başlatma tamamlandı.");
    registerIpcHandlers();
    console.log("IPC handler'lar kaydedildi.");
    createMainWindow();
  } catch (error) {
    console.error("Uygulama başlatılırken hata:", error);
    dialog.showErrorBox('Uygulama Başlatma Hatası', 'Uygulama başlatılırken kritik bir hata oluştu: ' + error.message);
    app.quit();
  }

  app.on('activate', () => {
    if (mainWindow === null) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log("Tüm BrowserWindows kapandı, uygulama kapatılıyor...");
      app.quit();
    }
  }
});

app.on('before-quit', () => {
  console.log("Uygulama kapanıyor...");
});

// YENİ: Başarılı giriş sonrası ana arayüzü yüklemek için IPC handler
ipcMain.on('login-successful', () => {
  if (mainWindow) {
    console.log("Başarılı giriş, ana arayüz yükleniyor...");
    // Ana uygulama için pencere boyutlarını ayarla (eğer splash/login için farklıysa)
    // mainWindow.setSize(1024, 768);
    // mainWindow.center();
    mainWindow.loadFile('index.html');
    mainWindow.webContents.once('did-finish-load', () => {
      if (mainWindow && !mainWindow.isDestroyed()) { // Pencerenin hala var olduğundan emin ol
        mainWindow.maximize();
      }
    });

  }
});

// YENİ: Kullanıcı adı/şifre kontrolü için IPC Handler
// Bu, ayarlar tablosundaki kullanıcı adı ve şifre ile karşılaştırma yapacak.
// Şimdilik basit bir karşılaştırma, sonra hash'li şifreye geçilecek.
ipcMain.handle('checkLogin', async (event, username, password) => {
    try {
        const dbUsername = await database.get("SELECT deger FROM ayarlar WHERE anahtar = ?", ['kullaniciAdi']);
        const dbPassword = await database.get("SELECT deger FROM ayarlar WHERE anahtar = ?", ['sifre']);

        if (dbUsername && dbPassword && dbUsername.deger === username && dbPassword.deger === password) {
            console.log("Giriş başarılı:", username);
            return true;
        } else {
            console.log("Giriş başarısız:", username);
            return false;
        }
    } catch (error) {
        console.error("Giriş kontrolü sırasında hata:", error);
        return false; // Hata durumunda da başarısız dön
    }
});