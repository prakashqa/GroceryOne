import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp } from './helpers/test-app.helper';
import { loginAsAdmin, loginAsCustomer, CREDENTIALS } from './helpers/auth.helper';
import { tenantPost, tenantGet, authGet, authPost } from './helpers/request.helper';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    server = testApp.server;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('POST /auth/resolve-tenant', () => {
    it('should resolve tenant for valid email', async () => {
      const res = await request(server)
        .post('/api/v1/auth/resolve-tenant')
        .send({ identifier: 'admin@freshmart.com' })
        .expect(200);

      expect(res.body.data).toHaveProperty('tenantSlug', 'freshmart');
      expect(res.body.data).toHaveProperty('tenantName');
      expect(res.body.data).toHaveProperty('userFirstName');
    });

    it('should return 401 for unknown email', async () => {
      await request(server)
        .post('/api/v1/auth/resolve-tenant')
        .send({ identifier: 'unknown@nobody.com' })
        .expect(401);
    });

    it('should work without X-Tenant-ID header', async () => {
      const res = await request(server)
        .post('/api/v1/auth/resolve-tenant')
        .send({ identifier: 'admin@freshmart.com' });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid admin credentials', async () => {
      const res = await tenantPost(server, '/auth/login')
        .send({ identifier: 'admin@freshmart.com', password: 'Admin@FM123' })
        .expect(200);

      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user).toHaveProperty('email', 'admin@freshmart.com');
      expect(res.body.data.user).toHaveProperty('role', 'admin');
    });

    it('should return 401 for wrong password', async () => {
      await tenantPost(server, '/auth/login')
        .send({ identifier: 'admin@freshmart.com', password: 'WrongPassword' })
        .expect(401);
    });

    it('should return 400 without X-Tenant-ID header', async () => {
      const res = await request(server)
        .post('/api/v1/auth/login')
        .send({ identifier: 'admin@freshmart.com', password: 'Admin@FM123' });

      expect([400, 404]).toContain(res.status);
    });

    it('should return 404 for invalid tenant slug', async () => {
      await request(server)
        .post('/api/v1/auth/login')
        .set('X-Tenant-ID', 'nonexistent-tenant')
        .send({ identifier: 'admin@freshmart.com', password: 'Admin@FM123' })
        .expect(404);
    });

    it('should login with phone number', async () => {
      const res = await tenantPost(server, '/auth/login')
        .send({ identifier: '+91-9876543211', password: 'Admin@FM123' })
        .expect(200);

      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should login customer with valid credentials', async () => {
      const res = await tenantPost(server, '/auth/login')
        .send({ identifier: 'customer@freshmart.com', password: 'Customer@FM123' })
        .expect(200);

      expect(res.body.data.user).toHaveProperty('role', 'customer');
    });

    it('should return error for empty identifier', async () => {
      const res = await tenantPost(server, '/auth/login')
        .send({ identifier: '', password: 'Admin@FM123' });

      expect([400, 401]).toContain(res.status);
    });
  });

  describe('POST /auth/login/pin', () => {
    it('should login with valid PIN', async () => {
      const res = await tenantPost(server, '/auth/login/pin')
        .send({ identifier: 'admin@freshmart.com', pin: '1234' })
        .expect(200);

      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('user');
    });

    it('should return 401 for wrong PIN', async () => {
      await tenantPost(server, '/auth/login/pin')
        .send({ identifier: 'admin@freshmart.com', pin: '9999' })
        .expect(401);
    });

    it('should return 401 for non-existent user PIN login', async () => {
      await tenantPost(server, '/auth/login/pin')
        .send({ identifier: 'nobody@freshmart.com', pin: '1234' })
        .expect(401);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return profile with valid token', async () => {
      const { accessToken } = await loginAsAdmin(server);
      const res = await authGet(server, '/auth/profile', accessToken).expect(200);

      expect(res.body.data).toHaveProperty('userId');
      expect(res.body.data).toHaveProperty('tenantId');
      expect(res.body.data).toHaveProperty('role', 'admin');
    });

    it('should return 401 without token', async () => {
      await tenantGet(server, '/auth/profile').expect(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return full user details', async () => {
      const { accessToken } = await loginAsAdmin(server);
      const res = await authGet(server, '/auth/me', accessToken).expect(200);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).toHaveProperty('firstName');
      expect(res.body.data).toHaveProperty('role');
      expect(res.body.data).toHaveProperty('status');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout and reject blacklisted token', async () => {
      const { accessToken } = await loginAsAdmin(server);
      const res = await authPost(server, '/auth/logout', accessToken).expect(200);

      expect(res.body.data).toHaveProperty('message', 'Logged out successfully');

      // Token should now be blacklisted
      await authGet(server, '/auth/profile', accessToken).expect(401);
    });
  });

  describe('Cross-tenant isolation', () => {
    it('should not allow freshmart token with quickbasket tenant', async () => {
      const { accessToken } = await loginAsAdmin(server, 'freshmart');
      const res = await authGet(server, '/auth/profile', accessToken, 'quickbasket');
      expect([401, 403]).toContain(res.status);
    });
  });
});
