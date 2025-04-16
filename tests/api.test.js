import request from 'supertest';
import app from '../app.js';

describe('API REST - Pruebas básicas', () => {

  let testUser = {
    name: 'Test User',
    email: `test${Date.now()}@mail.com`,
    password: 'test1234'
  };

  let token = '';

  it('POST /api/auth/register → debe registrar un nuevo usuario', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('token');
  });

  it('POST /api/auth/login → debe iniciar sesión con el usuario registrado', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('GET /api/products → debe listar productos públicos', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/users/favorites → debe rechazar sin token', async () => {
    const res = await request(app).get('/api/users/favorites');
    expect(res.statusCode).toBe(401);
  });

});