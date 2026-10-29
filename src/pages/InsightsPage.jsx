import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  DollarSign,
  PiggyBank,
  Info,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import {
  getDaysInMonth,
  getDaysElapsedInMonth,
  calculateTotalExpenses,
  calculateTotalIncome,
  calculateCategoryBreakdown,
  calculateProjectedSpending,
  calculatePotentialBudgetOverrun,
} from '../utils/calculations';

export const InsightsPage = () => {
  const {
    transactions,
    budgets,
    selectedMonth,
  } = useFinance();

  // E. Period Filter: current-month, prev-month, last-3-months
  const [periodFilter, setPeriodFilter] = useState('current'); // 'current', 'previous', 'last-3'

  // Interactive Simulator State for Section D
  const [simulatorCategory, setSimulatorCategory] = useState('Shopping');
  const [monthlyReduction, setMonthlyReduction] = useState(300);

  // Compute active month string based on period filter
  const [yearStr, monthStr] = selectedMonth.split('-');
  const baseYear = parseInt(yearStr, 10);
  const baseMonthIdx = parseInt(monthStr, 10) - 1;

  const currentMonthKey = selectedMonth;

  const prevDate = new Date(baseYear, baseMonthIdx - 1, 1);
  const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  // Filtered transactions for the selected insight period
  const { activeTransactions, periodLabel, daysElapsed, daysInPeriod } = useMemo(() => {
    if (periodFilter === 'previous') {
      const tx = transactions.filter(t => t.date && t.date.startsWith(prevMonthKey));
      const days = getDaysInMonth(prevDate.getFullYear(), prevDate.getMonth());
      return {
        activeTransactions: tx,
        periodLabel: prevDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        daysElapsed: days,
        daysInPeriod: days,
      };
    } else if (periodFilter === 'last-3') {
      const threeMonthsAgo = new Date(baseYear, baseMonthIdx - 2, 1);
      const tx = transactions.filter(t => new Date(t.date) >= threeMonthsAgo);
      return {
        activeTransactions: tx,
        periodLabel: 'Last 3 Months',
        daysElapsed: 90,
        daysInPeriod: 90,
      };
    }
    // Default: current month
    const tx = transactions.filter(t => t.date && t.date.startsWith(currentMonthKey));
    const daysInMo = getDaysInMonth(baseYear, baseMonthIdx);
    const elapsed = getDaysElapsedInMonth(baseYear, baseMonthIdx);
    return {
      activeTransactions: tx,
      periodLabel: new Date(baseYear, baseMonthIdx, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      daysElapsed: elapsed,
      daysInPeriod: daysInMo,
    };
  }, [transactions, periodFilter, currentMonthKey, prevMonthKey, baseYear, baseMonthIdx, prevDate]);

  // A. Spending Patterns Calculations
  const totalPeriodExpense = useMemo(() => {
    return calculateTotalExpenses(activeTransactions);
  }, [activeTransactions]);

  const totalPeriodIncome = useMemo(() => {
    return calculateTotalIncome(activeTransactions);
  }, [activeTransactions]);

  const categoryBreakdown = useMemo(() => {
    return calculateCategoryBreakdown(activeTransactions);
  }, [activeTransactions]);

  const averageDailySpending = useMemo(() => {
    if (!daysElapsed || daysElapsed <= 0) return 0;
    return Math.round(totalPeriodExpense / daysElapsed);
  }, [totalPeriodExpense, daysElapsed]);

  // Previous month comparison numbers
  const prevMonthTransactions = useMemo(() => {
    return transactions.filter(t => t.date && t.date.startsWith(prevMonthKey));
  }, [transactions, prevMonthKey]);

  const prevMonthTotalExpense = useMemo(() => {
    return calculateTotalExpenses(prevMonthTransactions);
  }, [prevMonthTransactions]);

  const expenseChangePct = useMemo(() => {
    if (prevMonthTotalExpense === 0) return 0;
    return Math.round(((totalPeriodExpense - prevMonthTotalExpense) / prevMonthTotalExpense) * 100);
  }, [totalPeriodExpense, prevMonthTotalExpense]);

  // B. Budget Predictions Calculation (Formula: (Current spending / Days elapsed) × Days in period)
  const budgetPredictions = useMemo(() => {
    return budgets.map(b => {
      const currentCatSpent = activeTransactions
        .filter(t => t.type === 'expense' && t.category.toLowerCase() === b.category.toLowerCase())
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const projected = calculateProjectedSpending(currentCatSpent, daysElapsed, daysInPeriod);
      const overrun = calculatePotentialBudgetOverrun(projected, b.amount);
      const pctProjectedOfBudget = b.amount > 0 ? Math.round((projected / b.amount) * 100) : 0;

      return {
        category: b.category,
        budget: b.amount,
        spent: currentCatSpent,
        projected,
        overrun,
        pctProjectedOfBudget,
        willOverrun: overrun > 0,
      };
    }).sort((a, b) => b.overrun - a.overrun);
  }, [budgets, activeTransactions, daysElapsed, daysInPeriod]);

  // C. Spending Trend Detection (Safe Zero Division & Realistic Rules)
  const trendDetections = useMemo(() => {
    const trends = [];
    categoryBreakdown.forEach(cat => {
      const prevSpent = prevMonthTransactions
        .filter(t => t.type === 'expense' && t.category.toLowerCase() === cat.name.toLowerCase())
        .reduce((sum, t) => sum + Number(t.amount), 0);

      if (prevSpent > 0) {
        const changePct = Math.round(((cat.amount - prevSpent) / prevSpent) * 100);
        if (Math.abs(changePct) >= 10) {
          trends.push({
            category: cat.name,
            currentSpent: cat.amount,
            previousSpent: prevSpent,
            changePct,
            isIncrease: changePct > 0,
            diff: Math.abs(cat.amount - prevSpent),
          });
        }
      } else if (cat.amount > 500) {
        // New spending category that didn't exist last month
        trends.push({
          category: cat.name,
          currentSpent: cat.amount,
          previousSpent: 0,
          changePct: 100,
          isIncrease: true,
          diff: cat.amount,
          isNew: true,
        });
      }
    });
    return trends.sort((a, b) => b.changePct - a.changePct);
  }, [categoryBreakdown, prevMonthTransactions]);

  // D. Actionable Recommendations & Simulator
  const annualSavings = monthlyReduction * 12;
  const threeYearSavings = annualSavings * 3;
  const fiveYearSavingsWithInterest = Math.round(annualSavings * 5 * 1.15); // ~7% compounding estimate

  return (
    <div className="space-y-6">
      {/* Header & Period Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-subtle">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              SpendSense Insights
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
              Differentiator
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data-backed financial predictions, trend intelligence, and habit optimization.
          </p>
        </div>

        {/* E. Period Filter Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setPeriodFilter('current')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              periodFilter === 'current'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Current Month
          </button>
          <button
            onClick={() => setPeriodFilter('previous')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              periodFilter === 'previous'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Previous Month
          </button>
          <button
            onClick={() => setPeriodFilter('last-3')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              periodFilter === 'last-3'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 3 Months
          </button>
        </div>
      </div>

      {/* A. Spending Patterns Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span>A. Spending Patterns</span>
              <span className="text-xs font-normal text-slate-400">({periodLabel})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Analysis of where and how quickly your money flows
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <span className="text-slate-500">
              Total Expenses: <strong className="text-slate-900">{formatCurrency(totalPeriodExpense)}</strong>
            </span>
          </div>
        </div>

        {/* Pattern Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">Average Daily Spending</span>
            <span className="text-xl font-bold text-slate-900">
              {formatCurrency(averageDailySpending)}/day
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Based on {daysElapsed} days elapsed in period
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">Largest Expense Category</span>
            <span className="text-xl font-bold text-teal-800">
              {categoryBreakdown[0]?.name || 'N/A'}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              {categoryBreakdown[0] ? `${formatCurrency(categoryBreakdown[0].amount)} (${formatPercentage(categoryBreakdown[0].percentage)})` : 'No expenses'}
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">Period-over-Period Delta</span>
            <div className="flex items-center space-x-1.5">
              <span className={`text-xl font-bold ${expenseChangePct > 0 ? 'text-red-600' : 'text-green-700'}`}>
                {expenseChangePct > 0 ? `+${expenseChangePct}%` : `${expenseChangePct}%`}
              </span>
              {expenseChangePct > 0 ? (
                <ArrowUpRight className="w-5 h-5 text-red-600" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-green-700" />
              )}
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Compared to previous month's {formatCurrency(prevMonthTotalExpense)}
            </span>
          </div>
        </div>

        {/* Category Expense Bar Chart */}
        <div>
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
            Spending by Category
          </h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryBreakdown}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis
                  type="number"
                  tickFormatter={(val) => `₹${val}`}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#334155' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Spent']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#0F766E" radius={[0, 4, 4, 0]} barSize={16}>
                  {categoryBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? '#0F766E' : '#14B8A6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* B. Budget Predictions Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900">
                B. Intelligent Budget Predictions
              </h3>
              <span className="text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                Mathematical Projection
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Formula: Projected spending = (Current spending / Days elapsed) × Days in period
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Day {daysElapsed} of {daysInPeriod} elapsed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgetPredictions.map((pred) => {
            const isOverrun = pred.willOverrun;

            return (
              <div
                key={pred.category}
                className={`p-4 rounded-xl border transition-all ${
                  isOverrun
                    ? 'bg-red-50/50 border-red-200 hover:border-red-300'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{pred.category}</h4>
                    <span className="text-xs text-slate-500">
                      Budget: {formatCurrency(pred.budget)} · Spent so far: {formatCurrency(pred.spent)}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isOverrun
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {isOverrun ? 'Potential Overrun' : 'Within Budget'}
                  </span>
                </div>

                {/* Mathematical narrative callout */}
                <div className="text-xs text-slate-700 mt-3 p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <p className="leading-relaxed">
                    {isOverrun ? (
                      <>
                        At your current spending rate of{' '}
                        <strong>{formatCurrency(Math.round(pred.spent / Math.max(1, daysElapsed)))}/day</strong>, you
                        may spend <strong>{formatCurrency(pred.projected)}</strong> on {pred.category} this
                        month, <span className="text-red-600 font-semibold">exceeding your budget by {formatCurrency(pred.overrun)}</span>.
                      </>
                    ) : (
                      <>
                        At your current spending rate of{' '}
                        <strong>{formatCurrency(Math.round(pred.spent / Math.max(1, daysElapsed)))}/day</strong>, you
                        are on track to spend approximately <strong>{formatCurrency(pred.projected)}</strong>, safely remaining within your {formatCurrency(pred.budget)} limit.
                      </>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-400 italic">
                    * Clearly labeled estimate based on linear velocity; assumes ongoing current behavior.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* C. Spending Trend Detection Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>C. Spending Trend Detection</span>
            <span className="text-xs font-normal text-slate-400">
              (Comparison with {prevDate.toLocaleString('en-US', { month: 'short' })})
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Surfacing significant spending shifts, anomalies, and habit changes.
          </p>
        </div>

        {trendDetections.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
            Spending across categories has remained stable with no deviations greater than 10%.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {trendDetections.map((trend) => (
              <div
                key={trend.category}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-subtle transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900">{trend.category}</span>
                  <span
                    className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                      trend.isIncrease
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}
                  >
                    {trend.isIncrease ? `+${trend.changePct}%` : `${trend.changePct}%`}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {trend.isNew ? (
                    <>You recorded <strong>{formatCurrency(trend.currentSpent)}</strong> in {trend.category} with no previous spend last month.</>
                  ) : trend.isIncrease ? (
                    <>Your <strong>{trend.category}</strong> expenses increased by <strong>{trend.changePct}%</strong> compared with last month (an extra {formatCurrency(trend.diff)}).</>
                  ) : (
                    <>You successfully reduced <strong>{trend.category}</strong> spending by <strong>{Math.abs(trend.changePct)}%</strong> ({formatCurrency(trend.diff)} saved).</>
                  )}
                </p>

                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
                  <span>Last Mo: {formatCurrency(trend.previousSpent)}</span>
                  <span>This Mo: {formatCurrency(trend.currentSpent)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* D. Actionable Recommendations & Interactive Savings Simulator */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-6">
        <div className="pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900">
              D. Actionable Recommendations & Savings Impact Simulator
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">
              Simulator
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Simulate how small, realistic lifestyle trims multiply into substantial annual savings.
          </p>
        </div>

        {/* Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Controls */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-slate-800 font-semibold text-sm">
              <Calculator className="w-4 h-4 text-teal-700" />
              <span>Configure Your Spending Reduction</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Category to Trim:
              </label>
              <select
                value={simulatorCategory}
                onChange={(e) => setSimulatorCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="Shopping">Shopping & Lifestyle</option>
                <option value="Food">Food & Dining Out</option>
                <option value="Entertainment">Entertainment & Subscriptions</option>
                <option value="Transport">Cabs & Daily Commute</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-medium">Monthly Reduction:</span>
                <span className="font-bold text-teal-700 text-sm">
                  {formatCurrency(monthlyReduction)}/month
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="2500"
                step="50"
                value={monthlyReduction}
                onChange={(e) => setMonthlyReduction(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-700"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>₹100/mo</span>
                <span>₹1,000/mo</span>
                <span>₹2,500/mo</span>
              </div>
            </div>

            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 leading-relaxed">
              <strong>Transparent Calculation Rule:</strong> Reducing {simulatorCategory.toLowerCase()} expenses by{' '}
              {formatCurrency(monthlyReduction)} per month could save {formatCurrency(annualSavings)} annually.
            </div>
          </div>

          {/* Results Projection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-teal-800 to-teal-950 text-white rounded-2xl p-5 shadow-card flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-teal-300 font-semibold block mb-1">
                  1-Year Projected Savings
                </span>
                <p className="text-3xl font-extrabold text-white">
                  {formatCurrency(annualSavings)}
                </p>
                <p className="text-xs text-teal-200/80 mt-2">
                  Potential cash freed up over 12 months.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-teal-700/50 flex items-center justify-between text-[11px] text-teal-300">
                <span>{formatCurrency(monthlyReduction)} × 12 mo</span>
                <span className="font-bold">Guaranteed</span>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-card flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-teal-400 font-semibold block mb-1">
                  5-Year Compounded Impact
                </span>
                <p className="text-3xl font-extrabold text-teal-300">
                  {formatCurrency(fiveYearSavingsWithInterest)}
                </p>
                <p className="text-xs text-slate-300 mt-2">
                  Invested in mutual funds / liquid deposits at ~7% CAGR.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Disciplined Wealth</span>
                <span className="font-bold text-teal-400">+15% Compounding</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
