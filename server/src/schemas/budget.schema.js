import { z } from 'zod';

export const createBudgetSchema = z.object({
  category: z.string().trim().min(1, 'Category is required').max(50),
  amount: z.coerce.number().positive('Budget amount must be greater than zero'),
  period: z.enum(['monthly', 'weekly', 'yearly']).default('monthly'),
  startDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'Valid start date is required',
  }),
  alertThreshold: z.coerce.number().int().min(1).max(100).default(75),
});

export const updateBudgetSchema = createBudgetSchema.partial();

