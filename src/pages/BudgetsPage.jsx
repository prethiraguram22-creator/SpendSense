import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  PieChart,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Edit2,
  Trash2,
  Utensils,
  ShoppingBag,
  Car,
  Film,
  Zap,
  GraduationCap,
  HeartPulse,
  MoreHorizontal,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { BudgetDialog } from '../components/budgets/BudgetDialog';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';

const categoryIcons = {
  Food: Utensils,
  Shopping: ShoppingBag,
  Transport: Car,
  Entertainment: Film,
  Bills: Zap,
  Education: GraduationCap,
  Healthcare: HeartPulse,
  Other: MoreHorizontal,
};

export const BudgetsPage = () => {
  const navigate = useNavigate();
  const {
    budgetsWithProgress,
    deleteBudget,
    selectedMonth,
  } = useFinance();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState(null);

  // Overall totals across all budgets
  const summary = useMemo(() => {
    const totalBudget = budgetsWithProgress.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgetsWithProgress.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = Math.max(0, totalBudget - totalSpent);
    const overBudgetCount = budgetsWithProgress.filter((b) => b.percentage >= 100).length;
    const warningCount = budgetsWithProgress.filter((b) => b.percentage >= 75 && b.percentage < 100).length;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overBudgetCount,
      warningCount,
      overallUtilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
    };
  }, [budgetsWithProgress]);

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (budget) => {
    setEditingBudget(budget);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingBudgetId) {
      deleteBudget(deletingBudgetId);
      setDeletingBudgetId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-subtle">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Budgets
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Control your monthly category limits and prevent overspending.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-card transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create Budget</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Total Monthly Budget
          </span>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(summary.totalBudget)}
          </p>
          <p className="text-xs text-slate-400 mt-1">{budgetsWithProgress.length} categories configured</p>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Total Spent
          </span>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(summary.totalSpent)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {summary.overallUtilization}% of total allocated
          </p>
        </div>

        {/* Remaining Budget */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Remaining Budget
          </span>
          <p className="text-2xl font-bold text-teal-700">
            {formatCurrency(summary.totalRemaining)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Safe to spend this month</p>
        </div>

        {/* Over Budget Count */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Exceeded Categories
          </span>
          <div className="flex items-center space-x-2">
            <p className={`text-2xl font-bold ${summary.overBudgetCount > 0 ? 'text-red-600' : 'text-green-700'}`}>
              {summary.overBudgetCount}
            </p>
            {summary.overBudgetCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> Over Limit
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Disciplined
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {summary.warningCount} categories approaching limit (&gt;75%)
          </p>
        </div>
      </div>

      {/* Category Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {budgetsWithProgress.map((b) => {
          const IconComponent = categoryIcons[b.category] || MoreHorizontal;
          const isExceeded = b.percentage >= 100;
          const isCritical = b.percentage >= 90 && !isExceeded;
          const isWarning = b.percentage >= 75 && !isCritical && !isExceeded;

          let statusBadge = {
            label: 'Normal Spending',
            bg: 'bg-green-50 text-green-700 border-green-200',
            barColor: 'bg-teal-600',
            textColor: 'text-teal-700',
          };

          if (isExceeded) {
            statusBadge = {
              label: "You've exceeded your budget",
              bg: 'bg-red-50 text-red-700 border-red-200 font-bold',
              barColor: 'bg-red-600',
              textColor: 'text-red-700',
            };
          } else if (isCritical) {
            statusBadge = {
              label: 'Your budget is nearly exhausted',
              bg: 'bg-red-50 text-red-700 border-red-200',
              barColor: 'bg-red-500',
              textColor: 'text-red-600',
            };
          } else if (isWarning) {
            statusBadge = {
              label: "You're approaching your budget limit",
              bg: 'bg-amber-50 text-amber-700 border-amber-200',
              barColor: 'bg-amber-500',
              textColor: 'text-amber-600',
            };
          }

          // Expected pace based on day elapsed
          const expectedPacePct = Math.round((b.daysElapsed / b.daysInPeriod) * 100);
          const paceDifference = Math.round(b.percentage - expectedPacePct);

          return (
            <div
              key={b.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{b.category}</h4>
                      <span className="text-xs text-slate-400 capitalize">{b.period}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-slate-100 transition-colors"
                      title="Edit Budget"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingBudgetId(b.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Numbers */}
                <div className="my-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Spent</span>
                      <span className="text-xl font-bold text-slate-900">
                        {formatCurrency(b.spent)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Budget</span>
                      <span className="text-base font-semibold text-slate-600">
                        {formatCurrency(b.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                      <span className={statusBadge.textColor}>
                        {formatPercentage(b.percentage)} used
                      </span>
                      <span className="text-slate-500">
                        {isExceeded
                          ? `Over by ${formatCurrency(b.overspent)}`
                          : `${formatCurrency(b.remaining)} left`}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${statusBadge.barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Status Notice */}
                <div className={`p-2.5 rounded-lg border text-xs mb-3 flex items-start space-x-2 ${statusBadge.bg}`}>
                  {isExceeded ? (
                    <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : isWarning || isCritical ? (
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{statusBadge.label}</span>
                </div>

                {/* Pace vs Utilization Analytics Box */}
                <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Month Elapsed:</span>
                    <span className="font-semibold text-slate-700">
                      Day {b.daysElapsed} of {b.daysInPeriod} ({expectedPacePct}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500">
                    <span>Spending Pace:</span>
                    <span className="font-semibold">
                      {paceDifference > 5 ? (
                        <span className="text-amber-600">
                          {paceDifference}% faster than calendar
                        </span>
                      ) : paceDifference < -5 ? (
                        <span className="text-teal-700">
                          {Math.abs(paceDifference)}% slower than calendar
                        </span>
                      ) : (
                        <span className="text-slate-600">On pace with calendar</span>
                      )}
                    </span>
                  </div>

                  {b.potentialOverrun > 0 && (
                    <div className="flex items-center justify-between text-red-600 font-medium pt-1 border-t border-slate-200/60">
                      <span>Projected Overrun:</span>
                      <span>+{formatCurrency(b.potentialOverrun)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Quick Filter Link */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => navigate(`/transactions?category=${encodeURIComponent(b.category)}`)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors py-1"
                >
                  <span>View {b.category} Transactions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Budget Dialog */}
      <BudgetDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialBudget={editingBudget}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(deletingBudgetId)}
        title="Delete Budget"
        message="Are you sure you want to remove this category budget? Existing transactions in this category will not be deleted."
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingBudgetId(null)}
      />
    </div>
  );
};
