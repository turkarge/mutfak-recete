// main.js (Ana Giriş Noktası)
const { app, BrowserWindow } = require('electron'); // ipcMain artık ipcHandlers.js'de
const path = require('node:path');
// sqlite3 artık db.js'de
const database = require('./main/db'); // db modülümüzü içeri aktarıyoruz
const { registerIpcHandlers } = require('./main/ipcHandlers'); // ipc handler modülümüzü içeri aktarıyoruz

// Veritabanı yolu ve db değişkenleri artık db.js'de

// Pencere oluşturma fonksiyonu aynı kalıyor
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1024, // Pencere boyutunu biraz büyüttüm (isteğe bağlı)
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
       // file:// protokolüne izin ver (yerel HTML dosyalarını yüklemek için)
       webSecurity: process.env.NODE_ENV !== 'development', // Geliştirme modunda security'i kapatabiliriz
       allowRunningInsecureContent: process.env.NODE_ENV === 'development', // Geliştirme modunda izin ver
    }
  });

  // Uygulamanın ana HTML dosyasını yükle (index.html)
  // Bu dosya artık ana layout (menü ve içerik alanı) olacak
  mainWindow.loadFile('index.html');

  // Geliştirme Araçlarını aç (isteğe bağlı)
  mainWindow.webContents.openDevTools();
};

// Electron uygulaması hazır olduğunda yapılacaklar
app.whenReady().then(async () => { // async yaptık çünkü initializeDatabase Promise döndürüyor

  try {
      await database.initialize(); // Veritabanını başlat ve tabloları oluştur (tamamlanmasını bekle)
      console.log("Veritabanı başlatma tamamlandı.");

      registerIpcHandlers(); // IPC handler'larını kaydet
      console.log("IPC handler'lar kaydedildi.");

      createWindow(); // Ana pencereyi oluştur

  } catch (error) {
      console.error("Uygulama başlatılırken hata:", error);
      // Hata durumunda uygulamayı kapatabiliriz veya kullanıcıya bir mesaj gösterebiliriz
      app.quit();
  }


  // macOS için ek ayar: Dock simgesine tıklayınca pencere yoksa oluştur
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Tüm pencereler kapandığında uygulamayı kapat (macOS hariç)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Uygulama kapanırken veritabanı bağlantısını kapatmak iyi bir uygulamadır
    // db.js içinde db objesi dışarıya aktarılmadığı için burada doğrudan db.close() yapamayız.
    // Ya db.js'e bir close fonksiyonu ekleriz ya da db objesini dışarıya aktarırız.
    // Şimdilik basit tutalım, kapanma anında db objesi hala erişilebilir olabilir ama garantili değil.
    // db.close() mantığını db.js'e taşımak daha doğru olurdu.
    // Şimdilik initializeDatabase() içindeki db objesine dışarıdan erişimimiz olmadığı için kapatma kodunu kaldırıyorum.
    // İlerde db.js'e bir close metodu ekleyip buradan çağırabiliriz.
    app.quit();
  }
});

// Güvenlik notu: Renderer process'te Node.js API'lerine doğrudan erişim engellenmiştir.
// Gerekli iletişimler için preload script ve IPC kullanılmalıdır.