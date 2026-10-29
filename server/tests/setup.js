import { beforeAll, beforeEach, afterAll } from 'vitest';
import { prisma } from '../src/db/prisma.js';

export const cleanDatabase = async () => {
  try {
    await prisma.transaction.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.savingsGoal.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.notificationPreference.deleteMany();
    await prisma.user.deleteMany();
  } catch (err) {
    console.error('Error cleaning database:', err);
  }
};

beforeAll(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

