// main/db.js
// Veritabanı bağlantısını ve temel CRUD işlemlerini yönetir.

const { app } = require('electron');
const path = require('node:path');
const sqlite3 = require('sqlite3').verbose(); // verbose hata ayıklama için faydalı

const dbPath = path.join(app.getPath('userData'), 'restoran.db');
let db = null; // Veritabanı bağlantı nesnesi. Başlangıçta null, initializeDatabase çalışınca atanacak.

// Veritabanını açma ve tabloları oluşturma fonksiyonu
// Bu fonksiyon bir Promise döndürür ve tüm tablolar oluşana kadar beklemesini sağlar.
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // Veritabanı dosyasını aç veya oluştur
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        console.error('Veritabanı bağlantı hatası:', err.message);
        // Bağlantı hatasında Promise'i reject et ve uygulamayı kapat
        // main.js'deki app.whenReady'deki catch bloğu bunu yakalayacak.
        reject(err);
      } else {
        console.log('Veritabanına başarıyla bağlandı:', dbPath);

        // Bağlantı kurulduktan hemen sonra yabancı anahtarları etkinleştir
        db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
            if (pragmaErr) {
                console.error('Yabancı anahtarları etkinleştirme hatası:', pragmaErr.message);
                // PRAGMA hatasında Promise'i reject et
                reject(pragmaErr);
            } else {
                console.log('Yabancı anahtarlar etkin.');

                // Tablo oluşturma ve varsayılan birim ekleme işlemleri seri olarak yapılacak
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
                      // Not: serialize bloğu tamamlandığında callback fonksiyonu yoktur.
                      // Bu nedenle resolve() çağrısını serialize bloğunun dışına,
                      // PRAGMA callback'inin içine (ama serialize'dan sonra) taşıdık.
                      // resolve(); // <-- Bu satır buradan kaldırıldı, PRAGMA callback'inde yukarıya taşındı.


                    }); // serialize sonu

                    // resolve() çağrısı artık PRAGMA callback'i içinde, serialize bloğu başlamadan hemen önce.

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
      // insertDefaultBirimler fonksiyonu initializeDatabase içindeki serialize bloğundan çağrıldığı için buradaki serialize gereksiz ve hata yaratabilir.
      // Düzeltme: insertDefaultBirimler fonksiyonu sadece db.run komutlarını içermeli, serialize initializeDatabase içinde yapılmalı.

      // Düzeltilmiş insertDefaultBirimler fonksiyonu:
       const stmt = db.prepare("INSERT OR IGNORE INTO birimler (birimAdi, kisaAd, anaBirimKisaAd) VALUES (?, ?, ?)");
       birimler.forEach(birim => {
           stmt.run(birim.birimAdi, birim.kisaAd, birim.anaBirimKisaAd);
       });
       stmt.finalize((err) => {
           if (!err) {
               console.log("Varsayılan birimler eklendi (eğer daha önce yoksa).");
           } else {
               console.error("Varsayılan birim ekleme hatası:", err.message);
           }
       });
    }


    // Temel CRUD (Create, Read, Update, Delete) işlemleri için yardımcı fonksiyonlar
    // Bu fonksiyonlar Ana Süreç'teki diğer modüller tarafından kullanılacak
    // Promise dönen fonksiyonlar
    const database = {
      initialize: initializeDatabase,
      // db bağlantı nesnesini döndüren getter fonksiyonu
      getDb: () => {
          if (!db) {
             // Teorik olarak buraya düşmemeli, initialize bekleniyor.
             // Ancak düşerse hata fırlatmak daha iyi.
             // Bu hata, initialize tamamlanmadan bir handler çalışırsa ortaya çıkar.
             throw new Error("Veritabanı bağlantısı henüz hazır değil (getDb çağrıldı).");
          }
          return db;
      },

       all: (sql, params = []) => {
        return new Promise((resolve, reject) => {
          // getDb() aracılığıyla güncel db nesnesine eriş
          database.getDb().all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
      },
       run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
           // getDb() aracılığıyla güncel db nesnesine eriş
          database.getDb().run(sql, params, function(err) { // function() callback'i this.lastID, this.changes için gerekli
            if (err) reject(err);
            else resolve(this.lastID); // Varsayılan olarak eklenen kaydın ID'sini döndür
          });
        });
      },
      get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
           // getDb() aracılığıyla güncel db nesnesine eriş
          database.getDb().get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      }
      // db.close fonksiyonu ekleyebiliriz, main.js kapanırken çağırırız
       /*
       close: () => {
           return new Promise((resolve, reject) => {
               if (db) {
                   db.close((err) => {
                       if (err) reject(err);
                       else {
                           console.log('Veritabanı bağlantısı kapatıldı.');
                           db = null; // Nesneyi null yap
                           resolve();
                       }
                   });
               } else {
                   resolve(); // Zaten kapalıysa sorun yok
               }
           });
       }
       */
    };

    // Yabancı modüllerden erişim için dışa aktar
    module.exports = database;