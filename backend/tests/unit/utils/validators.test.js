// Implemented validators utility unit tests
const {
  validateEmail,
  validatePassword,
  validateUsername,
  validatePhoneNumber,
  validateUrl,
  validateDate,
  validateObjectId,
  sanitizeString,
  validateFileUpload,
} = require('../../../src/utils/validators');

describe('Validators', () => {
  describe('validateEmail', () => {
    test('valid email should pass', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    test('invalid email should fail', () => {
      expect(validateEmail('not-an-email')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('strong password should be valid', () => {
      const result = validatePassword('Str0ngPass!');
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('weak password (missing number) should be invalid', () => {
      const result = validatePassword('Weakpass');
      expect(result.isValid).toBe(false);
      // error messages should mention requirements
      expect(
        result.errors.some((e) =>
          /lowercase|uppercase|number|Password must contain/i.test(e),
        ),
      ).toBe(true);
    });
  });

  describe('validateUsername', () => {
    test('valid username should pass', () => {
      expect(validateUsername('user_123')).toBe(true);
    });

    test('too short username should fail', () => {
      expect(validateUsername('ab')).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    test('valid phone number should pass', () => {
      expect(validatePhoneNumber('+1 (555) 123-4567')).toBe(true);
    });

    test('invalid phone number should fail', () => {
      expect(validatePhoneNumber('phone123')).toBe(false);
    });
  });

  describe('validateUrl', () => {
    test('valid url should pass', () => {
      expect(validateUrl('https://example.com/path?x=1')).toBe(true);
    });
  });

  describe('validateDate', () => {
    test('valid ISO datetime should pass', () => {
      expect(validateDate('2023-01-01T12:00:00Z')).toBe(true);
    });
  });

  describe('validateObjectId', () => {
    test('valid 24-hex ObjectId should pass', () => {
      expect(validateObjectId('507f1f77bcf86cd799439011')).toBe(true);
    });
  });

  describe('sanitizeString', () => {
    test('should remove angle brackets and scripts', () => {
      const input =
        '  <img src="x" onerror=alert(1)>javascript:alert(2)Hello  ';
      const out = sanitizeString(input);
      expect(typeof out).toBe('string');
      expect(out).not.toMatch(/[<>]/);
      expect(out.toLowerCase()).not.toContain('javascript:');
      expect(out).toContain('Hello');
      // trimmed
      expect(out[0]).not.toBe(' ');
    });
  });

  describe('validateFileUpload', () => {
    test('valid file should pass', () => {
      const file = {
        size: 1024 * 100, // 100KB
        mimetype: 'image/png',
        originalname: 'photo.png',
      };
      const res = validateFileUpload(file);
      expect(res.isValid).toBe(true);
      expect(res.errors.length).toBe(0);
    });

    test('invalid file (oversize, bad type/extension) should fail', () => {
      const file = {
        size: 10 * 1024 * 1024, // 10MB
        mimetype: 'application/pdf',
        originalname: 'document.pdf',
      };
      const res = validateFileUpload(file, { maxSize: 5 * 1024 * 1024 });
      expect(res.isValid).toBe(false);
      expect(res.errors.length).toBeGreaterThanOrEqual(1);
      // should include messages about size and type/extension
      expect(res.errors.some((e) => /size/i.test(e))).toBe(true);
      expect(res.errors.some((e) => /type|extension/i.test(e))).toBe(true);
    });
  });

  // Three additional related test cases (beyond the per-function coverage)
  test('validateEmail should reject empty string', () => {
    expect(validateEmail('')).toBe(false);
  });

  test('validatePassword should reject too short password', () => {
    const res = validatePassword('S1a');
    expect(res.isValid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  test('validateObjectId should reject non-hex string', () => {
    expect(validateObjectId('not_an_object_id')).toBe(false);
  });
});
