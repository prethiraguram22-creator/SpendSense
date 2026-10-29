import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { cleanDatabase } from './setup.js';
import { prisma } from '../src/db/prisma.js';

const app = createApp();

describe('Authentication & Security Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('1. should register a new user successfully and return sanitized user data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'securePassword123',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.name).toBe('Alice Johnson');
    expect(res.body.user.passwordHash).toBeUndefined(); // Sensitive hash NEVER exposed
    expect(res.body.token).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('2. should reject duplicate email registration with 409 conflict', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'securePassword123',
      });

    const duplicateRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Another',
        email: 'ALICE@example.com', // Case insensitive test
        password: 'anotherPassword456',
      });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
  });

  it('3. should log in with valid credentials and reject invalid credentials with safe generic error', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: 'bobPassword789',
      });

    // Valid login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'bob@example.com',
        password: 'bobPassword789',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.user.email).toBe('bob@example.com');

    // Invalid password
    const wrongPassRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'bob@example.com',
        password: 'wrongPassword!',
      });

    expect(wrongPassRes.status).toBe(401);
    expect(wrongPassRes.body.error).toBe('Invalid email address or password.');

    // Non-existent email returns same generic error to prevent account enumeration
    const noUserRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'unknown@example.com',
        password: 'anyPassword',
      });

    expect(noUserRes.status).toBe(401);
    expect(noUserRes.body.error).toBe('Invalid email address or password.');
  });

  it('4. should handle forgot-password and reset-password with single-use expiring token', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password: 'oldPassword123',
      });

    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'charlie@example.com' });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.debugToken).toBeDefined(); // returned in non-production

    const token = forgotRes.body.debugToken;

    // Reset password with token
    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token,
        password: 'newSecretPassword456',
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // Verify token CANNOT be reused (single-use constraint)
    const reuseRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token,
        password: 'evenNewerPassword789',
      });

    expect(reuseRes.status).toBe(400);
    expect(reuseRes.body.error).toContain('already been used');

    // Verify user can now log in with NEW password
    const loginWithNewRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'charlie@example.com',
        password: 'newSecretPassword456',
      });

    expect(loginWithNewRes.status).toBe(200);
  });

  it('5. should reject unauthenticated access to protected /api/auth/me', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

