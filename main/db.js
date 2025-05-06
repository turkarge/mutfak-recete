// main/db.js
const { app } = require('electron'); // app objesi userData yolu için gerekli
const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(app.getPath('userData'), 'restoran.db');
let db = null;

// Veritabanını açma ve tabloları oluşturma fonksiyonu
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        console.error('Veritabanı bağlantı hatası:', err.message);
        reject(err);
      } else {
        console.log('Veritabanına başarıyla bağlandı:', dbPath);

        // Yabancı anahtarları etkinleştir (İlişkilerin doğruluğunu sağlamak için)
        db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
            if (pragmaErr) {
                console.error('Yabancı anahtarları etkinleştirme hatası:', pragmaErr.message);
                reject(pragmaErr);
            } else {
                console.log('Yabancı anahtarlar etkin.');

                // Tabloları seri halde oluştur (sırayla)
                db.serialize(() => {
                  db.run(`CREATE TABLE IF NOT EXISTS urunler (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ad TEXT NOT NULL UNIQUE COLLATE NOCASE,
                    tur TEXT NOT NULL CHECK (tur IN ('Hammadde', 'Son Ürün'))
                  )`, (err) => {
                    if (err) console.error('urunler tablosu oluşturma hatası:', err.message);
                    else console.log('urunler tablosu hazır.');
                  });

                  db.run(`CREATE TABLE IF NOT EXISTS birimler (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    birimAdi TEXT NOT NULL UNIQUE,
                    kisaAd TEXT NOT NULL UNIQUE,
                    anaBirimKisaAd TEXT
                  )`, (err) => {
                    if (err) console.error('birimler tablosu oluşturma hatası:', err.message);
                    else console.log('birimler tablosu hazır.');
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

                  // Varsayılan birimleri ekle
                  insertDefaultBirimler();

                  // Tüm tablolar oluşturulduktan ve birimler eklendikten sonra promise'ı çöz
                  resolve();

                }); // serialize sonu
            }
        }); // PRAGMA sonu
      }
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
      { birimAdi: 'Porsiyon', kisaAd: 'porsiyon', anaBirimKisaAd: 'porsiyon' }
  ];

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
const database = {
  initialize: initializeDatabase,
  // db.all fonksiyonunu Promise döndürecek şekilde sarmalıyoruz
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
   // db.run fonksiyonunu Promise döndürecek şekilde sarmalıyoruz
   run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      // db.run'ın callback'i arrow function OLMAMALI, this.lastID'ye erişmek için function() {} olmalı
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this.lastID); // Eklenen son kaydın ID'sini döndür
      });
    });
  },
  // db.get fonksiyonunu Promise döndürecek şekilde sarmalıyoruz (tek bir satır için)
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row); // Tek bir satırı döndür
      });
    });
  }
  // db.each (tek tek satır işlemek için) ve diğer fonksiyonları da ihtiyaca göre sarmalayabiliriz
};

module.exports = database; // initializeDatabase ve diğer CRUD fonksiyonlarını dışarıya aktarıyoruz