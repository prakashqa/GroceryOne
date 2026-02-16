import { INestApplication } from '@nestjs/common';
import { createTestApp, closeTestApp } from './helpers/test-app.helper';
import { loginAsAdmin } from './helpers/auth.helper';
import { tenantGet, tenantPost, tenantPut, tenantDelete } from './helpers/request.helper';

describe('Products/Items (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let adminToken: string;
  let createdItemId: string;
  let categoryId: string;
  const uniqueSuffix = Date.now();

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    server = testApp.server;
    const admin = await loginAsAdmin(server);
    adminToken = admin.accessToken;

    // Get a category ID from seeded data
    const catRes = await tenantGet(server, '/categories').expect(200);
    categoryId = catRes.body.data[0].id;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('GET /items should return array of items', async () => {
    const res = await tenantGet(server, '/items').expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /items/count should return count', async () => {
    const res = await tenantGet(server, '/items/count').expect(200);
    expect(res.body.data).toHaveProperty('count');
    expect(res.body.data.count).toBeGreaterThan(0);
  });

  it('GET /items?categoryId should filter by category', async () => {
    const res = await tenantGet(server, `/items?categoryId=${categoryId}`).expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((item: any) => {
      expect(item.categoryId).toBe(categoryId);
    });
  });

  it('POST /items should create a new item', async () => {
    const testSlug = `e2e-item-${uniqueSuffix}`;
    const res = await tenantPost(server, '/items')
      .send({
        name: 'E2E Test Item',
        slug: testSlug,
        categoryId,
        unit: 'kg',
        defaultQuantity: 1,
        price: 99.50,
        compareAtPrice: 120.00,
        costPrice: 75.00,
        sortOrder: 999,
        isActive: true,
      })
      .expect(201);

    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.name).toBe('E2E Test Item');
    createdItemId = res.body.data.id;
  });

  it('GET /items/:id should return item by ID', async () => {
    const res = await tenantGet(server, `/items/${createdItemId}`).expect(200);
    expect(res.body.data.id).toBe(createdItemId);
    expect(res.body.data.name).toBe('E2E Test Item');
  });

  it('GET /items/slug/:slug should return item by slug', async () => {
    const testSlug = `e2e-item-${uniqueSuffix}`;
    const res = await tenantGet(server, `/items/slug/${testSlug}`).expect(200);
    expect(res.body.data.slug).toBe(testSlug);
  });

  it('POST /items should return 409 for duplicate slug', async () => {
    await tenantPost(server, '/items')
      .send({ name: 'Dup', slug: `e2e-item-${uniqueSuffix}`, categoryId, unit: 'kg', defaultQuantity: 1, price: 10, compareAtPrice: 15 })
      .expect(409);
  });

  it('PUT /items/:id should update item', async () => {
    const res = await tenantPut(server, `/items/${createdItemId}`)
      .send({ name: 'Updated E2E Item', price: 110.00 })
      .expect(200);

    expect(res.body.data.name).toBe('Updated E2E Item');
  });

  it('PUT /items/:id partial update should work', async () => {
    const res = await tenantPut(server, `/items/${createdItemId}`)
      .send({ sortOrder: 500 })
      .expect(200);

    expect(res.body.data.sortOrder).toBe(500);
    expect(res.body.data.name).toBe('Updated E2E Item'); // unchanged
  });

  it('price fields should be stored as numbers', async () => {
    const res = await tenantGet(server, `/items/${createdItemId}`).expect(200);
    expect(typeof res.body.data.compareAtPrice).toBe('number');
    expect(typeof res.body.data.costPrice).toBe('number');
  });

  it('DELETE /items/:id should soft delete', async () => {
    await tenantDelete(server, `/items/${createdItemId}`).expect(204);
  });

  it('deleted item should not appear in default list', async () => {
    const res = await tenantGet(server, '/items').expect(200);
    const ids = res.body.data.map((i: any) => i.id);
    expect(ids).not.toContain(createdItemId);
  });

  it('GET /items?includeInactive=true should include inactive', async () => {
    const res = await tenantGet(server, '/items?includeInactive=true').expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should enforce tenant isolation', async () => {
    const freshRes = await tenantGet(server, '/items', 'freshmart').expect(200);
    const quickRes = await tenantGet(server, '/items', 'quickbasket').expect(200);

    const freshIds = freshRes.body.data.map((i: any) => i.id);
    const quickIds = quickRes.body.data.map((i: any) => i.id);

    const overlap = freshIds.filter((id: string) => quickIds.includes(id));
    expect(overlap.length).toBe(0);
  });

  it('items should be sorted by sortOrder', async () => {
    const res = await tenantGet(server, '/items').expect(200);
    if (res.body.data.length >= 2) {
      for (let i = 1; i < res.body.data.length; i++) {
        if (res.body.data[i].sortOrder !== undefined && res.body.data[i - 1].sortOrder !== undefined) {
          expect(res.body.data[i].sortOrder).toBeGreaterThanOrEqual(res.body.data[i - 1].sortOrder);
        }
      }
    }
  });
});
