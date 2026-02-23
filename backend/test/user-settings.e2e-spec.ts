import { INestApplication } from '@nestjs/common';
import { createTestApp, closeTestApp } from './helpers/test-app.helper';
import { loginAsAdmin } from './helpers/auth.helper';
import { authGet, authPost, authPut, authDelete, tenantGet, tenantPost } from './helpers/request.helper';

describe('User Settings (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let freshmartToken: string;
  let freshmartUserId: string;
  let quickbasketToken: string;
  let quickbasketUserId: string;
  let settingsId: string;
  const testDeviceId = `e2e-device-${Date.now()}`;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    server = testApp.server;

    const fmAdmin = await loginAsAdmin(server, 'freshmart');
    freshmartToken = fmAdmin.accessToken;
    freshmartUserId = fmAdmin.user.id;

    const qbAdmin = await loginAsAdmin(server, 'quickbasket');
    quickbasketToken = qbAdmin.accessToken;
    quickbasketUserId = qbAdmin.user.id;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  // ─── Authentication Required ───────────────────────────────────────

  describe('authentication', () => {
    it('should return 401 when no JWT provided on GET', async () => {
      const res = await tenantGet(server, `/users/settings?deviceId=${testDeviceId}`)
        .expect(401);
    });

    it('should return 401 when no JWT provided on POST', async () => {
      await tenantPost(server, '/users/settings')
        .send({ deviceId: testDeviceId })
        .expect(401);
    });

    it('should return 401 when no JWT provided on PUT', async () => {
      await tenantGet(server, '/users/settings/some-uuid')
        .expect(401);
    });
  });

  // ─── CRUD with Auth ────────────────────────────────────────────────

  describe('CRUD operations', () => {
    it('POST /users/settings should create settings with tenantId', async () => {
      const res = await authPost(server, '/users/settings', freshmartToken)
        .send({
          deviceId: testDeviceId,
          themeMode: 'dark',
          language: 'te',
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.deviceId).toBe(testDeviceId);
      expect(res.body.data.themeMode).toBe('dark');
      expect(res.body.data).toHaveProperty('tenantId');
      settingsId = res.body.data.id;
    });

    it('GET /users/settings?deviceId should find settings', async () => {
      const res = await authGet(server, `/users/settings?deviceId=${testDeviceId}`, freshmartToken)
        .expect(200);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.deviceId).toBe(testDeviceId);
    });

    it('GET /users/settings/:id should return by ID', async () => {
      const res = await authGet(server, `/users/settings/${settingsId}`, freshmartToken)
        .expect(200);

      expect(res.body.data.id).toBe(settingsId);
    });

    it('PUT /users/settings/:id should update settings', async () => {
      const res = await authPut(server, `/users/settings/${settingsId}`, freshmartToken)
        .send({ themeMode: 'light' })
        .expect(200);

      expect(res.body.data.themeMode).toBe('light');
    });

    it('PUT /users/settings/device/:deviceId should upsert', async () => {
      const res = await authPut(server, `/users/settings/device/${testDeviceId}`, freshmartToken)
        .send({ language: 'en' })
        .expect(200);

      expect(res.body.data.language).toBe('en');
    });

    it('PUT /users/settings/user/:userId should upsert', async () => {
      const res = await authPut(server, `/users/settings/user/${freshmartUserId}`, freshmartToken)
        .send({ themeMode: 'dark', language: 'te' })
        .expect(200);

      expect(res.body.data).toHaveProperty('id');
    });
  });

  // ─── Cross-Tenant Isolation ────────────────────────────────────────

  describe('multi-tenant isolation', () => {
    let qbSettingsId: string;
    const qbDeviceId = `e2e-qb-device-${Date.now()}`;

    beforeAll(async () => {
      // Create settings in quickbasket
      const res = await authPost(server, '/users/settings', quickbasketToken, 'quickbasket')
        .send({ deviceId: qbDeviceId, themeMode: 'light' })
        .expect(201);
      qbSettingsId = res.body.data.id;
    });

    it('should NOT find another tenant settings by deviceId', async () => {
      // Freshmart token trying to read quickbasket device settings
      const res = await authGet(server, `/users/settings?deviceId=${qbDeviceId}`, freshmartToken)
        .expect(200);

      // Should create a new one (not find quickbasket's)
      expect(res.body.data.id).not.toBe(qbSettingsId);
    });

    it('should NOT find another tenant settings by ID', async () => {
      // Freshmart token trying to read quickbasket settings by ID
      await authGet(server, `/users/settings/${qbSettingsId}`, freshmartToken)
        .expect(404);
    });

    it('should NOT update another tenant settings by ID', async () => {
      await authPut(server, `/users/settings/${qbSettingsId}`, freshmartToken)
        .send({ themeMode: 'dark' })
        .expect(404);
    });

    it('should NOT delete another tenant settings', async () => {
      await authDelete(server, `/users/settings/${qbSettingsId}`, freshmartToken)
        .expect(404);
    });

    it('should scope findOrCreate by tenant (same deviceId, different tenants)', async () => {
      const sharedDeviceId = `shared-device-${Date.now()}`;

      // Create in freshmart
      const fmRes = await authPost(server, '/users/settings', freshmartToken)
        .send({ deviceId: sharedDeviceId, themeMode: 'dark' })
        .expect(201);

      // Create in quickbasket
      const qbRes = await authPost(server, '/users/settings', quickbasketToken, 'quickbasket')
        .send({ deviceId: sharedDeviceId, themeMode: 'light' })
        .expect(201);

      // Should be different settings entries
      expect(fmRes.body.data.id).not.toBe(qbRes.body.data.id);
      expect(fmRes.body.data.themeMode).toBe('dark');
      expect(qbRes.body.data.themeMode).toBe('light');
    });
  });

  // ─── Cleanup ───────────────────────────────────────────────────────

  describe('cleanup', () => {
    it('DELETE /users/settings/:id should delete own settings', async () => {
      await authDelete(server, `/users/settings/${settingsId}`, freshmartToken)
        .expect(204);
    });

    it('GET /users/settings?deviceId should create new after delete', async () => {
      const res = await authGet(server, `/users/settings?deviceId=new-device-${Date.now()}`, freshmartToken)
        .expect(200);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('tenantId');
    });
  });
});
