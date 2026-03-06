const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'events.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS events (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        title   TEXT    NOT NULL,
        date    TEXT    NOT NULL,
        description TEXT
    )
`);

module.exports = db;

