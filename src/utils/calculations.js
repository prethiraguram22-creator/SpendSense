/**
 * SpendSense Financial Calculations Engine
 * Pure mathematical & analytics functions with robust edge-case handling.
 */

export const getDaysInMonth = (year, monthIndex) => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

export const getDaysElapsedInMonth = (year, monthIndex) => {
  const now = new Date();
  // If the target month is in the past, all days elapsed
  if (now.getFullYear() > year || (now.getFullYear() === year && now.getMonth() > monthIndex)) {
    return getDaysInMonth(year, monthIndex);
  }
  // If the target month is in the future, 0 days elapsed
  if (now.getFullYear() < year || (now.getFullYear() === year && now.getMonth() < monthIndex)) {
    return 0;
  }
  // Current month
  return Math.max(1, now.getDate());
};

/**
 * Filter transactions by month (format: "YYYY-MM")
 */
export const filterTransactionsByMonth = (transactions, monthString) => {
  if (!monthString) return transactions;
  return transactions.filter(t => t.date && t.date.startsWith(monthString));
};

export const calculateTotalIncome = (transactions, monthString = null) => {
  const list = monthString ? filterTransactionsByMonth(transactions, monthString) : transactions;
  return list
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
};

export const calculateTotalExpenses = (transactions, monthString = null) => {
  const list = monthString ? filterTransactionsByMonth(transactions, monthString) : transactions;
  return list
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
};

export const calculateBalance = (transactions) => {
  const totalIncome = calculateTotalIncome(transactions);
  const totalExpenses = calculateTotalExpenses(transactions);
  return totalIncome - totalExpenses;
};

export const calculateMonthlySavings = (transactions, monthString) => {
  const income = calculateTotalIncome(transactions, monthString);
  const expenses = calculateTotalExpenses(transactions, monthString);
  return income - expenses;
};

export const calculateSavingsRate = (income, expenses) => {
  if (!income || income <= 0) return 0;
  const savings = income - expenses;
  if (savings <= 0) return 0;
  return Math.min(100, Math.round((savings / income) * 100 * 10) / 10);
};

export const calculateCategoryBreakdown = (transactions, monthString = null) => {
  const list = monthString ? filterTransactionsByMonth(transactions, monthString) : transactions;
  const expenseTransactions = list.filter(t => t.type === 'expense');
  const totalExpense = expenseTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const categoryTotals = {};
  expenseTransactions.forEach(t => {
    const cat = t.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount);
  });

  return Object.entries(categoryTotals).map(([name, amount]) => {
    const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
    return {
      name,
      amount,
      percentage: Math.round(percentage * 10) / 10,
    };
  }).sort((a, b) => b.amount - a.amount);
};

export const calculateBudgetUtilization = (spent, budgetAmount) => {
  if (!budgetAmount || budgetAmount <= 0) return { percentage: 0, status: 'normal' };
  const percentage = Math.round((spent / budgetAmount) * 100 * 10) / 10;
  let status = 'normal'; // green
  if (percentage >= 100) {
    status = 'exceeded'; // red
  } else if (percentage >= 90) {
    status = 'critical'; // dark amber/red
  } else if (percentage >= 75) {
    status = 'warning'; // amber
  }
  return {
    percentage,
    remaining: Math.max(0, budgetAmount - spent),
    overspent: Math.max(0, spent - budgetAmount),
    status
  };
};

/**
 * Formula: Projected spending = (Current spending / Days elapsed) × Days in period
 */
export const calculateProjectedSpending = (currentSpending, daysElapsed, daysInPeriod) => {
  if (!daysElapsed || daysElapsed <= 0 || !daysInPeriod || daysInPeriod <= 0) {
    return currentSpending || 0;
  }
  const projected = (currentSpending / daysElapsed) * daysInPeriod;
  return Math.round(projected);
};

export const calculatePotentialBudgetOverrun = (projectedSpending, budgetAmount) => {
  if (!budgetAmount || budgetAmount <= 0) return 0;
  return Math.max(0, Math.round(projectedSpending - budgetAmount));
};

export const calculateGoalProgress = (currentAmount, targetAmount) => {
  if (!targetAmount || targetAmount <= 0) return 0;
  const progress = (currentAmount / targetAmount) * 100;
  return Math.min(100, Math.round(progress * 10) / 10);
};

/**
 * Calculate required monthly contribution
 */
export const calculateRequiredMonthlyContribution = (currentAmount, targetAmount, targetDate) => {
  if (currentAmount >= targetAmount) return 0;
  if (!targetDate) return 0;

  const now = new Date();
  const target = new Date(targetDate);
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) {
    return Math.max(0, targetAmount - currentAmount);
  }

  const monthsRemaining = Math.max(1, Math.ceil(diffDays / 30.44));
  const remainingTarget = targetAmount - currentAmount;
  return Math.round(remainingTarget / monthsRemaining);
};

/**
 * Generate intelligent actionable insights strictly based on dynamic calculations
 */
