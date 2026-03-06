const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'events.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS events (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        title       TEXT    NOT NULL,
        date        TEXT    NOT NULL,
        description TEXT,
        capacite    INTEGER DEFAULT NULL
    )
`);

// Migration : ajouter la colonne si elle n'existe pas encore (BDD existante)
const columns = db.prepare("PRAGMA table_info(events)").all().map(c => c.name);
if (!columns.includes('capacite')) {
    db.exec('ALTER TABLE events ADD COLUMN capacite INTEGER DEFAULT NULL');
}

module.exports = db;
