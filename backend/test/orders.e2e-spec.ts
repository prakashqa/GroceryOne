import { INestApplication } from '@nestjs/common';
import { createTestApp, closeTestApp } from './helpers/test-app.helper';
import { loginAsAdmin } from './helpers/auth.helper';
import { tenantGet, authGet, authPost, authPut } from './helpers/request.helper';

describe('Orders (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let adminToken: string;
  let adminUserId: string;
  let orderId: string;
  let cartId: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    server = testApp.server;
    const admin = await loginAsAdmin(server);
    adminToken = admin.accessToken;
    adminUserId = admin.user.id;

    // Create a cart with items for order creation
    const cartRes = await authPost(server, '/carts', adminToken)
      .send({ name: 'Order Test Cart', userId: adminUserId })
      .expect(201);
    cartId = cartRes.body.data.id;

    // Add an item to the cart
    const itemsRes = await tenantGet(server, '/items').expect(200);
    const firstItem = itemsRes.body.data[0];

    await authPost(server, `/carts/${cartId}/items`, adminToken)
      .send({ itemId: firstItem.id, quantity: 3, priceSnapshot: firstItem.price || 50 })
      .expect(201);

    // Cart must be 'paid' or 'completed' to create an order
    await authPut(server, `/carts/${cartId}`, adminToken)
      .send({ status: 'paid' })
      .expect(200);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('Order creation', () => {
    it('POST /orders should create order from cart', async () => {
      const res = await authPost(server, '/orders', adminToken)
        .send({ cartId, notes: 'E2E test order' })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('orderNumber');
      orderId = res.body.data.id;
    });

    it('should return 401 without auth', async () => {
      await tenantGet(server, '/orders').expect(401);
    });
  });

  describe('Order retrieval', () => {
    it('GET /orders should list orders', async () => {
      const res = await authGet(server, '/orders', adminToken).expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /orders/count should return count', async () => {
      const res = await authGet(server, '/orders/count', adminToken).expect(200);
      expect(res.body.data).toHaveProperty('count');
      expect(res.body.data.count).toBeGreaterThan(0);
    });

    it('GET /orders/:id should return order with details', async () => {
      const res = await authGet(server, `/orders/${orderId}`, adminToken).expect(200);
      expect(res.body.data.id).toBe(orderId);
      expect(res.body.data).toHaveProperty('orderNumber');
      expect(res.body.data).toHaveProperty('items');
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('order should have financial fields', async () => {
      const res = await authGet(server, `/orders/${orderId}`, adminToken).expect(200);
      expect(res.body.data).toHaveProperty('subtotal');
      expect(res.body.data).toHaveProperty('totalAmount');
    });

    it('order items should be snapshots', async () => {
      const res = await authGet(server, `/orders/${orderId}`, adminToken).expect(200);
      if (res.body.data.items && res.body.data.items.length > 0) {
        const item = res.body.data.items[0];
        expect(item).toHaveProperty('quantity');
        expect(item).toHaveProperty('unitPrice');
      }
    });
  });

  describe('Order status updates', () => {
    it('PUT /orders/:id/status should update to confirmed', async () => {
      const res = await authPut(server, `/orders/${orderId}/status`, adminToken)
        .send({ status: 'confirmed' })
        .expect(200);

      expect(res.body.data.status).toBe('confirmed');
    });

    it('PUT /orders/:id/status should update to processing', async () => {
      const res = await authPut(server, `/orders/${orderId}/status`, adminToken)
        .send({ status: 'processing' })
        .expect(200);

      expect(res.body.data.status).toBe('processing');
    });
  });

  describe('Order cancellation', () => {
    let cancelOrderId: string;

    beforeAll(async () => {
      // Create another cart + order for cancel test
      const cartRes = await authPost(server, '/carts', adminToken)
        .send({ name: 'Cancel Test Cart', userId: adminUserId })
        .expect(201);

      const itemsRes = await tenantGet(server, '/items').expect(200);
      await authPost(server, `/carts/${cartRes.body.data.id}/items`, adminToken)
        .send({ itemId: itemsRes.body.data[0].id, quantity: 1, priceSnapshot: 50 })
        .expect(201);

      // Cart must be 'paid' or 'completed' to create an order
      await authPut(server, `/carts/${cartRes.body.data.id}`, adminToken)
        .send({ status: 'paid' })
        .expect(200);

      const orderRes = await authPost(server, '/orders', adminToken)
        .send({ cartId: cartRes.body.data.id })
        .expect(201);
      cancelOrderId = orderRes.body.data.id;
    });

    it('POST /orders/:id/cancel should cancel order', async () => {
      const res = await authPost(server, `/orders/${cancelOrderId}/cancel`, adminToken)
        .send({ reason: 'E2E test cancellation' })
        .expect(200);

      expect(res.body.data.status).toBe('cancelled');
    });
  });

  describe('Tenant isolation', () => {
    it('quickbasket should not see freshmart orders', async () => {
      const { accessToken: qbToken } = await loginAsAdmin(server, 'quickbasket');
      const res = await authGet(server, '/orders', qbToken, 'quickbasket').expect(200);

      const orderIds = res.body.data.map((o: any) => o.id);
      expect(orderIds).not.toContain(orderId);
    });
  });
});
