import { parseApiResponse } from './baseApi';

/**
 * Regression coverage for the "Something went wrong" delete bug: the base
 * query previously called response.json() unconditionally, which throws on a
 * 204 No Content (empty body) response — exactly what DELETE endpoints return —
 * surfacing a PARSING_ERROR even though the server succeeded.
 *
 * parseApiResponse must tolerate empty/204 bodies (→ undefined) while still
 * unwrapping the { success, data } envelope and passing plain JSON through.
 */

// Minimal stub: the helper only reads `status` and calls `text()`.
function res(status: number, body = ''): Response {
  return {
    status,
    text: async () => body,
  } as unknown as Response;
}

describe('parseApiResponse', () => {
  it('returns undefined for a 204 No Content (DELETE) without reading the body', async () => {
    const text = jest.fn(async () => '');
    const response = { status: 204, text } as unknown as Response;
    await expect(parseApiResponse(response)).resolves.toBeUndefined();
    expect(text).not.toHaveBeenCalled();
  });

  it('returns undefined for a 205 Reset Content', async () => {
    await expect(parseApiResponse(res(205))).resolves.toBeUndefined();
  });

  it('returns undefined for a 200 with an empty body', async () => {
    await expect(parseApiResponse(res(200, ''))).resolves.toBeUndefined();
  });

  it('unwraps a { success, data } envelope', async () => {
    const body = JSON.stringify({ success: true, data: { id: '1', name: 'Rice' } });
    await expect(parseApiResponse(res(200, body))).resolves.toEqual({ id: '1', name: 'Rice' });
  });

  it('returns a plain JSON object unchanged', async () => {
    const body = JSON.stringify({ id: '1', name: 'Rice' });
    await expect(parseApiResponse(res(200, body))).resolves.toEqual({ id: '1', name: 'Rice' });
  });

  it('returns a plain JSON array unchanged', async () => {
    const body = JSON.stringify([{ id: '1' }, { id: '2' }]);
    await expect(parseApiResponse(res(200, body))).resolves.toEqual([{ id: '1' }, { id: '2' }]);
  });

  it('still throws on a malformed non-empty body (unchanged behaviour)', async () => {
    await expect(parseApiResponse(res(200, 'not json'))).rejects.toThrow();
  });
});
