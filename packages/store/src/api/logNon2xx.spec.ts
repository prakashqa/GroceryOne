import { logNon2xx } from './logNon2xx';

describe('logNon2xx', () => {
  let warn: jest.Mock;
  let logger: { warn: jest.Mock };

  beforeEach(() => {
    warn = jest.fn();
    logger = { warn };
  });

  it('warns on a 401 result', () => {
    logNon2xx({ error: { status: 401 } }, 'GET', '/carts', logger);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toBe('[API] GET /carts returned 401');
  });

  it('warns on a 500 result', () => {
    logNon2xx({ error: { status: 500 } }, 'POST', '/orders', logger);
    expect(warn).toHaveBeenCalledWith('[API] POST /orders returned 500');
  });

  it('does not warn on a 200 result', () => {
    logNon2xx({}, 'GET', '/carts', logger);
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn on a successful result with meta.status 200', () => {
    logNon2xx({ meta: { response: { status: 200 } } } as any, 'GET', '/carts', logger);
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn on a 2xx result with meta.status', () => {
    logNon2xx({ meta: { response: { status: 204 } } } as any, 'DELETE', '/carts/1', logger);
    expect(warn).not.toHaveBeenCalled();
  });

  it('handles string status codes (RTK Query "FETCH_ERROR" etc.)', () => {
    // String-typed errors that are not numeric (FETCH_ERROR, PARSING_ERROR)
    // must NOT crash the wrapper and must NOT log a 200-ish nothing.
    logNon2xx({ error: { status: 'FETCH_ERROR' as any } }, 'GET', '/carts', logger);
    expect(warn).not.toHaveBeenCalled();
  });

  it('returns the input result unchanged so it can be chained', () => {
    const input = { error: { status: 401 }, meta: { request: { id: 'x' } } } as any;
    const out = logNon2xx(input, 'GET', '/carts', logger);
    expect(out).toBe(input);
  });

  it('does NOT include any auth header value or body in the log', () => {
    // Defensive: verify the log message has no Bearer tokens or PIN values.
    // The URL path itself ("/auth/login/pin") is fine — it's already public.
    // What we care about is NOT leaking the user's actual PIN digits or the
    // server-issued JWT into the log.
    logNon2xx(
      {
        error: {
          status: 401,
          data: { message: 'Unauthorized', token: 'eyJleHAi...', pin: '1234' },
        },
      } as any,
      'POST',
      '/auth/login/pin',
      logger,
    );
    const message = warn.mock.calls[0][0];
    expect(message).not.toMatch(/Bearer/);
    expect(message).not.toMatch(/eyJleHAi/);
    expect(message).not.toMatch(/1234/);
    expect(message).not.toMatch(/Unauthorized/);
  });
});
