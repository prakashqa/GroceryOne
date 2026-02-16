import request from 'supertest';

// Tenant-only requests (no auth)
export function tenantGet(server: any, path: string, tenant: string = 'freshmart') {
  return request(server).get(`/api/v1${path}`).set('X-Tenant-ID', tenant);
}

export function tenantPost(server: any, path: string, tenant: string = 'freshmart') {
  return request(server).post(`/api/v1${path}`).set('X-Tenant-ID', tenant);
}

export function tenantPut(server: any, path: string, tenant: string = 'freshmart') {
  return request(server).put(`/api/v1${path}`).set('X-Tenant-ID', tenant);
}

export function tenantDelete(server: any, path: string, tenant: string = 'freshmart') {
  return request(server).delete(`/api/v1${path}`).set('X-Tenant-ID', tenant);
}

// Authenticated requests (auth + tenant)
export function authGet(server: any, path: string, token: string, tenant: string = 'freshmart') {
  return request(server)
    .get(`/api/v1${path}`)
    .set('X-Tenant-ID', tenant)
    .set('Authorization', `Bearer ${token}`);
}

export function authPost(server: any, path: string, token: string, tenant: string = 'freshmart') {
  return request(server)
    .post(`/api/v1${path}`)
    .set('X-Tenant-ID', tenant)
    .set('Authorization', `Bearer ${token}`);
}

export function authPut(server: any, path: string, token: string, tenant: string = 'freshmart') {
  return request(server)
    .put(`/api/v1${path}`)
    .set('X-Tenant-ID', tenant)
    .set('Authorization', `Bearer ${token}`);
}

export function authDelete(server: any, path: string, token: string, tenant: string = 'freshmart') {
  return request(server)
    .delete(`/api/v1${path}`)
    .set('X-Tenant-ID', tenant)
    .set('Authorization', `Bearer ${token}`);
}

// Raw request without prefix (for health endpoint which uses global prefix already)
export function rawGet(server: any, path: string) {
  return request(server).get(path);
}
