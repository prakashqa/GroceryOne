import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp } from './helpers/test-app.helper';
import { loginAsAdmin } from './helpers/auth.helper';
import { tenantGet, authGet, authPost, authPut, authDelete } from './helpers/request.helper';

describe('Cart (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let adminToken: string;
  let adminUserId: string;
  let cartId: string;
  let itemId: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    server = testApp.server;
    const admin = await loginAsAdmin(server);
    adminToken = admin.accessToken;
    adminUserId = admin.user.id;

    // Get a product ID for cart item operations
    const itemsRes = await tenantGet(server, '/items').expect(200);
    itemId = itemsRes.body.data[0].id;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('Cart CRUD', () => {
    it('POST /carts should create a new cart', async () => {
      const res = await authPost(server, '/carts', adminToken)
        .send({ name: 'E2E Test Cart', userId: adminUserId })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('E2E Test Cart');
      cartId = res.body.data.id;
    });

    it('GET /carts should list carts', async () => {
      const res = await authGet(server, '/carts', adminToken).expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /carts/count should return count', async () => {
      const res = await authGet(server, '/carts/count', adminToken).expect(200);
      expect(res.body.data).toHaveProperty('count');
      expect(res.body.data.count).toBeGreaterThan(0);
    });

    it('GET /carts/:id should return cart by ID', async () => {
      const res = await authGet(server, `/carts/${cartId}`, adminToken).expect(200);
      expect(res.body.data.id).toBe(cartId);
      expect(res.body.data.name).toBe('E2E Test Cart');
    });

    it('PUT /carts/:id should update cart', async () => {
      const res = await authPut(server, `/carts/${cartId}`, adminToken)
        .send({ name: 'Updated E2E Cart' })
        .expect(200);

      expect(res.body.data.name).toBe('Updated E2E Cart');
    });

    it('should return 401 without auth token', async () => {
      await tenantGet(server, '/carts').expect(401);
    });
  });

  describe('Cart Items', () => {
    it('POST /carts/:id/items should add item to cart', async () => {
      const res = await authPost(server, `/carts/${cartId}/items`, adminToken)
        .send({ itemId, quantity: 2, priceSnapshot: 40 })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.quantity).toBe(2);
    });

    it('PUT /carts/:cartId/items/:itemId should update quantity', async () => {
      const res = await authPut(server, `/carts/${cartId}/items/${itemId}`, adminToken)
        .send({ quantity: 5 })
        .expect(200);

      expect(res.body.data.quantity).toBe(5);
    });

    it('GET /carts/:id should return cart with items', async () => {
      const res = await authGet(server, `/carts/${cartId}`, adminToken).expect(200);
      expect(res.body.data).toHaveProperty('items');
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it('DELETE /carts/:cartId/items/:itemId should remove item', async () => {
      await authDelete(server, `/carts/${cartId}/items/${itemId}`, adminToken).expect(204);
    });

    it('should add item back for clear test', async () => {
      await authPost(server, `/carts/${cartId}/items`, adminToken)
        .send({ itemId, quantity: 1, priceSnapshot: 40 })
        .expect(201);
    });

    it('DELETE /carts/:id/items should clear all items', async () => {
      await authDelete(server, `/carts/${cartId}/items`, adminToken).expect(204);

      const res = await authGet(server, `/carts/${cartId}`, adminToken).expect(200);
      expect(res.body.data.items?.length || 0).toBe(0);
    });
  });

  describe('Cart management', () => {
    it('should create multiple carts', async () => {
      const res = await authPost(server, '/carts', adminToken)
        .send({ name: 'Second Cart', userId: adminUserId })
        .expect(201);

      expect(res.body.data.name).toBe('Second Cart');
    });

    it('GET /carts?userId should filter by userId', async () => {
      const res = await authGet(server, `/carts?userId=${adminUserId}`, adminToken).expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((cart: any) => {
        expect(cart.userId).toBe(adminUserId);
      });
    });

    it('should create cart with deviceId', async () => {
      const res = await authPost(server, '/carts', adminToken)
        .send({ name: 'Device Cart', deviceId: 'test-device-123' })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
    });

    it('DELETE /carts/:id should delete cart', async () => {
      await authDelete(server, `/carts/${cartId}`, adminToken).expect(204);
    });
  });
});
