import request from 'supertest';
import { app } from '../src/index';
import { User } from '../src/models/User';

describe('Health Check', () => {
  it('should return 200 for health endpoint', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.uptime).toBeDefined();
    expect(response.body.environment).toBeDefined();
  });
});

describe('Public API', () => {
  it('should return categories list', async () => {
    const response = await request(app)
      .get('/api/public/categories')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should return articles list', async () => {
    const response = await request(app)
      .get('/api/public/articles')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.articles).toBeDefined();
    expect(response.body.data.pagination).toBeDefined();
  });

  it('should return trending articles', async () => {
    const response = await request(app)
      .get('/api/public/trending')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should return active tickers', async () => {
    const response = await request(app)
      .get('/api/public/ticker/active')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

describe('Authentication API', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'testpassword123',
    role: 'reader' as const,
  };

  beforeEach(async () => {
    // Clean up test user
    await User.deleteOne({ email: testUser.email });
  });

  afterAll(async () => {
    // Clean up test user
    await User.deleteOne({ email: testUser.email });
  });

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(testUser.email);
    expect(response.body.data.user.role).toBe(testUser.role);
    expect(response.body.data.token).toBeDefined();
  });

  it('should login existing user', async () => {
    // First register the user
    await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    // Then login
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(testUser.email);
    expect(response.body.data.token).toBeDefined();
  });

  it('should not login with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword',
      })
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Unauthorized');
  });

  it('should not register duplicate user', async () => {
    // Register user first time
    await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    // Try to register same user again
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(409);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Conflict');
  });

  it('should require authentication for protected routes', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Unauthorized');
  });
});

describe('Input Validation', () => {
  it('should validate registration input', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        password: '123', // Too short
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Bad Request');
  });

  it('should validate login input', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'invalid-email',
        password: '',
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Bad Request');
  });

  it('should validate article query parameters', async () => {
    const response = await request(app)
      .get('/api/public/articles?sort=invalid-sort')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Bad Request');
  });
});