const sqlite3 = require('sqlite3').verbose();

// We use SQLite so you don't have to install MySQL locally for testing.
// It creates a local file 'careq.db' to store structured relational data natively!
const db = new sqlite3.Database('./careq.db', (err) => {
  if (err) console.error("[DB Error] Failed to connect:", err);
  else console.log("[DB Success] Connected to SQLite embedded database");
});

// Initialize Advanced Schema
db.serialize(() => {
  // Authentication Table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  )`);
  
  // Real-Time Queue Table
  db.run(`CREATE TABLE IF NOT EXISTS queue_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_number TEXT UNIQUE,
    patient_name TEXT,
    condition TEXT DEFAULT 'General Consultation',
    severity INTEGER,
    status TEXT DEFAULT 'waiting',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Bed Tracking Map Table
  db.run(`CREATE TABLE IF NOT EXISTS beds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ward_name TEXT,
    status TEXT DEFAULT 'available',
    patient_id TEXT
  )`);
  
  // Migration: add condition column if it doesn't exist (for existing DBs)
  db.run(`ALTER TABLE queue_tokens ADD COLUMN condition TEXT DEFAULT 'General Consultation'`, () => {});

  // Clean initial DB seeding for empty starts
  db.get("SELECT COUNT(*) AS count FROM beds", (err, row) => {
    if(row && row.count === 0) {
      const stmt = db.prepare("INSERT INTO beds (ward_name, status) VALUES (?, ?)");
      for(let i=1; i<=10; i++) stmt.run(`General Ward - Bed ${i}`, 'available');
      for(let i=1; i<=4; i++) stmt.run(`ICU - Bed ${i}`, 'available');
      stmt.finalize();
    }
  });
});

module.exports = db;
