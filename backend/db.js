const Database = require("better-sqlite3");

// Cria (ou abre) o arquivo de banco de dados
const db = new Database("database.sqlite");

// Criação das tabelas se não existirem
db.exec(`
  CREATE TABLE IF NOT EXISTS lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER,
    email TEXT NOT NULL,
    empresa TEXT,
    contato TEXT,
    telefone TEXT,
    obs TEXT,
    tags TEXT,
    FOREIGN KEY (list_id) REFERENCES lists (id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS email_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subject TEXT,
    body TEXT
  );
`);

// Exemplo de inserir um usuário padrão (se não existir)
try {
  const checkUser = db.prepare(`
    SELECT * FROM users WHERE username = ?
  `).get("admin");

  if (!checkUser) {
    db.prepare(`
      INSERT INTO users (username, password)
      VALUES (?, ?)
    `).run("admin", "1234");
  }
} catch (err) {
  console.error("Erro ao verificar/ inserir usuário padrão:", err);
}

module.exports = db;

