import { Router } from 'express';
import { prisma, serializeModel } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createGoalSchema,
  updateGoalSchema,
  contributeGoalSchema,
} from '../schemas/goal.schema.js';

const router = Router();
router.use(requireAuth);

const calculateGoalAnalytics = (goal) => {
  const target = serializeModel(goal.targetAmount);
  const current = serializeModel(goal.currentAmount);
  const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100 * 10) / 10) : 0;
  const remainingAmount = Math.max(0, target - current);

  const now = new Date();
  const targetDate = new Date(goal.targetDate);
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const monthsRemaining = Math.max(1, Math.ceil(diffDays / 30.44));
  const monthlyContributionRequired = remainingAmount > 0 ? Math.round(remainingAmount / monthsRemaining) : 0;

  let computedStatus = goal.status;
  if (current >= target) {
    computedStatus = 'completed';
  } else if (diffDays <= 0 && current < target) {
    computedStatus = 'at_risk';
  } else if (!computedStatus) {
    computedStatus = 'on_track';
  }

  return {
    ...serializeModel(goal),
    progress,
    remainingAmount,
    monthlyContributionRequired,
    status: computedStatus,
  };
};

// GET /api/goals
router.get('/', async (req, res, next) => {
  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId: req.user.id },
      orderBy: { targetDate: 'asc' },
    });

    const enriched = goals.map(calculateGoalAnalytics);

    return res.json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/goals/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const goal = await prisma.savingsGoal.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        error: 'Savings goal not found or unauthorized.',
      });
    }

    return res.json({
      success: true,
      data: calculateGoalAnalytics(goal),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/goals
router.post('/', validate(createGoalSchema), async (req, res, next) => {
  try {
    const { name, targetAmount, currentAmount = 0, targetDate, category, description, status } = req.body;

    const goal = await prisma.savingsGoal.create({
      data: {
        userId: req.user.id,
        name,
        targetAmount,
        currentAmount,
        targetDate: new Date(targetDate),
        category: category || null,
        description: description || null,
        status: status || 'on_track',
      },
    });

    return res.status(201).json({
      success: true,
      data: calculateGoalAnalytics(goal),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/goals/:id
router.patch('/:id', validate(updateGoalSchema), async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.savingsGoal.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Savings goal not found or unauthorized.',
      });
    }

    const { name, targetAmount, currentAmount, targetDate, category, description, status } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (targetAmount !== undefined) updateData.targetAmount = targetAmount;
    if (currentAmount !== undefined) updateData.currentAmount = currentAmount;
    if (targetDate !== undefined) updateData.targetDate = new Date(targetDate);
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      data: calculateGoalAnalytics(updated),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/goals/:id/contribute
router.post('/:id/contribute', validate(contributeGoalSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const existing = await prisma.savingsGoal.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Savings goal not found or unauthorized.',
      });
    }

    const newCurrent = serializeModel(existing.currentAmount) + amount;
    const target = serializeModel(existing.targetAmount);
    const newStatus = newCurrent >= target ? 'completed' : existing.status;

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: {
        currentAmount: newCurrent,
        status: newStatus,
      },
    });

    return res.json({
      success: true,
      message: `Contributed ₹${amount.toLocaleString('en-IN')} to ${existing.name}`,
      data: calculateGoalAnalytics(updated),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/goals/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.savingsGoal.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Savings goal not found or unauthorized.',
      });
    }

    await prisma.savingsGoal.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Savings goal deleted successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

