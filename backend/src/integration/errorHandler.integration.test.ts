import request from 'supertest';
import { createApp } from '../app';
import redis from '../lib/redis';

const app = createApp();

describe('Global Error Handling', () => {
  describe('404 Not Found', () => {
    it('should return 404 with consistent error format for non-existent routes', async () => {
      const res = await request(app).get('/api/this-route-does-not-exist');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'NOT_FOUND_ERROR');
      expect(res.body).toHaveProperty('message');
      // En entorno de test (que suele ser como dev), deberíamos ver stack
      // Si NODE_ENV es 'test', express suele comportarse similar a dev o prod dependiendo de config.
      // Asumiremos que devuelve JSON estructurado.
    });
  });

  describe('Validation Errors (via existing endpoint)', () => {
    it('should return 400 with validation details', async () => {
      // Usamos /api/auth/login o similar si existe, o un admin endpoint.
      // El test de admin usaba /api/admin/login.

      const res = await request(app)
        .post('/api/admin/login')
        .send({ email: 'not-an-email', password: '' }); // Invalid data

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'VALIDATION_ERROR');
      expect(res.body).toHaveProperty('details');
      expect(Array.isArray(res.body.details)).toBe(true);
    });
  });

  afterAll(async () => {
    await redis.quit();
  });
});