export const generateDynamicInsights = (transactions, budgets, savingsGoals, currentMonth) => {
  const insights = [];
  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStr, 10) - 1;

  const daysInPeriod = getDaysInMonth(year, monthIdx);
  const daysElapsed = getDaysElapsedInMonth(year, monthIdx);

  // Month transactions
  const monthTx = filterTransactionsByMonth(transactions, currentMonth);
  const totalExp = calculateTotalExpenses(monthTx);
  const categoryBreakdown = calculateCategoryBreakdown(monthTx);

  // 1. Dominant category share insight
  if (categoryBreakdown.length > 0 && totalExp > 0) {
    const topCat = categoryBreakdown[0];
    if (topCat.percentage >= 25) {
      insights.push({
        id: 'dominant-category',
        type: 'info',
        icon: 'PieChart',
        title: `${topCat.name} dominates your spending`,
        description: `${topCat.name} accounts for ${topCat.percentage}% (₹${topCat.amount.toLocaleString('en-IN')}) of your total monthly spending.`,
        actionLabel: 'View Transactions',
        actionFilter: { category: topCat.name },
        category: topCat.name,
        badgeText: `${topCat.percentage}% of total`,
      });
    }
  }

  // 2. High budget utilization warning (>75% or >90%)
  budgets.forEach(b => {
    const spentInCat = monthTx
      .filter(t => t.type === 'expense' && t.category === b.category)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const util = calculateBudgetUtilization(spentInCat, b.amount);

    if (util.percentage >= 100) {
      insights.push({
        id: `budget-exceeded-${b.id}`,
        type: 'danger',
        icon: 'AlertTriangle',
        title: `${b.category} Budget Exceeded`,
        description: `You have spent ₹${spentInCat.toLocaleString('en-IN')} out of your ₹${b.amount.toLocaleString('en-IN')} budget (${util.percentage}%). You are over budget by ₹${util.overspent.toLocaleString('en-IN')}.`,
        actionLabel: 'Adjust Budget',
        actionTarget: 'budgets',
        badgeText: 'Over Budget',
        isEstimate: false,
      });
    } else if (util.percentage >= 75) {
      insights.push({
        id: `budget-warning-${b.id}`,
        type: 'warning',
        icon: 'AlertCircle',
        title: `${b.category} budget at ${util.percentage}%`,
        description: `You have used ₹${spentInCat.toLocaleString('en-IN')} of your ₹${b.amount.toLocaleString('en-IN')} budget. ₹${util.remaining.toLocaleString('en-IN')} remaining.`,
        actionLabel: 'Review Budget',
        actionTarget: 'budgets',
        badgeText: `${util.percentage}% Used`,
        isEstimate: false,
      });
    }

    // 3. Projected budget overrun
    if (daysElapsed >= 5 && util.percentage < 100) {
      const projected = calculateProjectedSpending(spentInCat, daysElapsed, daysInPeriod);
      const overrun = calculatePotentialBudgetOverrun(projected, b.amount);
      if (overrun > 0) {
        insights.push({
          id: `projection-overrun-${b.id}`,
          type: 'warning',
          icon: 'TrendingUp',
          title: `Projected overrun in ${b.category}`,
          description: `At your current spending rate of ₹${Math.round(spentInCat / daysElapsed).toLocaleString('en-IN')}/day, you may spend ₹${projected.toLocaleString('en-IN')} this month, exceeding your budget by ₹${overrun.toLocaleString('en-IN')}.`,
          actionLabel: 'Manage Budget',
          actionTarget: 'budgets',
          badgeText: `Est. +₹${overrun.toLocaleString('en-IN')}`,
          isEstimate: true,
        });
      }
    }
  });

  // 4. Previous month comparison for trends
  const prevDate = new Date(year, monthIdx - 1, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevTx = filterTransactionsByMonth(transactions, prevMonthStr);
  const prevExp = calculateTotalExpenses(prevTx);

  if (prevExp > 0 && totalExp > 0) {
    // Check specific categories for notable surges (>15%)
    budgets.forEach(b => {
      const currentCatSpent = monthTx
        .filter(t => t.type === 'expense' && t.category === b.category)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const prevCatSpent = prevTx
        .filter(t => t.type === 'expense' && t.category === b.category)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      if (prevCatSpent > 0 && currentCatSpent > prevCatSpent) {
        const increasePct = Math.round(((currentCatSpent - prevCatSpent) / prevCatSpent) * 100);
        if (increasePct >= 15) {
          insights.push({
            id: `trend-spike-${b.category}`,
            type: 'info',
            icon: 'TrendingUp',
            title: `${b.category} spending increased by ${increasePct}%`,
            description: `You've spent ₹${(currentCatSpent - prevCatSpent).toLocaleString('en-IN')} more on ${b.category} compared to the same time last month.`,
            actionLabel: 'View Transactions',
            actionFilter: { category: b.category },
            badgeText: `+${increasePct}% vs last mo`,
            isEstimate: false,
          });
        }
      }
    });
  }

  // 5. Savings recommendation
  const topShoppingOrFood = categoryBreakdown.find(c => c.name === 'Shopping' || c.name === 'Food' || c.name === 'Entertainment');
  if (topShoppingOrFood && topShoppingOrFood.amount > 1000) {
    const recommendedCut = Math.round(topShoppingOrFood.amount * 0.15 / 50) * 50; // ~15% rounded to nearest 50
    const annualSavings = recommendedCut * 12;
    insights.push({
      id: 'savings-opportunity',
      type: 'success',
      icon: 'PiggyBank',
      title: 'Smart Savings Opportunity',
      description: `Trimming ${topShoppingOrFood.name} spending by ₹${recommendedCut.toLocaleString('en-IN')} per month would put an extra ₹${annualSavings.toLocaleString('en-IN')} into your annual savings.`,
      actionLabel: 'Open Simulator',
      actionTarget: 'insights',
      badgeText: `+₹${annualSavings.toLocaleString('en-IN')}/yr`,
      isEstimate: true,
    });
  }

  return insights;
};

