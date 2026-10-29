import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { cleanDatabase } from './setup.js';

const app = createApp();

describe('Dashboard & Analytics Cross-User Isolation', () => {
  let userAToken;
  let userBToken;

  beforeEach(async () => {
    await cleanDatabase();

    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User A',
        email: 'usera@example.com',
        password: 'passwordA123',
      });
    userAToken = resA.body.token;

    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User B',
        email: 'userb@example.com',
        password: 'passwordB123',
      });
    userBToken = resB.body.token;

    // Seed User A with ₹40,000 Income and ₹15,000 Expenses in October 2026
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'income',
        amount: 40000,
        category: 'Salary',
        description: 'Developer Stipend',
        date: '2026-10-01',
      });

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'expense',
        amount: 15000,
        category: 'Rent',
        description: 'Apartment Rent',
        date: '2026-10-02',
      });

    // Seed User A with Budget
    await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        category: 'Food',
        amount: 5000,
        period: 'monthly',
      });

    // Seed User A with Savings Goal
    await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'Emergency Fund',
        targetAmount: 50000,
        currentAmount: 10000,
        targetDate: '2027-01-01',
      });

    // Seed User B with only ₹5,000 Income and ₹2,000 Expenses
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        type: 'income',
        amount: 5000,
        category: 'Freelance',
        description: 'Small design gig',
        date: '2026-10-05',
      });

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        type: 'expense',
        amount: 2000,
        category: 'Books',
        description: 'Textbooks',
        date: '2026-10-06',
      });
  });

  it('1. should calculate dashboard totals strictly for User A without mixing User B data', async () => {
    const resA = await request(app)
      .get('/api/dashboard/summary?month=2026-10')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(resA.status).toBe(200);
    const summaryA = resA.body.data;

    // User A: Balance = 40000 - 15000 = 25000
    expect(summaryA.totalIncome).toBe(40000);
    expect(summaryA.totalExpenses).toBe(15000);
    expect(summaryA.totalBalance).toBe(25000);
    expect(summaryA.monthlySavings).toBe(25000);

    // Verify User A category breakdown has Rent
    expect(summaryA.categoryBreakdown.some((c) => c.name === 'Rent')).toBe(true);
    // User A should NOT have User B's Books category
    expect(summaryA.categoryBreakdown.some((c) => c.name === 'Books')).toBe(false);
  });

  it('2. should calculate dashboard totals strictly for User B without leaking User A data', async () => {
    const resB = await request(app)
      .get('/api/dashboard/summary?month=2026-10')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(resB.status).toBe(200);
    const summaryB = resB.body.data;

    // User B: Balance = 5000 - 2000 = 3000
    expect(summaryB.totalIncome).toBe(5000);
    expect(summaryB.totalExpenses).toBe(2000);
    expect(summaryB.totalBalance).toBe(3000);
    expect(summaryB.monthlySavings).toBe(3000);

    // User B should NOT have User A's Rent category
    expect(summaryB.categoryBreakdown.some((c) => c.name === 'Rent')).toBe(false);
    expect(summaryB.categoryBreakdown.some((c) => c.name === 'Books')).toBe(true);
  });

  it('3. should isolate budgets and savings goals completely between users', async () => {
    // User B requests budgets
    const budgetsB = await request(app)
      .get('/api/budgets')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(budgetsB.status).toBe(200);
    // User B has created 0 budgets, User A's Food budget must not appear
    expect(budgetsB.body.data.length).toBe(0);

    // User B requests goals
    const goalsB = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(goalsB.status).toBe(200);
    // User B has created 0 goals, User A's Emergency Fund must not appear
    expect(goalsB.body.data.length).toBe(0);
  });
});

