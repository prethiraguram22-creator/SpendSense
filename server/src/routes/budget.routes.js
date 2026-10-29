import { Router } from 'express';
import { prisma, serializeModel } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createBudgetSchema,
  updateBudgetSchema,
} from '../schemas/budget.schema.js';

const router = Router();
router.use(requireAuth);

// GET /api/budgets
router.get('/', async (req, res, next) => {
  try {
    const { month } = req.query; // optional 'YYYY-MM'

    const budgets = await prisma.budget.findMany({
      where: { userId: req.user.id },
      orderBy: { category: 'asc' },
    });

    // Determine current month date range to calculate spent amounts
    const now = new Date();
    const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [yearStr, monthStr] = targetMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthIdx = parseInt(monthStr, 10) - 1;

    const startOfMonth = new Date(year, monthIdx, 1);
    const endOfMonth = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);

    // Get current month's expenses for this user
    const expenses = await prisma.transaction.findMany({
      where: {
        userId: req.user.id,
        type: 'expense',
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        category: true,
        amount: true,
      },
    });

    const categorySpentMap = {};
    expenses.forEach((e) => {
      const cat = e.category;
      categorySpentMap[cat] = (categorySpentMap[cat] || 0) + serializeModel(e.amount);
    });

    // Days elapsed & total days for pace calculations
    const daysInPeriod = endOfMonth.getDate();
    let daysElapsed = daysInPeriod;
    if (now.getFullYear() === year && now.getMonth() === monthIdx) {
      daysElapsed = Math.max(1, now.getDate());
    } else if (now < startOfMonth) {
      daysElapsed = 0;
    }

    const budgetsWithAnalytics = budgets.map((b) => {
      const budgetAmount = serializeModel(b.amount);
      const spent = categorySpentMap[b.category] || 0;
      const percentage = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100 * 10) / 10 : 0;
      const remaining = Math.max(0, budgetAmount - spent);
      const overspent = Math.max(0, spent - budgetAmount);

      const projectedSpending = daysElapsed > 0 ? Math.round((spent / daysElapsed) * daysInPeriod) : spent;
      const potentialOverrun = Math.max(0, projectedSpending - budgetAmount);

      let status = 'normal';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 90) status = 'critical';
      else if (percentage >= (b.alertThreshold || 75)) status = 'warning';

      return {
        ...serializeModel(b),
        spent,
        remaining,
        overspent,
        percentage,
        projectedSpending,
        potentialOverrun,
        daysElapsed,
        daysInPeriod,
        status,
      };
    });

    return res.json({
      success: true,
      data: budgetsWithAnalytics,
      period: targetMonth,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/budgets
router.post('/', validate(createBudgetSchema), async (req, res, next) => {
  try {
    const { category, amount, period = 'monthly', startDate, alertThreshold } = req.body;

    // Check if budget already exists for this category and period
    const existing = await prisma.budget.findFirst({
      where: {
        userId: req.user.id,
        category,
        period,
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: `A ${period} budget for '${category}' already exists. Please edit the existing budget.`,
      });
    }

    const budget = await prisma.budget.create({
      data: {
        userId: req.user.id,
        category,
        amount,
        period,
        startDate: startDate ? new Date(startDate) : new Date(),
        alertThreshold: alertThreshold || 75,
      },
    });

    return res.status(201).json({
      success: true,
      data: serializeModel(budget),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/budgets/:id
router.patch('/:id', validate(updateBudgetSchema), async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.budget.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found or unauthorized.',
      });
    }

    const { category, amount, period, startDate, alertThreshold } = req.body;
    const updateData = {};
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = amount;
    if (period !== undefined) updateData.period = period;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (alertThreshold !== undefined) updateData.alertThreshold = alertThreshold;

    const updated = await prisma.budget.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      data: serializeModel(updated),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.budget.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found or unauthorized.',
      });
    }

    await prisma.budget.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Budget removed successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

