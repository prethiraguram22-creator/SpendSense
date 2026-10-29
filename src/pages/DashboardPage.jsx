import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  CreditCard,
  PiggyBank,
  Plus,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { SpendingChart } from '../components/dashboard/SpendingChart';
import { CategoryDonutChart } from '../components/dashboard/CategoryDonutChart';
import { BudgetOverviewCard } from '../components/dashboard/BudgetOverviewCard';
import { RecentTransactionsTable } from '../components/dashboard/RecentTransactionsTable';
import { InsightsBanner } from '../components/dashboard/InsightsBanner';
import { TransactionDialog } from '../components/transactions/TransactionDialog';

export const DashboardPage = () => {
  const { user } = useAuth();
  const {
    totalBalance,
    totalIncome,
    totalExpenses,
    monthlySavings,
    savingsRate,
    previousMonthStats,
    monthlyTrendsData,
    categoryBreakdown,
    budgetsWithProgress,
    currentMonthTransactions,
    dynamicInsights,
  } = useFinance();

  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setIsTransactionDialogOpen(true);
  };

  const handleOpenEdit = (tx) => {
    setEditingTransaction(tx);
    setIsTransactionDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-subtle">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Good morning, {user?.name?.split(' ')[0] || 'Alex'}!
            </h2>
            <span className="text-xl">👋</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here's how your money is looking this month.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-card transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* 2. Financial Summary Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Balance */}
        <SummaryCard
          title="Total Balance"
          amount={totalBalance}
          subtitle="Net accumulated"
          icon={Wallet}
          iconColor="text-teal-700 bg-teal-50"
          additionalInfo="All Accounts"
        />

        {/* Card 2: Total Income */}
        <SummaryCard
          title="Total Income"
          amount={totalIncome}
          change={previousMonthStats.incomeDiff !== 0 ? Math.round((previousMonthStats.incomeDiff / (previousMonthStats.income || 1)) * 100) : 0}
          subtitle="vs last month"
          icon={TrendingUp}
          iconColor="text-green-700 bg-green-50"
        />

        {/* Card 3: Total Expenses */}
        <SummaryCard
          title="Total Expenses"
          amount={totalExpenses}
          change={previousMonthStats.expensesPctDiff}
          subtitle="vs last month"
          isInverse={true} // lower expense is positive
          icon={CreditCard}
          iconColor="text-red-700 bg-red-50"
        />

        {/* Card 4: Monthly Savings */}
        <SummaryCard
          title="Monthly Savings"
          amount={monthlySavings}
          subtitle={`Savings rate: ${savingsRate}%`}
          icon={PiggyBank}
          iconColor="text-teal-700 bg-teal-50"
          additionalInfo={`${savingsRate}% of income`}
        />
      </div>

      {/* 3. SpendSense AI Money Insights Banner */}
      <InsightsBanner insights={dynamicInsights} />

      {/* 4. Charts Row: Spending Over Time & Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingChart data={monthlyTrendsData} />
        <CategoryDonutChart categoryBreakdown={categoryBreakdown} />
      </div>

      {/* 5. Bottom Row: Budget Overview Progress & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Budget Card */}
        <div className="lg:col-span-1">
          <BudgetOverviewCard budgetsWithProgress={budgetsWithProgress} />
        </div>

        {/* Recent Transactions Table */}
        <div className="lg:col-span-2">
          <RecentTransactionsTable
            transactions={currentMonthTransactions}
            onEditTransaction={handleOpenEdit}
          />
        </div>
      </div>

      {/* Add / Edit Transaction Modal */}
      <TransactionDialog
        isOpen={isTransactionDialogOpen}
        onClose={() => setIsTransactionDialogOpen(false)}
        initialTransaction={editingTransaction}
      />
    </div>
  );
};

