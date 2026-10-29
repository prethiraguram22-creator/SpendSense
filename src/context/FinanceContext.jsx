import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_SAVINGS_GOALS,
  CATEGORIES,
} from '../data/demoData';
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateBalance,
  calculateMonthlySavings,
  calculateSavingsRate,
  calculateCategoryBreakdown,
  calculateBudgetUtilization,
  calculateProjectedSpending,
  calculatePotentialBudgetOverrun,
  calculateGoalProgress,
  calculateRequiredMonthlyContribution,
  generateDynamicInsights,
  getDaysInMonth,
  getDaysElapsedInMonth,
  filterTransactionsByMonth,
} from '../utils/calculations';

const FinanceContext = createContext(null);

export const FinanceProvider = ({ children }) => {
  const { isAuthenticated, isDemoMode } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Fetch initial data based on mode
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) {
      setTransactions([]);
      setBudgets([]);
      setSavingsGoals([]);
      setIsLoading(false);
      return;
    }

    if (isDemoMode) {
      try {
        const savedTx = localStorage.getItem('spendsense_transactions');
        const savedB = localStorage.getItem('spendsense_budgets');
        const savedG = localStorage.getItem('spendsense_goals');
        setTransactions(savedTx ? JSON.parse(savedTx) : INITIAL_TRANSACTIONS);
        setBudgets(savedB ? JSON.parse(savedB) : INITIAL_BUDGETS);
        setSavingsGoals(savedG ? JSON.parse(savedG) : INITIAL_SAVINGS_GOALS);
      } catch {
        setTransactions(INITIAL_TRANSACTIONS);
        setBudgets(INITIAL_BUDGETS);
        setSavingsGoals(INITIAL_SAVINGS_GOALS);
      }
      setIsLoading(false);
      return;
    }

    // Live Production API Mode
    setIsLoading(true);
    try {
      const [txRes, bRes, gRes] = await Promise.all([
        apiService.getTransactions({ limit: 100 }),
        apiService.getBudgets(selectedMonth),
        apiService.getSavingsGoals(),
      ]);

      if (txRes.success) setTransactions(txRes.data);
      if (bRes.success) setBudgets(bRes.data);
      if (gRes.success) setSavingsGoals(gRes.data);
    } catch (err) {
      console.error('Error fetching live finance data:', err);
      addToast('Error synchronizing financial records with database', 'danger');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isDemoMode, selectedMonth]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Transaction CRUD Operations
  const addTransaction = async (newTx) => {
    if (isDemoMode) {
      const tx = {
        ...newTx,
        id: `tx-${Date.now()}`,
        amount: Number(newTx.amount),
        createdAt: new Date().toISOString(),
      };
      setTransactions(prev => [tx, ...prev]);
      localStorage.setItem('spendsense_transactions', JSON.stringify([tx, ...transactions]));
      addToast(`Added ${tx.type === 'income' ? 'income' : 'expense'}: ${tx.description}`, 'success');
      return tx;
    }

    try {
      const res = await apiService.createTransaction(newTx);
      if (res.success) {
        setTransactions(prev => [res.data, ...prev]);
        addToast(`Transaction recorded: ${res.data.description}`, 'success');
        refreshData();
        return res.data;
      }
    } catch (error) {
      addToast(error.message || 'Failed to save transaction', 'danger');
      throw error;
    }
  };

  const updateTransaction = async (id, updates) => {
    if (isDemoMode) {
      setTransactions(prev =>
        prev.map(t => (t.id === id ? { ...t, ...updates, amount: Number(updates.amount || t.amount) } : t))
      );
      addToast('Transaction updated successfully', 'success');
      return;
    }

    try {
      const res = await apiService.updateTransaction(id, updates);
      if (res.success) {
        setTransactions(prev => prev.map(t => (t.id === id ? res.data : t)));
        addToast('Transaction updated successfully', 'success');
        refreshData();
      }
    } catch (error) {
      addToast(error.message || 'Failed to update transaction', 'danger');
      throw error;
    }
  };

  const deleteTransaction = async (id) => {
    if (isDemoMode) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      addToast('Transaction removed', 'info');
      return;
    }

    try {
      const res = await apiService.deleteTransaction(id);
      if (res.success) {
        setTransactions(prev => prev.filter(t => t.id !== id));
        addToast('Transaction deleted', 'info');
        refreshData();
      }
    } catch (error) {
      addToast(error.message || 'Failed to delete transaction', 'danger');
      throw error;
    }
  };

  // Budget CRUD Operations
  const addBudget = async (newBudget) => {
    if (isDemoMode) {
      const b = { ...newBudget, id: `b-${Date.now()}`, amount: Number(newBudget.amount) };
      setBudgets(prev => [...prev, b]);
      addToast(`Budget set for ${b.category}`, 'success');
      return b;
    }

    try {
      const res = await apiService.createBudget(newBudget);
      if (res.success) {
        setBudgets(prev => [...prev, res.data]);
        addToast(`Budget set for ${res.data.category}`, 'success');
        refreshData();
        return res.data;
      }
    } catch (error) {
      addToast(error.message || 'Failed to set budget', 'danger');
      throw error;
    }
  };

  const updateBudget = async (id, updates) => {
    if (isDemoMode) {
      setBudgets(prev =>
        prev.map(b => (b.id === id ? { ...b, ...updates, amount: Number(updates.amount || b.amount) } : b))
      );
      addToast('Budget updated successfully', 'success');
      return;
    }

    try {
      const res = await apiService.updateBudget(id, updates);
      if (res.success) {
        setBudgets(prev => prev.map(b => (b.id === id ? res.data : b)));
        addToast('Budget updated', 'success');
        refreshData();
      }
    } catch (error) {
      addToast(error.message || 'Failed to update budget', 'danger');
      throw error;
    }
  };

  const deleteBudget = async (id) => {
    if (isDemoMode) {
      setBudgets(prev => prev.filter(b => b.id !== id));
      addToast('Budget removed', 'info');
      return;
    }

    try {
      const res = await apiService.deleteBudget(id);
      if (res.success) {
        setBudgets(prev => prev.filter(b => b.id !== id));
        addToast('Budget removed', 'info');
        refreshData();
      }
    } catch (error) {
      addToast(error.message || 'Failed to delete budget', 'danger');
      throw error;
    }
  };

  // Savings Goal CRUD Operations
  const addSavingsGoal = async (newGoal) => {
    if (isDemoMode) {
      const g = {
        ...newGoal,
        id: `goal-${Date.now()}`,
        targetAmount: Number(newGoal.targetAmount),
        currentAmount: Number(newGoal.currentAmount || 0),
      };
      setSavingsGoals(prev => [...prev, g]);
      addToast(`Goal created: ${g.name}`, 'success');
      return g;
    }

    try {
      const res = await apiService.createSavingsGoal(newGoal);
      if (res.success) {
        setSavingsGoals(prev => [...prev, res.data]);
        addToast(`Goal created: ${res.data.name}`, 'success');
        refreshData();
        return res.data;
      }
    } catch (error) {
      addToast(error.message || 'Failed to create goal', 'danger');
      throw error;
    }
  };

  const updateSavingsGoal = async (id, updates) => {
    if (isDemoMode) {
      setSavingsGoals(prev =>
        prev.map(g =>
          g.id === id
            ? {
                ...g,
                ...updates,
                targetAmount: Number(updates.targetAmount || g.targetAmount),
                currentAmount: Number(updates.currentAmount !== undefined ? updates.currentAmount : g.currentAmount),
              }
            : g
        )
      );
      addToast('Goal updated', 'success');
      return;
    }

    try {
      const res = await apiService.updateSavingsGoal(id, updates);
      if (res.success) {
        setSavingsGoals(prev => prev.map(g => (g.id === id ? res.data : g)));
        addToast('Goal updated', 'success');
        refreshData();
      }
    } catch (error) {
      addToast(error.message || 'Failed to update goal', 'danger');
      throw error;
    }
  };

  const deleteSavingsGoal = async (id) => {
    if (isDemoMode) {
      setSavingsGoals(prev => prev.filter(g => g.id !== id));
      addToast('Savings goal removed', 'info');
      return;
    }

    try {
      const res = await apiService.deleteSavingsGoal(id);
      if (res.success) {
        setSavingsGoals(prev => prev.filter(g => g.id !== id));
        addToast('Savings goal removed', 'info');
        refreshData();
      }
    } catch (error) {
      addToast(error.message || 'Failed to delete goal', 'danger');
      throw error;
    }
  };

  const addGoalContribution = async (goalId, amount) => {
    const num = Number(amount);
    if (!num || num <= 0) return;

    if (isDemoMode) {
      setSavingsGoals(prev =>
        prev.map(g => (g.id === goalId ? { ...g, currentAmount: g.currentAmount + num } : g))
      );
      addToast(`Contributed ₹${num.toLocaleString('en-IN')}`, 'success');
      return;
    }

    try {
      const res = await apiService.contributeSavingsGoal(goalId, num);
      if (res.success) {
        setSavingsGoals(prev => prev.map(g => (g.id === goalId ? res.data : g)));
        addToast(`Contributed ₹${num.toLocaleString('en-IN')}`, 'success');
        refreshData();
      }
    } catch (error) {
      addToast(error.message || 'Failed to record contribution', 'danger');
      throw error;
    }
  };

  const resetToDemoData = () => {
    localStorage.removeItem('spendsense_transactions');
    localStorage.removeItem('spendsense_budgets');
    localStorage.removeItem('spendsense_goals');
    setTransactions(INITIAL_TRANSACTIONS);
    setBudgets(INITIAL_BUDGETS);
    setSavingsGoals(INITIAL_SAVINGS_GOALS);
    setSelectedMonth('2026-10');
    addToast('All demo records reset to initial state', 'info');
  };

  const exportAllDataJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      transactions,
      budgets,
      savingsGoals,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendsense_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Exported SpendSense backup file', 'success');
  };

  // Format date helper for transactions
  const normalizedTransactions = useMemo(() => {
    return transactions.map(t => ({
      ...t,
      date: typeof t.date === 'string' && t.date.length > 10 ? t.date.slice(0, 10) : (t.date || ''),
      amount: Number(t.amount) || 0,
    }));
  }, [transactions]);

  // Derived Financial Metrics
  const currentMonthTransactions = useMemo(() => {
    return filterTransactionsByMonth(normalizedTransactions, selectedMonth);
  }, [normalizedTransactions, selectedMonth]);

  const totalIncome = useMemo(() => {
    return calculateTotalIncome(normalizedTransactions, selectedMonth);
  }, [normalizedTransactions, selectedMonth]);

  const totalExpenses = useMemo(() => {
    return calculateTotalExpenses(normalizedTransactions, selectedMonth);
  }, [normalizedTransactions, selectedMonth]);

  const monthlySavings = useMemo(() => {
    return calculateMonthlySavings(normalizedTransactions, selectedMonth);
  }, [normalizedTransactions, selectedMonth]);

  const savingsRate = useMemo(() => {
    return calculateSavingsRate(totalIncome, totalExpenses);
  }, [totalIncome, totalExpenses]);

  const totalBalance = useMemo(() => {
    return calculateBalance(normalizedTransactions);
  }, [normalizedTransactions]);

  const categoryBreakdown = useMemo(() => {
    return calculateCategoryBreakdown(normalizedTransactions, selectedMonth);
  }, [normalizedTransactions, selectedMonth]);

  const previousMonthStats = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthIdx = parseInt(monthStr, 10) - 1;
    const prevDate = new Date(year, monthIdx - 1, 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const prevIncome = calculateTotalIncome(normalizedTransactions, prevMonthStr);
    const prevExpenses = calculateTotalExpenses(normalizedTransactions, prevMonthStr);
    const prevSavings = calculateMonthlySavings(normalizedTransactions, prevMonthStr);

    return {
      monthKey: prevMonthStr,
      income: prevIncome,
      expenses: prevExpenses,
      savings: prevSavings,
      incomeDiff: totalIncome - prevIncome,
      expensesDiff: totalExpenses - prevExpenses,
      savingsDiff: monthlySavings - prevSavings,
      expensesPctDiff: prevExpenses > 0 ? Math.round(((totalExpenses - prevExpenses) / prevExpenses) * 100) : 0,
    };
  }, [normalizedTransactions, selectedMonth, totalIncome, totalExpenses, monthlySavings]);

  const dynamicInsights = useMemo(() => {
    return generateDynamicInsights(normalizedTransactions, budgets, savingsGoals, selectedMonth);
  }, [normalizedTransactions, budgets, savingsGoals, selectedMonth]);

  const monthlyTrendsData = useMemo(() => {
    const months = [];
    const [yearStr, monthStr] = selectedMonth.split('-');
    const baseYear = parseInt(yearStr, 10);
    const baseMonthIdx = parseInt(monthStr, 10) - 1;

    for (let i = 5; i >= 0; i--) {
      const d = new Date(baseYear, baseMonthIdx - i, 1);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mLabel = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const inc = calculateTotalIncome(normalizedTransactions, mKey);
      const exp = calculateTotalExpenses(normalizedTransactions, mKey);

      months.push({
        month: mLabel,
        key: mKey,
        income: inc,
        expenses: exp,
        savings: inc - exp,
      });
    }
    return months;
  }, [normalizedTransactions, selectedMonth]);

  const budgetsWithProgress = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthIdx = parseInt(monthStr, 10) - 1;
    const daysInPeriod = getDaysInMonth(year, monthIdx);
    const daysElapsed = getDaysElapsedInMonth(year, monthIdx);

    return budgets.map(budget => {
      const spent = currentMonthTransactions
        .filter(t => t.type === 'expense' && t.category.toLowerCase() === budget.category.toLowerCase())
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const budgetAmount = Number(budget.amount) || 0;
      const util = calculateBudgetUtilization(spent, budgetAmount);
      const projected = calculateProjectedSpending(spent, daysElapsed, daysInPeriod);
      const potentialOverrun = calculatePotentialBudgetOverrun(projected, budgetAmount);

      return {
        ...budget,
        amount: budgetAmount,
        spent,
        remaining: util.remaining,
        overspent: util.overspent,
        percentage: util.percentage,
        status: util.status,
        projectedSpending: projected,
        potentialOverrun,
        daysElapsed,
        daysInPeriod,
      };
    });
  }, [budgets, currentMonthTransactions, selectedMonth]);

  const goalsWithCalculations = useMemo(() => {
    return savingsGoals.map(goal => {
      const targetAmount = Number(goal.targetAmount) || 0;
      const currentAmount = Number(goal.currentAmount) || 0;
      const progress = calculateGoalProgress(currentAmount, targetAmount);
      const monthlyContributionRequired = calculateRequiredMonthlyContribution(
        currentAmount,
        targetAmount,
        goal.targetDate
      );

      let status = goal.status || 'on_track';
      if (progress >= 100) {
        status = 'completed';
      } else if (new Date(goal.targetDate) < new Date() && progress < 100) {
        status = 'at_risk';
      }

      return {
        ...goal,
        targetAmount,
        currentAmount,
        progress,
        remainingAmount: Math.max(0, targetAmount - currentAmount),
        monthlyContributionRequired,
        status,
      };
    });
  }, [savingsGoals]);

  return (
    <FinanceContext.Provider
      value={{
        transactions: normalizedTransactions,
        budgets,
        savingsGoals,
        categories: CATEGORIES,
        selectedMonth,
        setSelectedMonth,
        isLoading,
        toasts,
        addToast,
        removeToast,
        refreshData,
        // CRUD
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addBudget,
        updateBudget,
        deleteBudget,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        addGoalContribution,
        resetToDemoData,
        exportAllDataJSON,
        // Computed
        currentMonthTransactions,
        totalIncome,
        totalExpenses,
        monthlySavings,
        savingsRate,
        totalBalance,
        categoryBreakdown,
        previousMonthStats,
        dynamicInsights,
        monthlyTrendsData,
        budgetsWithProgress,
        goalsWithCalculations,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
