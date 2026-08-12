import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ─── Business Logic Helpers (extracted from auth controller) ─────────────────

const JWT_SECRET = 'test-secret';

function generateToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
}

function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}

async function validatePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Authentication Logic', () => {
  const fakeUser = { id: 'user-1', email: 'admin@bizloom.com', role: 'ADMIN' };
  let hashedPassword: string;

  beforeAll(async () => {
    hashedPassword = await bcrypt.hash('correctPassword123', 10);
  });

  // --- Password Validation ---
  it('should return true when the correct password is provided', async () => {
    const result = await validatePassword('correctPassword123', hashedPassword);
    expect(result).toBe(true);
  });

  it('should reject login with an incorrect password', async () => {
    const result = await validatePassword('wrongPassword!', hashedPassword);
    expect(result).toBe(false);
  });

  // --- Token Generation ---
  it('should generate a valid JWT token for an authenticated user', () => {
    const token = generateToken(fakeUser);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('should decode the JWT and contain correct user fields', () => {
    const token = generateToken(fakeUser);
    const decoded = verifyToken(token) as any;
    expect(decoded.id).toBe(fakeUser.id);
    expect(decoded.email).toBe(fakeUser.email);
    expect(decoded.role).toBe(fakeUser.role);
  });

  // --- Token Expiry ---
  it('should reject an expired JWT token', () => {
    const expiredToken = jwt.sign(fakeUser, JWT_SECRET, { expiresIn: '1ms' });
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(() => verifyToken(expiredToken)).toThrow('jwt expired');
        resolve();
      }, 50);
    });
  });

  it('should reject a token signed with a different secret', () => {
    const badToken = jwt.sign(fakeUser, 'wrong-secret', { expiresIn: '1h' });
    expect(() => verifyToken(badToken)).toThrow('invalid signature');
  });

  // --- Role Validation ---
  it('should correctly identify an ADMIN role in the token', () => {
    const token = generateToken({ ...fakeUser, role: 'ADMIN' });
    const decoded = verifyToken(token) as any;
    expect(decoded.role).toBe('ADMIN');
  });
});
