const express = require('express');
const app = express();
const db = require('./database');

app.use(express.json()); // Pour lire le JSON dans le corps des requêtes

app.get('/', (req, res) => {
    res.send('Bienvenue sur l\'API de gestion d\'événements !');
});

app.get('/events', (req, res) => {
    const events = db.prepare('SELECT * FROM events').all();
    res.json(events);
});

// POST /events : Créer un nouvel événement
app.post('/events', (req, res) => {
    const newEvent = req.body;

    // --- LOGIQUE MÉTIER (À tester via CI/CD !) ---

    // 1. Validation basique
    if (!newEvent.title || !newEvent.date) {
        return res.status(400).json({
            error: "Le titre et la date sont obligatoires"
        });
    }

    // 2. Validation logique : pas d'événement dans le passé
    const eventDate = new Date(newEvent.date);
    const today = new Date();
    // On retire l'heure pour comparer uniquement les jours
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) {
        return res.status(400).json({
            error: "La date ne peut pas être dans le passé"
        });
    }

    // 3. Insertion en base de données
    const stmt = db.prepare('INSERT INTO events (title, date, description) VALUES (?, ?, ?)');
    const result = stmt.run(newEvent.title, newEvent.date, newEvent.description || null);

    res.status(201).json({
        id: result.lastInsertRowid,
        title: newEvent.title,
        date: newEvent.date,
        description: newEvent.description || null
    });
});

// Export de l'app (nécessaire pour les tests unitaires sans lancer le serveur)
module.exports = app;