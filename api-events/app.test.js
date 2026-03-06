const request = require('supertest');

// ── Mock BDD SQLite ─────────────────────────────────────────────────
// Les tests n'écrivent jamais dans events.db
const mockRun = jest.fn(() => ({ lastInsertRowid: 1, changes: 1 }));
const mockAll = jest.fn(() => []);

jest.mock('./database', () => ({
    prepare: jest.fn(() => ({ run: mockRun, all: mockAll })),
}));

const app = require('./app');

// ────────────────────────────────────────────────────────────────────
describe('GET /events', () => {

    it('retourne un tableau vide quand il n\'y a pas d\'événements (200)', async () => {
        mockAll.mockReturnValueOnce([]);
        const res = await request(app).get('/events');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(0);
    });

    it('retourne la liste des événements existants (200)', async () => {
        mockAll.mockReturnValueOnce([
            { id: 1, title: 'Conf CI/CD', date: '2026-04-15', description: null, capacite: null, categorie: null, lieu: null }
        ]);
        const res = await request(app).get('/events');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].title).toBe('Conf CI/CD');
    });
});

// ────────────────────────────────────────────────────────────────────
describe('POST /events — Validations', () => {

    it('refuse si le titre est manquant (400)', async () => {
        const res = await request(app).post('/events').send({ date: '2028-01-01' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Le titre et la date sont obligatoires");
    });

    it('refuse si la date est manquante (400)', async () => {
        const res = await request(app).post('/events').send({ title: 'Mon Event' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Le titre et la date sont obligatoires");
    });

    it('refuse si la date est dans le passé (400)', async () => {
        const res = await request(app).post('/events').send({ title: 'Event passé', date: '2020-01-01' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("La date ne peut pas être dans le passé");
    });

    it('refuse si la capacité est 0 (400)', async () => {
        const res = await request(app).post('/events').send({ title: 'Event', date: '2028-01-01', capacite: 0 });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("La capacité doit être un entier positif");
    });

    it('refuse si la capacité est négative (400)', async () => {
        const res = await request(app).post('/events').send({ title: 'Event', date: '2028-01-01', capacite: -5 });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("La capacité doit être un entier positif");
    });
});

// ────────────────────────────────────────────────────────────────────
describe('POST /events — Succès', () => {

    it('crée un événement minimal (titre + date) (201)', async () => {
        const res = await request(app).post('/events').send({ title: 'Futur Event', date: '2028-12-31' });
        expect(res.status).toBe(201);
        expect(res.body.id).toBe(1);
        expect(res.body.title).toBe('Futur Event');
        expect(res.body.capacite).toBeNull();
        expect(res.body.categorie).toBeNull();
        expect(res.body.lieu).toBeNull();
    });

    it('crée un événement complet avec tous les champs (201)', async () => {
        const res = await request(app).post('/events').send({
            title:       'Meetup DevOps',
            date:        '2028-06-15',
            description: 'Un super meetup',
            capacite:    50,
            categorie:   'Meetup',
            lieu:        'Paris'
        });
        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Meetup DevOps');
        expect(res.body.capacite).toBe(50);
        expect(res.body.categorie).toBe('Meetup');
        expect(res.body.lieu).toBe('Paris');
    });
});

// ────────────────────────────────────────────────────────────────────
describe('PUT /events/:id — Validations', () => {

    it('refuse si le titre est manquant (400)', async () => {
        const res = await request(app).put('/events/1').send({ date: '2028-01-01' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Le titre et la date sont obligatoires");
    });

    it('refuse si la date est dans le passé (400)', async () => {
        const res = await request(app).put('/events/1').send({ title: 'Event', date: '2020-01-01' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("La date ne peut pas être dans le passé");
    });

    it('refuse si la capacité est invalide (400)', async () => {
        const res = await request(app).put('/events/1').send({ title: 'Event', date: '2028-01-01', capacite: -1 });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("La capacité doit être un entier positif");
    });

    it('retourne 404 si l\'événement n\'existe pas', async () => {
        mockRun.mockReturnValueOnce({ changes: 0 });
        const res = await request(app).put('/events/999').send({ title: 'Ghost', date: '2028-01-01' });
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Événement introuvable");
    });
});

// ────────────────────────────────────────────────────────────────────
describe('PUT /events/:id — Succès', () => {

    it('met à jour un événement avec tous les champs (200)', async () => {
        const res = await request(app).put('/events/1').send({
            title:       'Event Modifié',
            date:        '2028-09-01',
            description: 'Nouvelle description',
            capacite:    100,
            categorie:   'Conférence',
            lieu:        'Lyon'
        });
        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Event Modifié');
        expect(res.body.capacite).toBe(100);
        expect(res.body.categorie).toBe('Conférence');
        expect(res.body.lieu).toBe('Lyon');
    });
});

// ────────────────────────────────────────────────────────────────────
describe('DELETE /events/:id', () => {

    it('supprime un événement existant (200)', async () => {
        const res = await request(app).delete('/events/1');
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Événement #1 supprimé");
    });

    it('retourne 404 si l\'événement n\'existe pas', async () => {
        mockRun.mockReturnValueOnce({ changes: 0 });
        const res = await request(app).delete('/events/999');
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Événement introuvable");
    });
});

