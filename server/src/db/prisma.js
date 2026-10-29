import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

let prismaInstance;

if (process.env.NODE_ENV === 'test') {
  try {
    // If test client was generated, use it for SQLite testing
    const { PrismaClient: TestPrismaClient } = await import('@prisma/test-client');
    prismaInstance = new TestPrismaClient();
  } catch {
    prismaInstance = new PrismaClient();
  }
} else {
  prismaInstance = new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma = prismaInstance;

/**
 * Helper to serialize Prisma models with Decimals to clean numeric JSON objects
 */
export const serializeModel = (data) => {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map(serializeModel);
  }
  if (typeof data === 'object') {
    if (data.toNumber && typeof data.toNumber === 'function') {
      return data.toNumber();
    }
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && value.toNumber && typeof value.toNumber === 'function') {
        result[key] = value.toNumber();
      } else if (value instanceof Date) {
        result[key] = value.toISOString();
      } else if (typeof value === 'object' && value !== null) {
        result[key] = serializeModel(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  return data;
};

