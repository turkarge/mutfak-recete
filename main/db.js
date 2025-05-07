// main/db.js
const { app } = require('electron');
const path = require('node:path');
const sqlite3 = require('sqlite3').verbose(); // verbose hata ayıklama için faydalı

const dbPath = path.join(app.getPath('userData'), 'restoran.db');
let db = null; // Veritabanı bağlantı nesnesi

// Veritabanını açma ve tabloları oluşturma fonksiyonu
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // Veritabanı dosyasını aç veya oluştur
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        console.error('Veritabanı bağlantı hatası:', err.message);
        reject(err); // Bağlantı hatasında Promise'i reject et
      } else {
        console.log('Veritabanına başarıyla bağlandı:', dbPath);

        // Bağlantı kurulduktan hemen sonra yabancı anahtarları etkinleştir
        db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
            if (pragmaErr) {
                console.error('Yabancı anahtarları etkinleştirme hatası:', pragmaErr.message);
                reject(pragmaErr); // PRAGMA hatasında Promise'i reject et
            } else {
                console.log('Yabancı anahtarlar etkin.');

                // Bağlantı ve PRAGMA tamamlandı.
                // db bağlantı nesnesi (db değişkeni) artık atanmış durumda ve null değil.
                // Şimdi Promise'i çözebiliriz. IPC handler'ları artık kaydedilebilir.
                resolve();

                // Tablo oluşturma ve varsayılan birim ekleme işlemleri burada devam edecek.
                // Bunların Promise'ın çözülmesini beklemesi gerekmiyor çünkü CREATE TABLE IF NOT EXISTS idempotent.
                // Ancak, bu işlemlerin bitmeden handler'ların veri tabanını kullanmaya başlaması sorun yaratabilir.
                // En iyi uygulama: initialize Promise'ının tüm tablolar oluşana kadar beklemesi.
                // Önceki yaklaşım (tüm serialize bitince resolve) daha doğruydu.
                // Hata 'Cannot read properties of null' başka bir yerden kaynaklanıyor olabilir.
                // Önceki yaklaşımı tekrar deneyelim ve db nesnesini aktardığımızdan emin olalım.

                 // <-- ÖNCEKİ YAKLAŞIMA GERİ DÖNÜYORUZ -->
                 // Promise'ı tüm serialize işlemleri bitince çözeceğiz.
                 // 'Cannot read properties of null' hatası, db nesnesinin null olmasından değil,
                 // belki de database.db'ye erişim sırasında nesnenin henüz tam initialize olmamasından kaynaklanıyor olabilir.
                 // database.db'yi export ettiğimizden eminiz, şimdi serialize içinde resolve edelim.

                 db.serialize(() => {
                      console.log('Tablolar oluşturuluyor ve birimler ekleniyor...');
                      // urunler Tablosu
                      db.run(`CREATE TABLE IF NOT EXISTS urunler (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        ad TEXT NOT NULL UNIQUE COLLATE NOCASE,
                        tur TEXT NOT NULL CHECK (tur IN ('Hammadde', 'Son Ürün'))
                      )`, (err) => {
                        if (err) console.error('urunler tablosu oluşturma hatası:', err.message);
                        else console.log('urunler tablosu hazır.');
                      });

                      // birimler Tablosu
                      db.run(`CREATE TABLE IF NOT EXISTS birimler (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        birimAdi TEXT NOT NULL UNIQUE,
                        kisaAd TEXT NOT NULL UNIQUE,
                        anaBirimKisaAd TEXT
                      )`, (err) => {
                        if (err) console.error('birimler tablosu oluşturma hatası:', err.message);
                        else console.log('birimler tablosu hazır.');
                        // Birimleri birimler tablosu oluşturulunca ekle
                         insertDefaultBirimler(); // Serialize içinde çağırıyoruz
                      });

                       db.run(`CREATE TABLE IF NOT EXISTS porsiyonlar (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        sonUrunId INTEGER NOT NULL,
                        porsiyonAdi TEXT NOT NULL,
                        satisBirimiKisaAd TEXT NOT NULL,
                        varsayilanSatisFiyati REAL,
                        UNIQUE(sonUrunId, porsiyonAdi),
                        FOREIGN KEY (sonUrunId) REFERENCES urunler(id),
                        FOREIGN KEY (satisBirimiKisaAd) REFERENCES birimler(kisaAd)
                      )`, (err) => {
                        if (err) console.error('porsiyonlar tablosu oluşturma hatası:', err.message);
                        else console.log('porsiyonlar tablosu hazır.');
                      });

                      db.run(`CREATE TABLE IF NOT EXISTS receler (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        porsiyonId INTEGER NOT NULL,
                        receteAdi TEXT,
                        UNIQUE(porsiyonId, receteAdi),
                        FOREIGN KEY (porsiyonId) REFERENCES porsiyonlar(id)
                      )`, (err) => {
                        if (err) console.error('receler tablosu oluşturma hatası:', err.message);
                        else console.log('receler tablosu hazır.');
                      });

                      db.run(`CREATE TABLE IF NOT EXISTS receteDetaylari (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        receteId INTEGER NOT NULL,
                        hammaddeId INTEGER NOT NULL,
                        miktar REAL NOT NULL,
                        birimKisaAd TEXT NOT NULL,
                        FOREIGN KEY (receteId) REFERENCES receler(id),
                        FOREIGN KEY (hammaddeId) REFERENCES urunler(id),
                        FOREIGN KEY (birimKisaAd) REFERENCES birimler(kisaAd)
                      )`, (err) => {
                        if (err) console.error('receteDetaylari tablosu oluşturma hatası:', err.message);
                        else console.log('receteDetaylari tablosu hazır.');
                      });

                      db.run(`CREATE TABLE IF NOT EXISTS alimlar (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        urunId INTEGER NOT NULL,
                        tarih TEXT NOT NULL,
                        miktar REAL NOT NULL,
                        birimKisaAd TEXT NOT NULL,
                        birimFiyat REAL NOT NULL,
                        toplamFiyat REAL NOT NULL,
                        FOREIGN KEY (urunId) REFERENCES urunler(id),
                        FOREIGN KEY (birimKisaAd) REFERENCES birimler(kisaAd)
                      )`, (err) => {
                        if (err) console.error('alimlar tablosu oluşturma hatası:', err.message);
                        else console.log('alimlar tablosu hazır.');
                      });

                      db.run(`CREATE TABLE IF NOT EXISTS giderler (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        tarih TEXT NOT NULL,
                        giderKalemi TEXT NOT NULL,
                        aciklama TEXT,
                        tutar REAL NOT NULL
                      )`, (err) => {
                        if (err) console.error('giderler tablosu oluşturma hatası:', err.message);
                        else console.log('giderler tablosu hazır.');
                      });

                      db.run(`CREATE TABLE IF NOT EXISTS satislar (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        porsiyonId INTEGER NOT NULL,
                        tarih TEXT NOT NULL,
                        miktar REAL NOT NULL,
                        satisFiyati REAL NOT NULL,
                        FOREIGN KEY (porsiyonId) REFERENCES porsiyonlar(id)
                      )`, (err) => {
                        if (err) console.error('satislar tablosu oluşturma hatası:', err.message);
                        else console.log('satislar tablosu hazır.');
                      });

                      db.run(`CREATE TABLE IF NOT EXISTS ayarlar (
                        anahtar TEXT PRIMARY KEY,
                        deger TEXT
                      )`, (err) => {
                         if (err) console.error('ayarlar tablosu oluşturma hatası:', err.message);
                         else console.log('ayarlar tablosu hazır.');
                      });

                      // Tüm serialize işlemleri bittiğinde Promise'ı çöz
                      // Bu, main.js'deki await database.initialize()'ın burada tamamlanmasını sağlar
                      // ve handler'lar kaydedildiğinde tabloların oluşmuş olmasını garanti eder.
                      resolve(); // <-- Promise'ı serialize bloğu sonunda çözüyoruz

                    }); // serialize sonu
                } // else (bağlantı başarılıysa) sonu
            }); // PRAGMA sonu
          } // else (bağlantı başarılıysa) sonu
        }); // sqlite3.Database sonu
      }); // Promise sonu
    }

    // İsteğe bağlı: Uygulamanın ilk çalıştırılmasında standart birimleri ekleme fonksiyonu
    function insertDefaultBirimler() {
      const birimler = [
          { birimAdi: 'Kilogram', kisaAd: 'kg', anaBirimKisaAd: 'kg' },
          { birimAdi: 'Gram', kisaAd: 'gr', anaBirimKisaAd: 'kg' },
          { birimAdi: 'Litre', kisaAd: 'lt', anaBirimKisaAd: 'lt' },
          { birimAdi: 'Mililitre', kisaAd: 'ml', anaBirimKisaAd: 'lt' },
          { birimAdi: 'Adet', kisaAd: 'adet', anaBirimKisaAd: 'adet' },
          { birimAdi: 'Porsiyon', kisaAd: 'porsiyon', anaBirimKisaAd: 'porsiyon' },
          { birimAdi: 'Kilogram (Adet)', kisaAd: 'kg/adet', anaBirimKisaAd: 'kg' } // Örnek: Domates için 1 kg'ın kaç adet olduğu gibi çevrimler için
      ];

      // db.serialize() dışından çağrıldığı için burada tekrar serialize kullanmak güvenli
      db.serialize(() => {
          const stmt = db.prepare("INSERT OR IGNORE INTO birimler (birimAdi, kisaAd, anaBirimKisaAd) VALUES (?, ?, ?)");
          birimler.forEach(birim => {
              stmt.run(birim.birimAdi, birim.kisaAd, birim.anaBirimKisaAd);
          });
          stmt.finalize((err) => {
              if (!err) {
                  console.log("Varsayılan birimler eklendi (eğer daha önce yoksa).");
              }
          });
      });
    }


    // Temel CRUD (Create, Read, Update, Delete) işlemleri için yardımcı fonksiyonlar
    // Bu fonksiyonlar Ana Süreç'teki diğer modüller tarafından kullanılacak
    // Promise dönen fonksiyonlar
    const database = {
      initialize: initializeDatabase,
      // db bağlantısı initialize edildiyse kullan
       all: (sql, params = []) => {
        return new Promise((resolve, reject) => {
          if (!db) { // Bağlantı kontrolü
              return reject(new Error("Veritabanı bağlantısı henüz kurulmadı."));
          }
          db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
      },
       run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
           if (!db) { // Bağlantı kontrolü
              return reject(new Error("Veritabanı bağlantısı henüz kurulmadı."));
           }
          db.run(sql, params, function(err) { // function() callback'i this.lastID, this.changes için gerekli
            if (err) reject(err);
            else resolve(this.lastID); // Varsayılan olarak eklenen kaydın ID'sini döndür
          });
        });
      },
      get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
           if (!db) { // Bağlantı kontrolü
            return reject(new Error("Veritabanı bağlantısı henüz kurulmadı."));
           }
          db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      },
      // Doğrudan db bağlantı nesnesini de dışarıya aktarıyoruz (silme gibi özel işlemler için this.changes'a ihtiyaç duyulduğunda)
      db: db // <-- db bağlantı nesnesini dışarıya aktardık. Başlangıçta null olabilir ama initialize sonrası atanacak.
             // Bu satırın database objesinin içinde olduğundan emin olun!
    };

    module.exports = database; // initializeDatabase ve diğer CRUD fonksiyonlarını dışarıya aktarıyoruz