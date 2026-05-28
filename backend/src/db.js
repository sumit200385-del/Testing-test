const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../database.sqlite');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
    seedData();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','rd_engineer','rd_head','operations','sales')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS firmware_versions (
      id TEXT PRIMARY KEY,
      version TEXT NOT NULL,
      device_model TEXT NOT NULL,
      platform TEXT NOT NULL DEFAULT 'abckedn',
      description TEXT,
      release_notes TEXT,
      status TEXT NOT NULL DEFAULT 'draft'
        CHECK(status IN ('draft','stage1_pending','stage1_passed','stage1_failed',
                         'stage2_pending','stage2_passed','stage2_failed',
                         'stage3_pending','approved','rejected')),
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS testing_sessions (
      id TEXT PRIMARY KEY,
      firmware_id TEXT NOT NULL,
      stage INTEGER NOT NULL CHECK(stage IN (1,2,3)),
      tester_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'in_progress'
        CHECK(status IN ('in_progress','completed','signed_off','rejected')),
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      notes TEXT,
      FOREIGN KEY(firmware_id) REFERENCES firmware_versions(id),
      FOREIGN KEY(tester_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS test_cases (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      category TEXT NOT NULL,
      test_name TEXT NOT NULL,
      description TEXT,
      result TEXT CHECK(result IN ('pass','fail','skip','pending')) DEFAULT 'pending',
      actual_value TEXT,
      expected_value TEXT,
      remarks TEXT,
      tested_at TEXT,
      FOREIGN KEY(session_id) REFERENCES testing_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS signoffs (
      id TEXT PRIMARY KEY,
      firmware_id TEXT NOT NULL,
      stage INTEGER NOT NULL CHECK(stage IN (1,2,3)),
      session_id TEXT NOT NULL,
      signed_by TEXT NOT NULL,
      decision TEXT NOT NULL CHECK(decision IN ('approved','rejected')),
      comments TEXT,
      signed_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(firmware_id) REFERENCES firmware_versions(id),
      FOREIGN KEY(session_id) REFERENCES testing_sessions(id),
      FOREIGN KEY(signed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS change_log (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      changed_at TEXT NOT NULL DEFAULT (datetime('now')),
      old_value TEXT,
      new_value TEXT,
      details TEXT,
      FOREIGN KEY(changed_by) REFERENCES users(id)
    );
  `);
}

function seedData() {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (count.c > 0) return;

  const { v4: uuidv4 } = require('uuid');
  const insert = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `);

  const users = [
    { id: uuidv4(), name: 'Admin User',        email: 'admin@abckedn.com',      role: 'admin' },
    { id: uuidv4(), name: 'R&D Engineer',      email: 'rd.engineer@abckedn.com', role: 'rd_engineer' },
    { id: uuidv4(), name: 'R&D Head',          email: 'rd.head@abckedn.com',     role: 'rd_head' },
    { id: uuidv4(), name: 'Operations Lead',   email: 'ops@abckedn.com',         role: 'operations' },
    { id: uuidv4(), name: 'Sales Manager',     email: 'sales@abckedn.com',       role: 'sales' },
  ];

  const hash = bcrypt.hashSync('Password@123', 10);
  for (const u of users) {
    insert.run(u.id, u.name, u.email, hash, u.role);
  }
}

module.exports = { getDb };
