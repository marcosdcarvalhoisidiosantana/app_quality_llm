const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS Set_empresa (
      IDsetor INTEGER PRIMARY KEY AUTOINCREMENT,
      NomeSetor TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Doc_Qualidade (
      IDdoc INTEGER PRIMARY KEY AUTOINCREMENT,
      TituloDoc TEXT NOT NULL,
      Arquivo BLOB,
      SetorDoc INTEGER,
      EstadoDoc TEXT CHECK(EstadoDoc IN ('Inativo', 'Ativo')) DEFAULT 'Ativo',
      FOREIGN KEY(SetorDoc) REFERENCES Set_empresa(IDsetor)
    )
  `);
});

module.exports = db;
