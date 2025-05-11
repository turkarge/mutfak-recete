// main.js (Ana Giriş Noktası)
// Electron uygulamasının başlatılmasını, pencereleri ve temel olayları yönetir.

const { app, BrowserWindow, dialog, ipcMain } = require('electron'); // ipcMain ve dialog modülünü ekledik
const path = require('node:path');
const database = require('./main/db'); // Veritabanı modülümüz
const { registerIpcHandlers } = require('./main/ipcHandlers'); // IPC handler modülümüz

let mainWindow = null; // Ana uygulama penceresi
let splashWindow = null; // Splash screen penceresi
let loginWindow = null; // Giriş Penceresi


// Splash screen penceresini oluşturma fonksiyonu
const createSplashWindow = () => {
    try {
        splashWindow = new BrowserWindow({
            width: 400,
            height: 300,
            transparent: true, // Pencere arka planını şeffaf yap
            frame: false,      // Pencere çerçevesini (başlık çubuğu, butonlar) kaldır
            alwaysOnTop: true, // Her zaman en üstte kalsın
            resizable: false,  // Yeniden boyutlandırılamaz
             webPreferences: {
                 nodeIntegration: false,
                 contextIsolation: true
             }
        });

        // Splash screen HTML dosyasını yükle
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
         createLoginWindow(); // --> createLoginWindow çağırıldı (Hata olursa splash yerine login açılır)
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

  createSplashWindow(); // Splash screen'i oluştur

  try {
      // SADECE Veritabanını başlat (tabloları oluşturacak)
      await database.initialize();
      console.log("Veritabanı başlatma tamamlandı.");

      // !!! IPC handler'larını KAYDETMİYORUZ !!!
      // registerIpcHandlers(); // <-- Bu satırı yorum satırı yap veya sil
      console.log("IPC handler'lar kaydedilmiyor (Test).");


      // Başlangıç işlemleri tamamlandı (initialize bitti).
      // Login veya main pencereleri oluşturmuyoruz.
      // Uygulamanın kapanmaması için splash screen'i açık tutabiliriz
      // veya bir süre sonra uygulamayı kapatabiliriz.
       console.log("Test tamamlandı, handler'lar kaydedilmedi. Uygulama kapanacak veya splash açık kalacak.");
       // Splash screen'i kapatmaya veya uygulama quit etmeye gerek yok
       // sadece pencere oluşturulmadığı için kendiliğinden kapanabilir.
       // Eğer kapanmazsa ve splash açıksa başarılı.
       // setTimeout(() => {
       //      if (splashWindow) splashWindow.destroy();
       //      app.quit();
       //  }, 10000); // 10 saniye sonra kapat (Test)


  } catch (error) {
      console.error("Uygulama başlatılırken hata:", error);
       if (splashWindow) {
           splashWindow.destroy();
       }
       dialog.showErrorBox('Uygulama Başlatma Hatası', 'Uygulama başlatılırken kritik bir hata oluştu: ' + error.message);
      app.quit();
  }

  // activate ve window-all-closed eventleri şimdilik olduğu gibi kalsın.
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


// --- IPC Handler Kaydı ---
// Bu handler, renderer/login.js'den başarılı giriş sinyali aldığında çalışacak.
ipcMain.on('login-success', (event) => { // <-- ipcMain.on kullanıyoruz, send ile gönderiliyor
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