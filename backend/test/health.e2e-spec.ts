import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp } from './helpers/test-app.helper';

describe('Health (e2e)', () => {
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

  it('GET /api/v1/health should return 200 with status ok', async () => {
    const res = await request(server).get('/api/v1/health').expect(200);

    expect(res.body.data).toHaveProperty('status', 'ok');
    expect(res.body.data).toHaveProperty('timestamp');
    expect(res.body.data).toHaveProperty('uptime');
    expect(res.body.data).toHaveProperty('environment');
  });

  it('should work without X-Tenant-ID header', async () => {
    const res = await request(server).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });
});
