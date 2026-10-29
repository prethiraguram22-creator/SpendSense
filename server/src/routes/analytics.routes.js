import { Router } from 'express';
import { prisma, serializeModel } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/analytics/spending
router.get('/spending', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month } = req.query;

    const now = new Date();
    const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [yearStr, monthStr] = targetMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthIdx = parseInt(monthStr, 10) - 1;

    const startOfMonth = new Date(year, monthIdx, 1);
    const endOfMonth = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);

    const expenses = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'expense',
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { category: true, amount: true, date: true },
    });

    const totalExpense = expenses.reduce((sum, e) => sum + serializeModel(e.amount), 0);
    const categoryTotals = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + serializeModel(e.amount);
    });

    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const daysInPeriod = endOfMonth.getDate();
    let daysElapsed = daysInPeriod;
    if (now.getFullYear() === year && now.getMonth() === monthIdx) {
      daysElapsed = Math.max(1, now.getDate());
    }

    const averageDailySpending = daysElapsed > 0 ? Math.round(totalExpense / daysElapsed) : 0;

    return res.json({
      success: true,
      data: {
        month: targetMonth,
        totalExpense,
        categoryBreakdown,
        averageDailySpending,
        daysElapsed,
        daysInPeriod,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/monthly
router.get('/monthly', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const monthsCount = Math.min(24, Math.max(1, parseInt(req.query.months, 10) || 6));

    const now = new Date();
    const trends = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mLabel = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });

      const [inc, exp] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, type: 'income', date: { gte: mStart, lte: mEnd } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId, type: 'expense', date: { gte: mStart, lte: mEnd } },
          _sum: { amount: true },
        }),
      ]);

      const incVal = serializeModel(inc._sum.amount) || 0;
      const expVal = serializeModel(exp._sum.amount) || 0;

      trends.push({
        month: mLabel,
        key: mKey,
        income: incVal,
        expenses: expVal,
        savings: incVal - expVal,
      });
    }

    return res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

