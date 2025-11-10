// Implement JWT utility unit tests
const {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  decodeToken,
} = require('../../../src/utils/jwt');

describe('JWT Utils', () => {
  const OLD_ENV = process.env;

  beforeAll(() => {
    // set deterministic secrets for tests
    process.env = { ...OLD_ENV };
    process.env.JWT_SECRET = 'test_jwt_secret';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('generateToken and verifyToken should round-trip payload', () => {
    const payload = { id: 'user123', role: 'member' };
    const token = generateToken(payload);
    expect(typeof token).toBe('string');

    const verified = verifyToken(token);
    expect(verified).toBeDefined();
    expect(verified.id).toBe(payload.id);
    expect(verified.role).toBe(payload.role);
  });

  test('generateRefreshToken and verifyRefreshToken should round-trip payload', () => {
    const payload = { id: 'user123' };
    const token = generateRefreshToken(payload);
    expect(typeof token).toBe('string');

    const verified = verifyRefreshToken(token);
    expect(verified).toBeDefined();
    expect(verified.id).toBe(payload.id);
  });

  test('decodeToken should return decoded payload without verifying', () => {
    const payload = { foo: 'bar' };
    const token = generateToken(payload);
    const decoded = decodeToken(token);
    expect(decoded).toBeDefined();
    expect(decoded.foo).toBe('bar');
  });

  // Extra related test cases
  test('tampered token should fail verification', () => {
    const token = generateToken({ id: 'u1' });
    // tamper with token by altering a character
    const tampered = token.slice(0, -1) + (token.slice(-1) === 'a' ? 'b' : 'a');
    expect(() => verifyToken(tampered)).toThrow();
  });

  test('expired token should throw on verify', async () => {
    // create a token that expires quickly
    process.env.JWT_EXPIRES_IN = '1s';
    const token = generateToken({ id: 'shortlived' });
    // wait for expiration
    await new Promise((r) => setTimeout(r, 1100));
    expect(() => verifyToken(token)).toThrow(/expired/i);
    // restore expiry
    process.env.JWT_EXPIRES_IN = '15m';
  });

  test('refresh token cannot be verified by access token verifier (different secret)', () => {
    const refresh = generateRefreshToken({ id: 'r1' });
    expect(() => verifyToken(refresh)).toThrow();
  });
});
