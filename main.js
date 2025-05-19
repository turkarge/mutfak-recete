// main.js
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('node:path');
const database = require('./main/db');
const { registerIpcHandlers } = require('./main/ipcHandlers');

let splashWindow = null;
let loginWindow = null;
let mainWindow = null;

const SPLASH_TIMEOUT = 2500; // Splash ekranı gösterim süresi (milisaniye)

// 1. Splash Penceresini Oluştur
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 640,
    height: 480,
    center: true,
    frame: false, // Çerçevesiz
    resizable: false,
    show: false,
    backgroundColor: '#f0f2f5',
    webPreferences: {
      // Splash için preload gerekmeyebilir, ama tutarlılık için eklenebilir
      // preload: path.join(__dirname, 'preload_splash.js'), // Gerekirse ayrı bir preload
      nodeIntegration: false,
      contextIsolation: true,
    }
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
  });

  // Splash gösterildikten sonra Login penceresini aç ve Splash'i kapat
  setTimeout(() => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      createLoginWindow(); // Login penceresini oluştur
      splashWindow.close(); // Splash penceresini kapat
      splashWindow = null;
    }
  }, SPLASH_TIMEOUT);

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

// 2. Login Penceresini Oluştur
function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 800, // Login için uygun bir boyut
    height: 600, // Logo ve form için yeterli yükseklik
    center: true,
    frame: true, // Çerçeveli (kapat, küçült butonları için)
    resizable: false, // Login ekranı genelde sabit boyutludur
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Giriş işlemleri için preload gerekli
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // YÖNTEM 1: Menüyü tamamen kaldırmak (önerilen, eğer hiç menü istenmiyorsa)
  loginWindow.setMenu(null); 
  // VEYA loginWindow.removeMenu(); // Electron'un daha yeni versiyonlarında

  // YÖNTEM 2: Menü çubuğunu gizlemek (Alt tuşuyla hala erişilebilir olabilir)
  // loginWindow.setMenuBarVisibility(false); // Windows/Linux'ta çalışır

  loginWindow.loadFile(path.join(__dirname, 'login.html'));
  loginWindow.once('ready-to-show', () => {
    loginWindow.show();
  });

  loginWindow.on('closed', () => {
    loginWindow = null;
    // Eğer login penceresi kapatılırsa ve ana pencere yoksa uygulamayı kapat
    // (Kullanıcı giriş yapmadan uygulamayı kapatırsa)
    if (!mainWindow) {
      app.quit();
    }
  });
}

// 3. Ana Uygulama Penceresini Oluştur
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, // Ana uygulama için başlangıç boyutu
    height: 800,
    show: false, // Başlangıçta gösterme
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // index.html'in yolunu doğru belirttiğinizden emin olun
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.once('did-finish-load', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.maximize(); // Pencereyi maksimize et
      mainWindow.show();    // Sonra göster
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    // Ana pencere kapatıldığında uygulamayı tamamen kapatabiliriz
    // veya macOS'ta dock'ta kalmasını sağlayabiliriz.
    // Mevcut app.on('window-all-closed') bunu zaten yönetiyor.
  });
}

// Electron uygulaması başlatılmaya hazır olduğunda
app.whenReady().then(async () => {
  try {
    await database.initialize();
    console.log("Veritabanı başlatma tamamlandı.");
    registerIpcHandlers();
    console.log("IPC handler'lar kaydedildi.");

    createSplashWindow(); // İlk olarak Splash penceresini oluştur

  } catch (error) {
    console.error("Uygulama başlatılırken hata:", error);
    dialog.showErrorBox('Uygulama Başlatma Hatası', 'Uygulama başlatılırken kritik bir hata oluştu: ' + error.message);
    app.quit();
  }

  app.on('activate', () => {
    // macOS'ta dock simgesine tıklandığında
    // Eğer hiçbir pencere açık değilse (splash veya login beklenirken), splash ile başlat
    // Eğer login bekleniyorsa login aç, main bekleniyorsa main aç.
    // Bu kısım mevcut akışla biraz daha karmaşıklaşabilir.
    // Şimdilik, eğer ana pencere yoksa ve login de yoksa splash açsın.
    if (BrowserWindow.getAllWindows().length === 0) {
        createSplashWindow();
    } else if (loginWindow && loginWindow.isDestroyed() && !mainWindow) {
        createLoginWindow(); // Eğer login kapatıldı ama main açılmadıysa
    } else if (mainWindow && mainWindow.isDestroyed()) {
        // Bu durum normalde olmaz, çünkü main kapanınca uygulama kapanır.
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  console.log("Uygulama kapanıyor...");
});

// Başarılı giriş sonrası
ipcMain.on('login-successful', () => {
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.close(); // Login penceresini kapat
  }
  createMainWindow(); // Ana uygulama penceresini oluştur ve göster
});

// Kullanıcı adı/şifre kontrolü
ipcMain.handle('checkLogin', async (event, username, password) => {
  try {
    const dbUsername = await database.get("SELECT deger FROM ayarlar WHERE anahtar = ?", ['kullaniciAdi']);
    const dbPassword = await database.get("SELECT deger FROM ayarlar WHERE anahtar = ?", ['sifre']);
    if (dbUsername && dbPassword && dbUsername.deger === username && dbPassword.deger === password) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Giriş kontrolü sırasında hata:", error);
    return false;
  }
});