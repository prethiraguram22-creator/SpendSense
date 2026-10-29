import { Router } from 'express';
import { prisma, serializeModel } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/dashboard/summary?month=YYYY-MM
router.get('/summary', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month } = req.query;

    const now = new Date();
    const currentMonthKey = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [yearStr, monthStr] = currentMonthKey.split('-');
    const year = parseInt(yearStr, 10);
    const monthIdx = parseInt(monthStr, 10) - 1;

    // Date range for current month
    const startOfMonth = new Date(year, monthIdx, 1);
    const endOfMonth = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);

    // Date range for previous month
    const startOfPrevMonth = new Date(year, monthIdx - 1, 1);
    const endOfPrevMonth = new Date(year, monthIdx, 0, 23, 59, 59, 999);

    // 1. All-time balance
    const [allIncome, allExpenses] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'income' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'expense' },
        _sum: { amount: true },
      }),
    ]);
    const totalBalance = (serializeModel(allIncome._sum.amount) || 0) - (serializeModel(allExpenses._sum.amount) || 0);

    // 2. Current Month transactions & aggregates
    const [monthIncomeAgg, monthExpenseAgg, monthExpenses] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'income',
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'expense',
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          type: 'expense',
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        select: { category: true, amount: true },
      }),
    ]);

    const totalIncome = serializeModel(monthIncomeAgg._sum.amount) || 0;
    const totalExpenses = serializeModel(monthExpenseAgg._sum.amount) || 0;
    const monthlySavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 && monthlySavings > 0
      ? Math.min(100, Math.round((monthlySavings / totalIncome) * 100 * 10) / 10)
      : 0;

    // 3. Previous Month aggregates for comparisons
    const [prevIncomeAgg, prevExpenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'income',
          date: { gte: startOfPrevMonth, lte: endOfPrevMonth },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'expense',
          date: { gte: startOfPrevMonth, lte: endOfPrevMonth },
        },
        _sum: { amount: true },
      }),
    ]);

    const prevIncome = serializeModel(prevIncomeAgg._sum.amount) || 0;
    const prevExpenses = serializeModel(prevExpenseAgg._sum.amount) || 0;
    const expensesPctDiff = prevExpenses > 0
      ? Math.round(((totalExpenses - prevExpenses) / prevExpenses) * 100)
      : 0;
    const incomeDiff = totalIncome - prevIncome;

    // 4. Category breakdown for current month
    const categoryTotals = {};
    monthExpenses.forEach((e) => {
      const cat = e.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + serializeModel(e.amount);
    });

    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // 5. Six-month historical monthly trends
    const monthlyTrendsData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, monthIdx - i, 1);
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
      monthlyTrendsData.push({
        month: mLabel,
        key: mKey,
        income: incVal,
        expenses: expVal,
        savings: incVal - expVal,
      });
    }

    // 6. Recent transactions (latest 6)
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 6,
    });

    // 7. Budgets with Progress
    const budgets = await prisma.budget.findMany({
      where: { userId },
      orderBy: { category: 'asc' },
    });

    const daysInPeriod = endOfMonth.getDate();
    let daysElapsed = daysInPeriod;
    if (now.getFullYear() === year && now.getMonth() === monthIdx) {
      daysElapsed = Math.max(1, now.getDate());
    }

    const budgetsWithProgress = budgets.map((b) => {
      const budgetAmount = serializeModel(b.amount);
      const spent = categoryTotals[b.category] || 0;
      const percentage = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100 * 10) / 10 : 0;
      const remaining = Math.max(0, budgetAmount - spent);
      const overspent = Math.max(0, spent - budgetAmount);
      const projectedSpending = daysElapsed > 0 ? Math.round((spent / daysElapsed) * daysInPeriod) : spent;
      const potentialOverrun = Math.max(0, projectedSpending - budgetAmount);

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
        status: percentage >= 100 ? 'exceeded' : percentage >= 90 ? 'critical' : percentage >= 75 ? 'warning' : 'normal',
      };
    });

    // 8. Generate dynamic mathematical insights strictly from user's data
    const dynamicInsights = [];
    if (categoryBreakdown.length > 0 && totalExpenses > 0) {
      const top = categoryBreakdown[0];
      if (top.percentage >= 25) {
        dynamicInsights.push({
          id: 'dominant-category',
          type: 'info',
          icon: 'PieChart',
          title: `${top.name} accounts for ${top.percentage}% of spending`,
          description: `You have spent ₹${top.amount.toLocaleString('en-IN')} on ${top.name} this month.`,
          actionLabel: 'View Transactions',
          actionFilter: { category: top.name },
          badgeText: `${top.percentage}% of total`,
        });
      }
    }

    budgetsWithProgress.forEach((b) => {
      if (b.percentage >= 100) {
        dynamicInsights.push({
          id: `exceeded-${b.id}`,
          type: 'danger',
          icon: 'AlertTriangle',
          title: `${b.category} Budget Exceeded`,
          description: `You've used ${b.percentage}% of your ₹${b.amount.toLocaleString('en-IN')} limit, exceeding it by ₹${b.overspent.toLocaleString('en-IN')}.`,
          actionLabel: 'Adjust Budget',
          actionTarget: 'budgets',
          badgeText: 'Over Budget',
        });
      } else if (b.potentialOverrun > 0 && daysElapsed >= 5) {
        dynamicInsights.push({
          id: `overrun-${b.id}`,
          type: 'warning',
          icon: 'TrendingUp',
          title: `Projected Overrun in ${b.category}`,
          description: `At your current velocity, you may spend ₹${b.projectedSpending.toLocaleString('en-IN')} this month, exceeding your limit by ₹${b.potentialOverrun.toLocaleString('en-IN')}.`,
          actionLabel: 'Manage Budget',
          actionTarget: 'budgets',
          badgeText: `Est. +₹${b.potentialOverrun.toLocaleString('en-IN')}`,
          isEstimate: true,
        });
      }
    });

    // Savings opportunity
    if (totalExpenses > 1000) {
      const cut = Math.round(totalExpenses * 0.05 / 50) * 50;
      dynamicInsights.push({
        id: 'savings-opportunity',
        type: 'success',
        icon: 'PiggyBank',
        title: 'Compound Savings Opportunity',
        description: `Trimming monthly discretionary expenses by ₹${cut.toLocaleString('en-IN')} could accumulate ₹${(cut * 12).toLocaleString('en-IN')} in annual savings.`,
        actionLabel: 'Open Simulator',
        actionTarget: 'insights',
        badgeText: `+₹${(cut * 12).toLocaleString('en-IN')}/yr`,
        isEstimate: true,
      });
    }

    return res.json({
      success: true,
      data: {
        totalBalance,
        totalIncome,
        totalExpenses,
        monthlySavings,
        savingsRate,
        previousMonthStats: {
          monthKey: `${startOfPrevMonth.getFullYear()}-${String(startOfPrevMonth.getMonth() + 1).padStart(2, '0')}`,
          income: prevIncome,
          expenses: prevExpenses,
          incomeDiff,
          expensesPctDiff,
        },
        categoryBreakdown,
        monthlyTrendsData,
        budgetsWithProgress,
        recentTransactions: serializeModel(recentTransactions),
        dynamicInsights,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

