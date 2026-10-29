import { z } from 'zod';

export const createGoalSchema = z.object({
  name: z.string().trim().min(1, 'Goal name is required').max(100),
  targetAmount: z.coerce.number().positive('Target amount must be greater than zero'),
  currentAmount: z.coerce.number().min(0, 'Current amount cannot be negative').default(0),
  targetDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid target date is required',
  }),
  category: z.string().trim().max(50).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  status: z.enum(['on_track', 'completed', 'at_risk']).default('on_track'),
});

export const updateGoalSchema = createGoalSchema.partial();

export const contributeGoalSchema = z.object({
  amount: z.coerce.number().positive('Contribution amount must be greater than zero'),
});

