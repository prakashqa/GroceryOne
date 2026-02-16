import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp } from './helpers/test-app.helper';
import { loginAsAdmin } from './helpers/auth.helper';
import { tenantGet, tenantPost, tenantPut, tenantDelete } from './helpers/request.helper';

describe('Categories (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let adminToken: string;
  let createdCategoryId: string;
  const uniqueSuffix = Date.now();

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    server = testApp.server;
    const admin = await loginAsAdmin(server);
    adminToken = admin.accessToken;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('GET /categories should return array of categories', async () => {
    const res = await tenantGet(server, '/categories').expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /categories/count should return count', async () => {
    const res = await tenantGet(server, '/categories/count').expect(200);
    expect(res.body.data).toHaveProperty('count');
    expect(typeof res.body.data.count).toBe('number');
    expect(res.body.data.count).toBeGreaterThan(0);
  });

  it('POST /categories should create a new category', async () => {
    const testSlug = `e2e-cat-${uniqueSuffix}`;
    const res = await tenantPost(server, '/categories')
      .send({
        name: 'E2E Test Category',
        slug: testSlug,
        sortOrder: 99,
        isActive: true,
      })
      .expect(201);

    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.name).toBe('E2E Test Category');
    expect(res.body.data.slug).toBe(testSlug);
    createdCategoryId = res.body.data.id;
  });

  it('GET /categories/:id should return category by ID', async () => {
    const res = await tenantGet(server, `/categories/${createdCategoryId}`).expect(200);
    expect(res.body.data.id).toBe(createdCategoryId);
    expect(res.body.data.name).toBe('E2E Test Category');
  });

  it('GET /categories/slug/:slug should return category by slug', async () => {
    const testSlug = `e2e-cat-${uniqueSuffix}`;
    const res = await tenantGet(server, `/categories/slug/${testSlug}`).expect(200);
    expect(res.body.data.slug).toBe(testSlug);
  });

  it('GET /categories/:id should return 404 for non-existent ID', async () => {
    await tenantGet(server, '/categories/00000000-0000-0000-0000-000000000000').expect(404);
  });

  it('POST /categories should return 409 for duplicate slug', async () => {
    await tenantPost(server, '/categories')
      .send({ name: 'Duplicate', slug: `e2e-cat-${uniqueSuffix}` })
      .expect(409);
  });

  it('POST /categories should return 400 for missing name', async () => {
    const res = await tenantPost(server, '/categories').send({ slug: 'no-name' });
    expect([400, 422]).toContain(res.status);
  });

  it('PUT /categories/:id should update category', async () => {
    const res = await tenantPut(server, `/categories/${createdCategoryId}`)
      .send({ name: 'Updated E2E Category' })
      .expect(200);

    expect(res.body.data.name).toBe('Updated E2E Category');
  });

  it('should return category entity fields', async () => {
    const res = await tenantGet(server, `/categories/${createdCategoryId}`).expect(200);
    expect(res.body.data).toHaveProperty('name');
    expect(res.body.data).toHaveProperty('slug');
    expect(res.body.data).toHaveProperty('sortOrder');
    expect(res.body.data).toHaveProperty('isActive');
  });

  it('DELETE /categories/:id should soft delete', async () => {
    await tenantDelete(server, `/categories/${createdCategoryId}`).expect(204);
  });

  it('deleted category should not appear in list', async () => {
    const res = await tenantGet(server, '/categories').expect(200);
    const ids = res.body.data.map((c: any) => c.id);
    expect(ids).not.toContain(createdCategoryId);
  });

  it('should enforce tenant isolation', async () => {
    const freshRes = await tenantGet(server, '/categories', 'freshmart').expect(200);
    const quickRes = await tenantGet(server, '/categories', 'quickbasket').expect(200);

    const freshIds = freshRes.body.data.map((c: any) => c.id);
    const quickIds = quickRes.body.data.map((c: any) => c.id);

    // No overlapping IDs between tenants
    const overlap = freshIds.filter((id: string) => quickIds.includes(id));
    expect(overlap.length).toBe(0);
  });

  it('should return 400 without X-Tenant-ID header', async () => {
    const res = await request(server).get('/api/v1/categories');
    expect([400, 404]).toContain(res.status);
  });

  describe('Cross-tenant item isolation in categories', () => {
    let freshmartCategoryId: string;
    let freshmartItemId: string;
    const isolationSuffix = Date.now();
    const testCatSlug = `isolation-cat-${isolationSuffix}`;
    const testItemSlug = `isolation-item-${isolationSuffix}`;

    it('should create a category in freshmart', async () => {
      const res = await tenantPost(server, '/categories', 'freshmart')
        .send({
          name: 'Isolation Test Category',
          slug: testCatSlug,
          sortOrder: 99,
          isActive: true,
        })
        .expect(201);

      freshmartCategoryId = res.body.data.id;
      expect(freshmartCategoryId).toBeDefined();
    });

    it('should create an item in freshmart linked to the category', async () => {
      const res = await tenantPost(server, '/items', 'freshmart')
        .send({
          name: 'Isolation Test Item',
          slug: testItemSlug,
          categoryId: freshmartCategoryId,
          unit: 'pcs',
          defaultQuantity: 1,
          compareAtPrice: 0,
          sortOrder: 0,
          isActive: true,
        })
        .expect(201);

      freshmartItemId = res.body.data.id;
      expect(freshmartItemId).toBeDefined();
    });

    it('freshmart should see the item via GET /categories?includeItems=true', async () => {
      const res = await tenantGet(server, '/categories?includeItems=true', 'freshmart').expect(200);
      const testCat = res.body.data.find((c: any) => c.id === freshmartCategoryId);
      expect(testCat).toBeDefined();
      expect(testCat.items).toBeDefined();
      expect(testCat.items.length).toBeGreaterThanOrEqual(1);
      const testItem = testCat.items.find((i: any) => i.id === freshmartItemId);
      expect(testItem).toBeDefined();
    });

    it('quickbasket should NOT see freshmart items via GET /categories?includeItems=true', async () => {
      const res = await tenantGet(server, '/categories?includeItems=true', 'quickbasket').expect(200);
      // The freshmart category should not appear at all for quickbasket
      const testCat = res.body.data.find((c: any) => c.id === freshmartCategoryId);
      expect(testCat).toBeUndefined();

      // Also check that no quickbasket category contains the freshmart item
      const allItems = res.body.data.flatMap((c: any) => c.items || []);
      const leakedItem = allItems.find((i: any) => i.id === freshmartItemId);
      expect(leakedItem).toBeUndefined();
    });

    it('quickbasket should get 404 for freshmart category by ID', async () => {
      await tenantGet(server, `/categories/${freshmartCategoryId}`, 'quickbasket').expect(404);
    });

    it('quickbasket should get 404 for freshmart category by slug', async () => {
      await tenantGet(server, `/categories/slug/${testCatSlug}`, 'quickbasket').expect(404);
    });

    it('freshmart should see items when fetching category by ID', async () => {
      const res = await tenantGet(server, `/categories/${freshmartCategoryId}`, 'freshmart').expect(200);
      expect(res.body.data.items).toBeDefined();
      const testItem = res.body.data.items.find((i: any) => i.id === freshmartItemId);
      expect(testItem).toBeDefined();
    });

    it('freshmart should see items when fetching category by slug', async () => {
      const res = await tenantGet(server, `/categories/slug/${testCatSlug}`, 'freshmart').expect(200);
      expect(res.body.data.items).toBeDefined();
      const testItem = res.body.data.items.find((i: any) => i.id === freshmartItemId);
      expect(testItem).toBeDefined();
    });

    // Cleanup
    afterAll(async () => {
      try {
        await tenantDelete(server, `/items/${freshmartItemId}`, 'freshmart');
      } catch (_e) { /* ignore cleanup failures */ }
      try {
        await tenantDelete(server, `/categories/${freshmartCategoryId}`, 'freshmart');
      } catch (_e) { /* ignore cleanup failures */ }
    });
  });
});
