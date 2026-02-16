import request from 'supertest';

const CREDENTIALS = {
  freshmart: {
    admin: { identifier: 'admin@freshmart.com', password: 'Admin@FM123', pin: '1234' },
    customer: { identifier: 'customer@freshmart.com', password: 'Customer@FM123', pin: '5678' },
  },
  quickbasket: {
    admin: { identifier: 'admin@quickbasket.com', password: 'Admin@QB123', pin: '4321' },
    customer: { identifier: 'customer@quickbasket.com', password: 'Customer@QB123', pin: '8765' },
  },
};

export async function loginAsAdmin(
  server: any,
  tenant: 'freshmart' | 'quickbasket' = 'freshmart',
): Promise<{ accessToken: string; user: any }> {
  const creds = CREDENTIALS[tenant].admin;
  const res = await request(server)
    .post('/api/v1/auth/login')
    .set('X-Tenant-ID', tenant)
    .send({ identifier: creds.identifier, password: creds.password })
    .expect(200);

  return { accessToken: res.body.data.accessToken, user: res.body.data.user };
}

export async function loginAsCustomer(
  server: any,
  tenant: 'freshmart' | 'quickbasket' = 'freshmart',
): Promise<{ accessToken: string; user: any }> {
  const creds = CREDENTIALS[tenant].customer;
  const res = await request(server)
    .post('/api/v1/auth/login')
    .set('X-Tenant-ID', tenant)
    .send({ identifier: creds.identifier, password: creds.password })
    .expect(200);

  return { accessToken: res.body.data.accessToken, user: res.body.data.user };
}

export async function loginWithPin(
  server: any,
  tenant: 'freshmart' | 'quickbasket' = 'freshmart',
  role: 'admin' | 'customer' = 'admin',
): Promise<{ accessToken: string; user: any }> {
  const creds = CREDENTIALS[tenant][role];
  const res = await request(server)
    .post('/api/v1/auth/login/pin')
    .set('X-Tenant-ID', tenant)
    .send({ identifier: creds.identifier, pin: creds.pin })
    .expect(200);

  return { accessToken: res.body.data.accessToken, user: res.body.data.user };
}

export function getAuthHeaders(accessToken: string, tenant: string = 'freshmart') {
  return {
    Authorization: `Bearer ${accessToken}`,
    'X-Tenant-ID': tenant,
  };
}

export { CREDENTIALS };
