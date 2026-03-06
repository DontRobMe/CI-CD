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
            { id: 1, title: 'Conf CI/CD', date: '2026-04-15', description: null, participants: null, categorie: null, lieu: null }
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
        const res = await request(app).post('/events').send({ title: 'Event', date: '2028-01-01', participants: 0 });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("La capacité doit être un entier positif");
    });

    it('refuse si la capacité est négative (400)', async () => {
        const res = await request(app).post('/events').send({ title: 'Event', date: '2028-01-01', participants: -5 });
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
        expect(res.body.participants).toBeNull();
        expect(res.body.categorie).toBeNull();
        expect(res.body.lieu).toBeNull();
    });

    it('crée un événement complet avec tous les champs (201)', async () => {
        const res = await request(app).post('/events').send({
            title:       'Meetup DevOps',
            date:        '2028-06-15',
            description: 'Un super meetup',
            participants:    50,
            categorie:   'Meetup',
            lieu:        'Paris'
        });
        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Meetup DevOps');
        expect(res.body.participants).toBe(50);
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
        const res = await request(app).put('/events/1').send({ title: 'Event', date: '2028-01-01', participants: -1 });
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
            participants:    100,
            categorie:   'Conférence',
            lieu:        'Lyon'
        });
        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Event Modifié');
        expect(res.body.participants).toBe(100);
        expect(res.body.categorie).toBe('Conférence');
        expect(res.body.lieu).toBe('Lyon');
    });
});

// ────────────────────────────────────────────────────────────────────
describe('Sécurité API — Headers HTTP (Helmet)', () => {

    it('expose l\'en-tête X-Content-Type-Options: nosniff', async () => {
        const res = await request(app).get('/events');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('expose l\'en-tête X-Frame-Options pour bloquer le clickjacking', async () => {
        const res = await request(app).get('/events');
        // helmet renvoie SAMEORIGIN ou DENY selon la config
        expect(res.headers['x-frame-options']).toMatch(/SAMEORIGIN|DENY/i);
    });

    it('ne renvoie pas l\'en-tête X-Powered-By (fingerprinting)', async () => {
        const res = await request(app).get('/events');
        expect(res.headers['x-powered-by']).toBeUndefined();
    });
});

// ────────────────────────────────────────────────────────────────────
describe('Sécurité API — Enforcement Content-Type', () => {

    it('refuse un POST sans Content-Type application/json (415)', async () => {
        const res = await request(app)
            .post('/events')
            .set('Content-Type', 'text/plain')
            .send('title=Test&date=2028-01-01');
        expect(res.status).toBe(415);
        expect(res.body.error).toBe("Content-Type doit être application/json");
    });

    it('refuse un PUT sans Content-Type application/json (415)', async () => {
        const res = await request(app)
            .put('/events/1')
            .set('Content-Type', 'text/plain')
            .send('title=Test&date=2028-01-01');
        expect(res.status).toBe(415);
        expect(res.body.error).toBe("Content-Type doit être application/json");
    });

    it('accepte un POST avec Content-Type application/json (pas de 415)', async () => {
        const res = await request(app)
            .post('/events')
            .set('Content-Type', 'application/json')
            .send({ title: 'Sécurisé', date: '2028-01-01' });
        expect(res.status).not.toBe(415);
    });
});

// ────────────────────────────────────────────────────────────────────
describe('Sécurité API — Sanitisation XSS', () => {

    it('supprime les balises HTML dans le titre avant insertion (POST)', async () => {
        const res = await request(app)
            .post('/events')
            .send({ title: '<script>alert("xss")</script>Conf', date: '2028-01-01' });
        expect(res.status).toBe(201);
        // Le bloc <script>...</script> entier est supprimé, "Conf" reste
        expect(res.body.title).toBe('Conf');
        expect(res.body.title).not.toContain('<script>');
    });

    it('supprime les balises HTML dans la description (POST)', async () => {
        const res = await request(app)
            .post('/events')
            .send({ title: 'Event', date: '2028-01-01', description: '<img src=x onerror=alert(1)>Détail' });
        expect(res.status).toBe(201);
        expect(res.body.description).not.toContain('<img');
        // Le texte "Détail" doit être conservé
        expect(res.body.description).toContain('Détail');
    });

    it('supprime les balises HTML dans le titre avant mise à jour (PUT)', async () => {
        const res = await request(app)
            .put('/events/1')
            .send({ title: '<b>Evil</b>Title', date: '2028-01-01' });
        expect(res.status).toBe(200);
        // Les balises <b> sont supprimées mais le texte "EvilTitle" est conservé
        expect(res.body.title).toBe('EvilTitle');
        expect(res.body.title).not.toContain('<b>');
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

