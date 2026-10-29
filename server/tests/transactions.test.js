import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { cleanDatabase } from './setup.js';

const app = createApp();

describe('Transaction Isolation & Security (IDOR Prevention)', () => {
  let userAToken;
  let userBToken;
  let userAId;
  let userBId;

  beforeEach(async () => {
    await cleanDatabase();

    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User A',
        email: 'usera@example.com',
        password: 'passwordA123',
      });
    userAToken = resA.body.token;
    userAId = resA.body.user.id;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User B',
        email: 'userb@example.com',
        password: 'passwordB123',
      });
    userBToken = resB.body.token;
    userBId = resB.body.user.id;
  });

  it('1. should allow User A to create and retrieve their own transaction', async () => {
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'expense',
        amount: 1500,
        category: 'Food',
        description: 'Dinner at Italian Bistro',
        date: '2026-10-15',
        paymentMethod: 'Credit Card',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.amount).toBe(1500);
    expect(createRes.body.data.description).toBe('Dinner at Italian Bistro');

    const txId = createRes.body.data.id;

    // Retrieve via list
    const listRes = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.data[0].id).toBe(txId);
  });

  it('2. should prevent User B from reading User A transaction (IDOR Prevention)', async () => {
    // User A creates a transaction
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'expense',
        amount: 2400,
        category: 'Shopping',
        description: 'Confidential Personal Purchase',
        date: '2026-10-18',
      });

    const userATxId = createRes.body.data.id;

    // User B attempts to read User A's transaction using the ID
    const getRes = await request(app)
      .get(`/api/transactions/${userATxId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    // Must return 404 (not found / unauthorized) to prevent resource enumeration
    expect(getRes.status).toBe(404);
    expect(getRes.body.success).toBe(false);
  });

  it('3. should prevent User B from updating or tampering with User A transaction', async () => {
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'income',
        amount: 50000,
        category: 'Salary',
        description: 'Monthly Stipend',
        date: '2026-10-01',
      });

    const userATxId = createRes.body.data.id;

    // User B attempts to change the amount of User A's transaction
    const patchRes = await request(app)
      .patch(`/api/transactions/${userATxId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        amount: 1,
      });

    expect(patchRes.status).toBe(404);

    // Verify original amount remains untouched
    const verifyRes = await request(app)
      .get(`/api/transactions/${userATxId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(verifyRes.body.data.amount).toBe(50000);
  });

  it('4. should prevent User B from deleting User A transaction', async () => {
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'expense',
        amount: 800,
        category: 'Transport',
        description: 'Airport Cab',
        date: '2026-10-10',
      });

    const userATxId = createRes.body.data.id;

    // User B attempts to delete User A's record
    const deleteRes = await request(app)
      .delete(`/api/transactions/${userATxId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(deleteRes.status).toBe(404);

    // Verify record still exists for User A
    const checkRes = await request(app)
      .get(`/api/transactions/${userATxId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(checkRes.status).toBe(200);
  });

  it('5. should reject spoofed userId attempts in request body', async () => {
    // Client sends userB's id inside body, trying to write to user B's account
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        userId: userBId, // Spoofed field
        type: 'expense',
        amount: 999,
        category: 'Food',
        description: 'Spoof attempt',
        date: '2026-10-20',
      });

    expect(res.status).toBe(201);
    // Server must have assigned req.user.id (userA), ignoring the spoofed userId!
    expect(res.body.data.userId).toBe(userAId);

    // Confirm User B does not see this transaction
    const userBList = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(userBList.body.data.length).toBe(0);
  });

  it('6. should reject invalid payloads with detailed 400 validation errors', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'invalid_type',
        amount: -50, // Negative amount
        description: '', // Empty description
        date: 'not-a-date',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.details).toBeDefined();
    expect(res.body.details.length).toBeGreaterThan(0);
  });
});

