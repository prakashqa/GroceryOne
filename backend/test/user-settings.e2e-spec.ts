import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp } from './helpers/test-app.helper';
import { loginAsAdmin } from './helpers/auth.helper';

describe('User Settings (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let settingsId: string;
  let adminUserId: string;
  const testDeviceId = 'e2e-test-device-001';

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    server = testApp.server;
    const admin = await loginAsAdmin(server);
    adminUserId = admin.user.id;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('POST /users/settings should create settings', async () => {
    const res = await request(server)
      .post('/api/v1/users/settings')
      .set('X-Tenant-ID', 'freshmart')
      .send({
        deviceId: testDeviceId,
        themeMode: 'dark',
        language: 'te',
      })
      .expect(201);

    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.deviceId).toBe(testDeviceId);
    settingsId = res.body.data.id;
  });

  it('GET /users/settings?deviceId should find settings', async () => {
    const res = await request(server)
      .get(`/api/v1/users/settings?deviceId=${testDeviceId}`)
      .set('X-Tenant-ID', 'freshmart')
      .expect(200);

    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.deviceId).toBe(testDeviceId);
  });

  it('GET /users/settings/:id should return by ID', async () => {
    const res = await request(server)
      .get(`/api/v1/users/settings/${settingsId}`)
      .set('X-Tenant-ID', 'freshmart')
      .expect(200);

    expect(res.body.data.id).toBe(settingsId);
  });

  it('PUT /users/settings/:id should update settings', async () => {
    const res = await request(server)
      .put(`/api/v1/users/settings/${settingsId}`)
      .set('X-Tenant-ID', 'freshmart')
      .send({ themeMode: 'light' })
      .expect(200);

    expect(res.body.data.themeMode).toBe('light');
  });

  it('PUT /users/settings/device/:deviceId should upsert', async () => {
    const res = await request(server)
      .put(`/api/v1/users/settings/device/${testDeviceId}`)
      .set('X-Tenant-ID', 'freshmart')
      .send({ language: 'en' })
      .expect(200);

    expect(res.body.data.language).toBe('en');
  });

  it('PUT /users/settings/user/:userId should upsert', async () => {
    const res = await request(server)
      .put(`/api/v1/users/settings/user/${adminUserId}`)
      .set('X-Tenant-ID', 'freshmart')
      .send({ themeMode: 'dark', language: 'te' })
      .expect(200);

    expect(res.body.data).toHaveProperty('id');
  });

  it('DELETE /users/settings/:id should delete', async () => {
    await request(server)
      .delete(`/api/v1/users/settings/${settingsId}`)
      .set('X-Tenant-ID', 'freshmart')
      .expect(204);
  });

  it('GET /users/settings?deviceId should create new after delete', async () => {
    const res = await request(server)
      .get(`/api/v1/users/settings?deviceId=new-device-xyz`)
      .set('X-Tenant-ID', 'freshmart')
      .expect(200);

    expect(res.body.data).toHaveProperty('id');
  });
});
