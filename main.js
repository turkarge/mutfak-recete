// main.js (Ana Giriş Noktası)
// Electron uygulamasının başlatılmasını, pencereleri ve temel olayları yönetir.

const { app, BrowserWindow, dialog } = require('electron'); // dialog modülünü ekledik
const path = require('node:path');
const database = require('./main/db'); // Veritabanı modülümüz
const { registerIpcHandlers } = require('./main/ipcHandlers'); // IPC handler modülümüz

let mainWindow = null; // Ana uygulama penceresi (Başlangıçta null)
let splashWindow = null; // Splash screen penceresi (Başlangıçta null)


// Splash screen penceresini oluşturma fonksiyonu
const createSplashWindow = () => {
    splashWindow = new BrowserWindow({
        width: 400, // Splash ekran boyutu
        height: 300,
        transparent: true, // Pencere arka planını şeffaf yap
        frame: false,      // Pencere çerçevesini (başlık çubuğu, butonlar) kaldır
        alwaysOnTop: true, // Her zaman en üstte kalsın
        resizable: false,  // Yeniden boyutlandırılamaz
         webPreferences: {
             // Splash screen'de Node.js veya IPC kullanmıyoruz, güvenlik için kapalı kalsın
             nodeIntegration: false,
             contextIsolation: true
             // Preload script'ine gerek yok (varsa da özel splash preload olmalıydı)
             // preload: path.join(__dirname, 'preload.js')
         }
    });

    // Splash screen HTML dosyasını yükle
    // __dirname main.js dosyasının bulunduğu dizini verir. splash.html aynı dizinde.
    splashWindow.loadFile(path.join(__dirname, 'splash.html'));


     // Splash screen penceresi kapandığında veya hata oluştuğunda null yapalım
     splashWindow.on('closed', () => {
         splashWindow = null;
     });

     // Geliştirme araçlarını açmayın (genellikle splash screen için istenmez)
    // splashWindow.webContents.openDevTools();
};


// Ana uygulama penceresini oluşturma fonksiyonu
const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false, // <-- Pencereyi hemen gösterme! Başlangıç işlemleri bitince göstereceğiz.
    webPreferences: {
      // Ana pencere Renderer'ı için preload script'i gerekli
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
       // file:// protokolüne izin ver (yerel HTML dosyalarını yüklemek için)
       // Geliştirme modunda security'i kapatabiliriz, production'da açık olmalı
       webSecurity: process.env.NODE_ENV !== 'development',
       allowRunningInsecureContent: process.env.NODE_ENV === 'development',
    }
  });

  // Ana HTML dosyasını yükle (index.html)
  mainWindow.loadFile('index.html');

  // Ana pencere içeriği tamamen yüklendiğinde ve görünmeye hazır olduğunda
  mainWindow.once('ready-to-show', () => {
      if (splashWindow) {
         splashWindow.destroy(); // Splash screen'i kapat ve yok et
      }
      mainWindow.show(); // Ana pencereyi göster
      // Geliştirme Araçlarını aç (ana pencere hazır olunca açmak daha iyi)
      // mainWindow.webContents.openDevTools(); // Geliştirme araçlarını manuel açmak daha iyi olabilir (View menüsünden)
  });

  // Ana pencere kapandığında null yapalım activate eventi için
   mainWindow.on('closed', () => {
       mainWindow = null;
   });

};


// Electron uygulaması başlatılmaya hazır olduğunda (init tamamlandığında)
app.whenReady().then(async () => {

  createSplashWindow(); // <-- Önce splash screen'i göster

  try {
      // <-- Başlangıç işlemlerini yaparken splash screen görünüyor olacak -->
      // Veritabanını başlat ve tabloları oluştur (db.js içindeki Promise'ın tamamlanmasını bekle)
      await database.initialize();
      console.log("Veritabanı başlatma tamamlandı.");

      // IPC handler'larını kaydet (main/ipcHandlers.js içindeki fonksiyonları çalıştır)
      registerIpcHandlers();
      console.log("IPC handler'lar kaydedildi.");
      // <-- Başlangıç işlemleri tamamlandı -->

      // Şimdi ana pencereyi oluştur
      createMainWindow();


  } catch (error) {
      console.error("Uygulama başlatılırken hata:", error);
      // Hata durumunda splash screen açıksa kapat
       if (splashWindow) {
           splashWindow.destroy();
       }
      // Kullanıcıya hata mesajı gösterip uygulamayı kapatabiliriz (Electron dialog modülü)
       dialog.showErrorBox('Uygulama Başlatma Hatası', 'Uygulama başlatılırken kritik bir hata oluştu: ' + error.message);
      app.quit(); // Uygulamayı kapat

  }


  // macOS için ek ayar: Dock simgesine tıklanması durumunda pencere oluştur (eğer ana pencere yoksa)
  app.on('activate', () => {
    // Eğer uygulama aktif hale getirildiğinde ve ana pencere null ise (kapatılmışsa)
    if (mainWindow === null) {
        // Tekrar initialize ve handler kaydı yapmaya gerek yok, sadece ana pencereyi oluştur
        createMainWindow();
    }
  });
});

// Tüm pencereler kapandığında uygulamayı kapat (macOS hariç)
app.on('window-all-closed', () => {
  // Eğer current process macOS değilse (Windows veya Linux) uygulamayı kapat
  if (process.platform !== 'darwin') {
    // Veritabanı bağlantısını kapatmak iyi bir uygulama olabilir.
    // db.js'e bir close fonksiyonu ekleyip burada çağırabiliriz.
     /*
     if (database && database.close) {
         database.close().then(() => {
             app.quit(); // Veritabanı kapatıldıktan sonra uygulamayı kapat
         }).catch((err) => {
             console.error("Veritabanı kapatılırken hata:", err);
             app.quit(); // Hata olsa bile uygulamayı kapat
         });
     } else {
         app.quit(); // Veritabanı objesi veya close fonksiyonu yoksa doğrudan kapat
     }
     */
     app.quit(); // Şimdilik doğrudan kapatıyoruz
  }
});

// Uygulama çıkarken (quit olmadan önce)
app.on('before-quit', () => {
    // Veritabanı bağlantısını kapatmak için daha güvenli bir yer olabilir.
    // Ancak, window-all-closed çoğu durumda yeterlidir.
    console.log("Uygulama kapanıyor...");
});


// Güvenlik notu: Renderer process'te Node.js API'lerine doğrudan erişim engellenmiştir.
// Gerekli iletişimler için preload script ve IPC kullanılmalıdır.