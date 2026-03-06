const request = require('supertest');

// Mock de la BDD SQLite : les tests n'écrivent jamais dans events.db
jest.mock('./database', () => {
    const mockRun = jest.fn(() => ({ lastInsertRowid: 1 }));
    const mockAll = jest.fn(() => []);
    return {
        prepare: jest.fn(() => ({
            run: mockRun,
            all: mockAll,
        })),
    };
});

const app = require('./app');

describe('Tests de la Logique Métier - API Events', () => {

    // TEST 1 : Vérification des champs obligatoires
    it('doit refuser un événement sans titre ou sans date (400)', async () => {
        const response = await request(app)
            .post('/events')
            .send({ title: "Soirée DevOps" }); // Il manque la date !

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Le titre et la date sont obligatoires");
    });

    // TEST 2 : Vérification de la date dans le passé
    it('doit refuser un événement dans le passé (400)', async () => {
        const response = await request(app)
            .post('/events')
            .send({
                title: "Événement passé",
                date: "2020-01-01"
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("La date ne peut pas être dans le passé");
    });

    // TEST 3 : Cas de succès
    it('doit accepter un événement avec une date valide (201)', async () => {
        const response = await request(app)
            .post('/events')
            .send({
                title: "Futur Event",
                date: "2028-12-31"
            });

        expect(response.status).toBe(201);
        expect(response.body.id).toBe(1);
        expect(response.body.title).toBe("Futur Event");
    });

    // TEST 4 : GET /events retourne bien un tableau
    it('doit retourner la liste des événements (200)', async () => {
        const response = await request(app).get('/events');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });
});