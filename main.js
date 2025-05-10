// main.js (Ana Giriş Noktası)
// Electron uygulamasının başlatılmasını, pencereleri ve temel olayları yönetir.

const { app, BrowserWindow, dialog, ipcMain } = require('electron'); // ipcMain ve dialog modülünü ekledik
const path = require('node:path');
const database = require('./main/db'); // Veritabanı modülümüz
const { registerIpcHandlers } = require('./main/ipcHandlers'); // IPC handler modülümüz

let mainWindow = null; // Ana uygulama penceresi
let splashWindow = null; // Splash screen penceresi
let loginWindow = null; // <-- Giriş Penceresi


// Splash screen penceresini oluşturma fonksiyonu
const createSplashWindow = () => {
    try {
        splashWindow = new BrowserWindow({
            width: 400,
            height: 300,
            transparent: true,
            frame: false,
            alwaysOnTop: true,
            resizable: false,
             webPreferences: {
                 nodeIntegration: false,
                 contextIsolation: true
             }
        });

        splashWindow.loadFile(path.join(__dirname, 'splash.html'));

         splashWindow.on('closed', () => {
             splashWindow = null;
         });

         // Splash penceresi yüklendiğinde göster (HTML içeriği hazır olunca)
         splashWindow.once('ready-to-show', () => {
              splashWindow.show();
         });


    } catch (error) {
        console.error("Splash screen oluşturulurken hata:", error);
         dialog.showErrorBox('Splash Screen Hatası', 'Splash screen oluşturulurken bir hata oluştu: ' + error.message);
         // Hata durumunda splash açılamazsa veya kapandıysa, doğrudan login penceresini açmaya çalışalım
         createLoginWindow(); // --> createLoginWindow çağırıldı
    }
};

// *** Giriş Penceresini oluşturma fonksiyonu ***
const createLoginWindow = () => {
     try {
        loginWindow = new BrowserWindow({
            width: 400, // Giriş penceresi boyutu
            height: 500, // Giriş formuna göre yüksekliği ayarla
            resizable: false,
             frame: false, // Çerçevesiz pencere istenirse
            // transparent: true, // Şeffaf arka plan istenirse
             webPreferences: {
                 preload: path.join(__dirname, 'preload.js'), // Aynı preload script'i kullanılabilir
                 nodeIntegration: false,
                 contextIsolation: true
             }
        });

        // Giriş sayfası HTML dosyasını yükle
        loginWindow.loadFile(path.join(__dirname, 'views/login.html')); // <-- views klasöründeki login.html

         loginWindow.on('closed', () => {
             loginWindow = null;
         });

         // Giriş penceresi yüklendiğinde göster
         loginWindow.once('ready-to-show', () => {
              loginWindow.show();
         });


     } catch (error) {
          console.error("Giriş penceresi oluşturulurken hata:", error);
           dialog.showErrorBox('Giriş Penceresi Hatası', 'Giriş penceresi oluşturulurken bir hata oluştu: ' + error.message);
           app.quit(); // Kritik hata, uygulamayı kapat
     }
};


// Ana uygulama penceresini oluşturma fonksiyonu
const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false, // Ana pencereyi hemen gösterme
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

  // Ana pencere içeriği tamamen yüklendiğinde ve görünmeye hazır olduğunda
  mainWindow.once('ready-to-show', () => {
      // Bu mantık artık giriş başarılı olduğunda Ana Süreç'te tetiklenecek.
      // Yani createMainWindow fonksiyonu zaten bu logic çalışınca çağrılacak.
      // Burada sadece göstermemiz yeterli.
      mainWindow.show();
      // Geliştirme Araçlarını aç (ana pencere hazır olunca açmak daha iyi)
      // mainWindow.webContents.openDevTools();
  });

   mainWindow.on('closed', () => {
       mainWindow = null;
   });

};


// Electron uygulaması başlatılmaya hazır olduğunda (init tamamlandığında)
app.whenReady().then(async () => {

  createSplashWindow(); // <-- Önce splash screen'i göster

  try {
      // <-- Başlangıç işlemleri (Veritabanı init, handler kaydı) -->
      await database.initialize();
      console.log("Veritabanı başlatma tamamlandı.");

      registerIpcHandlers(); // IPC handler'larını kaydet
      console.log("IPC handler'lar kaydedildi.");
      // <-- Başlangıç işlemleri tamamlandı -->

      // Başlangıç işlemleri bitince splash screen'i kapat
      if (splashWindow) {
          splashWindow.destroy();
      }

      // Başlangıç işlemleri bittikten sonra Giriş Penceresini aç
      createLoginWindow(); // <-- Giriş Penceresi çağırıldı


  } catch (error) {
      console.error("Uygulama başlatılırken hata:", error);
       if (splashWindow) {
           splashWindow.destroy();
       }
       dialog.showErrorBox('Uygulama Başlatma Hatası', 'Uygulama başlatılırken kritik bir hata oluştu: ' + error.message);
      app.quit();

  }


  // macOS için ek ayar: Dock simgesine tıklanması durumunda pencere oluştur (eğer ana pencere yoksa)
  app.on('activate', () => {
    if (mainWindow === null && loginWindow === null) { // Hem ana pencere hem giriş penceresi yoksa
         // Uygulama kapatılmış ve tekrar aktif edilmiş.
         // Giriş akışını yeniden başlatmak gerekir.
         createLoginWindow(); // Giriş akışını yeniden başlat
    }
     // Eğer sadece ana pencere kapalıysa ama giriş penceresi açıksa bir şey yapma.
     // Eğer hem ana hem giriş açıksa bir şey yapma.
  });
});

// Tüm pencereler kapandığında uygulamayı kapat (macOS hariç)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
     // Eğer tüm pencereler kapandıysa (hem ana hem giriş), uygulamayı kapat
     // isActive() yöntemi Electron'da genellikle uygulama sürecini kontrol eder.
     // Eğer mainWindow ve loginWindow null ise tüm BrowserWindows kapanmıştır.
     if (mainWindow === null && loginWindow === null) {
         app.quit();
     }
     // Not: Eğer sadece biri kapandıysa (örn: Giriş penceresi ama ana pencere açık),
     // window-all-closed tetiklenmez. Bu olay sadece TÜM pencereler kapandığında tetiklenir.
     // Bu mantık biraz daha karmaşık, window 'close' eventlerini tek tek dinlemek gerekebilir.
     // Şimdilik basit kalsın.
     console.log("Tüm pencereler kapandı, uygulama kapatılıyor...");
     app.quit();

  }
});

app.on('before-quit', () => {
    console.log("Uygulama kapanıyor...");
});


// --- IPC Handler Kaydı ---
// Bu handler, renderer/login.js'den başarılı giriş sinyali aldığında çalışacak.
ipcMain.on('login-success', (event) => {
     console.log("Başarılı giriş sinyali alındı.");
     // Başarılı giriş sinyali geldiğinde Giriş Penceresini kapat
     if (loginWindow) {
         loginWindow.destroy();
     }
     // Ana uygulama penceresini oluştur ve göster
     createMainWindow(); // --> createMainWindow çağırıldı
});


// Güvenlik notu: Renderer process'te Node.js API'lerine doğrudan erişim engellenmiştir.
// Gerekli iletişimler için preload script ve IPC kullanılmalıdır.