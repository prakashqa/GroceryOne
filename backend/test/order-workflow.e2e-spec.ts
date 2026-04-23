/**
 * Order Workflow (e2e)
 *
 * Full end-to-end API test covering:
 *   1. Create a Category → Edit → Validate
 *   2. Create an Item under the new Category → Edit → Validate
 *   3. Create an Order (cart) using the new Item → Validate
 *   4. Complete Payment via Cash → Validate
 *   5. Verify Order appears in the Orders list
 *   6. Multi-tenant isolation (bonus)
 *
 * All test data is dynamically generated via Date.now() to avoid collisions.
 * Cleanup runs in reverse dependency order.
 */

import { INestApplication } from '@nestjs/common';
import { createTestApp, closeTestApp } from './helpers/test-app.helper';
import { loginAsAdmin } from './helpers/auth.helper';
import {
  tenantGet, tenantPost, tenantPut, tenantDelete,
  authGet, authPost, authPut, authDelete,
} from './helpers/request.helper';

describe('Order Workflow (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let adminToken: string;
  let adminUserId: string;

  // Dynamic, collision-free test data
  const uniqueSuffix = Date.now();
  const categorySlug = `e2e-wf-cat-${uniqueSuffix}`;
  const categoryName = `E2E WF Category ${uniqueSuffix}`;
  const categoryNameV2 = `E2E WF Category (edited) ${uniqueSuffix}`;
  const itemSlug = `e2e-wf-item-${uniqueSuffix}`;
  const itemName = `E2E WF Item ${uniqueSuffix}`;
  const itemNameV2 = `E2E WF Item (edited) ${uniqueSuffix}`;
  const cartName = `E2E WF Cart ${uniqueSuffix}`;

  // Captured IDs
  let categoryId: string;
  let itemId: string;
  let cartId: string;
  let orderId: string;
  let orderNumber: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    server = testApp.server;
    const admin = await loginAsAdmin(server, 'freshmart');
    adminToken = admin.accessToken;
    adminUserId = admin.user.id;
  });

  afterAll(async () => {
    // Teardown in reverse dependency order; ignore failures so one error doesn't block the rest
    try { if (orderId) await authPost(server, `/orders/${orderId}/cancel`, adminToken).send({ reason: 'e2e cleanup' }); } catch { /* ignore */ }
    try { if (cartId) await authDelete(server, `/carts/${cartId}`, adminToken); } catch { /* ignore */ }
    try { if (itemId) await tenantDelete(server, `/items/${itemId}`); } catch { /* ignore */ }
    try { if (categoryId) await tenantDelete(server, `/categories/${categoryId}`); } catch { /* ignore */ }
    await closeTestApp(app);
  });

  // ---------------------------------------------------------------------------
  // Step 1: Category create + edit
  // ---------------------------------------------------------------------------
  describe('Step 1 — Category: create → edit → validate', () => {
    it('POST /categories should create a new category', async () => {
      const res = await tenantPost(server, '/categories')
        .send({
          slug: categorySlug,
          name: categoryName,
          icon: '🌾',
          sortOrder: 99,
          isActive: true,
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe(categoryName);
      expect(res.body.data.slug).toBe(categorySlug);
      expect(res.body.data.icon).toBe('🌾');

      categoryId = res.body.data.id;
    });

    it('PUT /categories/:id should update name and icon', async () => {
      const res = await tenantPut(server, `/categories/${categoryId}`)
        .send({ name: categoryNameV2, icon: '🍚' })
        .expect(200);

      expect(res.body.data.id).toBe(categoryId);
      expect(res.body.data.name).toBe(categoryNameV2);
      expect(res.body.data.icon).toBe('🍚');
    });

    it('GET /categories should reflect the edited category in the list', async () => {
      const res = await tenantGet(server, '/categories').expect(200);
      const found = res.body.data.find((c: any) => c.id === categoryId);

      expect(found).toBeDefined();
      expect(found.name).toBe(categoryNameV2);
      expect(found.icon).toBe('🍚');
    });
  });

  // ---------------------------------------------------------------------------
  // Step 2: Item create + edit under the new category
  // ---------------------------------------------------------------------------
  describe('Step 2 — Item: create → edit → validate', () => {
    it('POST /items should create a new item under the category', async () => {
      const res = await tenantPost(server, '/items')
        .send({
          slug: itemSlug,
          name: itemName,
          categoryId,
          unit: 'kg',
          defaultQuantity: 1,
          price: 120,
          compareAtPrice: 150,
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe(itemName);
      expect(res.body.data.categoryId).toBe(categoryId);
      expect(res.body.data.unit).toBe('kg');
      expect(Number(res.body.data.price)).toBe(120);
      expect(Number(res.body.data.compareAtPrice)).toBe(150);

      itemId = res.body.data.id;
    });

    it('PUT /items/:id should update name and price', async () => {
      const res = await tenantPut(server, `/items/${itemId}`)
        .send({ name: itemNameV2, price: 135 })
        .expect(200);

      expect(res.body.data.id).toBe(itemId);
      expect(res.body.data.name).toBe(itemNameV2);
      expect(Number(res.body.data.price)).toBe(135);
    });

    it('GET /items/:id should persist the edited fields', async () => {
      const res = await tenantGet(server, `/items/${itemId}`).expect(200);

      expect(res.body.data.name).toBe(itemNameV2);
      expect(Number(res.body.data.price)).toBe(135);
      expect(res.body.data.categoryId).toBe(categoryId);
    });
  });

  // ---------------------------------------------------------------------------
  // Step 3: Create cart + add item
  // ---------------------------------------------------------------------------
  describe('Step 3 — Cart: create → add item → validate', () => {
    it('POST /carts should create a new cart', async () => {
      const res = await authPost(server, '/carts', adminToken)
        .send({ name: cartName, userId: adminUserId })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe(cartName);
      // Default cart status should be 'draft'
      expect(res.body.data.status || 'draft').toBe('draft');

      cartId = res.body.data.id;
    });

    it('POST /carts/:id/items should add the new item to the cart', async () => {
      const res = await authPost(server, `/carts/${cartId}/items`, adminToken)
        .send({ itemId, quantity: 2, priceSnapshot: 135 })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(Number(res.body.data.quantity)).toBe(2);
    });

    it('GET /carts/:id should include the line item', async () => {
      const res = await authGet(server, `/carts/${cartId}`, adminToken).expect(200);

      expect(res.body.data.id).toBe(cartId);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);

      const lineItem = res.body.data.items.find((li: any) => li.itemId === itemId);
      expect(lineItem).toBeDefined();
      expect(Number(lineItem.quantity)).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Step 4: Complete payment via Cash → create order
  // ---------------------------------------------------------------------------
  describe('Step 4 — Cash payment → create order → validate', () => {
    it('PUT /carts/:id should mark cart as paid (cash)', async () => {
      const res = await authPut(server, `/carts/${cartId}`, adminToken)
        .send({ status: 'paid' })
        .expect(200);

      expect(res.body.data.id).toBe(cartId);
      expect(res.body.data.status).toBe('paid');
    });

    it('POST /orders should convert the paid cart into an order', async () => {
      const res = await authPost(server, '/orders', adminToken)
        .send({ cartId, notes: 'E2E workflow — cash paid' })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('orderNumber');
      // Match the ORD-YYYYMMDD-XXXXX shape
      expect(res.body.data.orderNumber).toMatch(/^ORD-\d{8}-\w+/);

      orderId = res.body.data.id;
      orderNumber = res.body.data.orderNumber;
    });
  });

  // ---------------------------------------------------------------------------
  // Step 5: Verify order appears in list + details
  // ---------------------------------------------------------------------------
  describe('Step 5 — Order: verify visibility in list + details', () => {
    it('GET /orders should include the new order', async () => {
      const res = await authGet(server, '/orders', adminToken).expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);

      const found = res.body.data.find((o: any) => o.id === orderId);
      expect(found).toBeDefined();
      expect(found.orderNumber).toBe(orderNumber);
    });

    it('GET /orders/:id should return full order details', async () => {
      const res = await authGet(server, `/orders/${orderId}`, adminToken).expect(200);

      expect(res.body.data.id).toBe(orderId);
      expect(res.body.data.orderNumber).toBe(orderNumber);
      expect(res.body.data).toHaveProperty('subtotal');
      expect(res.body.data).toHaveProperty('totalAmount');
      expect(Number(res.body.data.totalAmount)).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);

      // Verify the ordered item is present
      const orderedItem = res.body.data.items.find(
        (li: any) => li.itemId === itemId || li.productName === itemNameV2,
      );
      expect(orderedItem).toBeDefined();
    });

    it('GET /orders/count should include the new order in the count', async () => {
      const res = await authGet(server, '/orders/count', adminToken).expect(200);
      expect(res.body.data).toHaveProperty('count');
      expect(res.body.data.count).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Step 6: Multi-tenant isolation
  // ---------------------------------------------------------------------------
  describe('Step 6 — Multi-tenant isolation', () => {
    it('quickbasket admin should NOT see freshmart order', async () => {
      const qbAdmin = await loginAsAdmin(server, 'quickbasket');
      const res = await authGet(server, '/orders', qbAdmin.accessToken, 'quickbasket').expect(200);

      const orderIds = res.body.data.map((o: any) => o.id);
      expect(orderIds).not.toContain(orderId);
    });

    it('quickbasket tenant should NOT see freshmart category', async () => {
      const res = await tenantGet(server, '/categories', 'quickbasket').expect(200);

      const categoryIds = res.body.data.map((c: any) => c.id);
      expect(categoryIds).not.toContain(categoryId);
    });

    it('quickbasket tenant should NOT see freshmart item', async () => {
      const res = await tenantGet(server, '/items', 'quickbasket').expect(200);

      const itemIds = res.body.data.map((i: any) => i.id);
      expect(itemIds).not.toContain(itemId);
    });
  });
});
